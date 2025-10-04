import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminNotificationDropdown from '../components/admin/AdminNotificationDropdown';
import {
    Home,
    Package,
    ShoppingCart,
    Users,
    Warehouse,
    PackageSearch,
    Ticket,
    LogOut,
    Package2,
    LineChart,
    Bell,
    MessageSquare,
    Star,
    LayoutGrid,
    Search,
    Menu,
    X,
    ChevronDown
} from "lucide-react";

const NavItem = ({ to, icon: Icon, children, end = false }: { to: string, icon: React.ElementType, children: React.ReactNode, end?: boolean }) => {
    const baseClasses = "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm";
    const activeClassName = "bg-gray-200 text-gray-900 font-semibold";
    const inactiveClassName = "text-gray-500 hover:bg-gray-200 hover:text-gray-900";

    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `${baseClasses} ${isActive ? activeClassName : inactiveClassName}`
            }
        >
            <Icon className="h-4 w-4" />
            {children}
        </NavLink>
    );
};

const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link to="/admin" className="flex items-center gap-2 font-semibold text-gray-900">
                    <Package2 className="h-6 w-6 text-indigo-600" />
                    <span className="">Lumiere Admin</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto" onClick={onLinkClick}>
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    <NavItem to="/admin" icon={Home} end={true}>Dashboard</NavItem>
                    <NavItem to="/admin/products" icon={Package}>Sản phẩm</NavItem>
                    <NavItem to="/admin/orders" icon={ShoppingCart}>Đơn hàng</NavItem>
                    <NavItem to="/admin/customers" icon={Users}>Khách hàng</NavItem>
                    <NavItem to="/admin/reviews" icon={Star}>Đánh giá</NavItem>
                    <NavItem to="/admin/qa" icon={MessageSquare}>Hỏi & Đáp</NavItem>
                    <NavItem to="/admin/collections" icon={LayoutGrid}>Bộ sưu tập</NavItem>
                    <NavItem to="/admin/warehouses" icon={Warehouse}>Kho hàng</NavItem>
                    <NavItem to="/admin/inventory" icon={PackageSearch}>Tồn kho</NavItem>
                    <NavItem to="/admin/vouchers" icon={Ticket}>Khuyến mãi</NavItem>
                    <NavItem to="/admin/reports" icon={LineChart}>Báo cáo</NavItem>
                    <NavItem to="/admin/notifications" icon={Bell}>Thông báo</NavItem>
                </nav>
            </div>
            <div className="mt-auto p-4 border-t">
                 <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}


const AdminLayout: React.FC = () => {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (username: string = '') => {
        return username?.[0]?.toUpperCase() || 'A';
    }


    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="hidden border-r bg-gray-100/40 md:block">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                 <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="fixed inset-0 bg-black/60"></div>
                    <div className="fixed top-0 left-0 h-full w-3/4 max-w-sm bg-gray-100/95 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                        <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
                         <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-3 right-3 p-2 rounded-full bg-gray-200/50 hover:bg-gray-300/50">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-col h-screen">
                <header className="flex h-14 items-center gap-4 border-b bg-white/95 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-40">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-2 -ml-2 text-gray-600"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    
                    <div className="w-full flex-1">
                        <form>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <input
                                    type="search"
                                    placeholder="Tìm kiếm..."
                                    className="w-full appearance-none bg-gray-100 border-none rounded-md pl-8 md:w-2/3 lg:w-1/3 py-2 text-sm"
                                />
                            </div>
                        </form>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4">
                        <AdminNotificationDropdown />
                        <div className="relative" ref={userMenuRef}>
                            <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                                    {getInitials(user?.sub)}
                                </div>
                                <span className="hidden md:inline text-sm font-medium">{user?.sub}</span>
                                <ChevronDown className="h-4 w-4 hidden md:inline text-gray-500"/>
                            </button>
                             {isUserMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                                    <div className="p-2 border-b">
                                        <p className="text-sm font-semibold">{user?.sub}</p>
                                        <p className="text-xs text-gray-500">Admin</p>
                                    </div>
                                    <div className="p-1">
                                         <button
                                            onClick={handleLogout}
                                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 font-medium"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

