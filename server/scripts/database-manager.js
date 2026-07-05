const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseManager {
    constructor() {
        this.connection = null;
        this.dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            acquireTimeout: 60000,
            timeout: 60000
        };
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection(this.dbConfig);
            console.log('✅ Connected to database successfully');
            console.log(`📍 Host: ${this.dbConfig.host}`);
            console.log(`🗄️ Database: ${this.dbConfig.database}`);
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            console.log('🔌 Disconnected from database');
        }
    }

    async checkDatabaseHealth() {
        try {
            // Check database connection
            const [result] = await this.connection.execute('SELECT 1 as health');
            console.log('✅ Database connection is healthy');

            // Check database version
            const [version] = await this.connection.execute('SELECT VERSION() as version');
            console.log(`📊 MySQL Version: ${version[0].version}`);

            // Check database size
            const [size] = await this.connection.execute(`
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Database Size (MB)'
                FROM information_schema.tables 
                WHERE table_schema = ?
            `, [this.dbConfig.database]);
            console.log(`💾 Database Size: ${size[0]['Database Size (MB)']} MB`);

            return true;
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            return false;
        }
    }

    async listAllTables() {
        try {
            const [tables] = await this.connection.execute(`
                SELECT TABLE_NAME, TABLE_ROWS, 
                       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
                       CREATE_TIME, UPDATE_TIME
                FROM information_schema.TABLES 
                WHERE table_schema = ?
                ORDER BY TABLE_NAME
            `, [this.dbConfig.database]);

            console.log('\n📋 DATABASE TABLES:');
            console.log('=====================================');
            console.table(tables);
            
            return tables;
        } catch (error) {
            console.error('❌ Failed to list tables:', error.message);
            return [];
        }
    }

    async getTableStructure(tableName) {
        try {
            const [structure] = await this.connection.execute(`
                SELECT 
                    COLUMN_NAME as 'Column',
                    DATA_TYPE as 'Type',
                    IS_NULLABLE as 'Null',
                    COLUMN_KEY as 'Key',
                    COLUMN_DEFAULT as 'Default',
                    EXTRA as 'Extra'
                FROM information_schema.COLUMNS 
                WHERE table_schema = ? AND table_name = ?
                ORDER BY ORDINAL_POSITION
            `, [this.dbConfig.database, tableName]);

            console.log(`\n🏗️ STRUCTURE OF TABLE: ${tableName}`);
            console.log('=====================================');
            console.table(structure);
            
            return structure;
        } catch (error) {
            console.error(`❌ Failed to get structure for ${tableName}:`, error.message);
            return [];
        }
    }

    async getTableData(tableName, limit = 10) {
        try {
            const [data] = await this.connection.execute(
                `SELECT * FROM \`${tableName}\` LIMIT ${limit}`
            );

            console.log(`\n📊 DATA FROM TABLE: ${tableName} (First ${limit} rows)`);
            console.log('=====================================');
            if (data.length > 0) {
                console.table(data);
            } else {
                console.log('No data found in this table.');
            }
            
            return data;
        } catch (error) {
            console.error(`❌ Failed to get data from ${tableName}:`, error.message);
            return [];
        }
    }

    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `backup_${this.dbConfig.database}_${timestamp}.sql`;
            
            // Get all tables
            const tables = await this.listAllTables();
            let backupSQL = `-- Database backup for ${this.dbConfig.database}\n-- Created at: ${new Date().toISOString()}\n\n`;
            
            for (const table of tables) {
                const tableName = table.TABLE_NAME;
                
                // Get table structure
                const [createTable] = await this.connection.execute(`SHOW CREATE TABLE ${tableName}`);
                backupSQL += `-- Table: ${tableName}\n`;
                backupSQL += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
                backupSQL += createTable[0]['Create Table'] + ';\n\n';
                
                // Get table data
                const [rows] = await this.connection.execute(`SELECT * FROM ${tableName}`);
                if (rows.length > 0) {
                    backupSQL += `-- Data for table: ${tableName}\n`;
                    for (const row of rows) {
                        const values = Object.values(row).map(val => 
                            val === null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`
                        ).join(', ');
                        const columns = Object.keys(row).map(col => `\`${col}\``).join(', ');
                        backupSQL += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
                    }
                    backupSQL += '\n';
                }
            }
            
            console.log(`\n💾 Backup created in memory. Size: ${(backupSQL.length / 1024).toFixed(2)} KB`);
            return { fileName: backupFileName, content: backupSQL };
        } catch (error) {
            console.error('❌ Backup creation failed:', error.message);
            return null;
        }
    }

    async runSQLFile(sqlContent) {
        try {
            // Split SQL content into individual statements
            const statements = sqlContent
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt && !stmt.startsWith('--') && stmt.length > 0);

            let successCount = 0;
            let errorCount = 0;

            for (const statement of statements) {
                try {
                    console.log(`🔄 Executing: ${statement.substring(0, 100)}...`);
                    const result = await this.connection.execute(statement);
                    console.log(`✅ Success: ${statement.split(' ')[0]} command executed`);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
                    console.error(`   Error: ${error.message}`);
                    errorCount++;
                }
            }

            console.log(`\n✅ SQL execution completed:`);
            console.log(`   Successful statements: ${successCount}`);
            console.log(`   Failed statements: ${errorCount}`);
            
            return { success: successCount, errors: errorCount };
        } catch (error) {
            console.error('❌ SQL file execution failed:', error.message);
            return { success: 0, errors: 1 };
        }
    }

    async updateSchema() {
        try {
            const fs = require('fs');
            const path = require('path');
            const schemaPath = path.join(__dirname, '../database/schema.sql');
            
            if (!fs.existsSync(schemaPath)) {
                console.error('❌ Schema file not found:', schemaPath);
                return false;
            }

            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            console.log('🔄 Updating database schema...');
            
            const result = await this.runSQLFile(schemaContent);
            
            if (result.errors === 0) {
                console.log('✅ Schema updated successfully');
                return true;
            } else {
                console.log(`⚠️ Schema updated with ${result.errors} errors`);
                return false;
            }
        } catch (error) {
            console.error('❌ Schema update failed:', error.message);
            return false;
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const dbManager = new DatabaseManager();
    
    if (!await dbManager.connect()) {
        process.exit(1);
    }

    try {
        switch (command) {
            case 'health':
                await dbManager.checkDatabaseHealth();
                break;
            
            case 'tables':
                await dbManager.listAllTables();
                break;
            
            case 'structure':
                const tableName = args[1];
                if (!tableName) {
                    console.error('❌ Please provide table name: npm run db-manager structure <table_name>');
                    break;
                }
                await dbManager.getTableStructure(tableName);
                break;
            
            case 'data':
                const table = args[1];
                const limit = parseInt(args[2]) || 10;
                if (!table) {
                    console.error('❌ Please provide table name: npm run db-manager data <table_name> [limit]');
                    break;
                }
                await dbManager.getTableData(table, limit);
                break;
            
            case 'backup':
                const backup = await dbManager.createBackup();
                if (backup) {
                    const fs = require('fs');
                    fs.writeFileSync(backup.fileName, backup.content);
                    console.log(`💾 Backup saved to: ${backup.fileName}`);
                }
                break;
            
            case 'update-schema':
                await dbManager.updateSchema();
                break;
            
            case 'full-report':
                console.log('🔍 GENERATING FULL DATABASE REPORT');
                console.log('=====================================');
                await dbManager.checkDatabaseHealth();
                const tables = await dbManager.listAllTables();
                
                for (const table of tables) {
                    await dbManager.getTableStructure(table.TABLE_NAME);
                    await dbManager.getTableData(table.TABLE_NAME, 5);
                }
                break;
            
            default:
                console.log('🛠️ DATABASE MANAGER COMMANDS:');
                console.log('=====================================');
                console.log('npm run db-manager health           - Check database health');
                console.log('npm run db-manager tables           - List all tables');
                console.log('npm run db-manager structure <table> - Show table structure');
                console.log('npm run db-manager data <table> [limit] - Show table data');
                console.log('npm run db-manager backup           - Create database backup');
                console.log('npm run db-manager update-schema    - Update database schema');
                console.log('npm run db-manager full-report      - Generate complete report');
                break;
        }
    } finally {
        await dbManager.disconnect();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DatabaseManager;
