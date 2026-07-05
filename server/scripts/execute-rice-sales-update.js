const DatabaseManager = require('./database-manager');

async function executeRiceSalesUpdate() {
    const dbManager = new DatabaseManager();
    
    try {
        console.log('🔄 Connecting to database...');
        if (!await dbManager.connect()) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }

        // Execute each SQL command individually
        const commands = [
            {
                sql: "ALTER TABLE rice_sales ADD COLUMN packet_size DECIMAL(5,2) NULL AFTER rice_variety_id",
                description: "Adding packet_size column"
            },
            {
                sql: "ALTER TABLE rice_sales ADD COLUMN packet_quantity INT NULL AFTER packet_size",
                description: "Adding packet_quantity column"
            },
            {
                sql: "UPDATE rice_sales SET packet_size = 1, packet_quantity = quantity_kg WHERE packet_size IS NULL",
                description: "Updating existing records with default values"
            },
            {
                sql: "ALTER TABLE rice_sales MODIFY COLUMN packet_size DECIMAL(5,2) NOT NULL",
                description: "Making packet_size NOT NULL"
            },
            {
                sql: "ALTER TABLE rice_sales MODIFY COLUMN packet_quantity INT NOT NULL",
                description: "Making packet_quantity NOT NULL"
            }
        ];

        let successCount = 0;
        let errorCount = 0;

        for (const command of commands) {
            try {
                console.log(`\n🔄 ${command.description}...`);
                console.log(`   SQL: ${command.sql}`);
                
                await dbManager.connection.execute(command.sql);
                console.log(`✅ Success: ${command.description}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Error: ${command.description}`);
                console.error(`   Message: ${error.message}`);
                errorCount++;
                
                // If it's a "Duplicate column" error, that's okay - column already exists
                if (error.message.includes('Duplicate column name')) {
                    console.log('   Note: Column already exists, continuing...');
                    successCount++;
                    errorCount--;
                }
            }
        }

        console.log(`\n📊 EXECUTION SUMMARY:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${errorCount}`);

        // Show final table structure
        console.log('\n📋 Final rice_sales table structure:');
        await dbManager.getTableStructure('rice_sales');

        // Show updated data
        console.log('\n📊 Updated rice_sales data (first 3 rows):');
        await dbManager.getTableData('rice_sales', 3);

    } catch (error) {
        console.error('❌ Error during update:', error.message);
        process.exit(1);
    } finally {
        await dbManager.disconnect();
    }
}

executeRiceSalesUpdate().catch(console.error);
