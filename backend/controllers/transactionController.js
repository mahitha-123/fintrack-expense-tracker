const { pool } = require('../config/db');

// GET /api/transactions
const getTransactions = async (req, res) => {
  const userId = req.user.id;
  const { month, year, type, category_id, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (month && year) {
      query += ' AND MONTH(t.date) = ? AND YEAR(t.date) = ?';
      params.push(parseInt(month), parseInt(year));
    }

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (category_id) {
      query += ' AND t.category_id = ?';
      params.push(category_id);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) AS total FROM transactions WHERE user_id = ?';
    const countParams = [userId];

    if (month && year) {
      countQuery += ' AND MONTH(date) = ? AND YEAR(date) = ?';
      countParams.push(parseInt(month), parseInt(year));
    }

    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }

    if (category_id) {
      countQuery += ' AND category_id = ?';
      countParams.push(category_id);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/transactions
const createTransaction = async (req, res) => {
  const userId = req.user.id;
  const { title, amount, type, category_id, date, notes, payment_method } = req.body;

  console.log('createTransaction body:', req.body);
  console.log('createTransaction user:', req.user);

  if (!title || !amount || !type || !date) {
    return res.status(400).json({
      success: false,
      message: 'title, amount, type, and date are required.'
    });
  }

  
  const cleanedCategoryId =
  category_id === '' ||
  category_id === undefined ||
  category_id === null ||
  Number.isNaN(parseInt(category_id, 10))
    ? null
    : parseInt(category_id, 10);

console.log('cleanedCategoryId:', cleanedCategoryId);
  try {
    const [result] = await pool.query(
      `INSERT INTO transactions
       (user_id, category_id, title, amount, type, date, notes, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        cleanedCategoryId,
        title.trim(),
        parseFloat(amount),
        type,
        date,
        notes || null,
        payment_method || 'cash'
      ]
    );

    console.log('inserted transaction id:', result.insertId);

res.status(201).json({
  success: true,
  data: {
    id: result.insertId,
    user_id: userId,
    category_id: cleanedCategoryId,
    title: title.trim(),
    amount: parseFloat(amount),
    type,
    date,
    notes: notes || null,
    payment_method: payment_method || 'cash'
  }
});
  } catch (err) {
    console.error('createTransaction error:', err);
console.error('sqlMessage:', err.sqlMessage);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, amount, type, category_id, date, notes, payment_method } = req.body;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    await pool.query(
      `UPDATE transactions
       SET title = ?, amount = ?, type = ?, category_id = ?, date = ?, notes = ?, payment_method = ?
       WHERE id = ? AND user_id = ?`,
      [
        title,
        parseFloat(amount),
        type,
        category_id || null,
        date,
        notes || null,
        payment_method || 'cash',
        id,
        userId
      ]
    );

    const [[row]] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('updateTransaction error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    console.error('deleteTransaction error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/transactions/export/csv
const exportCSV = async (req, res) => {
  const userId = req.user.id;
  const { month, year, type } = req.query;

  try {
    let query = `
      SELECT t.date, t.title, t.amount, t.type, c.name AS category, t.payment_method, t.notes
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (month && year) {
      query += ' AND MONTH(t.date) = ? AND YEAR(t.date) = ?';
      params.push(parseInt(month), parseInt(year));
    }

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    query += ' ORDER BY t.date DESC';

    const [rows] = await pool.query(query, params);

    const headers = 'Date,Title,Amount,Type,Category,Payment Method,Notes\n';
    const csvRows = rows.map(
      (r) =>
        `"${r.date}","${r.title}","${r.amount}","${r.type}","${r.category || ''}","${r.payment_method}","${(r.notes || '').replace(/"/g, '""')}"`
    );

    const csv = headers + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (err) {
    console.error('exportCSV error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportCSV
};