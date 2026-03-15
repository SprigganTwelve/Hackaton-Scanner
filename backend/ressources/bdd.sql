CREATE DATABASE IF NOT EXISTS secure_scann
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE secure_scann;

-- =========================
-- ACCOUNT
-- =========================
CREATE TABLE account(
   id VARCHAR(250) PRIMARY KEY,
   name VARCHAR(250),
   email VARCHAR(250) NOT NULL UNIQUE,
   password VARCHAR(255) NOT NULL,
   git_url VARCHAR(350) DEFAULT NULL,
   git_access_token VARCHAR(250) DEFAUL NULL
);

-- =========================
-- PROJECT
-- =========================
CREATE TABLE project(
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(250) NOT NULL,
   original_name VARCHAR(250) DEFAULT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   url VARCHAR(250) NOT NULL,
   is_uploaded TINYINT(1) NOT NULL DEFAULT 0,

   account_id VARCHAR(250) NOT NULL,
   FOREIGN KEY(account_id)
      REFERENCES account(id) ON DELETE CASCADE
);

-- =========================
-- TOOLS
-- =========================
CREATE TABLE tools(
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(250) NOT NULL UNIQUE
);


-- =========================
-- OWASP CATEGORY
-- =========================
CREATE TABLE owasp_category(
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(250) NOT NULL UNIQUE
);



-- =========================
-- RULE
-- =========================
CREATE TABLE rule(
   id INT AUTO_INCREMENT PRIMARY KEY,
   check_id VARCHAR(250) NOT NULL UNIQUE, -- represented someetimes by rule_id
   description TEXT,
   name VARCHAR(250) DEFAULT 'Unknow'
);

-- =========================
-- RULE_CATEGORIES_OWASP
-- =========================

CREATE TABLE rule_categories_owasp(
   rule_id INT,
   category_id INT,
   PRIMARY KEY (rule_id, category_id), -- Empêche les doublons
   FOREIGN KEY (rule_id) REFERENCES rule(id) ON DELETE CASCADE,
   FOREIGN KEY (category_id) REFERENCES owasp_category(id) ON DELETE CASCADE
);


-- =========================
-- ANALYSIS RECORD
-- =========================
CREATE TABLE analysis_record(
   id INT AUTO_INCREMENT PRIMARY KEY,
   score ENUM('A','B','C','D', 'UNDETERMINED') DEFAULT NULL,
   started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   status ENUM('PENDING','RUNNING','COMPLETED','FAILED') DEFAULT 'PENDING',

   project_id INT NOT NULL,
   FOREIGN KEY(project_id)
      REFERENCES project(id) ON DELETE CASCADE
);

-- =========================
-- ANALYSIS TOOLS (M:N)
-- =========================

CREATE TABLE analysis_tools(
   analysis_record_id INT NOT NULL,
   tool_id INT NOT NULL,

   PRIMARY KEY (analysis_record_id, tool_id),

   FOREIGN KEY(analysis_record_id)
      REFERENCES analysis_record(id) ON DELETE CASCADE,

   FOREIGN KEY(tool_id)
      REFERENCES tools(id)
);

-- =========================
-- REPORT
-- =========================
CREATE TABLE report(
   id INT AUTO_INCREMENT PRIMARY KEY,
   format VARCHAR(50),
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   path VARCHAR(250) NOT NULL,
   original_name VARCHAR(250) NOT NULL,

   analysis_id INT UNIQUE,
   FOREIGN KEY(analysis_id)
      REFERENCES analysis_record(id) ON DELETE CASCADE
);

-- =========================
-- FINDING
-- =========================
CREATE TABLE finding(
   id INT AUTO_INCREMENT PRIMARY KEY,
   
   file_path VARCHAR(250) NOT NULL,
   is_corrected TINYINT(1) DEFAULT 0,
   severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
   code TEXT NOT NULL,

   tool_id INT DEFAULT NULL,
   rule_id INT NOT NULL,
   analysis_record_id INT NOT NULL,

   fingerprint VARCHAR(255) NOT NULL,

   UNIQUE(fingerprint, analysis_record_id),
   FOREIGN KEY(rule_id) REFERENCES rule(id),
   FOREIGN KEY(tool_id) REFERENCES tools(id),
   FOREIGN KEY(analysis_record_id) REFERENCES analysis_record(id) ON DELETE CASCADE
);

-- =========================
-- LINE INFO
-- =========================
CREATE TABLE IF NOT EXISTS line_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_index INT NOT NULL,
    end_index INT DEFAULT NULL,
    finding_id INT NOT NULL,
    FOREIGN KEY(finding_id) REFERENCES finding(id) ON DELETE CASCADE
);

-- =========================
-- SOLUTION
-- =========================
CREATE TABLE IF NOT EXISTS solution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    corrective_measure TEXT,
    finding_id INT UNIQUE,
    FOREIGN KEY(finding_id) REFERENCES finding(id) ON DELETE CASCADE
);


-- =========================
-- BLACKLISTED TOKEN
-- =========================
CREATE TABLE blacklisted_token(
   id INT AUTO_INCREMENT PRIMARY KEY,
   token VARCHAR(250),
   expired_at DATETIME,
   issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,

   account_id VARCHAR(250),
   FOREIGN KEY(account_id)
      REFERENCES account(id) ON DELETE CASCADE
);

-- =========================
-- DEFAULT DATA
-- =========================
INSERT INTO tools (name) VALUES
('semgrep'),
('eslint'),
('npmAudit');

INSERT INTO owasp_category (name) VALUES
('A01_Broken_Access_Control'),
('A02_Cryptographic_Failures'),
('A03_Injection'),
('A04_Insecure_Design'),
('A05_Security_Misconfiguration'),
('A06_Vulnerable_And_Outdated_Components'),
('A07_Identification_And_Authentication_Failures'),
('A08_Software_And_Data_Integrity_Failures'),
('A09_Security_Logging_And_Monitoring_Failures'),
('A10_Server_Side_Request_Forgery');

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_project_account  ON project(account_id);
CREATE INDEX idx_analysis_project ON analysis_record(project_id);
CREATE INDEX idx_finding_analysis ON finding(analysis_record_id);