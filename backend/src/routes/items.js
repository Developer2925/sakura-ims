const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');
const crypto = require('crypto');

router.post('/manual', auth, async (req, res) => {
  if (req.user.role !== 'clinic') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.clinicId;
  const { name, manufacturer, category, condition, price, expiryDate, quantity, barcode } = req.body;

  if (!name || !category || price === undefined || !quantity) {
    return res.status(400).json({ error: 'Missing required fields: name, category, price, quantity' });
  }

  const internalId = barcode ? null : `INT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `INSERT INTO items (clinic_id, barcode, internal_id, name, manufacturer, category, condition_status, price, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinicId, barcode || null, internalId, name, manufacturer || '', category, condition || '新品', parseFloat(price), expiryDate || null]
    );
    const itemId = result.insertId;
    const qty = parseInt(quantity);
    await conn.execute(
      `INSERT INTO inventory (clinic_id, item_id, quantity, total_quantity_received) VALUES (?, ?, ?, ?)`,
      [clinicId, itemId, qty, qty]
    );
    // Record as an 'add' transaction
    await conn.execute(
      `INSERT INTO transactions (clinic_id, item_id, item_name, type, quantity, unit_price, notes)
       VALUES (?, ?, ?, 'add', ?, ?, 'New item added')`,
      [clinicId, itemId, name, qty, parseFloat(price)]
    );
    // Create initial batch
    await conn.execute(
      `INSERT INTO item_batches (item_id, clinic_id, price, expiry_date, quantity, condition_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [itemId, clinicId, parseFloat(price), expiryDate || null, qty, condition || '新品']
    );
    await conn.commit();
    const [items] = await conn.execute(
      `SELECT i.*, inv.quantity, inv.total_quantity_received, (i.price * inv.quantity) AS total_price
       FROM items i JOIN inventory inv ON i.id = inv.item_id WHERE i.id = ?`,
      [itemId]
    );
    res.json({ item: items[0] });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
