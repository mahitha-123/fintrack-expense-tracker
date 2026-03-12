const { pool } = require('../config/db');

// GET /api/budgets?month=&year=
const getBudgets = async (req, res) => {
  const userId = req.user.id;
  const { month, year } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  try {
    // Fetch budgets with actual spending — single optimized query
    const [rows] = await pool.query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
        COALESCE((
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.user_id = b.user_id
            AND t.category_id = b.category_id
            AND t.type = 'expense'
            AND MONTH(t.date) = b.month
            AND YEAR(t.date) = b.year
        ), 0) AS spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      ORDER BY c.name`,
      [userId, m, y]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getBudgets error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/budgets
const createBudget = async (req, res) => {
  const userId = req.user.id;
  const { category_id, title, amount, month, year } = req.body;
  if (!category_id || !amount || !month || !year)
    return res.status(400).json({ success: false, message: 'category_id, amount, month, and year are required.' });

  try {
    const [result] = await pool.query(
      `INSERT INTO budgets (user_id, category_id, title, amount, month, year)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), title = VALUES(title)`,
      [userId, category_id, title || 'Budget', parseFloat(amount), parseInt(month), parseInt(year)]
    );

    const [[row]] = await pool.query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('createBudget error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/budgets/:id
const updateBudget = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, amount } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: 'Budget not found.' });

    await pool.query('UPDATE budgets SET title=?, amount=? WHERE id=? AND user_id=?', [title, parseFloat(amount), id, userId]);

    const [[row]] = await pool.query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b LEFT JOIN categories c ON b.category_id = c.id WHERE b.id = ?`,
      [id]
    );
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    res.json({ success: true, message: 'Budget deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
