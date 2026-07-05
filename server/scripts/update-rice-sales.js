const DatabaseManager = require('./database-manager');
const fs = require('fs');
const path = require('path');

async function updateRiceSalesTable() {
    const dbManager = new DatabaseManager();
    
    try {
        // Connect to database
        console.log('🔄 Connecting to database...');
        if (!await dbManager.connect()) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }

        // Check current structure of rice_sales table
        console.log('\n📋 Current rice_sales table structure:');
        await dbManager.getTableStructure('rice_sales');

        // Show current data sample
        console.log('\n📊 Current rice_sales data (first 5 rows):');
        await dbManager.getTableData('rice_sales', 5);

        // Read the SQL update file
        const sqlFilePath = path.join(__dirname, 'update-rice-sales.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('\n🔄 Executing SQL updates...');
        console.log('SQL to execute:');
        console.log(sqlContent);

        // Execute the SQL updates
        const result = await dbManager.runSQLFile(sqlContent);

        if (result.errors === 0) {
            console.log('\n✅ All SQL commands executed successfully!');
        } else {
            console.log(`\n⚠️ SQL executed with ${result.errors} errors`);
        }

        // Check updated structure
        console.log('\n📋 Updated rice_sales table structure:');
        await dbManager.getTableStructure('rice_sales');

        // Show updated data sample
        console.log('\n📊 Updated rice_sales data (first 5 rows):');
        await dbManager.getTableData('rice_sales', 5);

        console.log('\n🎉 Database update completed!');

    } catch (error) {
        console.error('❌ Error during update:', error.message);
        process.exit(1);
    } finally {
        await dbManager.disconnect();
    }
}

// Run the update if this script is called directly
if (require.main === module) {
    updateRiceSalesTable().catch(console.error);
}

module.exports = updateRiceSalesTable;
