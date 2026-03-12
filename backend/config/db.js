const mysql = require('mysql2/promise');
require('dotenv').config();
console.log('DB password loaded:', process.env.DB_PASSWORD);
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fintrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Connected successfully');
    conn.release();
  } catch (err) {
    console.error('MySQL Connection failed:', err.message);
  }
};

module.exports = { pool, testConnection };