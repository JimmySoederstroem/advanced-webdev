const pool = require('../config/db');

const createExpenseTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      amount DECIMAL,
      category VARCHAR(100),
      date DATE,
      notes TEXT
    )
  `);
};

createExpenseTable();

module.exports = {
  createExpenseTable,
};
