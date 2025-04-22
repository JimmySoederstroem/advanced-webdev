const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',    // Replace with your PostgreSQL user
  host: 'localhost',
  database: 'expensetracker',  // Replace with your database name
  password: 'Jimmy123', // Replace with your password
  port: 5432,
});

module.exports = pool; // Exporting pool for use in other files

