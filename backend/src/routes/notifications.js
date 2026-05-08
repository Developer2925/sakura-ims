const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const clinicId = req.user.id;
  if (!clinicId) return res.status(403).json({ error: 'Forbidden' });
  try {
    const [rows] = await db.execute(
      `SELECT id, type, message, restock_request_id, is_read, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [clinicId]
    );
    res.json({ notifications: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const clinicId = req.user.id;
  if (!clinicId) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.execute(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [req.params.id, clinicId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/', auth, async (req, res) => {
  const clinicId = req.user.id;
  if (!clinicId) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.execute(`DELETE FROM notifications WHERE user_id = ?`, [clinicId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/read', auth, async (req, res) => {
  const clinicId = req.user.id;
  if (!clinicId) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.execute(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [clinicId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
