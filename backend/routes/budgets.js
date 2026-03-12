const express = require('express');
const router = express.Router();

// middleware
const auth = require('../middleware/auth');

// controller functions
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');


// apply authentication middleware to all routes
router.use(auth);


// GET all budgets
router.get('/', getBudgets);


// CREATE a new budget
router.post('/', createBudget);


// UPDATE a budget by id
router.put('/:id', updateBudget);


// DELETE a budget by id
router.delete('/:id', deleteBudget);


// export router
module.exports = router;