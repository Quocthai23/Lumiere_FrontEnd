import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '250px', background: '#2c3e50', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div>
            <h2>Lumiere Admin</h2>
            <nav>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '10px' }}><Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link></li>
                <li style={{ marginBottom: '10px' }}><Link to="/admin/products" style={{ color: 'white', textDecoration: 'none' }}>Quản lý sản phẩm</Link></li>
                {}
            </ul>
            </nav>
        </div>
        <div style={{ marginTop: 'auto' }}>
            <p>Đăng nhập với: {user?.sub}</p>
            <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Đăng xuất
            </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '20px', background: '#f4f6f9' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;