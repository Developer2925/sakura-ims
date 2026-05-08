-- Migration 006: Clear all data (except admins), rename clinic_id → user_id

-- Step 1: Clear all data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE restock_logs;
TRUNCATE TABLE restock_requests;
TRUNCATE TABLE transactions;
TRUNCATE TABLE item_batches;
TRUNCATE TABLE inventory;
TRUNCATE TABLE items;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Step 2: Rename clinic_id → user_id in inventory
ALTER TABLE inventory DROP FOREIGN KEY inventory_ibfk_1;
ALTER TABLE inventory RENAME COLUMN clinic_id TO user_id;
ALTER TABLE inventory
  ADD CONSTRAINT inventory_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Rename clinic_id → user_id in item_batches
ALTER TABLE item_batches DROP FOREIGN KEY item_batches_ibfk_2;
ALTER TABLE item_batches RENAME COLUMN clinic_id TO user_id;
ALTER TABLE item_batches
  ADD CONSTRAINT item_batches_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Rename clinic_id → user_id in items
ALTER TABLE items DROP FOREIGN KEY items_ibfk_1;
ALTER TABLE items RENAME COLUMN clinic_id TO user_id;
ALTER TABLE items
  ADD CONSTRAINT items_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Rename clinic_id → user_id in transactions
ALTER TABLE transactions DROP FOREIGN KEY transactions_ibfk_1;
ALTER TABLE transactions RENAME COLUMN clinic_id TO user_id;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Rename clinic_id → user_id in restock_requests
ALTER TABLE restock_requests DROP FOREIGN KEY restock_requests_ibfk_1;
ALTER TABLE restock_requests RENAME COLUMN clinic_id TO user_id;
ALTER TABLE restock_requests
  ADD CONSTRAINT restock_requests_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 7: Rename clinic_id → user_id in restock_logs
ALTER TABLE restock_logs DROP FOREIGN KEY restock_logs_ibfk_2;
ALTER TABLE restock_logs RENAME COLUMN clinic_id TO user_id;
ALTER TABLE restock_logs
  ADD CONSTRAINT restock_logs_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(id);

-- Step 8: Rename clinic_id → user_id in notifications
ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_1;
ALTER TABLE notifications RENAME COLUMN clinic_id TO user_id;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
