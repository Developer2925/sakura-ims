-- Migration 003: User profile fields
ALTER TABLE clinics
  ADD COLUMN first_name VARCHAR(100) NULL,
  ADD COLUMN last_name  VARCHAR(100) NULL,
  ADD COLUMN position   ENUM('clinic','office_staff') NULL;
