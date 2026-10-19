ALTER TABLE customer_requests
  MODIFY COLUMN status ENUM(
    'new', 'contacted', 'completed', 'in_progress', 'resolved', 'unresolved', 'escalated'
  ) NOT NULL DEFAULT 'new';

UPDATE customer_requests
SET status = CASE
  WHEN status = 'contacted' THEN 'in_progress'
  WHEN status = 'completed' THEN 'resolved'
  ELSE status
END
WHERE status IN ('contacted', 'completed');

ALTER TABLE customer_requests
  MODIFY COLUMN status ENUM(
    'new', 'in_progress', 'resolved', 'unresolved', 'escalated'
  ) NOT NULL DEFAULT 'new',
  ADD COLUMN assigned_to_user_id CHAR(36) NULL,
  ADD COLUMN read_by_user_id CHAR(36) NULL,
  ADD COLUMN read_at DATETIME NULL,
  ADD COLUMN resolution_note TEXT NULL,
  ADD COLUMN last_action_by_user_id CHAR(36) NULL,
  ADD COLUMN last_action_type ENUM('read', 'claimed', 'updated') NULL,
  ADD COLUMN last_action_note TEXT NULL,
  ADD COLUMN last_action_at DATETIME NULL;

ALTER TABLE website_chat_sessions
  ADD COLUMN handling_status ENUM(
    'open', 'in_progress', 'resolved', 'unresolved', 'escalated'
  ) NOT NULL DEFAULT 'open',
  ADD COLUMN assigned_to_user_id CHAR(36) NULL,
  ADD COLUMN read_by_user_id CHAR(36) NULL,
  ADD COLUMN read_at DATETIME NULL,
  ADD COLUMN resolution_note TEXT NULL,
  ADD COLUMN last_action_by_user_id CHAR(36) NULL,
  ADD COLUMN last_action_type ENUM('read', 'claimed', 'updated') NULL,
  ADD COLUMN last_action_note TEXT NULL,
  ADD COLUMN last_action_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS website_staff_activity (
  activity_id CHAR(36) NOT NULL,
  entity_type ENUM('request', 'chat') NOT NULL,
  entity_id VARCHAR(128) NOT NULL,
  staff_user_id CHAR(36) NOT NULL,
  action ENUM('read', 'claimed', 'status', 'note') NOT NULL,
  details TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (activity_id),
  KEY idx_website_staff_activity_entity (entity_type, entity_id, created_at),
  KEY idx_website_staff_activity_staff (staff_user_id, created_at),
  CONSTRAINT fk_website_staff_activity_user
    FOREIGN KEY (staff_user_id) REFERENCES website_users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
