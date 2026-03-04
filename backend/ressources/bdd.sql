CREATE DATABASE IF NOT EXISTS secure_scann
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE secure_scann;

-- Define or represent an user inside the system
CREATE TABLE account(
   id  VARCHAR(250) PRIMARY KEY,
   name VARCHAR(250),         
   email VARCHAR(250) UNIQUE NOT NULL,
   password VARCHAR(255) NOT NULL,
   git_url VARCHAR(350),
   git_access_token VARCHAR(250)     -- represent a PAT(Personal Access Token) that is used to access the user's git repository, it is hashed for security reasons
);

-- Represent a project upload by an user
CREATE TABLE project(
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(250) NOT NULL,                  -- can represent the name of the cloned repository or an original name of the uploaded zip file
   original_name VARCHAR(250) DEFAULT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   url VARCHAR(250) NOT NULL,                   -- can represent the url of the git project (ex: git repository url) or the local path
   is_uploaded TINYINT(1) NOT NULL DEFAULT 0,   -- indicates if the project was uploaded as a zip file or not

   account_id VARCHAR(250) NOT NULL,
   FOREIGN KEY(account_id) REFERENCES account(id)
);

-- Represent the OWASP category of a finding (e.g. Injection, Broken Authentication, etc.)
CREATE TABLE owasp_category(
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(250) NOT NULL UNQIUE,
);


-- Existing used tools for scanning
CREATE TABLE tools(
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(250) NOT NULL UNIQUE
);


-- Represent unique rule that could be violated (e.g. AWS Hardcoded Password, etc.)
CREATE TABLE rule(
   id INT AUTO_INCREMENT PRIMARY KEY,
   
   check_id VARCHAR(250) NOT NULL UNIQUE,       -- or ruleId, represnts the unique error identifier in the sys         -- represents the rule that was violated (ex: AWS Hardcoded Password)
   description TEXT ,                   -- represents the description of the rule
   name VARCHAR(250) NOT NULL,                  -- represents the name of the rule


   owasp_category_id INT NOT NULL,              -- represents the OWASP category of the rule
   
   FOREIGN KEY(owasp_category_id) REFERENCES owasp_category(id)
);



CREATE TABLE analysis_record(
   id INT AUTO_INCREMENT PRIMARY KEY,
   score ENUM('A', 'B', 'C', 'D') DEFAULT NULL,
   started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   status ENUM('PENDING','RUNNING','COMPLETED','FAILED') DEFAULT 'PENDING',
   project_id INT NOT NULL,

   FOREIGN KEY(project_id)
      REFERENCES project(id) ON DELETE CASCADE
);


CREATE TABLE analysis_tools(
   analysis_record_id INT NOT NULL,
   tool_id INT NOT NULL,

   PRIMARY KEY (analysis_record_id, tool_id),

   FOREIGN KEY(analysis_record_id)
      REFERENCES analysis_record(id) ON DELETE CASCADE,

   FOREIGN KEY(tool_id)
      REFERENCES tools(id)
);

-- A Report that could be made after analysis 
CREATE TABLE report(
   id INT AUTO_INCREMENT PRIMARY KEY,
   format VARCHAR(50),
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   path VARCHAR(250) NOT NULL,
   original_name VARCHAR(250) NOT NULL,
   analysis_id INT UNIQUE,
   FOREIGN KEY(analysis_id) REFERENCES analysis_record(id)
);


-- Finding - description about an existing error
CREATE TABLE finding(
   id INT AUTO_INCREMENT PRIMARY KEY,

   file_path VARCHAR(250) NOT NULL,          -- represents the path of the file where the error is located
   
   severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
   code TEXT NOT NULL,                         -- represents the code snippet where the error is located

   tool_id INT DEFAULT NULL,
   rule_id INT NOT NULL,              -- represents the rule that was violated (ex: AWS Hardcoded Password)
   analysis_record_id INT NOT NULL,

   fingerprint VARCHAR(255) NOT NULL,  -- helps detect if the same error is corrected, existing or reintroduced
   UNIQUE(fingerprint, analysis_record_id),

   FOREIGN KEY(rule_id) REFERENCES rule(id),
   FOREIGN KEY(tool_id) REFERENCES tools(id),
   FOREIGN KEY(analysis_record_id) REFERENCES analysis_record(id) ON DELETE CASCADE
);




-- Details about the related line
CREATE TABLE line_info(
   id INT AUTO_INCREMENT PRIMARY KEY,
   start_index INT NOT NULL,
   end_index INT DEFAULT NULL,
   finding_id INT NOT NULL,
   FOREIGN KEY(finding_id) REFERENCES finding(id) ON DELETE CASCADE
);


-- Potential solutions that could be apply
CREATE TABLE solution(
   id INT AUTO_INCREMENT PRIMARY KEY,
   corrective_measure TEXT,
   finding_id INT UNIQUE,
   FOREIGN KEY(finding_id) REFERENCES finding(id) ON DELETE CASCADE
);


-- Security for invalid access_token
CREATE TABLE blacklisted_token(
   id INT AUTO_INCREMENT PRIMARY KEY,
   hash_token VARCHAR(250),
   epired_at DATETIME,
   issue_at DATETIME,

   account_id VARCHAR(250) ,
   FOREIGN KEY(account_id) REFERENCES account(id) ON DELETE CASCADE
);


-- Available tools for scanning
INSERT INTO tools (name) VALUES ('semgrep');
INSERT INTO tools (name) VALUES ('eslint'); 
INSERT INTO tools (name) VALUES ('npmAudit');


-- Available OWAPS categories
INSERT INTO owasp_category (name) VALUES ('A01_Broken_Access_Control');
INSERT INTO owasp_category (name) VALUES ('A02_Security_Misconfiguration');
INSERT INTO owasp_category (name) VALUES ('A03_Software_Supply_Chain_Failures');
INSERT INTO owasp_category (name) VALUES ('A04_Cryptographic_Failures');
INSERT INTO owasp_category (name) VALUES ('A05_Injection');
INSERT INTO owasp_category (name) VALUES ('A06_Insecure_Design');
INSERT INTO owasp_category (name) VALUES ('A07_Auth_Failures');
INSERT INTO owasp_category (name) VALUES ('A08_Data_Integrity_Failures');
INSERT INTO owasp_category (name) VALUES ('A09_Logging_Failures');
INSERT INTO owasp_category (name) VALUES ('A10_Mishandling_Of_Exceptional_onditions');


CREATE INDEX idx_project_account  ON project(account_id);
CREATE INDEX idx_analysis_project ON analysis_record(project_id);
CREATE INDEX idx_finding_analysis ON finding(analysis_record_id);