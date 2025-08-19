const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Import routes
const authRoutes = require('./routes/authRoutes'); // Adjust path as needed
const riceRoutes = require('./routes/riceRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const customerRoutes = require('./routes/customerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const boilingRoutes = require('./routes/boilingRoutes');
const millingRoutes = require('./routes/millingRoutes');
const salesRoutes = require('./routes/salesRoutes');
const extraTransactionsRoutes = require('./routes/extraTransactionsRoutes');

// Use routes
app.use('/api/auth', authRoutes); // This mounts all auth routes under /api/auth
app.use('/api/rice', riceRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/boiling', boilingRoutes);
app.use('/api/milling', millingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/extra', extraTransactionsRoutes);

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Rice Mill Management System API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});