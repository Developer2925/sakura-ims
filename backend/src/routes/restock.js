const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.post('/request', auth, async (req, res) => {
  if (req.user.role !== 'clinic') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.clinicId;
  const { itemId, requestedQuantity, notes } = req.body;

  if (!itemId || !requestedQuantity) {
    return res.status(400).json({ error: 'itemId and requestedQuantity required' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO restock_requests (clinic_id, item_id, requested_quantity, notes) VALUES (?, ?, ?, ?)`,
      [clinicId, itemId, parseInt(requestedQuantity), notes || null]
    );
    const [requests] = await db.execute(
      `SELECT rr.*, i.name AS item_name, i.category
       FROM restock_requests rr JOIN items i ON rr.item_id = i.id WHERE rr.id = ?`,
      [result.insertId]
    );
    res.json({ request: requests[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/status', auth, async (req, res) => {
  if (req.user.role !== 'clinic') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.clinicId;
  try {
    const [requests] = await db.execute(
      `SELECT rr.*, i.name AS item_name, i.category, inv.quantity AS current_stock,
              COALESCE(
                (SELECT ib.price FROM item_batches ib
                 WHERE ib.item_id = i.id AND ib.clinic_id = rr.clinic_id
                 ORDER BY ib.created_at DESC LIMIT 1),
                i.price
              ) AS unit_price
       FROM restock_requests rr
       JOIN items i ON rr.item_id = i.id
       LEFT JOIN inventory inv ON inv.item_id = i.id AND inv.clinic_id = rr.clinic_id
       WHERE rr.clinic_id = ?
       ORDER BY rr.requested_at DESC`,
      [clinicId]
    );
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /restock/confirm-delivery — clinic confirms they received the stock and creates new batch
router.post('/confirm-delivery', auth, async (req, res) => {
  if (req.user.role !== 'clinic') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.clinicId;
  const { requestId, price, expiryDate, conditionStatus = '新品', restockDate } = req.body;

  if (!requestId || price === undefined) {
    return res.status(400).json({ error: 'requestId and price are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [reqs] = await conn.execute(
      `SELECT rr.*, i.name AS item_name
       FROM restock_requests rr JOIN items i ON rr.item_id = i.id
       WHERE rr.id = ? AND rr.clinic_id = ? AND rr.status = 'out_for_delivery'`,
      [requestId, clinicId]
    );
    if (!reqs.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Request not found or not out for delivery' });
    }
    const r = reqs[0];
    const qty = r.requested_quantity;
    const unitPrice = parseFloat(price);

    // Mark request as delivered
    await conn.execute(
      `UPDATE restock_requests SET status = 'delivered', delivered_at = NOW() WHERE id = ?`,
      [requestId]
    );

    // Create new batch with user-provided details
    await conn.execute(
      `INSERT INTO item_batches (item_id, clinic_id, price, expiry_date, quantity, condition_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [r.item_id, clinicId, unitPrice, expiryDate || null, qty, conditionStatus]
    );

    // Update inventory totals
    await conn.execute(
      `UPDATE inventory SET quantity = quantity + ?, total_quantity_received = total_quantity_received + ?
       WHERE clinic_id = ? AND item_id = ?`,
      [qty, qty, clinicId, r.item_id]
    );

    // Record transaction for analytics
    await conn.execute(
      `INSERT INTO transactions (clinic_id, item_id, item_name, type, quantity, unit_price, notes)
       VALUES (?, ?, ?, 'add', ?, ?, 'Restock delivery confirmed')`,
      [clinicId, r.item_id, r.item_name, qty, unitPrice]
    );

    // Log the action
    await conn.execute(
      `INSERT INTO restock_logs (request_id, clinic_id, item_id, quantity_added, action, performed_by)
       VALUES (?, ?, ?, ?, 'delivered', ?)`,
      [requestId, clinicId, r.item_id, qty, null]
    );

    await conn.commit();
    const [rows] = await conn.execute(
      `SELECT rr.*, i.name AS item_name FROM restock_requests rr
       JOIN items i ON rr.item_id = i.id WHERE rr.id = ?`,
      [requestId]
    );
    res.json({ request: rows[0] });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
