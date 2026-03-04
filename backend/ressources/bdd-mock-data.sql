-- ==============================
-- ACCOUNTS
-- ==============================
INSERT INTO account (id, name, email, password, git_url, hash_git_access_token)
VALUES 
('user_001', 'Alice Martin', 'alice@example.com', '$2b$10$hashedpassword1', 'https://github.com/alice', 'hashed_token_001'),
('user_002', 'Bob Durand', 'bob@example.com', '$2b$10$hashedpassword2', 'https://github.com/bob', NULL);


-- ==============================
-- PROJECTS
-- ==============================
INSERT INTO project (name, url, is_uploaded, account_id)
VALUES
('secure-api', 'https://github.com/alice/secure-api', 0, 'user_001'),
('legacy-app', 'https://github.com/bob/legacy-app', 0, 'user_002'),
('uploaded-archive.zip', 'local_upload', 1, 'user_001');


-- ==============================
-- RULES
-- ==============================
INSERT INTO rule (check_id, description, name, owasp_category_id)
VALUES
('JS_HARDCODED_SECRET', 'Hardcoded secret detected in source code', 'Hardcoded Secret', 4),
('SQL_INJECTION_RAW_QUERY', 'Raw SQL query detected without sanitization', 'SQL Injection Risk', 5),
('INSECURE_RANDOM', 'Insecure random number generator used', 'Weak Random Generator', 4),
('OUTDATED_DEPENDENCY', 'Outdated dependency with known vulnerability', 'Outdated Dependency', 3);


-- ==============================
-- ANALYSIS RECORDS
-- ==============================
INSERT INTO analysis_record (score, status, project_id)
VALUES
('C', 'COMPLETED', 1),
('B', 'COMPLETED', 2),
(NULL, 'RUNNING', 3);


-- ==============================
-- ANALYSIS TOOLS (many-to-many)
-- ==============================
INSERT INTO analysis_tools (analysis_record_id, tool_id)
VALUES
(1, 1), -- semgrep
(1, 2), -- eslint
(2, 1), -- semgrep
(2, 3); -- npmAudit


-- ==============================
-- FINDINGS
-- ==============================
INSERT INTO finding 
(score_penality, message, file_path, severity, code, tool_id, rule_id, analysis_record_id, fingerprint)
VALUES
(2.0, 'hardcoded_secret', 'src/config.js', 'HIGH',
 'const API_KEY = "123456SECRET";',
 1, 1, 1, 'fp_001'),

(3.0, 'sql_injection', 'src/db.js', 'CRITICAL',
 'db.query("SELECT * FROM users WHERE id = " + userId);',
 1, 2, 1, 'fp_002'),

(1.5, 'insecure_random', 'utils/random.js', 'MEDIUM',
 'Math.random()',
 2, 3, 2, 'fp_003'),

(2.5, 'outdated_dependency', 'package.json', 'HIGH',
 '"lodash": "4.17.10"',
 3, 4, 2, 'fp_004');


-- ==============================
-- LINE INFO
-- ==============================
INSERT INTO line_info (start_index, end_index, finding_id)
VALUES
(12, 12, 1),
(45, 45, 2),
(8, 8, 3),
(22, NULL, 4);


-- ==============================
-- SOLUTIONS
-- ==============================
INSERT INTO solution (corrective_measure, finding_id)
VALUES
('Move the secret to environment variables using process.env.', 1),
('Use parameterized queries or prepared statements.', 2),
('Use crypto.randomBytes instead of Math.random.', 3);


-- ==============================
-- REPORTS
-- ==============================
INSERT INTO report (format, path, original_name, analysis_id)
VALUES
('PDF', '/reports/report_analysis_1.pdf', 'secure-api-report.pdf', 1),
('JSON', '/reports/report_analysis_2.json', 'legacy-app-report.json', 2);


-- ==============================
-- BLACKLISTED TOKENS
-- ==============================
INSERT INTO blacklisted_token (hash_token, epired_at, issue_at, account_id)
VALUES
('blacklisted_hash_001', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), 'user_001');