ALTER TABLE career_vacancies
  ADD COLUMN responsibilities TEXT NULL AFTER requirements,
  ADD COLUMN salary_range VARCHAR(120) NULL AFTER responsibilities,
  ADD COLUMN selection_process TEXT NULL AFTER salary_range;

ALTER TABLE career_vacancies
  ALTER COLUMN required_documents_json SET DEFAULT '["cv"]';

UPDATE career_vacancies
SET required_documents_json = '["cv"]'
WHERE required_documents_json = '["cv","identity","qualification"]';
