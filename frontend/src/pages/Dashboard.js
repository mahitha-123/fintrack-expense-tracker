import { useState, useEffect, useCallback } from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Filler, Title
} from 'chart.js';
import API from '../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Filler, Title);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const now = new Date();

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/dashboard?month=${month}&year=${year}`);
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fmt = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Pie chart — expense by category
  const pieData = data ? {
    labels: data.categoryBreakdown.map(c => c.name || 'Uncategorized'),
    datasets: [{
      data: data.categoryBreakdown.map(c => c.total),
      backgroundColor: data.categoryBreakdown.map(c => c.color || '#6c757d'),
      borderWidth: 2, borderColor: '#fff',
    }]
  } : null;

  // Monthly bar chart — last 6 months
  const buildMonthlyBar = () => {
    if (!data) return null;
    const monthMap = {};
    data.monthlyTrend.forEach(r => {
      const key = `${MONTHS[r.month - 1]} ${r.year}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      monthMap[key][r.type] = parseFloat(r.total);
    });
    const labels = Object.keys(monthMap);
    return {
      labels,
      datasets: [
        { label: 'Income', data: labels.map(l => monthMap[l]?.income || 0), backgroundColor: '#10b981', borderRadius: 6, borderSkipped: false },
        { label: 'Expense', data: labels.map(l => monthMap[l]?.expense || 0), backgroundColor: '#ef4444', borderRadius: 6, borderSkipped: false },
      ]
    };
  };

  // Daily trend line chart
  const buildDailyLine = () => {
    if (!data) return null;
    const daysInMonth = new Date(year, month, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const incomeMap = {}, expenseMap = {};
    data.dailyTrend.forEach(r => {
      if (r.type === 'income') incomeMap[r.day] = parseFloat(r.total);
      else expenseMap[r.day] = parseFloat(r.total);
    });
    return {
      labels,
      datasets: [
        {
          label: 'Income', data: labels.map(d => incomeMap[d] || 0),
          borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.1)',
          fill: true, tension: 0.4, pointRadius: 3,
        },
        {
          label: 'Expense', data: labels.map(d => expenseMap[d] || 0),
          borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.1)',
          fill: true, tension: 0.4, pointRadius: 3,
        },
      ]
    };
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <h5 className="mb-0 fw-bold">Dashboard</h5>
          <small className="text-muted">Financial overview</small>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" value={month} onChange={e => setMonth(+e.target.value)} style={{ width: 'auto' }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-select form-select-sm" value={year} onChange={e => setYear(+e.target.value)} style={{ width: 'auto' }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }} /></div>
        ) : data ? (
          <>
            {/* Summary cards */}
            <div className="row g-3 mb-4">
              {[
                { label: 'Total Income', value: fmt(data.summary.income), icon: 'bi-arrow-down-circle', color: '#d1fae5', iconColor: '#10b981' },
                { label: 'Total Expense', value: fmt(data.summary.expense), icon: 'bi-arrow-up-circle', color: '#fee2e2', iconColor: '#ef4444' },
                { label: 'Net Balance', value: fmt(data.summary.balance), icon: 'bi-wallet2', color: data.summary.balance >= 0 ? '#dbeafe' : '#fee2e2', iconColor: data.summary.balance >= 0 ? '#3b82f6' : '#ef4444' },
                { label: 'Active Budgets', value: data.budgetUtilization.length, icon: 'bi-pie-chart', color: '#ede9fe', iconColor: '#8b5cf6' },
              ].map((s, i) => (
                <div className="col-6 col-md-3" key={i}>
                  <div className="stat-card">
                    <div className="d-flex align-items-center gap-3">
                      <div className="icon-box" style={{ background: s.color }}>
                        <i className={`bi ${s.icon}`} style={{ color: s.iconColor }}></i>
                      </div>
                      <div>
                        <div className="text-muted small">{s.label}</div>
                        <div className="fw-bold fs-6">{s.value}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row 1 */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="chart-card">
                  <h6><i className="bi bi-pie-chart me-2 text-primary"></i>Spending by Category</h6>
                  <div style={{ height: 260 }}>
                    {pieData && pieData.labels.length > 0
                      ? <Pie data={pieData} options={{ ...chartOptions, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }} />
                      : <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No expense data</div>
                    }
                  </div>
                </div>
              </div>
              <div className="col-md-8">
                <div className="chart-card">
                  <h6><i className="bi bi-bar-chart me-2 text-primary"></i>Monthly Income vs Expense</h6>
                  <div style={{ height: 260 }}>
                    {buildMonthlyBar()
                      ? <Bar data={buildMonthlyBar()} options={{ ...chartOptions, plugins: { legend: { position: 'top' } } }} />
                      : <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No data</div>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Charts row 2 */}
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <div className="chart-card">
                  <h6><i className="bi bi-graph-up me-2 text-primary"></i>Daily Spending Trend — {MONTHS[month-1]} {year}</h6>
                  <div style={{ height: 220 }}>
                    {buildDailyLine()
                      ? <Line data={buildDailyLine()} options={{ ...chartOptions, plugins: { legend: { position: 'top' } } }} />
                      : <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No data</div>
                    }
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="chart-card">
                  <h6><i className="bi bi-target me-2 text-primary"></i>Budget Utilization</h6>
                  {data.budgetUtilization.length === 0 ? (
                    <div className="d-flex align-items-center justify-content-center text-muted small" style={{ height: 180 }}>
                      No budgets set for this month
                    </div>
                  ) : (
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {data.budgetUtilization.map((b, i) => {
                        const pct = Math.min((b.spent / b.budget) * 100, 100);
                        const over = b.spent > b.budget;
                        return (
                          <div key={i} className="budget-bar mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <small className="fw-semibold">{b.category || b.title}</small>
                              <small className={over ? 'text-danger' : 'text-muted'}>{`$${Number(b.spent).toFixed(0)} / $${Number(b.budget).toFixed(0)}`}</small>
                            </div>
                            <div className="progress">
                              <div className="progress-bar" style={{ width: `${pct}%`, background: over ? '#ef4444' : b.color || 'var(--primary)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="chart-card">
              <h6><i className="bi bi-clock-history me-2 text-primary"></i>Recent Transactions</h6>
              {data.recentTransactions.length === 0 ? (
                <p className="text-muted small text-center py-3">No transactions yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-modern mb-0">
                    <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Type</th><th className="text-end">Amount</th></tr></thead>
                    <tbody>
                      {data.recentTransactions.map(t => (
                        <tr key={t.id}>
                          <td className="text-muted small">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="fw-semibold">{t.title}</td>
                          <td>
                            {t.category_icon && <i className={`bi ${t.category_icon} me-1`} style={{ color: t.category_color }}></i>}
                            <small>{t.category_name || '—'}</small>
                          </td>
                          <td><span className={`type-badge ${t.type}`}>{t.type}</span></td>
                          <td className={`text-end fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-muted py-5">Failed to load dashboard.</div>
        )}
      </div>
    </div>
  );
}
