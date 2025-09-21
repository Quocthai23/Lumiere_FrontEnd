import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Customer } from '../../types/customer';

const CustomerManagementPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const response = await axiosClient.get('/customers?sort=id,asc');
                setCustomers(response.data);
                setError(null);
            } catch (err) {
                setError('Không thể tải danh sách khách hàng.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const getTierClass = (tier?: string) => {
        switch (tier) {
            case 'GOLD':
                return 'bg-yellow-400 text-yellow-900';
            case 'SILVER':
                return 'bg-gray-300 text-gray-800';
            case 'BRONZE':
                return 'bg-yellow-600 text-white';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) return <p>Đang tải danh sách khách hàng...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Quản lý Khách hàng</h1>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Họ Tên</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Số điện thoại</th>
                            <th className="px-6 py-3">Hạng</th>
                            <th className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold">{customer.id}</td>
                                <td className="px-6 py-4">{customer.firstName} {customer.lastName}</td>
                                <td className="px-6 py-4">{customer.email}</td>
                                <td className="px-6 py-4">{customer.phone}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTierClass(customer.tier)}`}>
                                        {customer.tier || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link to={`/admin/customers/${customer.id}`} className="font-medium text-indigo-600 hover:underline">
                                        Xem chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {customers.length === 0 && (
                    <p className="p-4 text-center text-gray-500">Chưa có khách hàng nào.</p>
                )}
            </div>
        </div>
    );
};

export default CustomerManagementPage;
