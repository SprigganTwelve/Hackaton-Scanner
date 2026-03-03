CREATE DATABASE IF NOT EXISTS secure_scann
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE secure_scann;

-- Define or represent an user inside the system
CREATE TABLE account(
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(250),
   email VARCHAR(250),
   password VARCHAR(255),
   git_url VARCHAR(350),
   access_token VARCHAR(250)
);

-- Represent a project upload by an user
CREATE TABLE project(
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(250) NOT NULL,
   created_at DATETIME,
   url VARCHAR(250) NOT NULL,
   account_id INT NOT NULL,
   FOREIGN KEY(account_id) REFERENCES account(id)
);

-- Analysis about an user'project
CREATE TABLE analysis_record(
   id INT AUTO_INCREMENT PRIMARY KEY,
   started_at DATETIME NOT NULL,
   status VARCHAR(50) NOT NULL,
   project_id INT NOT NULL,
   FOREIGN KEY(project_id) REFERENCES project(id)
);

-- A Report that could be made after analysis 
CREATE TABLE report(
   id INT AUTO_INCREMENT PRIMARY KEY,
   format VARCHAR(50),
   created_at DATETIME,
   path VARCHAR(250) NOT NULL,
   original_name VARCHAR(250) NOT NULL,
   analysis_id INT UNIQUE,
   FOREIGN KEY(analysis_id) REFERENCES analysis_record(id)
);

-- Finding - description about an existing error
CREATE TABLE finding(
   id INT AUTO_INCREMENT PRIMARY KEY,
   rule_id VARCHAR(250) NOT NULL,              -- represents the rule that was violated (ex: AWS Hardcoded Password)
   score DECIMAL(15,2) NOT NULL,
   pattern_type VARCHAR(250) NOT NULL,       -- represents the type of the error (ex: hardcoded password, secret key, etc.)
   file_path VARCHAR(250) NOT NULL,          -- represents the path of the file where the error is located
   analysis_record_id INT NOT NULL,
   code TEXT NOT NULL,                         -- represents the code snippet where the error is located
   FOREIGN KEY(analysis_record_id) REFERENCES analysis_record(id)
);

-- Details about the related line
CREATE TABLE line_info(
   id INT AUTO_INCREMENT PRIMARY KEY,
   start_index INT NOT NULL,
   end_index INT NOT NULL,
   finding_id INT NOT NULL,
   FOREIGN KEY(finding_id) REFERENCES finding(id)
);

-- Potential solutions that could be apply
CREATE TABLE solution(
   id INT AUTO_INCREMENT PRIMARY KEY,
   status VARCHAR(50) NOT NULL,
   corrective_measure TEXT,
   finding_id INT UNIQUE,
   FOREIGN KEY(finding_id) REFERENCES finding(id)
);

-- Security for invalid access_token
CREATE TABLE blacklisted_token(
   id INT AUTO_INCREMENT PRIMARY KEY,
   token VARCHAR(250),
   epired_at VARCHAR(250),
   issue_at VARCHAR(350),

   account_id INT UNIQUE,
   FOREIGN KEY(account_id) REFERENCES account(id)
);
