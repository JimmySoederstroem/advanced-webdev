// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  /* ssl: { rejectUnauthorized: false } */
});

pool.connect((err, client, release) => {
  if (err) { return console.error('Error acquiring client', err.stack); }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) { return console.error('Error executing query', err.stack); }
    console.log('Database connected successfully:', result.rows[0].now);
  });
});

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) { console.error('JWT Verification Error:', err.message); return res.sendStatus(403); }
    req.user = user;
    next();
  });
};

// --- API Endpoints ---

app.post('/api/register', async (req, res) => { // Added /api
  const { name, email, password } = req.body;
  if (!name || !email || !password) { return res.status(400).json({ message: 'Name, email, and password are required.' }); }
  try {
    const userExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) { return res.status(409).json({ message: 'Email already registered.' }); }
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    const newUser = await pool.query('INSERT INTO Users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at, currency_code', [name, email, password_hash]);
    console.log('User registered:', newUser.rows[0]);
    const userResponse = { id: newUser.rows[0].id, name: newUser.rows[0].name, email: newUser.rows[0].email, created_at: newUser.rows[0].created_at, currency_code: newUser.rows[0].currency_code };
    res.status(201).json({ message: 'User registered successfully!', user: userResponse });
  } catch (error) { console.error('Registration error:', error); res.status(500).json({ message: 'Internal server error during registration.' }); }
});

app.post('/api/login', async (req, res) => { // Added /api
  const { email, password } = req.body;
  if (!email || !password) { return res.status(400).json({ message: 'Email and password are required.' }); }
  try {
    const result = await pool.query('SELECT id, email, password_hash FROM Users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) { return res.status(401).json({ message: 'Invalid credentials.' }); }
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
       const userPayload = { userId: user.id, email: user.email };
       const accessToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
       res.json({ message: 'Login successful!', accessToken: accessToken, userId: user.id });
    } else { res.status(401).json({ message: 'Invalid credentials.' }); }
  } catch (error) { console.error('Login error:', error); res.status(500).json({ message: 'Internal server error during login.' }); }
});

// --- Protected Routes ---

app.get('/api/expenses', authenticateToken, async (req, res) => { // Added /api
  const userId = req.user.userId; const { startDate, endDate, categoryId, limit } = req.query;
  try {
    let query = `SELECT e.id, e.amount, e.date, e.notes, e.category_id, c.name as category_name, c.icon as category_icon FROM Expenses e LEFT JOIN Categories c ON e.category_id = c.id WHERE e.user_id = $1`;
    const params = [userId]; let paramIndex = 2;
    if (startDate) { params.push(startDate); query += ` AND e.date >= $${paramIndex++}`; }
    if (endDate) { params.push(endDate); query += ` AND e.date <= $${paramIndex++}`; }
    if (categoryId) { params.push(categoryId); query += ` AND e.category_id = $${paramIndex++}`; }
    query += ' ORDER BY e.date DESC, e.created_at DESC';
    if (limit && !isNaN(parseInt(limit))) { params.push(parseInt(limit)); query += ` LIMIT $${paramIndex++}`; }
    const result = await pool.query(query, params); res.json(result.rows);
  } catch (error) { console.error('Error fetching expenses:', error); res.status(500).json({ message: 'Failed to fetch expenses.' }); }
});

app.post('/api/expenses', authenticateToken, async (req, res) => { // Added /api
  const userId = req.user.userId; const { amount, category_id, date, notes } = req.body;
  if (!amount || !category_id || !date) { return res.status(400).json({ message: 'Amount, category, and date are required.' }); }
  if (isNaN(parseFloat(amount)) || !Number.isInteger(parseInt(category_id)) || isNaN(Date.parse(date))) { return res.status(400).json({ message: 'Invalid data types.' }); }
  try {
    const categoryCheck = await pool.query('SELECT id FROM Categories WHERE id = $1', [category_id]);
    if (categoryCheck.rows.length === 0) { return res.status(400).json({ message: 'Invalid category ID.' }); }
    const result = await pool.query('INSERT INTO Expenses (user_id, amount, category_id, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *', [userId, amount, category_id, date, notes]);
    const newExpense = result.rows[0]; const categoryData = await pool.query('SELECT name, icon FROM Categories WHERE id = $1', [newExpense.category_id]);
    newExpense.category_name = categoryData.rows[0]?.name; newExpense.category_icon = categoryData.rows[0]?.icon;
    res.status(201).json(newExpense);
  } catch (error) { console.error('Error adding expense:', error); res.status(500).json({ message: 'Failed to add expense.' }); }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => { // Added /api
    const userId = req.user.userId; const expenseId = req.params.id;
    if (isNaN(parseInt(expenseId))) { return res.status(400).json({ message: 'Invalid expense ID.' }); }
    try {
        const result = await pool.query('DELETE FROM Expenses WHERE id = $1 AND user_id = $2 RETURNING id', [expenseId, userId]);
        if (result.rowCount === 0) { return res.status(404).json({ message: 'Expense not found or not authorized to delete.' }); }
        console.log(`Expense deleted: ID ${expenseId} by User ${userId}`); res.status(200).json({ message: 'Expense deleted successfully.' });
    } catch (error) { console.error('Error deleting expense:', error); res.status(500).json({ message: 'Failed to delete expense.' }); }
});

app.get('/api/reports', authenticateToken, async (req, res) => { // Added /api
  const userId = req.user.userId; const { startDate, endDate } = req.query;
  try {
    let query = `SELECT c.name as category_name, SUM(e.amount) as total_amount, COUNT(e.id) as transaction_count FROM Expenses e JOIN Categories c ON e.category_id = c.id WHERE e.user_id = $1`;
    const params = [userId]; let paramIndex = 2;
    if (startDate) { params.push(startDate); query += ` AND e.date >= $${paramIndex++}`; }
    if (endDate) { params.push(endDate); query += ` AND e.date <= $${paramIndex++}`; }
    query += ' GROUP BY c.name ORDER BY total_amount DESC';
    const result = await pool.query(query, params); res.json(result.rows);
  } catch (error) { console.error('Error generating report:', error); res.status(500).json({ message: 'Failed to generate report.' }); }
});

// Replace the existing GET /api/export route entirely with this corrected version:
app.get('/api/export', authenticateToken, async (req, res) => { // Ensure authenticateToken is uncommented unless testing
  const userId = req.user.userId;
  const { format = 'csv', startDate, endDate, categoryId } = req.query;
  // Use a unique ID for this request instance in logs (optional but helpful)
  const requestId = `Export-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  console.log(`[${requestId}] User ${userId} requested export. Format: ${format}, Start: ${startDate}, End: ${endDate}, CatID: ${categoryId}`);

  try {
      console.log(`[${requestId}] Step 1: Building query...`);
      let query = `SELECT e.id, e.date, c.name as category_name, e.amount, e.notes FROM Expenses e LEFT JOIN Categories c ON e.category_id = c.id WHERE e.user_id = $1`;
      const params = [userId]; let paramIndex = 2;
      if (startDate) { params.push(startDate); query += ` AND e.date >= $${paramIndex++}`; }
      if (endDate) { params.push(endDate); query += ` AND e.date <= $${paramIndex++}`; }
      if (categoryId) { params.push(categoryId); query += ` AND e.category_id = $${paramIndex++}`; }
      query += ' ORDER BY e.date ASC';
      console.log(`[${requestId}] Step 2: Executing query: ${query.substring(0, 150)}... Params: ${JSON.stringify(params)}`);

      const result = await pool.query(query, params);
      const expensesData = result.rows;
      console.log(`[${requestId}] Step 3: Query successful, ${expensesData.length} rows found.`);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      // --- Generate File based on format ---
      if (format.toLowerCase() === 'pdf') {
          console.log(`[${requestId}] Step 4a: Starting PDF generation...`);
          const filename = `expenses_${timestamp}.pdf`;
          // Set headers BEFORE piping
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

          console.log(`[${requestId}] Step 4b: Creating PDF Document...`);
          const doc = new PDFDocument({ margin: 50, size: 'A4' });

          // Handle potential errors during streaming/piping
          doc.on('error', (pdfErr) => {
              console.error(`[${requestId}] PDF generation stream error:`, pdfErr);
              // Try to end the response if possible, though headers might be sent
              if (!res.headersSent) {
                  res.status(500).json({ message: 'Error during PDF generation stream.' });
              }
          });
          res.on('error', (resErr) => {
              console.error(`[${requestId}] Response stream error during PDF pipe:`, resErr);
          });

          console.log(`[${requestId}] Step 4c: Piping PDF to response...`);
          doc.pipe(res); // Pipe output to response stream EARLY

          // Add PDF Content
          console.log(`[${requestId}] Step 4d: Adding PDF content (Header)...`);
          doc.fontSize(18).text('Expense Report', { align: 'center' }).moveDown();
          // ... Add filter text and table header logic ...
          if(startDate || endDate || categoryId) { /* Add filter text based on query params if needed */ }
          const tableTop = doc.y; const itemX = 50; const dateX = 50; const categoryX = 150; const amountX = 350; const notesX = 430;
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Date', dateX, tableTop); doc.text('Category', categoryX, tableTop); doc.text('Amount', amountX, tableTop, { width: 70, align: 'right'}); doc.text('Notes', notesX, tableTop);
          doc.font('Helvetica'); doc.moveDown();
          const headerBottom = doc.y;
          doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(itemX, headerBottom).lineTo(doc.page.width - itemX, headerBottom).stroke();
          let rowY = headerBottom + 5;

          console.log(`[${requestId}] Step 4e: Adding PDF content (${expensesData.length} Rows)...`);
          expensesData.forEach((expense, index) => {
              // Check if response is still writable (client might disconnect during long process)
              if (!res.writable) {
                  console.log(`[${requestId}] Response no longer writable, stopping PDF row generation.`);
                  doc.end(); // Attempt to end gracefully
                  throw new Error("Response stream closed prematurely during PDF row generation"); // Stop further processing
              }
               const expenseDate = new Date(expense.date); const formattedDate = expenseDate.toLocaleDateString('en-CA'); // Adjust locale if needed
               const categoryText = expense.category_name || 'N/A'; const amountText = `$${parseFloat(expense.amount).toFixed(2)}`;
               const notesText = expense.notes || ''; const notesHeight = doc.heightOfString(notesText, { width: doc.page.width - notesX - itemX });
               const rowHeight = Math.max(doc.heightOfString('Test'), notesHeight) + 10;
               if (rowY + rowHeight > doc.page.height - doc.page.margins.bottom) { console.log(`[${requestId}] Adding PDF page break...`); doc.addPage(); rowY = doc.page.margins.top; /* Repeat header */ }
               doc.fontSize(10); doc.text(formattedDate, dateX, rowY); doc.text(categoryText, categoryX, rowY, { width: 190 }); doc.text(amountText, amountX, rowY, { width: 70, align: 'right' }); doc.text(notesText, notesX, rowY, { width: doc.page.width - notesX - itemX });
               rowY += rowHeight; doc.strokeColor("#eeeeee").lineWidth(0.5).moveTo(itemX, rowY).lineTo(doc.page.width - itemX, rowY).stroke();
               // Log progress occasionally for very large files
               if ((index + 1) % 100 === 0) { console.log(`[${requestId}] Added ${index + 1} rows to PDF...`); }
          });
          console.log(`[${requestId}] Step 4f: Finalizing PDF document...`);
          doc.end(); // <<<< This signals the end of content addition and flushes the stream
          console.log(`[${requestId}] Step 4g: PDF generation complete. Filename: ${filename}`);

      } else { // CSV Generation
          console.log(`[${requestId}] Step 4a: Starting CSV generation...`);
          const filename = `expenses_${timestamp}.csv`;
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          if (expensesData.length === 0) {
              console.log(`[${requestId}] Step 4b: Sending empty CSV.`);
              return res.status(200).send("id,date,category_name,amount,notes\n");
          }
          console.log(`[${requestId}] Step 4b: Formatting CSV header...`);
          const csvHeader = Object.keys(expensesData[0]).join(",") + "\n";
          console.log(`[${requestId}] Step 4c: Formatting ${expensesData.length} CSV rows...`);
          // Generate rows in chunks perhaps if it's huge? For now, generate all.
          const csvRows = expensesData.map((row, index) => {
               if ((index + 1) % 500 === 0) { console.log(`[${requestId}] Formatted ${index + 1} CSV rows...`); } // Log progress
               return Object.values(row).map(value => { const stringValue = String(value ?? ''); if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) { return `"${stringValue.replace(/"/g, '""')}"`; } return stringValue; }).join(",");
          }).join("\n");

          const csvData = csvHeader + csvRows;
          console.log(`[${requestId}] Step 4d: Sending CSV data (${csvData.length} bytes)...`);
          res.status(200).send(csvData);
          console.log(`[${requestId}] Step 4e: CSV sending complete. Filename: ${filename}`);
      }
  } catch (error) {
      // Log the specific error that occurred during the try block
      console.error(`[${requestId}] Error during export generation:`, error);
      // Avoid sending headers again if they were already sent (e.g., during PDF pipe)
      if (!res.headersSent) {
         res.status(500).json({ message: 'Failed to export data due to server error.' });
      } else {
         // If headers sent, response might be partially streamed; client likely sees error
         console.error(`[${requestId}] Headers already sent, could not send JSON error response.`);
      }
  }
});

app.get('/api/categories', authenticateToken, async (req, res) => { // Added /api
    try {
        const result = await pool.query('SELECT id, name, icon FROM Categories ORDER BY name ASC'); res.json(result.rows);
    } catch (error) { console.error('Error fetching categories:', error); res.status(500).json({ message: 'Failed to fetch categories.' }); }
});

app.get('/api/settings', authenticateToken, async (req, res) => { // Added /api
    const userId = req.user.userId;
    try {
        const userSettings = await pool.query('SELECT currency_code FROM Users WHERE id = $1', [userId]);
        const budgetSettings = await pool.query('SELECT monthly_limit FROM Budgets WHERE user_id = $1 ORDER BY year DESC, month DESC LIMIT 1', [userId]);
        res.json({ currency_code: userSettings.rows[0]?.currency_code || 'USD', monthly_limit: budgetSettings.rows[0]?.monthly_limit ?? null });
    } catch (error) { console.error('Error fetching settings:', error); res.status(500).json({ message: 'Failed to fetch settings.' }); }
});

app.post('/api/settings', authenticateToken, async (req, res) => { // Added /api
    const userId = req.user.userId; const { monthly_limit, currency_code } = req.body;
    const validCurrency = currency_code && typeof currency_code === 'string' && currency_code.length === 3;
    const validBudget = monthly_limit === null || monthly_limit === '' || (!isNaN(parseFloat(monthly_limit)) && parseFloat(monthly_limit) >= 0);
    if (!validCurrency || !validBudget) { return res.status(400).json({ message: 'Invalid input.' }); }
    const budgetValue = (monthly_limit === null || monthly_limit === '') ? null : parseFloat(monthly_limit);
    const currencyValue = currency_code.toUpperCase();
    const currentMonth = new Date().getMonth() + 1; const currentYear = new Date().getFullYear();
    try {
        await Promise.all([
            pool.query('UPDATE Users SET currency_code = $1 WHERE id = $2', [currencyValue, userId]),
            budgetValue !== null
                ? pool.query( `INSERT INTO Budgets (user_id, monthly_limit, month, year) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, month, year) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit`, [userId, budgetValue, currentMonth, currentYear])
                : pool.query( 'DELETE FROM Budgets WHERE user_id = $1 AND month = $2 AND year = $3', [userId, currentMonth, currentYear])
        ]);
        res.status(200).json({ message: 'Settings saved successfully!', settings: { currency_code: currencyValue, monthly_limit: budgetValue }});
    } catch (error) { console.error('Error saving settings:', error); res.status(500).json({ message: 'Failed to save settings.' }); }
});

// server.js
// ... (keep existing requires, setup, middleware, other routes) ...

// *** NEW: POST /api/reset-password (Simple version without token) ***
app.post('/api/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  // Basic validation
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required.' });
  }
  if (newPassword.length < 6) {
     return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT id FROM Users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      // Send a generic message even if user doesn't exist for security
      // Or you could send a 404, but generic is often preferred for password resets
      return res.status(404).json({ message: 'User not found.' });
    }

    // Hash the new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password hash
    await pool.query(
      'UPDATE Users SET password_hash = $1 WHERE email = $2',
      [password_hash, email]
    );

    console.log(`Password reset successful for email: ${email}`);
    res.status(200).json({ message: 'Password reset successfully. You can now log in with your new password.' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'An error occurred during password reset.' });
  }
});


// --- Error Handling Middleware (keep as is) ---
app.use((err, req, res, next) => { /* ... */ });

// --- Server Start (keep as is) ---
app.listen(PORT, () => { /* ... */ });

// --- Error Handling Middleware ---
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Something broke!'); });

// --- Server Start ---
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });