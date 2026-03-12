import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import API from '../utils/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();
const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'];

const emptyForm = {
  title: '',
  amount: '',
  type: 'expense',
  category_id: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  payment_method: 'cash'
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const txRes = await API.get(
        `/transactions?month=${month}&year=${year}&type=${filterType}&limit=${limit}&offset=${page * limit}`
      );

      setTransactions(Array.isArray(txRes.data.data) ? txRes.data.data : []);
      setTotal(txRes.data.total || 0);

      try {
        const catRes = await API.get('/categories');
        setCategories(Array.isArray(catRes.data.data) ? catRes.data.data : []);
      } catch (catErr) {
        console.error('Categories load error:', catErr.response?.data || catErr.message);
        setCategories([]);
      }
    } catch (e) {
      console.error('Transactions load error:', e.response?.data || e.message);
      toast.error(e.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [month, year, filterType, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setForm({
      title: t.title || '',
      amount: t.amount || '',
      type: t.type || 'expense',
      category_id: t.category_id ?? '',
      date: t.date ? String(t.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: t.notes || '',
      payment_method: t.payment_method || 'cash'
    });
    setEditId(t.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      category_id: form.category_id === '' ? '' : Number(form.category_id)
    };

    try {
      if (editId) {
        await API.put(`/transactions/${editId}`, payload);
        toast.success('Transaction updated.');
      } else {
        await API.post('/transactions', payload);
        toast.success('Transaction added.');
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditId(null);
      fetchData();
    } catch (err) {
      console.error('Save transaction error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;

    try {
      await API.delete(`/transactions/${id}`);
      toast.success('Deleted.');
      fetchData();
    } catch (err) {
      console.error('Delete transaction error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleExport = async () => {
    const url = `/transactions/export/csv?month=${month}&year=${year}&type=${filterType}`;
    try {
      const res = await API.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `transactions_${MONTHS[month - 1]}_${year}.csv`;
      link.click();
      toast.success('CSV exported!');
    } catch (err) {
      console.error('Export error:', err.response?.data || err.message);
      toast.error('Export failed.');
    }
  };

  const fmt = (n) =>
    `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const filteredCats = categories;

  return (
    <div>
      <div className="topbar">
        <div>
          <h5 className="mb-0 fw-bold">Transactions</h5>
          <small className="text-muted">{total} total records</small>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <select
            className="form-select form-select-sm"
            value={month}
            onChange={(e) => {
              setMonth(+e.target.value);
              setPage(0);
            }}
            style={{ width: 'auto' }}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="form-select form-select-sm"
            value={year}
            onChange={(e) => {
              setYear(+e.target.value);
              setPage(0);
            }}
            style={{ width: 'auto' }}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="form-select form-select-sm"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(0);
            }}
            style={{ width: 'auto' }}
          >
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <button className="btn btn-sm btn-outline-secondary" onClick={handleExport}>
            <i className="bi bi-download me-1"></i>
            CSV
          </button>

          <button className="btn btn-sm btn-primary" onClick={openAdd}>
            <i className="bi bi-plus me-1"></i>
            Add
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="chart-card">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--primary)' }} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No transactions found. Add your first one!
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-modern mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Payment</th>
                      <th>Type</th>
                      <th className="text-end">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="text-muted small">
                          {new Date(t.date).toLocaleDateString()}
                        </td>

                        <td>
                          <div className="fw-semibold">{t.title}</div>
                          {t.notes && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {t.notes}
                            </div>
                          )}
                        </td>

                        <td>
                          {t.category_icon && (
                            <i
                              className={`bi ${t.category_icon} me-1`}
                              style={{ color: t.category_color }}
                            ></i>
                          )}
                          <small>{t.category_name || '—'}</small>
                        </td>

                        <td>
                          <small className="text-muted">
                            {t.payment_method?.replace('_', ' ')}
                          </small>
                        </td>

                        <td>
                          <span className={`type-badge ${t.type}`}>{t.type}</span>
                        </td>

                        <td
                          className={`text-end fw-bold ${
                            t.type === 'income' ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {fmt(t.amount)}
                        </td>

                        <td>
                          <div className="d-flex gap-1 justify-content-end">
                            <button
                              className="btn btn-sm btn-outline-primary py-0 px-2"
                              onClick={() => openEdit(t)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger py-0 px-2"
                              onClick={() => handleDelete(t.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {total > limit && (
                <div className="d-flex justify-content-between align-items-center pt-3">
                  <small className="text-muted">
                    Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={(page + 1) * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editId ? 'Edit Transaction' : 'Add Transaction'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Title *</label>
                      <input
                        className="form-control"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                        placeholder="e.g. Grocery shopping"
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        required
                        placeholder="0.00"
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Type *</label>
                      <select
                        className="form-select"
                        value={form.type}
                        onChange={(e) =>
                          setForm({ ...form, type: e.target.value, category_id: '' })
                        }
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Category</label>
                      <select
                        className="form-select"
                        value={form.category_id}
                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      >
                        <option value="">Select category</option>
                        {filteredCats.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Payment Method</label>
                      <select
                        className="form-select"
                        value={form.payment_method}
                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Notes</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Optional note..."
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                    {editId ? 'Update' : 'Add Transaction'}
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