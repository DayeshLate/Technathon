-- BloodBank MySQL Schema for Red Relay Platform
CREATE DATABASE IF NOT EXISTS BloodBank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE BloodBank;

-- Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  area VARCHAR(100) NOT NULL,
  lat DOUBLE NOT NULL,
  lng DOUBLE NOT NULL,
  contact VARCHAR(100),
  emergency_units_needed INT DEFAULT 0,
  type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Banks Table
CREATE TABLE IF NOT EXISTS blood_banks (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  area VARCHAR(100) NOT NULL,
  lat DOUBLE NOT NULL,
  lng DOUBLE NOT NULL,
  contact VARCHAR(100),
  address VARCHAR(255),
  threshold INT DEFAULT 20,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Bank Inventory Table
CREATE TABLE IF NOT EXISTS blood_bank_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_id VARCHAR(50) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  available_units INT NOT NULL DEFAULT 0,
  reserved_units INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bank_group (bank_id, blood_group),
  FOREIGN KEY (bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE
);

-- Donors Table
CREATE TABLE IF NOT EXISTS donors (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  area VARCHAR(100) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(100),
  available BOOLEAN DEFAULT TRUE,
  eligibility_status VARCHAR(50) DEFAULT 'Eligible',
  last_donation_date VARCHAR(50),
  total_donations INT DEFAULT 0,
  badge VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Requests Table
CREATE TABLE IF NOT EXISTS emergency_requests (
  id VARCHAR(50) PRIMARY KEY,
  patient_case_id VARCHAR(100),
  hospital_id VARCHAR(50),
  hospital_name VARCHAR(255),
  area VARCHAR(100),
  latitude DOUBLE,
  longitude DOUBLE,
  blood_group VARCHAR(10) NOT NULL,
  units_required INT NOT NULL DEFAULT 1,
  units_fulfilled INT NOT NULL DEFAULT 0,
  urgency VARCHAR(50) NOT NULL DEFAULT 'Critical',
  status VARCHAR(50) NOT NULL DEFAULT 'MATCHING',
  required_by_minutes INT DEFAULT 60,
  priority_score INT DEFAULT 50,
  notes TEXT,
  matched_donors_json LONGTEXT,
  duplicate_flag BOOLEAN DEFAULT FALSE,
  created_at VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_req_status (status),
  INDEX idx_req_blood (blood_group),
  INDEX idx_req_urgency (urgency)
);

-- NGOs Table
CREATE TABLE IF NOT EXISTS ngos (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  area VARCHAR(100) NOT NULL,
  contact VARCHAR(100),
  description TEXT,
  camps_json LONGTEXT,
  registered_volunteers_json LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  time VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  request_id VARCHAR(50),
  created_at VARCHAR(100)
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  actor VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  timestamp VARCHAR(100)
);

-- Compatibility Matrix Table
CREATE TABLE IF NOT EXISTS blood_compatibility (
  blood_group VARCHAR(10) PRIMARY KEY,
  can_receive_from_json LONGTEXT NOT NULL
);

-- System Metadata & Analytics Table
CREATE TABLE IF NOT EXISTS system_metadata (
  meta_key VARCHAR(100) PRIMARY KEY,
  meta_value LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
