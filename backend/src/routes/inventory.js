const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

// GET /inventory — clinic's full inventory with batches
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.id;
  try {
    const [items] = await db.execute(
      `SELECT i.*, inv.quantity, inv.total_quantity_received
       FROM items i
       JOIN inventory inv ON i.id = inv.item_id AND inv.user_id = ?
       WHERE i.user_id = ?
       ORDER BY i.name ASC`,
      [clinicId, clinicId]
    );

    let batches = [];
    try {
      const [rows] = await db.execute(
        `SELECT * FROM item_batches
         WHERE user_id = ?
         ORDER BY expiry_date ASC, created_at ASC`,
        [clinicId]
      );
      batches = rows;
    } catch (_) {
      // item_batches table not yet created — migration pending
    }

    const batchMap = {};
    for (const b of batches) {
      if (!batchMap[b.item_id]) batchMap[b.item_id] = [];
      batchMap[b.item_id].push(b);
    }

    const result = items.map((item) => {
      const itemBatches = batchMap[item.id] || [];
      const total_price = itemBatches.length > 0
        ? itemBatches.reduce((s, b) => s + Number(b.price) * b.quantity, 0)
        : Number(item.price) * item.quantity;
      const price = itemBatches.length === 1 ? itemBatches[0].price : item.price;
      const expiry_date = itemBatches.length === 1 ? itemBatches[0].expiry_date : item.expiry_date;
      return { ...item, price, expiry_date, total_price, batches: itemBatches };
    });

    res.json({ items: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /inventory/check/:barcode — find items by barcode
router.get('/check/:barcode', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.id;
  const { barcode } = req.params;
  try {
    const [items] = await db.execute(
      `SELECT i.*, inv.quantity, (i.price * inv.quantity) AS total_price
       FROM items i
       JOIN inventory inv ON i.id = inv.item_id AND inv.user_id = ?
       WHERE i.user_id = ? AND i.barcode = ?`,
      [clinicId, clinicId, barcode]
    );
    res.json({ exists: items.length > 0, items });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /inventory/search?q=name — search items by name
router.get('/search', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.id;
  const q = `%${req.query.q || ''}%`;
  try {
    const [items] = await db.execute(
      `SELECT i.*, inv.quantity, (i.price * inv.quantity) AS total_price
       FROM items i
       JOIN inventory inv ON i.id = inv.item_id AND inv.user_id = ?
       WHERE i.user_id = ? AND i.name LIKE ?
       ORDER BY i.name ASC
       LIMIT 20`,
      [clinicId, clinicId, q]
    );
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /inventory/transactions — all clinic transactions (add + use)
router.get('/transactions', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.id;
  try {
    const [rows] = await db.execute(
      `SELECT * FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 200`,
      [clinicId]
    );
    res.json({ transactions: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /inventory/:itemId/batches — batches for a specific item
router.get('/:itemId/batches', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.id;
  const itemId = parseInt(req.params.itemId);
  try {
    const [batches] = await db.execute(
      `SELECT * FROM item_batches
       WHERE item_id = ? AND user_id = ?
       ORDER BY expiry_date ASC, created_at ASC`,
      [itemId, clinicId]
    );
    res.json({ batches });
  } catch (err) {
    // If table doesn't exist yet return empty; migration pending
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json({ batches: [] });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /inventory/use — sell/use an item (FIFO across batches, or specific batchId)
router.post('/use', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.id;
  const { itemId, quantity, notes, batchId } = req.body;
  if (!itemId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'itemId and quantity are required' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[inv]] = await conn.execute(
      `SELECT inv.quantity, i.price, i.name
       FROM inventory inv JOIN items i ON i.id = inv.item_id
       WHERE inv.user_id = ? AND inv.item_id = ?`,
      [clinicId, itemId]
    );
    if (!inv) return res.status(404).json({ error: 'Item not in inventory' });
    if (inv.quantity < quantity) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${inv.quantity}` });
    }

    let unitPrice = inv.price;

    if (batchId) {
      const [[batch]] = await conn.execute(
        `SELECT * FROM item_batches WHERE id = ? AND user_id = ? AND item_id = ?`,
        [batchId, clinicId, itemId]
      );
      if (!batch) return res.status(404).json({ error: 'Batch not found' });
      if (batch.quantity < quantity) {
        return res.status(400).json({ error: `Insufficient batch stock. Available: ${batch.quantity}` });
      }
      unitPrice = batch.price;
      await conn.execute(
        `UPDATE item_batches SET quantity = quantity - ? WHERE id = ?`,
        [quantity, batchId]
      );
    } else {
      // FIFO: earliest expiry first (nulls last), then oldest created
      const [batches] = await conn.execute(
        `SELECT * FROM item_batches
         WHERE item_id = ? AND user_id = ? AND quantity > 0
         ORDER BY (expiry_date IS NULL) ASC, expiry_date ASC, created_at ASC`,
        [itemId, clinicId]
      );
      let remaining = quantity;
      for (let i = 0; i < batches.length && remaining > 0; i++) {
        const batch = batches[i];
        const deduct = Math.min(batch.quantity, remaining);
        await conn.execute(
          `UPDATE item_batches SET quantity = quantity - ? WHERE id = ?`,
          [deduct, batch.id]
        );
        if (i === 0) unitPrice = batch.price;
        remaining -= deduct;
      }
    }

    await conn.execute(
      `UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?`,
      [quantity, clinicId, itemId]
    );
    await conn.execute(
      `INSERT INTO transactions (user_id, item_id, item_name, type, quantity, unit_price, notes)
       VALUES (?, ?, ?, 'use', ?, ?, ?)`,
      [clinicId, itemId, inv.name, quantity, unitPrice, notes || null]
    );
    await conn.commit();
    res.json({ success: true, remaining: inv.quantity - quantity });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// POST /inventory/add-stock — add stock, optionally as a new batch
router.post('/add-stock', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
  const clinicId = req.user.id;
  const { itemId, quantity, notes, price, expiryDate, batchId, conditionStatus = '新品' } = req.body;
  if (!itemId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'itemId and quantity are required' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[inv]] = await conn.execute(
      `SELECT inv.quantity, i.price, i.name
       FROM inventory inv JOIN items i ON i.id = inv.item_id
       WHERE inv.user_id = ? AND inv.item_id = ?`,
      [clinicId, itemId]
    );
    if (!inv) return res.status(404).json({ error: 'Item not in inventory' });

    const qty = parseInt(quantity);
    const batchExpiry = expiryDate || null;

    let batchPrice;
    if (batchId) {
      // Add to a specific existing batch — use that batch's actual price
      const [[batch]] = await conn.execute(
        `SELECT * FROM item_batches WHERE id = ? AND user_id = ? AND item_id = ?`,
        [batchId, clinicId, itemId]
      );
      if (!batch) return res.status(404).json({ error: 'Batch not found' });
      batchPrice = parseFloat(batch.price);
      await conn.execute(
        `UPDATE item_batches SET quantity = quantity + ? WHERE id = ?`,
        [qty, batchId]
      );
    } else {
      batchPrice = price !== undefined && price !== null ? parseFloat(price) : inv.price;
      // Find matching batch (same price + expiry + condition) or create new
      const [[existing]] = await conn.execute(
        `SELECT * FROM item_batches
         WHERE item_id = ? AND user_id = ? AND price = ? AND condition_status = ?
           AND (
             (expiry_date IS NULL AND ? IS NULL)
             OR (expiry_date = ?)
           )`,
        [itemId, clinicId, batchPrice, conditionStatus, batchExpiry, batchExpiry]
      );
      if (existing) {
        await conn.execute(
          `UPDATE item_batches SET quantity = quantity + ? WHERE id = ?`,
          [qty, existing.id]
        );
      } else {
        await conn.execute(
          `INSERT INTO item_batches (item_id, user_id, price, expiry_date, quantity, condition_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [itemId, clinicId, batchPrice, batchExpiry, qty, conditionStatus]
        );
      }
    }

    await conn.execute(
      `UPDATE inventory
       SET quantity = quantity + ?, total_quantity_received = total_quantity_received + ?
       WHERE user_id = ? AND item_id = ?`,
      [qty, qty, clinicId, itemId]
    );
    await conn.execute(
      `INSERT INTO transactions (user_id, item_id, item_name, type, quantity, unit_price, notes)
       VALUES (?, ?, ?, 'add', ?, ?, ?)`,
      [clinicId, itemId, inv.name, qty, batchPrice, notes || null]
    );
    await conn.commit();
    res.json({ success: true, newQuantity: inv.quantity + qty });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
