import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="d-flex align-items-center gap-2 mb-1">
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="bi bi-wallet2 text-white"></i>
            </div>
            <h4>FinTrack</h4>
          </div>
          <small>Personal Finance Manager</small>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-grid-1x2"></i> Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-arrow-left-right"></i> Transactions
          </NavLink>
          <NavLink to="/budgets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-pie-chart"></i> Budgets
          </NavLink>
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="d-flex align-items-center gap-2 px-2 mb-2">
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.85rem', fontWeight: 700
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-link w-100 text-start"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <i className="bi bi-box-arrow-left"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <Outlet />
      </div>
    </>
  );
}
