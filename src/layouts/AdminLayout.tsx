import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeLinkStyle = {
    backgroundColor: '#4f46e5',
    color: 'white',
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="text-2xl font-bold p-4 border-b border-gray-700">
          Lumiere Admin
        </div>
        <nav className="flex-grow p-2">
          <NavLink
            to="/admin"
            end
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
            className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/products"
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
            className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors mt-1"
          >
            Quản lý sản phẩm
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `block px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            Quản lý Đơn hàng
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => `block px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            Quản lý Khách hàng
          </NavLink>
          <NavLink to="/admin/warehouses" className={({ isActive }) => `block px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            Quản lý Kho
          </NavLink>
          <NavLink to="/admin/inventory" className={({ isActive }) => `block px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            Quản lý Tồn kho
          </NavLink>
          <NavLink to="/admin/vouchers" className={({ isActive }) => `block px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            Quản lý Khuyến mãi
          </NavLink>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
            <p className="text-sm">Đăng nhập với: <strong>{user?.sub}</strong></p>
            <button 
              onClick={handleLogout} 
              className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-semibold"
            >
                Đăng xuất
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
