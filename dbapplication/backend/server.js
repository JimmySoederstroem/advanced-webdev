import express from 'express';
import sqlite3 from 'sqlite3';
sqlite3.verbose();

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to serve static files
app.use(express.static('public'));

// Connect to the database
let db = new sqlite3.Database('./mydatabase.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// Create a table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER,
    fruit TEXT,
    color TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Table created or already exists.');
});

// Endpoint to add a record
app.post('/add-item', (req, res) => {
    const { amount, fruit, color } = req.body;
    db.run(`INSERT INTO items (amount, fruit, color) VALUES (?, ?, ?)`, [amount, fruit, color], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: `A row has been inserted with rowid ${this.lastID}` });
    });
});

// Endpoint to get all records
app.get('/items', (req, res) => {
    db.all(`SELECT * FROM items`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ items: rows });
    });
});

// Endpoint to delete a record
app.delete('/delete-item/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM items WHERE id = ?`, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: `Row(s) deleted: ${this.changes}` });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Close the database connection when the server is stopped
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});