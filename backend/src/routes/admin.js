const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../db");
const bcrypt = require("bcrypt");

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  next();
}

// --- Clinics ---
router.get("/clinics", auth, requireAdmin, async (req, res) => {
  try {
    const [clinics] = await db.execute(
      `SELECT c.id, c.organization_name AS name, c.username, c.email, c.plain_password,
              c.position, c.first_name, c.last_name,
              COUNT(DISTINCT i.id) AS item_count,
              COALESCE(SUM(
                CASE
                  WHEN bt.batch_value IS NOT NULL THEN bt.batch_value
                  ELSE i.price * inv.quantity
                END
              ), 0) AS total_value,
              COALESCE(SUM(inv.quantity), 0) AS total_quantity
       FROM users c
       LEFT JOIN items i ON i.user_id = c.id
       LEFT JOIN inventory inv ON inv.item_id = i.id AND inv.user_id = c.id
       LEFT JOIN (
         SELECT item_id, user_id, SUM(price * quantity) AS batch_value
         FROM item_batches
         GROUP BY item_id, user_id
       ) bt ON bt.item_id = i.id AND bt.user_id = c.id
       GROUP BY c.id
       ORDER BY c.organization_name ASC`,
    );
    res.json({ clinics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /admin/clinics/:id — update clinic credentials
router.put("/clinics/:id", auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, username, email, password } = req.body;
  if (!name && !username && !email && !password) {
    return res.status(400).json({ error: "Nothing to update" });
  }
  try {
    const fields = [];
    const values = [];
    if (name) {
      fields.push("organization_name = ?");
      values.push(name);
    }
    if (username) {
      fields.push("username = ?");
      values.push(username);
    }
    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email || null);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push("password_hash = ?");
      values.push(hash);
      fields.push("plain_password = ?");
      values.push(password);
    }
    values.push(id);
    await db.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    const [[clinic]] = await db.execute(
      "SELECT id, organization_name AS name, username, email, plain_password, position, first_name, last_name FROM users WHERE id = ?",
      [id],
    );
    res.json({ clinic });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Username already taken by another clinic" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /admin/clinics/:id/send-credentials — email login details
router.post(
  "/clinics/:id/send-credentials",
  auth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { password } = req.body; // plain-text password admin wants to send
    if (!password)
      return res
        .status(400)
        .json({ error: "password is required to send credentials" });

    try {
      const [[clinic]] = await db.execute(
        "SELECT id, organization_name AS name, username, email, position, first_name, last_name FROM users WHERE id = ?",
        [id],
      );
      if (!clinic) return res.status(404).json({ error: "Clinic not found" });
      if (!clinic.email)
        return res
          .status(400)
          .json({ error: "No email address set for this clinic" });

      const clinicName = clinic.organization_name || "";
      const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "医療法人さくら会", email: process.env.BREVO_FROM },
          to: [{ email: clinic.email }],
          subject: `ログイン情報 / Login Credentials — ${clinicName}`,
          htmlContent: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f7f8fc;border-radius:12px">
              <h2 style="color:#1A1A1A;margin-bottom:8px">クリニック在庫システム</h2>
              <p style="color:#9CA3AF;margin-bottom:24px">Clinic Inventory System — Login Credentials</p>
              <div style="background:#fff;border-radius:10px;padding:20px;margin-bottom:20px">
                <p style="margin:0 0 12px;color:#9CA3AF;font-size:13px">CLINIC / クリニック</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#1A1A1A">${clinicName}</p>
              </div>
              <div style="background:#fff;border-radius:10px;padding:20px;margin-bottom:20px">
                <p style="margin:0 0 8px;color:#9CA3AF;font-size:13px">USERNAME / ユーザー名</p>
                <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:#5B8DEF">${clinic.username}</p>
              </div>
              <div style="background:#fff;border-radius:10px;padding:20px;margin-bottom:24px">
                <p style="margin:0 0 8px;color:#9CA3AF;font-size:13px">PASSWORD / パスワード</p>
                <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:#5B8DEF">${password}</p>
              </div>
              <p style="color:#9CA3AF;font-size:12px;text-align:center">
                Keep these credentials secure. / これらの認証情報を安全に保管してください。
              </p>
            </div>
          `,
        }),
      });
      if (!emailRes.ok) {
        const errData = await emailRes.json();
        throw new Error(errData.message || "Failed to send email");
      }
      res.json({ success: true, sentTo: clinic.email });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to send email" });
    }
  },
);

router.get("/clinics/:id/inventory", auth, requireAdmin, async (req, res) => {
  const clinicId = req.params.id;
  try {
    const [clinics] = await db.execute(
      "SELECT id, organization_name AS name, username, position, first_name, last_name FROM users WHERE id = ?",
      [clinicId],
    );
    if (!clinics.length)
      return res.status(404).json({ error: "Clinic not found" });
    const [items] = await db.execute(
      `SELECT i.*, inv.quantity, inv.total_quantity_received,
              (i.price * inv.quantity) AS total_price,
              (i.price * inv.total_quantity_received) AS total_received_cost
       FROM items i
       JOIN inventory inv ON i.id = inv.item_id AND inv.user_id = ?
       WHERE i.user_id = ?
       ORDER BY i.name ASC`,
      [clinicId, clinicId],
    );

    let batches = [];
    try {
      const [rows] = await db.execute(
        `SELECT * FROM item_batches WHERE user_id = ? ORDER BY expiry_date ASC, created_at ASC`,
        [clinicId],
      );
      batches = rows;
    } catch (_) {}

    const batchMap = {};
    for (const b of batches) {
      if (!batchMap[b.item_id]) batchMap[b.item_id] = [];
      batchMap[b.item_id].push(b);
    }

    const result = items.map((item) => {
      const itemBatches = batchMap[item.id] || [];
      const total_price =
        itemBatches.length > 0
          ? itemBatches.reduce((s, b) => s + Number(b.price) * b.quantity, 0)
          : Number(item.price) * item.quantity;
      return { ...item, total_price, batches: itemBatches };
    });

    res.json({ clinic: clinics[0], items: result });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/clinics/:id/inventory/:itemId",
  auth,
  requireAdmin,
  async (req, res) => {
    const { id: clinicId, itemId } = req.params;
    const { quantity } = req.body;
    if (quantity === undefined)
      return res.status(400).json({ error: "quantity required" });
    try {
      await db.execute(
        "UPDATE inventory SET quantity = ? WHERE user_id = ? AND item_id = ?",
        [Math.max(0, parseInt(quantity)), clinicId, itemId],
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

// DELETE /admin/clinics/:id/data — wipe clinic inventory data, keep the clinic account
router.delete("/clinics/:id/data", auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[clinic]] = await conn.execute("SELECT id FROM users WHERE id = ?", [
      id,
    ]);
    if (!clinic) {
      await conn.rollback();
      return res.status(404).json({ error: "Clinic not found" });
    }

    // Order matters: delete dependents before parents (no CASCADE without clinic delete)
    await conn.execute("DELETE FROM restock_logs WHERE user_id = ?", [id]);
    await conn.execute("DELETE FROM restock_requests WHERE user_id = ?", [id]);
    await conn.execute("DELETE FROM transactions WHERE user_id = ?", [id]);
    // Deleting items cascades inventory + item_batches (both have ON DELETE CASCADE on item_id)
    await conn.execute("DELETE FROM items WHERE user_id = ?", [id]);

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

// --- Restock ---
router.get("/restock/requests", auth, requireAdmin, async (req, res) => {
  const { status, clinicId } = req.query;
  let query = `SELECT rr.*, i.name AS item_name, i.category, i.price,
               c.organization_name AS clinic_name
               FROM restock_requests rr
               JOIN items i ON rr.item_id = i.id
               JOIN users c ON rr.user_id = c.id
               WHERE 1=1`;
  const params = [];
  if (status) {
    query += " AND rr.status = ?";
    params.push(status);
  }
  if (clinicId) {
    query += " AND rr.user_id = ?";
    params.push(clinicId);
  }
  query += " ORDER BY rr.requested_at DESC";
  try {
    const [requests] = await db.execute(query, params);
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/restock/approve", auth, requireAdmin, async (req, res) => {
  const { requestId, adminNote } = req.body;
  if (!requestId) return res.status(400).json({ error: "requestId required" });
  try {
    await db.execute(
      `UPDATE restock_requests SET status = 'approved', approved_at = NOW(), admin_note = ?
       WHERE id = ? AND status = 'pending'`,
      [adminNote || null, requestId],
    );
    await db.execute(
      `INSERT INTO restock_logs (request_id, user_id, item_id, quantity_added, action, performed_by)
       SELECT id, user_id, item_id, requested_quantity, 'approved', ?
       FROM restock_requests WHERE id = ?`,
      [req.user.id, requestId],
    );
    await db.execute(
      `INSERT INTO notifications (user_id, type, message, restock_request_id)
       SELECT rr.user_id, 'approved',
         CONCAT('Your restock request for "', i.name, '" (x', rr.requested_quantity, ') has been approved.'),
         rr.id
       FROM restock_requests rr
       JOIN items i ON i.id = rr.item_id
       WHERE rr.id = ?`,
      [requestId],
    );
    const [rows] = await db.execute(
      "SELECT * FROM restock_requests WHERE id = ?",
      [requestId],
    );
    res.json({ request: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/restock/reject", auth, requireAdmin, async (req, res) => {
  const { requestId, adminNote } = req.body;
  if (!requestId) return res.status(400).json({ error: "requestId required" });
  try {
    await db.execute(
      `UPDATE restock_requests SET status = 'rejected', admin_note = ?
       WHERE id = ? AND status = 'pending'`,
      [adminNote || null, requestId],
    );
    await db.execute(
      `INSERT INTO restock_logs (request_id, user_id, item_id, quantity_added, action, performed_by)
       SELECT id, user_id, item_id, 0, 'rejected', ?
       FROM restock_requests WHERE id = ?`,
      [req.user.id, requestId],
    );
    await db.execute(
      `INSERT INTO notifications (user_id, type, message, restock_request_id)
       SELECT rr.user_id, 'rejected',
         CONCAT('Your restock request for "', i.name, '" has been rejected.',
           CASE WHEN ? IS NOT NULL THEN CONCAT(' Note: ', ?) ELSE '' END),
         rr.id
       FROM restock_requests rr
       JOIN items i ON i.id = rr.item_id
       WHERE rr.id = ?`,
      [adminNote || null, adminNote || null, requestId],
    );
    const [rows] = await db.execute(
      "SELECT * FROM restock_requests WHERE id = ?",
      [requestId],
    );
    res.json({ request: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin marks request as shipped (out for delivery) — clinic confirms receipt separately
router.post("/restock/deliver", auth, requireAdmin, async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: "requestId required" });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [reqs] = await conn.execute(
      `SELECT * FROM restock_requests WHERE id = ? AND status = 'approved'`,
      [requestId],
    );
    if (!reqs.length) {
      await conn.rollback();
      return res
        .status(400)
        .json({ error: "Request not found or not in approved state" });
    }
    const r = reqs[0];
    await conn.execute(
      `UPDATE restock_requests SET status = 'out_for_delivery', shipped_at = NOW() WHERE id = ?`,
      [requestId],
    );
    await conn.execute(
      `INSERT INTO restock_logs (request_id, user_id, item_id, quantity_added, action, performed_by)
       VALUES (?, ?, ?, ?, 'out_for_delivery', ?)`,
      [requestId, r.user_id, r.item_id, r.requested_quantity, req.user.id],
    );
    const [itemRows] = await conn.execute(
      "SELECT name FROM items WHERE id = ?",
      [r.item_id],
    );
    const itemName = itemRows[0]?.name ?? "Unknown item";
    await conn.execute(
      `INSERT INTO notifications (user_id, type, message, restock_request_id)
       VALUES (?, 'shipped', ?, ?)`,
      [
        r.user_id,
        `Your restock for "${itemName}" (x${r.requested_quantity}) has been shipped and is on the way.`,
        requestId,
      ],
    );
    await conn.commit();
    const [rows] = await conn.execute(
      "SELECT * FROM restock_requests WHERE id = ?",
      [requestId],
    );
    res.json({ request: rows[0] });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

// --- Analytics ---
router.get("/analytics/monthly", auth, requireAdmin, async (req, res) => {
  const { month, clinicId, overall } = req.query;
  const isOverall = overall === "true";
  if (!isOverall && !month)
    return res.status(400).json({ error: "month or overall=true required" });

  const clinicTxFilter = clinicId ? "AND t.user_id = ?" : "";
  const clinicRRFilter = clinicId ? "AND rr.user_id = ?" : "";
  const clinicInvFilter = clinicId ? "AND inv.user_id = ?" : "";

  let dateFrom, dateTo;
  if (!isOverall) {
    const [yr, mo] = month.split("-").map(Number);
    const lastDay = new Date(yr, mo, 0).getDate();
    dateFrom = `${month}-01 00:00:00`;
    dateTo = `${month}-${String(lastDay).padStart(2, "0")} 23:59:59`;
  }

  try {
    // ── All-time totals (denominator for usage rate, always unfiltered by date) ──
    const allTimeParams = clinicId ? [clinicId] : [];
    const [allTime] = await db.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN t.type = 'add' THEN t.quantity               ELSE 0 END), 0) AS total_qty_added,
         COALESCE(SUM(CASE WHEN t.type = 'add' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS total_cost_added,
         COALESCE(SUM(CASE WHEN t.type = 'use' THEN t.quantity               ELSE 0 END), 0) AS total_qty_used,
         COALESCE(SUM(CASE WHEN t.type = 'use' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS total_cost_used
       FROM transactions t
       WHERE 1=1 ${clinicTxFilter}`,
      allTimeParams,
    );

    // ── Period stats (monthly or all-time for overall mode) ──
    const periodFilter = isOverall ? "" : "AND t.created_at BETWEEN ? AND ?";
    const periodParams = [];
    if (!isOverall) periodParams.push(dateFrom, dateTo);
    if (clinicId) periodParams.push(clinicId);
    const [period] = await db.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN t.type = 'add' THEN t.quantity               ELSE 0 END), 0) AS qty_added,
         COALESCE(SUM(CASE WHEN t.type = 'add' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS cost_added,
         COALESCE(SUM(CASE WHEN t.type = 'use' THEN t.quantity               ELSE 0 END), 0) AS qty_used,
         COALESCE(SUM(CASE WHEN t.type = 'use' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS cost_used
       FROM transactions t
       WHERE 1=1 ${periodFilter} ${clinicTxFilter}`,
      periodParams,
    );

    // ── Restock request stats (filtered to period) ──
    const rrReqFilter = isOverall ? "" : "AND rr.requested_at  BETWEEN ? AND ?";
    const rrDelFilter = isOverall ? "" : "AND rr.delivered_at  BETWEEN ? AND ?";
    const rrParams = [];
    if (!isOverall)
      rrParams.push(dateFrom, dateTo, dateFrom, dateTo, dateFrom, dateTo);
    if (clinicId) rrParams.push(clinicId);
    const [rrStats] = await db.execute(
      `SELECT
         COUNT(DISTINCT CASE WHEN 1=1 ${rrReqFilter} THEN rr.id END) AS total_requests,
         COUNT(DISTINCT CASE WHEN rr.status = 'delivered' ${rrDelFilter} THEN rr.id END) AS total_restocks,
         COALESCE(SUM(CASE WHEN rr.status = 'delivered' ${rrDelFilter} THEN rr.requested_quantity ELSE 0 END), 0) AS restocked_qty
       FROM restock_requests rr WHERE 1=1 ${clinicRRFilter}`,
      rrParams,
    );

    // ── Current inventory snapshot (live, not date-filtered) ──
    const invParams = clinicId ? [clinicId] : [];
    const [invStats] = await db.execute(
      `SELECT
         COALESCE(SUM(inv.quantity), 0) AS current_qty,
         COALESCE(SUM(i.price * inv.quantity), 0) AS current_cost
       FROM inventory inv
       JOIN items i ON i.id = inv.item_id
       WHERE 1=1 ${clinicInvFilter}`,
      invParams,
    );

    const totalQtyAdded = Number(allTime[0].total_qty_added) || 0;
    const totalCostAdded = Number(allTime[0].total_cost_added) || 0;
    const totalQtyUsed = Number(allTime[0].total_qty_used) || 0;
    const totalCostUsed = Number(allTime[0].total_cost_used) || 0;

    const periodQtyAdded = Number(period[0].qty_added) || 0;
    const periodCostAdded = Number(period[0].cost_added) || 0;
    const periodQtyUsed = Number(period[0].qty_used) || 0;
    const periodCostUsed = Number(period[0].cost_used) || 0;

    const currentQty = Number(invStats[0].current_qty) || 0;
    const remainingCost = totalCostAdded - totalCostUsed;

    // Usage rate = cost_used_period * 100 / total_cost_added_all_time
    // Monthly: cost used this month / total all-time cost added
    // Overall: total cost used all time / total all-time cost added
    const costUsedForRate = isOverall ? totalCostUsed : periodCostUsed;
    const usagePct =
      totalCostAdded > 0
        ? Math.min(100, Math.round((costUsedForRate / totalCostAdded) * 100))
        : 0;

    res.json({
      month: isOverall ? null : month,
      overall: isOverall,
      data: {
        // Restock request activity
        totalRequests: Number(rrStats[0].total_requests),
        totalRestocks: Number(rrStats[0].total_restocks),
        restockedQty: Number(rrStats[0].restocked_qty),

        // Period (monthly or all-time) stock movements
        qtyAdded: periodQtyAdded,
        qtyUsed: periodQtyUsed,
        costAdded: periodCostAdded.toFixed(2),
        costUsed: periodCostUsed.toFixed(2),

        // All-time totals (Total Stock = everything ever added)
        totalStockQty: totalQtyAdded,
        totalStockCost: totalCostAdded.toFixed(2),
        totalUsedQty: totalQtyUsed,
        totalUsedCost: totalCostUsed.toFixed(2),

        // Current live inventory
        remainingStockQty: currentQty,
        remainingStockCost: remainingCost.toFixed(2),

        // Usage rate per spec
        usagePercentage: usagePct,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
