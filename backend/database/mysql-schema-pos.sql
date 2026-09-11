-- ============================================
-- POS & INVENTORY MANAGEMENT SYSTEM
-- MySQL Database Schema for Retail/Supermarket
-- ============================================
-- Database: denla
-- Version: 2.0.0 - POS System
-- Description: Complete POS, inventory, and stock management system
-- ============================================

CREATE DATABASE IF NOT EXISTS denla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE denla;

-- ============================================
-- 1. USERS & AUTHENTICATION (Staff/Employees)
-- ============================================

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'manager', 'cashier', 'inventory_clerk', 'accountant') DEFAULT 'cashier',
    employee_id VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_employee_id (employee_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User permissions/access log
CREATE TABLE user_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    ip_address VARCHAR(45),
    terminal_id VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. SUPPLIERS
-- ============================================

CREATE TABLE suppliers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100), -- e.g., "Net 30", "Cash on Delivery"
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. CATEGORIES
-- ============================================

CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    parent_id CHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. PRODUCTS (Inventory Items)
-- ============================================

CREATE TABLE products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    category_id CHAR(36),
    description TEXT,
    
    -- Unit & Pricing
    unit_of_measure ENUM('piece', 'kg', 'g', 'liter', 'ml', 'box', 'pack', 'dozen') DEFAULT 'piece',
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- Buying price
    selling_price DECIMAL(10,2) NOT NULL, -- Retail price
    wholesale_price DECIMAL(10,2), -- Bulk/Wholesale price
    minimum_price DECIMAL(10,2), -- Minimum selling price (discount limit)
    
    -- Stock Management
    current_stock DECIMAL(10,2) DEFAULT 0,
    minimum_stock DECIMAL(10,2) DEFAULT 10, -- Reorder level
    maximum_stock DECIMAL(10,2) DEFAULT 1000,
    reorder_quantity DECIMAL(10,2) DEFAULT 50,
    
    -- Tracking
    is_active BOOLEAN DEFAULT TRUE,
    is_taxable BOOLEAN DEFAULT TRUE,
    tax_rate DECIMAL(5,2) DEFAULT 0, -- e.g., 16.00 for 16% VAT
    has_expiry BOOLEAN DEFAULT FALSE,
    
    -- Supplier info
    default_supplier_id CHAR(36),
    
    -- Metadata
    image VARCHAR(500),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (default_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_sku (sku),
    INDEX idx_barcode (barcode),
    INDEX idx_category (category_id),
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product batches (for items with expiry dates)
CREATE TABLE product_batches (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    batch_number VARCHAR(100),
    manufacture_date DATE,
    expiry_date DATE,
    quantity DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    supplier_id CHAR(36),
    received_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_batch_number (batch_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. PURCHASE ORDERS (Stock Receiving)
-- ============================================

CREATE TABLE purchase_orders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id CHAR(36) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    received_date DATE,
    
    status ENUM('draft', 'sent', 'partial', 'received', 'cancelled') DEFAULT 'draft',
    
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    
    created_by CHAR(36),
    received_by CHAR(36),
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_po_number (po_number),
    INDEX idx_supplier_id (supplier_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    purchase_order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity_ordered DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_po_id (purchase_order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. STOCK ADJUSTMENTS & MOVEMENTS
-- ============================================

CREATE TABLE stock_adjustments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    adjustment_type ENUM('addition', 'reduction', 'damage', 'loss', 'return', 'transfer', 'recount') NOT NULL,
    quantity_before DECIMAL(10,2) NOT NULL,
    quantity_adjusted DECIMAL(10,2) NOT NULL,
    quantity_after DECIMAL(10,2) NOT NULL,
    reason TEXT,
    reference_number VARCHAR(100),
    adjusted_by CHAR(36),
    approved_by CHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (adjusted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_adjustment_type (adjustment_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. CUSTOMERS (Optional - for loyalty)
-- ============================================

CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    customer_type ENUM('regular', 'wholesale', 'vip') DEFAULT 'regular',
    loyalty_points INT DEFAULT 0,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_customer_type (customer_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. SALES / TRANSACTIONS (POS)
-- ============================================

CREATE TABLE sales (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id CHAR(36),
    
    -- Transaction details
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    cashier_id CHAR(36) NOT NULL,
    terminal_id VARCHAR(50),
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Payment
    payment_method ENUM('cash', 'card', 'mpesa', 'bank_transfer', 'credit', 'mixed') NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    change_given DECIMAL(12,2) DEFAULT 0,
    payment_status ENUM('pending', 'paid', 'partial', 'cancelled') DEFAULT 'paid',
    
    -- Status
    status ENUM('completed', 'pending', 'cancelled', 'refunded') DEFAULT 'completed',
    
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_sale_number (sale_number),
    INDEX idx_sale_date (sale_date),
    INDEX idx_cashier_id (cashier_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sale_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sale_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    
    -- Product snapshot
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    
    -- Quantities & Pricing
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL, -- For profit calculation
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    
    batch_id CHAR(36), -- Link to batch if applicable
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE SET NULL,
    INDEX idx_sale_id (sale_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment details for mixed payments
CREATE TABLE sale_payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sale_id CHAR(36) NOT NULL,
    payment_method ENUM('cash', 'card', 'mpesa', 'bank_transfer', 'credit') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reference_number VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    INDEX idx_sale_id (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. RETURNS & REFUNDS
-- ============================================

CREATE TABLE returns (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    return_number VARCHAR(50) UNIQUE NOT NULL,
    original_sale_id CHAR(36),
    customer_id CHAR(36),
    return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_by CHAR(36) NOT NULL,
    
    reason TEXT,
    refund_method ENUM('cash', 'card', 'mpesa', 'store_credit'),
    total_refund_amount DECIMAL(12,2) NOT NULL,
    
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (original_sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_return_number (return_number),
    INDEX idx_return_date (return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE return_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    return_id CHAR(36) NOT NULL,
    sale_item_id CHAR(36),
    product_id CHAR(36) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    reason TEXT,
    condition_status ENUM('good', 'damaged', 'expired') DEFAULT 'good',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_return_id (return_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. EXPENSES
-- ============================================

CREATE TABLE expenses (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category ENUM('rent', 'utilities', 'salaries', 'supplies', 'maintenance', 'transport', 'other') NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'cheque') NOT NULL,
    reference_number VARCHAR(100),
    approved_by CHAR(36),
    recorded_by CHAR(36),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_expense_date (expense_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. DAILY CASH REGISTER
-- ============================================

CREATE TABLE cash_register (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    terminal_id VARCHAR(50) NOT NULL,
    cashier_id CHAR(36) NOT NULL,
    opening_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    closing_date DATETIME,
    
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(12,2),
    
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_cash_sales DECIMAL(12,2) DEFAULT 0,
    total_card_sales DECIMAL(12,2) DEFAULT 0,
    total_mpesa_sales DECIMAL(12,2) DEFAULT 0,
    
    expected_cash DECIMAL(12,2),
    actual_cash DECIMAL(12,2),
    cash_difference DECIMAL(12,2),
    
    status ENUM('open', 'closed') DEFAULT 'open',
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_terminal_id (terminal_id),
    INDEX idx_cashier_id (cashier_id),
    INDEX idx_opening_date (opening_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. ANALYTICS & REPORTS
-- ============================================

-- Daily sales summary
CREATE TABLE daily_sales_summary (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    summary_date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_transactions INT DEFAULT 0,
    total_customers INT DEFAULT 0,
    total_items_sold DECIMAL(12,2) DEFAULT 0,
    total_profit DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    mpesa_sales DECIMAL(12,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_summary_date (summary_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product sales analytics
CREATE TABLE product_sales_analytics (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    quantity_sold DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_profit DECIMAL(12,2) DEFAULT 0,
    number_of_transactions INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_date (product_id, date),
    INDEX idx_date (date),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. SYSTEM LOGS & AUDIT TRAIL
-- ============================================

CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id CHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. SYSTEM SETTINGS
-- ============================================

CREATE TABLE system_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-generate sale number
DELIMITER //

CREATE TRIGGER before_sale_insert
BEFORE INSERT ON sales
FOR EACH ROW
BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
        SET NEW.sale_number = CONCAT('SAL-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 99999), 5, '0'));
    END IF;
END//

-- Auto-generate PO number
CREATE TRIGGER before_po_insert
BEFORE INSERT ON purchase_orders
FOR EACH ROW
BEGIN
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        SET NEW.po_number = CONCAT('PO-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 99999), 5, '0'));
    END IF;
END//

-- Update product stock after sale
CREATE TRIGGER after_sale_item_insert
AFTER INSERT ON sale_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
END//

-- Update product stock after return
CREATE TRIGGER after_return_item_insert
AFTER INSERT ON return_items
FOR EACH ROW
BEGIN
    IF NEW.condition_status = 'good' THEN
        UPDATE products 
        SET current_stock = current_stock + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
END//

DELIMITER ;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Low stock alert
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.barcode,
    p.current_stock,
    p.minimum_stock,
    p.reorder_quantity,
    c.name as category_name,
    s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.default_supplier_id = s.id
WHERE p.current_stock <= p.minimum_stock AND p.is_active = TRUE;

-- Products near expiry
CREATE OR REPLACE VIEW expiring_products AS
SELECT 
    pb.id as batch_id,
    p.name as product_name,
    p.sku,
    pb.batch_number,
    pb.expiry_date,
    pb.quantity,
    DATEDIFF(pb.expiry_date, CURDATE()) as days_to_expiry
FROM product_batches pb
INNER JOIN products p ON pb.product_id = p.id
WHERE pb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND pb.is_active = TRUE
  AND pb.quantity > 0
ORDER BY pb.expiry_date ASC;

-- Daily sales report
CREATE OR REPLACE VIEW daily_sales_report AS
SELECT 
    DATE(sale_date) as date,
    COUNT(*) as transactions_count,
    SUM(total_amount) as total_sales,
    SUM(subtotal) as subtotal,
    SUM(tax_amount) as total_tax,
    SUM(discount_amount) as total_discount,
    AVG(total_amount) as average_sale,
    SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_sales,
    SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as card_sales,
    SUM(CASE WHEN payment_method = 'mpesa' THEN total_amount ELSE 0 END) as mpesa_sales
FROM sales
WHERE status = 'completed'
GROUP BY DATE(sale_date)
ORDER BY date DESC;

-- Top selling products
CREATE OR REPLACE VIEW top_selling_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.barcode,
    SUM(si.quantity) as total_quantity_sold,
    COUNT(DISTINCT si.sale_id) as number_of_sales,
    SUM(si.subtotal) as total_revenue,
    SUM(si.subtotal - (si.quantity * si.cost_price)) as total_profit
FROM sale_items si
INNER JOIN products p ON si.product_id = p.id
INNER JOIN sales s ON si.sale_id = s.id
WHERE s.status = 'completed'
  AND s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY p.id, p.name, p.sku, p.barcode
ORDER BY total_quantity_sold DESC;

-- ============================================
-- INITIAL SYSTEM SETTINGS
-- ============================================

INSERT INTO system_settings (setting_key, setting_value, data_type, description, is_editable) VALUES
(UUID(), 'shop_name', 'Awesome Supermarket', 'string', 'Shop/Business name', TRUE),
(UUID(), 'tax_rate', '16.00', 'number', 'Default tax/VAT rate percentage', TRUE),
(UUID(), 'currency', 'KSh', 'string', 'Currency symbol', TRUE),
(UUID(), 'low_stock_alert', 'true', 'boolean', 'Enable low stock alerts', TRUE),
(UUID(), 'expiry_alert_days', '30', 'number', 'Days before expiry to show alert', TRUE),
(UUID(), 'receipt_footer', 'Thank you for shopping with us!', 'string', 'Receipt footer message', TRUE),
(UUID(), 'allow_negative_stock', 'false', 'boolean', 'Allow selling when stock is 0', TRUE);

-- ============================================
-- INITIAL CATEGORIES
-- ============================================

INSERT INTO categories (id, name, code, description) VALUES
(UUID(), 'Groceries', 'GRC', 'General grocery items'),
(UUID(), 'Beverages', 'BEV', 'Drinks and beverages'),
(UUID(), 'Dairy Products', 'DAI', 'Milk, cheese, yogurt'),
(UUID(), 'Meat & Poultry', 'MEA', 'Fresh and frozen meat'),
(UUID(), 'Fruits & Vegetables', 'FRU', 'Fresh produce'),
(UUID(), 'Bakery', 'BAK', 'Bread and baked goods'),
(UUID(), 'Household Items', 'HOU', 'Cleaning and household supplies'),
(UUID(), 'Personal Care', 'PER', 'Toiletries and personal care');

-- ============================================
-- END OF SCHEMA
-- ============================================
