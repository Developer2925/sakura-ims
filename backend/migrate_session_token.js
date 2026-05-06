require('dotenv').config();
const db = require('./src/db');

async function migrate() {
  const [cols] = await db.execute(`SHOW COLUMNS FROM clinics LIKE 'session_token'`);
  if (!cols.length) {
    await db.execute(`ALTER TABLE clinics ADD COLUMN session_token VARCHAR(64) DEFAULT NULL`);
  }
  console.log('session_token column added to clinics');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
