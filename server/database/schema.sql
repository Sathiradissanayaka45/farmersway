-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create rice_varieties table
CREATE TABLE IF NOT EXISTS rice_varieties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    total_purchases DECIMAL(12,2) DEFAULT 0.00,
    total_paid DECIMAL(12,2) DEFAULT 0.00,
    total_pending DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rice purchases table
CREATE TABLE IF NOT EXISTS rice_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    rice_type_id INT NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    pending_amount DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT
);

-- Customer payment history table
CREATE TABLE IF NOT EXISTS customer_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'bank_transfer', 'cheque', 'other') DEFAULT 'cash',
    reference_number VARCHAR(100),
    notes TEXT,
    created_by INT
);
CREATE TABLE boiling_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rice_variety_id INT NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    boiling_date DATETIME NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bdeleted BOOLEAN DEFAULT FALSE,
    deleted_by INT NULL,
    deleted_at TIMESTAMP NULL,
);
ALTER TABLE boiling_records 
ADD COLUMN status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
ADD COLUMN completed_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS boiling_missing_quantities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boiling_completion_id INT NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    reason ENUM('evaporation', 'spillage', 'quality_rejection', 'other') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boiling_completions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boiling_record_id INT NOT NULL,
    returned_quantity_kg DECIMAL(10,2) NOT NULL,
    missing_quantity_kg DECIMAL(10,2) NOT NULL,
    completion_date DATETIME NOT NULL,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Milling records table
CREATE TABLE IF NOT EXISTS milling_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rice_variety_id INT NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    milling_date DATETIME NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mdeleted BOOLEAN DEFAULT FALSE,
    deleted_by INT NULL,
    deleted_at TIMESTAMP NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    completed_at DATETIME NULL
);

-- Milling completions table
CREATE TABLE IF NOT EXISTS milling_completions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    milling_record_id INT NOT NULL,
    output_rice_variety_id INT NOT NULL,
    returned_quantity_kg DECIMAL(10,2) NOT NULL,
    completion_date DATETIME NOT NULL,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Selling customers table (different from purchasing customers)
CREATE TABLE IF NOT EXISTS selling_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    customer_type ENUM('wholesale', 'retail') NOT NULL,
    total_purchases DECIMAL(12,2) DEFAULT 0.00,
    total_paid DECIMAL(12,2) DEFAULT 0.00,
    total_pending DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rice sales table
CREATE TABLE IF NOT EXISTS rice_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    rice_variety_id INT NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    pending_amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT
);

-- Sales payment history table
CREATE TABLE IF NOT EXISTS sales_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    customer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'bank_transfer', 'cheque', 'other') DEFAULT 'cash',
    reference_number VARCHAR(100),
    notes TEXT,
    created_by INT
);

-- Extra income types table
CREATE TABLE IF NOT EXISTS income_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Extra expenses types table
CREATE TABLE IF NOT EXISTS expense_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Extra income records table
CREATE TABLE IF NOT EXISTS extra_income (
    id INT PRIMARY KEY AUTO_INCREMENT,
    income_type_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    income_date DATE NOT NULL,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INT,
    deleted_at TIMESTAMP NULL
);

-- Extra expenses records table
CREATE TABLE IF NOT EXISTS extra_expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expense_type_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INT,
    deleted_at TIMESTAMP NULL
);

ALTER TABLE rice_varieties 
ADD COLUMN rice_type ENUM('paddy', 'selling') NOT NULL DEFAULT 'paddy',
ADD COLUMN description TEXT NULL;

-- Insert default super admin user
-- Default password will be "Admin@123" (will be hashed in the application)
INSERT INTO admin_users (username, email, password, full_name, role) 
VALUES (
    'superadmin',
    'admin@ricemill.com',
    'placeholder_to_be_hashed',  -- We'll update this with bcrypt hash
    'Super Administrator',
    'super_admin'
);
