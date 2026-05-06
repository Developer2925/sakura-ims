const db = require('./src/db');

async function migrate() {
  const conn = await db.getConnection();
  try {
    try {
      await conn.execute(`
        ALTER TABLE item_batches
        ADD COLUMN condition_status VARCHAR(50) NOT NULL DEFAULT '新品'
      `);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
      console.log('Column already exists, skipping ALTER');
    }

    // Backfill from items table for existing batches
    await conn.execute(`
      UPDATE item_batches b
      JOIN items i ON i.id = b.item_id
      SET b.condition_status = i.condition_status
      WHERE b.condition_status = '新品'
    `);

    console.log('Migration complete: condition_status added to item_batches');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
