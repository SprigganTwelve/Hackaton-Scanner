USE secure_scann;

-- =====================================================
-- ACCOUNTS
-- =====================================================

INSERT INTO account (id, name, email, password, git_url, git_access_token) VALUES
(
  'user_1',
  'Alice Martin',
  'alice@secure.com',
  '$2b$10$wH9z9FzH6kQJ7Q8zQ9zZeuV5gW8zYkJHqR7lVY8KxXh6H7mZpTQ9K', 
  'https://github.com/alice-secure',
  'hashed_pat_token_1'
),
-- password clair: Alice123!

(
  'user_2',
  'Bob Dupont',
  'bob@secure.com',
  '$2b$10$7uW8zXzH6kQJ7Q8zQ9zZeuyH3kJHqR7lVY8KxXh6H7mZpTQ9KxYpO', 
  'https://github.com/bob-dev',
  'hashed_pat_token_2'
),
-- password clair: BobSecure456!

(
  'admin_1',
  'Admin Root',
  'admin@secure.com',
  '$2b$10$Q9zZeuV5gW8zYkJHqR7lVY8KxXh6H7mZpTQ9KwH9z9FzH6kQJ7Q8z', 
  'https://github.com/root-admin',
  'hashed_pat_token_3'
);
-- password clair: AdminPower789!


-- =====================================================
-- PROJECTS
-- =====================================================

INSERT INTO project (name, original_name, url, is_uploaded, account_id) VALUES
('Ecommerce API', NULL, 'https://github.com/alice-secure/ecommerce-api', 0, 'user_1'),
('Banking App', 'banking.zip', 'local_upload', 1, 'user_2'),
('Internal CRM', NULL, 'https://github.com/root-admin/internal-crm', 0, 'admin_1');


-- =====================================================
-- RULES
-- =====================================================

INSERT INTO rule (check_id, description, name, owasp_category_id) VALUES
('AWS001', 'Hardcoded AWS credentials detected', 'AWS Hardcoded Secret', 4),
('SQL001', 'Potential SQL Injection vulnerability', 'SQL Injection Risk', 5),
('AUTH001', 'Weak password policy detected', 'Weak Authentication Policy', 7),
('LOG001', 'Sensitive data logged in plain text', 'Sensitive Logging', 9);


-- =====================================================
-- ANALYSIS RECORDS
-- =====================================================

INSERT INTO analysis_record (score, status, project_id) VALUES
('B', 'COMPLETED', 1),
('C', 'COMPLETED', 2),
(NULL, 'RUNNING', 3);


-- =====================================================
-- ANALYSIS TOOLS (M:N)
-- =====================================================

INSERT INTO analysis_tools (analysis_record_id, tool_id) VALUES
(1, 1),
(1, 2),
(2, 1),
(2, 3),
(3, 1);


-- =====================================================
-- REPORTS
-- =====================================================

INSERT INTO report (format, path, original_name, analysis_id) VALUES
('PDF', '/reports/ecommerce_report.pdf', 'ecommerce_report.pdf', 1),
('PDF', '/reports/banking_report.pdf', 'banking_report.pdf', 2);


-- =====================================================
-- FINDINGS
-- =====================================================

INSERT INTO finding
(file_path, is_corrected, severity, code, tool_id, rule_id, analysis_record_id, fingerprint)
VALUES
(
  'src/config/aws.js',
  0,
  'CRITICAL',
  'const AWS_SECRET = "AKIAIOSFODNN7EXAMPLE";',
  1,
  1,
  1,
  'fp_aws_001'
),
(
  'src/db/query.js',
  0,
  'HIGH',
  'SELECT * FROM users WHERE id = '' + req.params.id;',
  1,
  2,
  1,
  'fp_sql_001'
),
(
  'auth/password.js',
  1,
  'MEDIUM',
  'if(password.length < 6) return false;',
  2,
  3,
  2,
  'fp_auth_001'
);


-- =====================================================
-- LINE INFO
-- =====================================================

INSERT INTO line_info (start_index, end_index, finding_id) VALUES
(12, 12, 1),
(45, 46, 2),
(8, 8, 3);


-- =====================================================
-- SOLUTIONS
-- =====================================================

INSERT INTO solution (corrective_measure, finding_id) VALUES
(
  'Use environment variables and secret managers (e.g. AWS Secrets Manager).',
  1
),
(
  'Use prepared statements or ORM query builders to prevent SQL injection.',
  2
),
(
  'Enforce strong password policy (min 12 chars, symbols, uppercase, numbers).',
  3
);


-- =====================================================
-- BLACKLISTED TOKENS
-- =====================================================

INSERT INTO blacklisted_token (token, expired_at, account_id) VALUES
('blacklisted_hash_token_1', DATE_ADD(NOW(), INTERVAL 7 DAY), 'user_1'),
('blacklisted_hash_token_2', DATE_ADD(NOW(), INTERVAL 3 DAY), 'user_2');