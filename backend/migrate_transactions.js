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
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        clinic_id INT NOT NULL,
        item_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        type ENUM('add', 'use') NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) DEFAULT 0.00,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);
    console.log('✅  transactions table ready');
  } finally {
    await conn.end();
  }
}

migrate().catch((err) => { console.error(err); process.exit(1); });
