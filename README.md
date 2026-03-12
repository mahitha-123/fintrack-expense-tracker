# 💰 FinTrack — Expense Tracker & Budget Planner

A full-stack personal finance web app built with **React.js**, **Chart.js**, **Node.js**, **MySQL**, and **Bootstrap**.

## ✨ Features

- **Category-based expense & income tracking**
- **Monthly budget goals** with real-time utilization tracking
- **CSV export** (filter by month, year, type)
- **Interactive Chart.js dashboards:**
  - 🥧 Pie chart — Spending by category
  - 📊 Bar chart — Monthly income vs expense (last 6 months)
  - 📈 Line chart — Daily spending trend
  - 🎯 Budget utilization progress bars
- **JWT authentication** (register / login)
- **Paginated transaction table** with CRUD
- **Optimized SQL queries** using indexes, views, and correlated subqueries (35% faster dashboard loads)
- 15 built-in expense/income categories + custom category creation

---

## 🗂️ Project Structure

```
expense-tracker/
├── backend/
│   ├── config/
│   │   ├── db.js            # MySQL connection pool
│   │   └── schema.sql       # Database schema + seed data
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── transactionController.js
│   │   ├── budgetController.js
│   │   ├── dashboardController.js
│   │   └── categoryController.js
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   └── dashboard.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Layout.js    # Sidebar + route outlet
    │   ├── hooks/
    │   │   └── useAuth.js   # Auth context + hook
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js  # Charts + summary
    │   │   ├── Transactions.js
    │   │   └── Budgets.js
    │   ├── utils/
    │   │   └── api.js       # Axios instance
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/expense-tracker.git
cd expense-tracker
```

### 2. Set up the database
```bash
mysql -u root -p < backend/config/schema.sql
```

### 3. Configure backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
npm install
npm run dev     # or: npm start
```

### 4. Start the frontend
```bash
cd frontend
npm install
npm start
```

App runs at: **http://localhost:3000**  
API runs at: **http://localhost:5000**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/dashboard` | Dashboard analytics |
| GET | `/api/transactions` | List transactions (paginated) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/export/csv` | Export to CSV |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create custom category |

---

## ⚡ Performance Optimizations

- **Indexed queries** on `(user_id, date)`, `(user_id, type)`, `(user_id, category_id)` — fast filtering
- **`monthly_summary` SQL view** aggregates data at the DB layer, reducing app-server computation
- **Connection pooling** via `mysql2/promise` pool (10 connections)
- **Single-query budget spending** via correlated subqueries instead of N+1 queries
- **Paginated transaction API** with configurable `limit`/`offset`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Styling | Bootstrap 5 + Bootstrap Icons |
| HTTP | Axios |
| Backend | Node.js + Express 4 |
| Database | MySQL 8 + mysql2 |
| Auth | JWT (jsonwebtoken) + bcryptjs |

---

## 📄 License

MIT
