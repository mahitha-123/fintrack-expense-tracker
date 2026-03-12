const express = require('express');
const dashRouter = express.Router();
const catRouter = express.Router();
const auth = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');
const { getCategories, createCategory } = require('../controllers/categoryController');

dashRouter.get('/', auth, getDashboard);
catRouter.get('/', auth, getCategories);
catRouter.post('/', auth, createCategory);

module.exports = { dashRouter, catRouter };
