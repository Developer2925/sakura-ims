const db = require("./src/db");

async function migrate() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS item_batches (
        id INT PRIMARY KEY AUTO_INCREMENT,
        item_id INT NOT NULL,
        clinic_id INT NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        expiry_date DATE,
        quantity INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
      )
    `);

    // Seed initial batch from existing items + inventory (skip if already seeded)
    await conn.execute(`
      INSERT INTO item_batches (item_id, clinic_id, price, expiry_date, quantity)
      SELECT i.id, i.clinic_id, i.price, i.expiry_date, inv.quantity
      FROM items i
      JOIN inventory inv ON inv.item_id = i.id AND inv.clinic_id = i.clinic_id
      WHERE NOT EXISTS (
        SELECT 1 FROM item_batches b WHERE b.item_id = i.id AND b.clinic_id = i.clinic_id
      )
    `);

    await conn.commit();
    console.log("item_batches migration complete");
  } catch (err) {
    await conn.rollback();
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
