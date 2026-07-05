# Hostinger VPS Database Management Guide

## Database Connection Details
- **Host**: 31.97.236.217
- **User**: nodeapp_user
- **Database**: ricemill_db
- **Port**: 3306

## 🔧 Quick Commands to Check and Update Your Database

### 1. Check Database Health
```bash
cd server
npm run db-health
```

### 2. List All Tables
```bash
npm run db-tables
```

### 3. Generate Full Database Report
```bash
npm run db-report
```

### 4. Update Database Schema
```bash
npm run db-update
```

### 5. Create Database Backup
```bash
npm run db-backup
```

### 6. Check Specific Table Structure
```bash
npm run db-manager structure admin_users
npm run db-manager structure rice_varieties
npm run db-manager structure customers
```

### 7. View Table Data (first 10 rows)
```bash
npm run db-manager data admin_users
npm run db-manager data rice_varieties 20
```

## 🌐 Direct MySQL Connection Methods

### Method 1: Using MySQL Command Line (if installed on your VPS)
```bash
mysql -h 31.97.236.217 -u nodeapp_user -p'Farmersway@123' ricemill_db
```

### Method 2: Using phpMyAdmin (if available on Hostinger)
1. Login to your Hostinger control panel
2. Go to "Databases" section
3. Click on "phpMyAdmin"
4. Use your database credentials to login

### Method 3: Using MySQL Workbench or HeidiSQL (from your local computer)
1. Download MySQL Workbench or HeidiSQL
2. Create new connection with these details:
   - Host: 31.97.236.217
   - Port: 3306
   - Username: nodeapp_user
   - Password: Farmersway@123
   - Database: ricemill_db

## 📊 Common SQL Commands for Database Management

### Check Database Size
```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'ricemill_db'
GROUP BY table_schema;
```

### List Tables with Row Count
```sql
SELECT 
    table_name AS 'Table',
    table_rows AS 'Rows',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'ricemill_db'
ORDER BY table_rows DESC;
```

### Check Table Structure
```sql
DESCRIBE admin_users;
DESCRIBE rice_varieties;
DESCRIBE customers;
```

### View Recent Records
```sql
SELECT * FROM admin_users ORDER BY created_at DESC LIMIT 10;
SELECT * FROM rice_purchases ORDER BY purchase_date DESC LIMIT 10;
SELECT * FROM rice_sales ORDER BY sale_date DESC LIMIT 10;
```

## 🔄 Database Update Process

### Step 1: Create Backup Before Updates
```bash
npm run db-backup
```

### Step 2: Update Schema
```bash
npm run db-update
```

### Step 3: Verify Updates
```bash
npm run db-report
```

## 🚨 Troubleshooting Common Issues

### Connection Issues
1. **Check VPS firewall**: Ensure port 3306 is open
2. **Verify credentials**: Double-check username/password
3. **Test from local**: Try connecting from your local machine

### Permission Issues
```sql
-- Check user privileges
SHOW GRANTS FOR 'nodeapp_user'@'%';

-- Grant necessary permissions if needed
GRANT ALL PRIVILEGES ON ricemill_db.* TO 'nodeapp_user'@'%';
FLUSH PRIVILEGES;
```

### Performance Issues
```sql
-- Check slow queries
SHOW PROCESSLIST;

-- Check table sizes
SELECT 
    table_name,
    round(((data_length + index_length) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'ricemill_db'
ORDER BY (data_length + index_length) DESC;
```

## 📝 Database Maintenance Tasks

### Weekly Tasks
1. Create database backup
2. Check table sizes and row counts
3. Review recent transactions

### Monthly Tasks
1. Analyze database performance
2. Clean up old logs (if any)
3. Update statistics

### Commands for Maintenance
```bash
# Weekly backup
npm run db-backup

# Check database health
npm run db-health

# Generate performance report
npm run db-report
```

## 🔧 Advanced Database Operations

### Add New Table
```sql
-- Example: Adding a new settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Modify Existing Table
```sql
-- Example: Adding a new column to rice_varieties
ALTER TABLE rice_varieties 
ADD COLUMN price_per_kg DECIMAL(10,2) DEFAULT 0.00;
```

### Create Index for Performance
```sql
-- Example: Adding indexes for better query performance
CREATE INDEX idx_purchase_date ON rice_purchases(purchase_date);
CREATE INDEX idx_customer_phone ON customers(phone);
CREATE INDEX idx_sale_date ON rice_sales(sale_date);
```

## 🔐 Security Best Practices

1. **Regular Backups**: Always backup before making changes
2. **Use Transactions**: For multiple related operations
3. **Validate Data**: Check data integrity after updates
4. **Monitor Access**: Review database logs regularly
5. **Update Passwords**: Change database passwords periodically

## 📞 Emergency Contacts

- **Hostinger Support**: Available in your control panel
- **Database Issues**: Check Hostinger database logs
- **Application Issues**: Review Node.js application logs

---

**Note**: Always test database changes in a development environment first before applying to production!
