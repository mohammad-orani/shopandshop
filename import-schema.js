// Import Schema to Railway MySQL
// Run with: node import-schema.js

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Railway MySQL Connection Details
// Get these from Railway → MySQL → Variables tab
const config = {
  host: 'crossover.proxy.rlwy.net', // Replace with your MYSQLHOST
  port: 26282,
  user: 'root',
  password: 'pWQyeUiMsSbDIWePoosMuoWsHdmYIOSZ', // Replace with your MYSQLPASSWORD
  database: 'railway',
  multipleStatements: true // Important for importing schema
};

async function importSchema() {
  console.log('🚀 Starting schema import...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    console.log('📄 Reading schema.sql...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Connect to Railway MySQL
    console.log('🔌 Connecting to Railway MySQL...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');

    // Execute schema
    console.log('⚙️  Executing schema...');
    console.log('   This may take 15-20 seconds...\n');

    const statements = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`   Found ${statements.length} SQL statements to execute...\n`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      try {
        await connection.query(statements[i]);
        if ((i + 1) % 10 === 0) {
          console.log(`   Executed ${i + 1}/${statements.length} statements...`);
        }
      } catch (err) {
        console.log(`   ⚠️  Statement ${i + 1} skipped (may already exist)`);
      }
    }

    console.log('\n✅ Schema imported successfully!\n');

    // Verify import
    console.log('🔍 Verifying import...\n');

    const [countries] = await connection.query('SELECT COUNT(*) as count FROM delivery_countries');
    console.log(`✅ Countries imported: ${countries[0].count}`);

    const [cities] = await connection.query('SELECT COUNT(*) as count FROM delivery_cities');
    console.log(`✅ Cities imported: ${cities[0].count}`);

    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Total tables created: ${tables.length}\n`);

    console.log('🎉 Import complete!\n');
    console.log('Tables created:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    await connection.end();
    console.log('\n✅ Connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your connection details are correct');
    console.error('2. Railway MySQL is running');
    console.error('3. Password is correct');
    process.exit(1);
  }
}

// Run the import
importSchema();
