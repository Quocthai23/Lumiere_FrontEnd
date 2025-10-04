import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Customer } from '../../types/customer';
import { PlusCircle, File, ListFilter, Search } from 'lucide-react';

// --- Reusable UI Components ---
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 border-b ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <h3 className={`font-semibold text-lg ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const TierBadge = ({ tier }: { tier?: string }) => {
    const tierStyles: { [key: string]: string } = {
        GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
        BRONZE: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    const style = tierStyles[tier || ''] || 'bg-blue-100 text-blue-800 border-blue-200';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full border ${style}`}>{tier || 'Member'}</span>;
};

// --- Main Component ---
const CustomerManagementPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(customer => {
                if (activeTab === 'All') return true;
                return customer.tier === activeTab;
            })
            .filter(customer => {
                const term = searchTerm.toLowerCase();
                if (!term) return true;
                const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
                return (
                    fullName.includes(term) ||
                    customer.email.toLowerCase().includes(term)
                );
            });
    }, [customers, activeTab, searchTerm]);
    
    const TABS = ['All', 'GOLD', 'SILVER', 'BRONZE'];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Quản lý Khách hàng</h1>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-gray-50">
                        <File className="h-4 w-4" />
                        <span>Xuất file</span>
                    </button>
                    <Link to="/admin/customers/new" className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm hover:bg-indigo-700">
                        <PlusCircle className="h-4 w-4" />
                        <span>Thêm khách hàng</span>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                         <div className="flex border-b">
                            {TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                                        activeTab === tab
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <input
                                type="search"
                                placeholder="Tìm kiếm khách hàng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-2 py-2 w-full md:w-[250px] border rounded-md bg-gray-50"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Khách Hàng</th>
                                    <th className="px-6 py-3">Hạng</th>
                                    <th className="px-6 py-3">Số điện thoại</th>
                                    <th className="px-6 py-3">Điểm tích lũy</th>
                                    <th className="px-6 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                 {isLoading ? (
                                    <tr><td colSpan={5} className="text-center p-8">Đang tải...</td></tr>
                                ) : error ? (
                                     <tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>
                                ) : filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                                {customer.firstName?.[0] || ''}{customer.lastName?.[0] || ''}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-800">{customer.firstName} {customer.lastName}</div>
                                                <div className="text-gray-500 text-xs">{customer.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><TierBadge tier={customer.tier} /></td>
                                    <td className="px-6 py-4">{customer.phone || 'N/A'}</td>
                                    <td className="px-6 py-4 font-semibold">{customer.loyaltyPoints?.toLocaleString('vi-VN') || 0}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/admin/customers/${customer.id}`} className="font-medium text-indigo-600 hover:underline">
                                            Xem chi tiết
                                        </Link>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                         { !isLoading && filteredCustomers.length === 0 && (
                            <p className="p-8 text-center text-gray-500">Không có khách hàng nào phù hợp.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomerManagementPage;


