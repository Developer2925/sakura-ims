require("dotenv").config();
const db = require("./src/db");

async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      clinic_id INT NOT NULL,
      type ENUM('approved', 'rejected', 'shipped') NOT NULL,
      message VARCHAR(500) NOT NULL,
      restock_request_id INT,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (restock_request_id) REFERENCES restock_requests(id) ON DELETE SET NULL
    )
  `);
  console.log("notifications table created");
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
