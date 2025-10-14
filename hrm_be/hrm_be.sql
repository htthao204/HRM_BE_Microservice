

CREATE DATABASE IF NOT EXISTS hrm_db;
USE hrm_db;

-- ==========================
-- ROLES
-- ==========================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
('Admin', 'Quản trị viên hệ thống với toàn quyền truy cập'),
('HR', 'Quản lý nhân sự, chịu trách nhiệm về nhân viên và chấm công'),
('Accountant', 'Kế toán, phụ trách bảng lương và báo cáo tài chính'),
('Employee', 'Nhân viên thông thường với quyền truy cập giới hạn');

-- ==========================
-- PERMISSIONS
-- ==========================
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO permissions (name, description) VALUES
('departments_all', 'Toàn quyền quản lý phòng ban'),
('department_create', 'Thêm phòng ban mới'),
('department_read', 'Xem thông tin phòng ban'),
('department_update', 'Cập nhật thông tin phòng ban'),
('department_delete', 'Xóa phòng ban'),

('employees_all', 'Toàn quyền quản lý nhân viên'),
('employee_create', 'Thêm nhân viên mới'),
('employee_read', 'Xem thông tin nhân viên'),
('employee_update', 'Cập nhật thông tin nhân viên'),
('employee_delete', 'Xóa nhân viên'),

('accounts_all', 'Toàn quyền quản lý tài khoản hệ thống'),
('account_create', 'Thêm tài khoản mới'),
('account_read', 'Xem thông tin tài khoản'),
('account_update', 'Cập nhật tài khoản'),
('account_delete', 'Xóa tài khoản'),

('roles_all', 'Toàn quyền quản lý vai trò'),
('role_create', 'Tạo vai trò mới'),
('role_read', 'Xem vai trò'),
('role_update', 'Cập nhật vai trò'),
('role_delete', 'Xóa vai trò'),

('payrolls_all', 'Toàn quyền quản lý bảng lương'),
('payroll_create', 'Tạo bảng lương mới'),
('payroll_read', 'Xem bảng lương'),
('payroll_update', 'Cập nhật bảng lương'),
('payroll_delete', 'Xóa bảng lương');

-- ==========================
-- ROLE - PERMISSIONS
-- ==========================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY(role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Admin có toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- HR
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 1),(2,2),(2,3),(2,4),(2,5),
(2,6),(2,7),(2,8);

-- Accountant
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 21),(3,22);

-- Employee chỉ đọc
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 8);

-- ==========================
-- ACCOUNTS
-- ==========================
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

INSERT INTO accounts (username, password, role_id) VALUES
('admin_user', 'admin123', 1),
('hr_user', 'hr123', 2),
('accountant_user', 'acc123', 3),
('employee1', 'emp123', 4),
('employee2', 'emp456', 4);

-- ==========================
-- REFRESH TOKENS
-- ==========================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  token VARCHAR(1000) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- ==========================
-- DEPARTMENTS
-- ==========================
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  manager_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO departments (name) VALUES
('Human Resources'),
('Finance'),
('IT');

-- ==========================
-- POSITIONS
-- ==========================
CREATE TABLE IF NOT EXISTS positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255)
);

INSERT INTO positions (name, description) VALUES
('HR Manager', 'Quản lý nhân sự'),
('HR Staff', 'Nhân viên nhân sự'),
('Accountant', 'Kế toán'),
('Developer', 'Lập trình viên'),
('Support', 'Nhân viên hỗ trợ');

-- ==========================
-- COUNTRIES
-- ==========================
CREATE TABLE IF NOT EXISTS countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- ==========================
-- EMPLOYEE INFORMATION
-- ==========================
CREATE TABLE IF NOT EXISTS employee_information (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  department_id INT,
  position_id INT NULL,
  hire_date DATE,
  account_id INT NULL,
  avatar VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO employee_information (full_name, email, phone, department_id, position_id, hire_date, account_id) VALUES
('Nguyen Van A', 'a@example.com', '0900000001', 1, 1, '2025-01-10', 1),
('Tran Thi B', 'b@example.com', '0900000002', 1, 2, '2025-02-15', 2),
('Le Van C', 'c@example.com', '0900000003', 2, 3, '2025-03-20', 3),
('Pham Thi D', 'd@example.com', '0900000004', 2, 4, '2025-04-05', 4),
('Hoang Van E', 'e@example.com', '0900000005', 3, 5, '2025-05-01', 5);

UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 3 WHERE id = 2;
UPDATE departments SET manager_id = 4 WHERE id = 3;

ALTER TABLE departments
  ADD CONSTRAINT fk_manager FOREIGN KEY (manager_id)
  REFERENCES employee_information(id)
  ON DELETE SET NULL ON UPDATE CASCADE;
