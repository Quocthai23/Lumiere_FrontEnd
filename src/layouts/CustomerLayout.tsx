import React from 'react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CustomerLayout: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    const activeLinkStyle = {
        color: '#4f46e5',
        fontWeight: '600', 
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
            <header className="bg-white shadow-md sticky top-0 z-50">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="text-3xl font-bold text-indigo-600 tracking-wider">
                        LUMIERE
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                            Trang chủ
                        </NavLink>
                        <NavLink to="/products" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                            Sản phẩm
                        </NavLink>
                         <NavLink to="/about" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                            Về chúng tôi
                        </NavLink>
                         <NavLink to="/contact" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                            Liên hệ
                        </NavLink>
                    </div>

                    {    }
                    <div className="flex items-center space-x-4">
                        {isAuthenticated() ? (
                            <>
                                <span className="text-gray-700 font-medium hidden sm:block">Chào, {user?.sub}</span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-300 text-sm font-semibold"
                                >
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-semibold transition-colors duration-300">
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 text-sm font-semibold"
                                >
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            <main className="flex-grow container mx-auto p-6">
                <Outlet />
            </main>

            <footer className="bg-gray-800 text-white">
                <div className="container mx-auto py-8 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4">LUMIERE</h3>
                        <p className="text-gray-400">
                            Mang đến những sản phẩm thời trang chất lượng, phong cách và độc đáo.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Liên kết nhanh</h3>
                        <ul>
                            <li className="mb-2"><Link to="/products" className="text-gray-400 hover:text-white">Sản phẩm</Link></li>
                            <li className="mb-2"><Link to="/about" className="text-gray-400 hover:text-white">Về chúng tôi</Link></li>
                            <li className="mb-2"><Link to="/contact" className="text-gray-400 hover:text-white">Liên hệ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Theo dõi chúng tôi</h3>
                        <div className="flex space-x-4">
                            {/* Social media icons can be added here */}
                            <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                            <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                            <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900 text-center py-4">
                    <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Lumiere Fashion. Đã đăng ký bản quyền.</p>
                </div>
            </footer>
        </div>
    );
};

export default CustomerLayout;