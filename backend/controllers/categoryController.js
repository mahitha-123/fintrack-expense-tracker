const { pool } = require('../config/db');

// GET /api/categories
const getCategories = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM categories
       WHERE user_id IS NULL OR user_id = ?
       ORDER BY name ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('getCategories error:', err);
    console.error('sqlMessage:', err.sqlMessage);
    res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message || 'Server error.'
    });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  const userId = req.user.id;
  const { name, icon, color } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required.'
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO categories (user_id, name, icon, color)
       VALUES (?, ?, ?, ?)`,
      [userId, name.trim(), icon || 'bi-tag', color || '#6c757d']
    );

    const [[row]] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: row
    });
  } catch (err) {
    console.error('createCategory error:', err);
    console.error('sqlMessage:', err.sqlMessage);
    res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message || 'Server error.'
    });
  }
};

module.exports = { getCategories, createCategory };