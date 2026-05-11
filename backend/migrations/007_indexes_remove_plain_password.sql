-- Migration 007: Add performance indexes + remove plain_password column

-- Indexes for transactions (analytics queries filter by user_id + type/date)
ALTER TABLE transactions
  ADD INDEX idx_transactions_user_type (user_id, type),
  ADD INDEX idx_transactions_user_date (user_id, created_at);

-- Index for restock_requests status filter
ALTER TABLE restock_requests
  ADD INDEX idx_restock_user_status (user_id, status);

-- Index for notifications list (most recent unread per user)
ALTER TABLE notifications
  ADD INDEX idx_notifications_user_date (user_id, created_at),
  ADD INDEX idx_notifications_user_read (user_id, is_read);

-- Index for item_batches lookup by item
ALTER TABLE item_batches
  ADD INDEX idx_batches_item_user (item_id, user_id);

-- Remove plain_password column (security: no plaintext passwords in DB)
ALTER TABLE users DROP COLUMN plain_password;
