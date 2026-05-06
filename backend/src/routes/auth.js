const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const [admins] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (admins.length > 0) {
      const admin = admins[0];
      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign(
        { id: admin.id, role: 'admin', username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, user: { id: admin.id, role: 'admin', username: admin.username } });
    }

    const [clinics] = await db.execute('SELECT * FROM clinics WHERE username = ?', [username]);
    if (!clinics.length) return res.status(401).json({ error: 'Invalid credentials' });
    const clinic = clinics[0];
    const valid = await bcrypt.compare(password, clinic.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: clinic.id, role: 'clinic', clinicId: clinic.id, clinicName: clinic.name, username: clinic.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      user: { id: clinic.id, role: 'clinic', clinicId: clinic.id, clinicName: clinic.name, username: clinic.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
