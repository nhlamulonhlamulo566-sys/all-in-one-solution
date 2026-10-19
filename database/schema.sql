CREATE TABLE IF NOT EXISTS customer_requests (
  request_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_type ENUM('quote', 'callback', 'message') NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email_address VARCHAR(254) NOT NULL,
  phone_number VARCHAR(40) NULL,
  company_name VARCHAR(160) NULL,
  service_name VARCHAR(160) NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'contacted', 'completed') NOT NULL DEFAULT 'new',
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
  role ENUM('user', 'staff', 'admin') NOT NULL DEFAULT 'user',
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

CREATE TABLE IF NOT EXISTS website_chat_sessions (
  session_id VARCHAR(128) NOT NULL,
  visitor_id CHAR(36) NOT NULL,
  visitor_token_hash CHAR(64) NOT NULL,
  status ENUM('active', 'closed') NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (session_id),
  KEY idx_website_chat_sessions_status_created (status, created_at),
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
