CREATE TABLE IF NOT EXISTS website_page_content (
  page_key VARCHAR(80) NOT NULL,
  heading VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
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
