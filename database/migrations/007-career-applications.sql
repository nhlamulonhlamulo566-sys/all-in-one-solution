CREATE TABLE IF NOT EXISTS career_applications (
  application_id CHAR(36) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email_address VARCHAR(254) NOT NULL,
  phone_number VARCHAR(40) NOT NULL,
  location VARCHAR(160) NOT NULL,
  role_interest VARCHAR(120) NOT NULL,
  availability VARCHAR(120) NOT NULL,
  experience_summary TEXT NOT NULL,
  consent_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (application_id),
  KEY idx_career_applications_created (created_at),
  KEY idx_career_applications_email (email_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_application_documents (
  document_id CHAR(36) NOT NULL,
  application_id CHAR(36) NOT NULL,
  document_type ENUM(
    'cv', 'identity', 'qualification', 'drivers_license', 'other'
  ) NOT NULL,
  original_name VARCHAR(180) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  content_base64 LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (document_id),
  KEY idx_career_documents_application (application_id),
  CONSTRAINT fk_career_documents_application
    FOREIGN KEY (application_id) REFERENCES career_applications (application_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
