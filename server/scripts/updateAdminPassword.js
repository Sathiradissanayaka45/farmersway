const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateAdminPassword() {
    try {
        // Create database connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Hash the default password
        const defaultPassword = 'Admin@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        // Update the superadmin password
        await connection.execute(
            'UPDATE admin_users SET password = ? WHERE username = ?',
            [hashedPassword, 'superadmin']
        );

        console.log('Successfully updated superadmin password');
        process.exit(0);
    } catch (error) {
        console.error('Error updating password:', error);
        process.exit(1);
    }
}

updateAdminPassword();
