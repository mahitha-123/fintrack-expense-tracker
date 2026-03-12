import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import API from '../utils/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const now = new Date();
const emptyForm = { category_id: '', title: '', amount: '' };

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const bRes = await API.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(Array.isArray(bRes.data.data) ? bRes.data.data : []);

      try {
        const cRes = await API.get('/categories');
        const allCategories = Array.isArray(cRes.data.data) ? cRes.data.data : [];

        // Optional: hide Salary from budget categories
        setCategories(allCategories.filter(c => c.name !== 'Salary'));
      } catch (catErr) {
        console.error('Categories load error:', catErr.response?.data || catErr.message);
        setCategories([]);
      }
    } catch (err) {
      console.error('Budgets load error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (b) => {
    setForm({
      category_id: b.category_id ?? '',
      title: b.title || '',
      amount: b.amount || ''
    });
    setEditId(b.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      category_id: Number(form.category_id),
      amount: Number(form.amount),
      month,
      year
    };

    try {
      if (editId) {
        await API.put(`/budgets/${editId}`, payload);
        toast.success('Budget updated.');
      } else {
        await API.post('/budgets', payload);
        toast.success('Budget created.');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditId(null);
      fetchData();
    } catch (err) {
      console.error('Save budget error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to save budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await API.delete(`/budgets/${id}`);
      toast.success('Budget deleted.');
      fetchData();
    } catch (err) {
      console.error('Delete budget error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + parseFloat(b.spent || 0), 0);

  return (
    <div>
      <div className="topbar">
        <div>
          <h5 className="mb-0 fw-bold">Budget Planner</h5>
          <small className="text-muted">{MONTHS[month - 1]} {year}</small>
        </div>

        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            value={month}
            onChange={e => setMonth(+e.target.value)}
            style={{ width: 'auto' }}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            className="form-select form-select-sm"
            value={year}
            onChange={e => setYear(+e.target.value)}
            style={{ width: 'auto' }}
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button className="btn btn-sm btn-primary" onClick={openAdd}>
            <i className="bi bi-plus me-1"></i>
            New Budget
          </button>
        </div>
      </div>

      <div className="p-4">
        {budgets.length > 0 && (
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Budgeted', value: fmt(totalBudget), icon: 'bi-bullseye', color: '#dbeafe', iconColor: '#3b82f6' },
              { label: 'Total Spent', value: fmt(totalSpent), icon: 'bi-cash-coin', color: '#fee2e2', iconColor: '#ef4444' },
              { label: 'Remaining', value: fmt(totalBudget - totalSpent), icon: 'bi-piggy-bank', color: '#d1fae5', iconColor: '#10b981' },
              { label: 'Overall Usage', value: `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`, icon: 'bi-percent', color: '#ede9fe', iconColor: '#8b5cf6' },
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
        )}

        <div className="chart-card">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--primary)' }} />
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-pie-chart fs-1 d-block mb-2"></i>
              No budgets set for {MONTHS[month - 1]} {year}.
              <div className="mt-2">
                <button className="btn btn-sm btn-primary" onClick={openAdd}>
                  <i className="bi bi-plus me-1"></i>
                  Create your first budget
                </button>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {budgets.map(b => {
                const pct = Math.min(b.amount > 0 ? (b.spent / b.amount) * 100 : 0, 100);
                const over = parseFloat(b.spent) > parseFloat(b.amount);
                const remaining = parseFloat(b.amount) - parseFloat(b.spent);

                return (
                  <div className="col-md-6 col-lg-4" key={b.id}>
                    <div
                      style={{
                        border: '1.5px solid var(--border)',
                        borderRadius: 14,
                        padding: 18,
                        background: '#fff',
                        transition: 'box-shadow .2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: `${b.category_color || '#6366f1'}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i
                              className={`bi ${b.category_icon || 'bi-tag'}`}
                              style={{ color: b.category_color || '#6366f1' }}
                            ></i>
                          </div>

                          <div>
                            <div className="fw-semibold small">{b.title}</div>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                              {b.category_name}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => openEdit(b)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => handleDelete(b.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div className="budget-bar mb-2">
                        <div className="progress">
                          <div
                            className="progress-bar"
                            style={{
                              width: `${pct}%`,
                              background: over ? '#ef4444' : b.category_color || 'var(--primary)'
                            }}
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between">
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Spent</div>
                          <div className={`fw-bold small ${over ? 'text-danger' : ''}`}>{fmt(b.spent)}</div>
                        </div>

                        <div className="text-center">
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Usage</div>
                          <div className={`fw-bold small ${over ? 'text-danger' : 'text-success'}`}>
                            {Math.round(pct)}%
                          </div>
                        </div>

                        <div className="text-end">
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {over ? 'Over by' : 'Remaining'}
                          </div>
                          <div className={`fw-bold small ${over ? 'text-danger' : 'text-success'}`}>
                            {fmt(Math.abs(remaining))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <small className="text-muted">Budget: <strong>{fmt(b.amount)}</strong></small>
                        {over && (
                          <span
                            className="ms-2 badge"
                            style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.65rem' }}
                          >
                            Over budget!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editId ? 'Edit Budget' : 'New Budget'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Category *</label>
                      <select
                        className="form-select"
                        value={form.category_id}
                        onChange={e => {
                          const cat = categories.find(c => c.id === Number(e.target.value));
                          setForm({
                            ...form,
                            category_id: e.target.value,
                            title: cat ? cat.name : form.title
                          });
                        }}
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Label</label>
                      <input
                        className="form-control"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Monthly Food Budget"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Budget Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        className="form-control"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                    {editId ? 'Update' : 'Create Budget'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}