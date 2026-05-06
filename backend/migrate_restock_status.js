require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await conn.execute(`
      ALTER TABLE restock_requests
      MODIFY COLUMN status ENUM('pending','approved','rejected','out_for_delivery','delivered') DEFAULT 'pending'
    `);
    console.log('✅  restock_requests.status ENUM updated');

    await conn.execute(`
      ALTER TABLE restock_logs
      MODIFY COLUMN action ENUM('approved','rejected','out_for_delivery','delivered') NOT NULL
    `);
    console.log('✅  restock_logs.action ENUM updated');

    // Add shipped_at column if missing (works on MySQL 5.7+)
    await conn.execute(`ALTER TABLE restock_requests ADD COLUMN shipped_at TIMESTAMP NULL`)
      .catch((err) => {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('  shipped_at already exists, skipping');
        } else {
          throw err;
        }
      });
    console.log('✅  shipped_at column ready');
  } finally {
    await conn.end();
  }
}

migrate().catch((err) => { console.error(err); process.exit(1); });
