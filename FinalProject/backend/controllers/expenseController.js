const pool = require('../config/db');

exports.addExpense = async (req, res) => {
  const { user_id, amount, category, date, notes } = req.body;

  if (!user_id || !amount || !category || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO expenses (user_id, amount, category, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, amount, category, date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

