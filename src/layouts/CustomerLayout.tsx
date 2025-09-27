import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { useComparison } from '../contexts/ComparisonContext';
import { useNotifications } from '../contexts/NotificationContext';
import axiosClient from '../api/axiosClient';
import type { Product } from '../types/product';
import QuickViewModal from '../components/customer/QuickViewModal';
import { Scale, Bell } from 'lucide-react';
import NotificationDropdown from '../components/customer/NotificationDropdown';
import LiveChatWidget from '../components/customer/LiveChatWidget';

// Custom hook để trì hoãn việc thực thi một chức năng (ví dụ: tìm kiếm)
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

const CustomerLayout: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const { cartCount } = useCart();
    const { compareCount } = useComparison();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const searchRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Style cho NavLink khi đang active
    const activeLinkStyle = {
        color: '#4f46e5',
        fontWeight: '600',
    };

    // Effect để gọi API tìm kiếm khi người dùng ngừng gõ
    useEffect(() => {
        if (debouncedSearchQuery.trim().length > 1) {
            setIsSearchLoading(true);
            // Sử dụng tham số 'query' để kích hoạt logic tìm kiếm nâng cao
            axiosClient.get(`/products`, { params: { 'query': debouncedSearchQuery }})
                .then(response => {
                    setSearchResults(response.data.slice(0, 5));
                })
                .catch(err => console.error("Search error:", err))
                .finally(() => setIsSearchLoading(false));
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchQuery]);

    // Effect để xử lý việc click ra ngoài khu vực tìm kiếm và thông báo
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchRef, notificationRef]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsSearchFocused(false);
        }
    };
    
    const handleResultClick = () => {
        setSearchQuery('');
        setIsSearchFocused(false);
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
            <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="text-3xl font-bold text-indigo-600 tracking-wider">LUMIERE</Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">Trang chủ</NavLink>
                        <NavLink to="/products" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">Sản phẩm</NavLink>
                        <NavLink to="/collections" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">Bộ sưu tập</NavLink>
                        <NavLink to="/about" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">Về chúng tôi</NavLink>
                        <NavLink to="/contact" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">Liên hệ</NavLink>
                    </div>

                    <div ref={searchRef} className="relative w-full max-w-xs md:max-w-sm">
                        <form onSubmit={handleSearchSubmit}>
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                placeholder="Tìm kiếm sản phẩm..."
                                className="w-full pl-12 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                        </form>
                        {isSearchFocused && searchQuery.length > 1 && (
                            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-2xl border overflow-hidden z-10">
                                {isSearchLoading && <div className="p-4 text-center text-sm text-gray-500">Đang tìm...</div>}
                                {!isSearchLoading && searchResults.length === 0 && <div className="p-4 text-center text-sm text-gray-500">Không tìm thấy sản phẩm.</div>}
                                {!isSearchLoading && searchResults.length > 0 && (
                                    <ul>
                                        {searchResults.map(product => (
                                            <li key={product.id} onClick={handleResultClick}>
                                                <Link to={`/products/${product.slug}`} className="flex items-center p-3 hover:bg-gray-100">
                                                    <img src={`https://placehold.co/60x60/EFEFEF/333333?text=${encodeURIComponent(product.name.split(' ')[0])}`} alt={product.name} className="w-12 h-12 object-cover rounded-md"/>
                                                    <div className="ml-4"><p className="font-semibold text-gray-800">{product.name}</p><p className="text-sm text-indigo-600">{product.variants?.[0]?.price.toLocaleString('vi-VN')} VND</p></div>
                                                </Link>
                                            </li>
                                        ))}
                                        <li onClick={handleResultClick}><Link to={`/search?query=${encodeURIComponent(searchQuery.trim())}`} className="block text-center p-3 bg-gray-50 hover:bg-gray-200 text-sm font-semibold text-indigo-600">Xem tất cả kết quả</Link></li>
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link to="/compare" className="relative text-gray-600 hover:text-indigo-600">
                            <Scale className="h-6 w-6" />
                            {compareCount > 0 && <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{compareCount}</span>}
                        </Link>
                        <Link to="/cart" className="relative text-gray-600 hover:text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
                        </Link>
                        {isAuthenticated() && (
                            <div ref={notificationRef} className="relative">
                                <button onClick={() => setIsNotificationOpen(prev => !prev)} className="relative text-gray-600 hover:text-indigo-600">
                                    <Bell className="h-6 w-6" />
                                    {unreadCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>}
                                </button>
                                {isNotificationOpen && <NotificationDropdown />}
                            </div>
                        )}
                        {isAuthenticated() ? (
                            <>
                                <NavLink to="/account/profile" className="text-gray-600 hover:text-indigo-600 font-semibold">Tài khoản</NavLink>
                                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm font-semibold">Đăng xuất</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-semibold">Đăng nhập</Link>
                                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-semibold">Đăng ký</Link>
                            </>
                        )}
                    </div>
                </nav>
            </header>
            <main className="flex-grow container mx-auto p-6"><Outlet /></main>
            <footer className="bg-gray-800 text-white">
                <div className="container mx-auto py-8 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div><h3 className="text-xl font-bold mb-4">LUMIERE</h3><p className="text-gray-400">Mang đến những sản phẩm thời trang chất lượng, phong cách và độc đáo.</p></div>
                    <div><h3 className="text-lg font-semibold mb-4">Liên kết nhanh</h3><ul><li className="mb-2"><Link to="/products" className="text-gray-400 hover:text-white">Sản phẩm</Link></li><li className="mb-2"><Link to="/about" className="text-gray-400 hover:text-white">Về chúng tôi</Link></li><li className="mb-2"><Link to="/contact" className="text-gray-400 hover:text-white">Liên hệ</Link></li></ul></div>
                    <div><h3 className="text-lg font-semibold mb-4">Theo dõi chúng tôi</h3><div className="flex space-x-4"><a href="#" className="text-gray-400 hover:text-white">Facebook</a><a href="#" className="text-gray-400 hover:text-white">Instagram</a><a href="#" className="text-gray-400 hover:text-white">Twitter</a></div></div>
                </div>
                <div className="bg-gray-900 text-center py-4"><p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Lumiere Fashion. Đã đăng ký bản quyền.</p></div>
            </footer>
            <QuickViewModal />
            <LiveChatWidget />
        </div>
    );
};

export default CustomerLayout;