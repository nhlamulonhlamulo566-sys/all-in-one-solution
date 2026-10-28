CREATE TABLE IF NOT EXISTS customer_requests (
  request_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_type ENUM('quote', 'callback', 'message') NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email_address VARCHAR(254) NOT NULL,
  phone_number VARCHAR(40) NULL,
  company_name VARCHAR(160) NULL,
  service_name VARCHAR(160) NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'in_progress', 'resolved', 'unresolved', 'escalated')
    NOT NULL DEFAULT 'new',
  assigned_to_user_id CHAR(36) NULL,
  read_by_user_id CHAR(36) NULL,
  read_at DATETIME NULL,
  resolution_note TEXT NULL,
  last_action_by_user_id CHAR(36) NULL,
  last_action_type ENUM('read', 'claimed', 'updated') NULL,
  last_action_note TEXT NULL,
  last_action_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id),
  KEY idx_customer_requests_created_at (created_at),
  KEY idx_customer_requests_type_created (request_type, created_at),
  KEY idx_customer_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_users (
  user_id CHAR(36) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email_address VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('staff', 'admin', 'super_admin') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_website_users_email (email_address),
  KEY idx_website_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_auth_sessions (
  session_hash CHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_hash),
  KEY idx_website_auth_sessions_user (user_id),
  KEY idx_website_auth_sessions_expires (expires_at),
  CONSTRAINT fk_website_auth_sessions_user
    FOREIGN KEY (user_id) REFERENCES website_users (user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_announcements (
  announcement_id VARCHAR(128) NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (announcement_id),
  KEY idx_website_announcements_published_created (is_published, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_page_content (
  page_key VARCHAR(80) NOT NULL,
  heading VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  members_json MEDIUMTEXT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO website_page_content (page_key, heading, description)
VALUES (
  'about-leadership',
  'Meet Our Leadership',
  'Our team helps South African businesses with technology, design and practical business support. Contact us to learn how we can help.'
);

CREATE TABLE IF NOT EXISTS website_chat_sessions (
  session_id VARCHAR(128) NOT NULL,
  visitor_id CHAR(36) NOT NULL,
  visitor_token_hash CHAR(64) NOT NULL,
  status ENUM('active', 'closed') NOT NULL DEFAULT 'active',
  handling_status ENUM('open', 'in_progress', 'resolved', 'unresolved', 'escalated')
    NOT NULL DEFAULT 'open',
  assigned_to_user_id CHAR(36) NULL,
  read_by_user_id CHAR(36) NULL,
  read_at DATETIME NULL,
  resolution_note TEXT NULL,
  last_action_by_user_id CHAR(36) NULL,
  last_action_type ENUM('read', 'claimed', 'updated') NULL,
  last_action_note TEXT NULL,
  last_action_at DATETIME NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (session_id),
  KEY idx_website_chat_sessions_status_created (status, created_at),
  KEY idx_website_chat_sessions_assignment_queue (
    status, assigned_to_user_id, created_at, session_id
  ),
  KEY idx_website_chat_sessions_token (visitor_token_hash),
  KEY idx_website_chat_sessions_visitor (visitor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_chat_messages (
  message_id VARCHAR(128) NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  sender_id VARCHAR(128) NOT NULL,
  sender_role ENUM('visitor', 'staff') NOT NULL,
  message_text TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (message_id),
  KEY idx_website_chat_messages_session_created (session_id, created_at),
  CONSTRAINT fk_website_chat_messages_session
    FOREIGN KEY (session_id) REFERENCES website_chat_sessions (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_vacancies (
  vacancy_id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  department VARCHAR(120) NOT NULL,
  location VARCHAR(160) NOT NULL,
  work_type ENUM('Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship')
    NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  responsibilities TEXT NULL,
  salary_range VARCHAR(120) NULL,
  selection_process TEXT NULL,
  required_documents_json VARCHAR(255) NOT NULL DEFAULT '["cv"]',
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  closing_date DATE NULL,
  created_by_user_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (vacancy_id),
  KEY idx_career_vacancies_status_created (status, created_at),
  CONSTRAINT fk_career_vacancies_creator
    FOREIGN KEY (created_by_user_id) REFERENCES website_users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_applications (
  application_id CHAR(36) NOT NULL,
  vacancy_id CHAR(36) NULL,
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
  KEY idx_career_applications_email (email_address),
  KEY idx_career_applications_vacancy_created (vacancy_id, created_at),
  CONSTRAINT fk_career_applications_vacancy
    FOREIGN KEY (vacancy_id) REFERENCES career_vacancies (vacancy_id)
    ON DELETE SET NULL
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
