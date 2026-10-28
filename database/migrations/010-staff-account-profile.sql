ALTER TABLE website_users
  ADD COLUMN surname VARCHAR(80) NULL AFTER full_name,
  ADD COLUMN contact_number VARCHAR(25) NULL AFTER email_address,
  ADD COLUMN work_number VARCHAR(25) NULL AFTER contact_number,
  ADD COLUMN persal_number VARCHAR(32) NULL AFTER work_number,
  ADD UNIQUE KEY uq_website_users_persal (persal_number);
