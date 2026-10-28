CREATE TABLE IF NOT EXISTS career_vacancies (
  vacancy_id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  department VARCHAR(120) NOT NULL,
  location VARCHAR(160) NOT NULL,
  work_type ENUM('Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship')
    NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
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

ALTER TABLE career_applications
  ADD COLUMN vacancy_id CHAR(36) NULL AFTER application_id,
  ADD KEY idx_career_applications_vacancy_created (vacancy_id, created_at),
  ADD CONSTRAINT fk_career_applications_vacancy
    FOREIGN KEY (vacancy_id) REFERENCES career_vacancies (vacancy_id)
    ON DELETE SET NULL;
