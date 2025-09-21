import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const AccountLayout: React.FC = () => {
    const activeLinkStyle = {
        backgroundColor: '#4f46e5',
        color: 'white',
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Tài khoản của tôi</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                <aside className="md:col-span-1">
                    <nav className="flex flex-col space-y-2">
                        <NavLink
                            to="/account/profile"
                            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                            className="px-4 py-2 rounded-md font-semibold text-gray-700 hover:bg-gray-100"
                        >
                            Thông tin cá nhân
                        </NavLink>
                        <NavLink
                            to="/account/orders"
                            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                            className="px-4 py-2 rounded-md font-semibold text-gray-700 hover:bg-gray-100"
                        >
                            Lịch sử đơn hàng
                        </NavLink>
                    </nav>
                </aside>

                <main className="md:col-span-3">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AccountLayout;
