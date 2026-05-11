const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const nodemailer = require('nodemailer');
const authMiddleware = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory OTP stores (10-min expiry)
const pendingRegistrations = new Map(); // email → { otp, firstName, lastName, position, passwordHash, expiresAt }
const pendingResets        = new Map(); // email → { otp, expiresAt }
const pendingEmailChange   = new Map(); // userId → { otp, newEmail, expiresAt }

function makeTransporter() {
  return nodemailer.createTransport({
    host: '74.125.133.108',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { servername: 'smtp.gmail.com' },
  });
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildUser(user) {
  return {
    id: user.id,
    role: 'user',
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    position: user.position,
    organizationName: user.organization_name ?? null,
    hasPassword: !!(user.password_hash && user.password_hash.length > 0),
  };
}

function signToken(user) {
  return jwt.sign(buildUser(user), process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function sendOTPEmail(to, otp, subject = 'Your Verification Code') {
  const transporter = makeTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="margin-bottom:8px">${subject}</h2>
        <p>Your verification code is:</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;padding:16px 0;color:#1a1a1a">${otp}</div>
        <p style="color:#888">Expires in 10 minutes. Do not share this code.</p>
      </div>
    `,
  });
}

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ token: signToken(user), user: buildUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Register step 1: send OTP ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, position, organizationName } = req.body;
  if (!firstName || !lastName || !email || !password || !position || !organizationName) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!['clinic', 'office_staff'].includes(position)) return res.status(400).json({ error: 'Invalid position' });

  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const otp = generateOTP();
    const passwordHash = await bcrypt.hash(password, 10);
    pendingRegistrations.set(email.toLowerCase(), {
      otp, firstName: firstName.trim(), lastName: lastName.trim(),
      position, organizationName: organizationName.trim(), passwordHash,
      plainPassword: password,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendOTPEmail(email, otp, 'Verify Your Email');
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ── Register step 2: verify OTP ───────────────────────────────────────────────
router.post('/register/verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'email and otp required' });

  const pending = pendingRegistrations.get(email.toLowerCase());
  if (!pending) return res.status(400).json({ error: 'No pending registration for this email' });
  if (Date.now() > pending.expiresAt) {
    pendingRegistrations.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP expired. Please register again.' });
  }
  if (pending.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const username = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 6);
    const [result] = await db.execute(
      `INSERT INTO users (organization_name, username, email, password_hash, plain_password, first_name, last_name, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pending.organizationName, username, email.toLowerCase(), pending.passwordHash, pending.plainPassword, pending.firstName, pending.lastName, pending.position]
    );
    pendingRegistrations.delete(email.toLowerCase());

    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.json({ token: signToken(rows[0]), user: buildUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Forgot password ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length) {
      const otp = generateOTP();
      pendingResets.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
      await sendOTPEmail(email, otp, 'Password Reset Code');
    }
    res.json({ message: 'If that email exists, a reset code was sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Reset password ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'email, otp, newPassword required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const pending = pendingResets.get(email.toLowerCase());
  if (!pending) return res.status(400).json({ error: 'No reset request for this email' });
  if (Date.now() > pending.expiresAt) {
    pendingResets.delete(email.toLowerCase());
    return res.status(400).json({ error: 'Code expired. Request a new one.' });
  }
  if (pending.otp !== otp) return res.status(400).json({ error: 'Invalid code' });

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password_hash = ?, plain_password = ? WHERE email = ?', [hash, newPassword, email.toLowerCase()]);
    pendingResets.delete(email.toLowerCase());
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Request email change OTP ──────────────────────────────────────────────────
router.post('/profile/request-email-change', authMiddleware, async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail || !newEmail.includes('@')) return res.status(400).json({ error: 'Valid email required' });

  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail.toLowerCase(), req.user.id]);
    if (existing.length) return res.status(409).json({ error: 'Email already in use' });

    const otp = generateOTP();
    pendingEmailChange.set(req.user.id, { otp, newEmail: newEmail.toLowerCase(), expiresAt: Date.now() + 10 * 60 * 1000 });
    await sendOTPEmail(newEmail, otp, 'Confirm Email Change');
    res.json({ message: 'OTP sent to new email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Verify email change OTP ───────────────────────────────────────────────────
router.post('/profile/verify-email-change', authMiddleware, async (req, res) => {
  const { otp } = req.body;
  const pending = pendingEmailChange.get(req.user.id);
  if (!pending) return res.status(400).json({ error: 'No pending email change' });
  if (Date.now() > pending.expiresAt) {
    pendingEmailChange.delete(req.user.id);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (pending.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  try {
    await db.execute('UPDATE users SET email = ? WHERE id = ?', [pending.newEmail, req.user.id]);
    pendingEmailChange.delete(req.user.id);
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ token: signToken(rows[0]), user: buildUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update password ───────────────────────────────────────────────────────────
router.put('/profile/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password_hash = ?, plain_password = ? WHERE id = ?', [hash, newPassword, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken required' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_ANDROID_CLIENT_ID].filter(Boolean) });
    const { email, given_name, family_name, sub: googleId } = ticket.getPayload();

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ? OR google_id = ?', [email.toLowerCase(), googleId]);
    if (rows.length) {
      if (!rows[0].google_id) {
        await db.execute('UPDATE users SET google_id = ? WHERE id = ?', [googleId, rows[0].id]);
      }
      return res.json({ token: signToken(rows[0]), user: buildUser(rows[0]) });
    }

    // new user — needs onboarding
    res.json({ newUser: true, email: email.toLowerCase(), firstName: given_name ?? '', lastName: family_name ?? '', googleId });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

router.post('/google/complete', async (req, res) => {
  const { email, firstName, lastName, position, organizationName, googleId } = req.body;
  if (!email || !position || !organizationName) return res.status(400).json({ error: 'email, position, organizationName required' });

  try {
    // check not already registered (race condition guard)
    const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length) {
      return res.json({ token: signToken(existing[0]), user: buildUser(existing[0]) });
    }

    const username = email.split('@')[0];
    await db.execute(
      'INSERT INTO users (organization_name, username, email, google_id, password_hash, plain_password, first_name, last_name, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [organizationName, username, email.toLowerCase(), googleId ?? null, '', '', firstName, lastName, position]
    );
    const [newRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    res.json({ token: signToken(newRows[0]), user: buildUser(newRows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
