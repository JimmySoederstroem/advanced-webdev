const pool = require('../config/db');

const createUserTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      password_hash VARCHAR(100)
    )
  `);
};

createUserTable();

module.exports = {
  createUserTable,
};
