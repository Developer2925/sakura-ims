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
    const [[{ col_exists }]] = await conn.execute(`
      SELECT COUNT(*) AS col_exists
      FROM information_schema.columns
      WHERE table_schema = ? AND table_name = 'clinics' AND column_name = 'plain_password'
    `, [process.env.DB_NAME]);

    if (Number(col_exists) === 0) {
      await conn.execute(`ALTER TABLE clinics ADD COLUMN plain_password VARCHAR(255) DEFAULT NULL AFTER email`);
      console.log('✅  plain_password column added to clinics table');
    } else {
      console.log('ℹ️   plain_password column already exists, skipping');
    }
  } finally {
    await conn.end();
  }
}

migrate().catch((err) => { console.error(err); process.exit(1); });
