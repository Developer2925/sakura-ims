-- Migration 005: Rename users→admins, clinics→users, name→organization_name

-- Step 1: Drop FKs referencing users and clinics
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Rename users (admin accounts) → admins
RENAME TABLE users TO admins;

-- Step 3: Rename clinics (clinic entities) → users
RENAME TABLE clinics TO users;

-- Step 4: Rename name → organization_name in users (was clinics)
ALTER TABLE users RENAME COLUMN name TO organization_name;

-- Step 5: Add missing columns to users if not exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS last_name  VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS position   ENUM('clinic','office_staff') NULL,
  ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS google_id  VARCHAR(255) NULL;

SET FOREIGN_KEY_CHECKS = 1;
