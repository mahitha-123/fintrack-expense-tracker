// GET /api/dashboard?month=&year=
const getDashboard = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        summary: {
          income: 5000,
          expense: 2300,
          balance: 2700
        },
        categoryBreakdown: [
          { name: 'Food', color: '#f59e0b', icon: 'bi-basket', total: 500 },
          { name: 'Travel', color: '#3b82f6', icon: 'bi-car-front', total: 300 },
          { name: 'Shopping', color: '#ec4899', icon: 'bi-bag', total: 700 },
          { name: 'Bills', color: '#10b981', icon: 'bi-receipt', total: 800 }
        ],
        dailyTrend: [
          { day: 1, type: 'income', total: 2000 },
          { day: 2, type: 'expense', total: 150 },
          { day: 5, type: 'expense', total: 300 },
          { day: 10, type: 'income', total: 3000 },
          { day: 12, type: 'expense', total: 450 },
          { day: 18, type: 'expense', total: 600 }
        ],
        monthlyTrend: [
          { year: 2025, month: 10, type: 'income', total: 4000 },
          { year: 2025, month: 10, type: 'expense', total: 2200 },
          { year: 2025, month: 11, type: 'income', total: 4200 },
          { year: 2025, month: 11, type: 'expense', total: 2100 },
          { year: 2025, month: 12, type: 'income', total: 4500 },
          { year: 2025, month: 12, type: 'expense', total: 2400 },
          { year: 2026, month: 1, type: 'income', total: 4800 },
          { year: 2026, month: 1, type: 'expense', total: 2500 },
          { year: 2026, month: 2, type: 'income', total: 5000 },
          { year: 2026, month: 2, type: 'expense', total: 2300 }
        ],
        recentTransactions: [
          {
            id: 1,
            title: 'Grocery Shopping',
            amount: 120,
            type: 'expense',
            date: '2026-03-01',
            category_name: 'Food',
            category_icon: 'bi-basket',
            category_color: '#f59e0b'
          },
          {
            id: 2,
            title: 'Bus Pass',
            amount: 80,
            type: 'expense',
            date: '2026-03-03',
            category_name: 'Travel',
            category_icon: 'bi-car-front',
            category_color: '#3b82f6'
          },
          {
            id: 3,
            title: 'Freelance Payment',
            amount: 2000,
            type: 'income',
            date: '2026-03-05',
            category_name: 'Income',
            category_icon: 'bi-cash-stack',
            category_color: '#10b981'
          }
        ],
        budgetUtilization: [
          { title: 'Food Budget', budget: 600, category: 'Food', color: '#f59e0b', spent: 500 },
          { title: 'Travel Budget', budget: 400, category: 'Travel', color: '#3b82f6', spent: 300 },
          { title: 'Shopping Budget', budget: 800, category: 'Shopping', color: '#ec4899', spent: 700 }
        ]
      }
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDashboard };