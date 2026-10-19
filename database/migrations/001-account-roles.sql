-- Run only after confirming website_users has no rows with role = 'user'.
ALTER TABLE website_users
  MODIFY role ENUM('staff', 'admin', 'super_admin')
  NOT NULL DEFAULT 'staff';
