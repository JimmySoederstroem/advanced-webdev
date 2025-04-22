const express = require('express');
const { addExpense, getExpenses } = require('../controllers/expensecontroller');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/expenses', authMiddleware, addExpense);
router.get('/expenses/:user_id', authMiddleware, getExpenses);

module.exports = router;

