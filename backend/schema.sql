CREATE DATABASE IF NOT EXISTS clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinic_db;

CREATE TABLE IF NOT EXISTS clinics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clinic_id INT NOT NULL,
  barcode VARCHAR(255),
  internal_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255) DEFAULT '',
  category VARCHAR(100) NOT NULL,
  condition_status VARCHAR(50) DEFAULT '新品',
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clinic_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  total_quantity_received INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clinic_item (clinic_id, item_id),
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS restock_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clinic_id INT NOT NULL,
  item_id INT NOT NULL,
  requested_quantity INT NOT NULL,
  notes TEXT,
  status ENUM('pending', 'approved', 'rejected', 'out_for_delivery', 'delivered') DEFAULT 'pending',
  admin_note TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

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
);

CREATE TABLE IF NOT EXISTS item_batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  clinic_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  expiry_date DATE,
  quantity INT NOT NULL DEFAULT 0,
  condition_status VARCHAR(50) NOT NULL DEFAULT '新品',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS restock_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  clinic_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity_added INT NOT NULL DEFAULT 0,
  action ENUM('approved', 'rejected', 'out_for_delivery', 'delivered') NOT NULL,
  performed_by INT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES restock_requests(id),
  FOREIGN KEY (clinic_id) REFERENCES clinics(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);
