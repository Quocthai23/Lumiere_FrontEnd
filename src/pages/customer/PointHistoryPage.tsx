import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import type { LoyaltyTransaction } from '../../types/loyalty';
import { ArrowDownRight, ArrowUpRight, Gift } from 'lucide-react';

const PointHistoryPage: React.FC = () => {
    const { user } = useAuth();
    // Khởi tạo state là một mảng rỗng [] thay vì null
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
    const [customer, setCustomer] = useState<{ loyaltyPoints?: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                // Giả lập customerId là 1 cho user đã đăng nhập
                const customerId = 1; 
                const [historyRes, customerRes] = await Promise.all([
                    axiosClient.get('/loyalty/history', { params: { 'customerId.equals': customerId } }),
                    axiosClient.get(`/customers/${customerId}`)
                ]);
                
                setTransactions(historyRes.data || []); // Đảm bảo transactions luôn là một mảng
                setCustomer(customerRes.data);

            } catch (err) {
                console.error("Lỗi khi tải lịch sử điểm:", err);
                setError("Không thể tải dữ liệu. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const renderIcon = (type: 'EARNED' | 'REDEEMED') => {
        if (type === 'EARNED') {
            return <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><ArrowUpRight className="w-5 h-5 text-green-600" /></div>;
        }
        return <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><ArrowDownRight className="w-5 h-5 text-red-600" /></div>;
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center py-10">Đang tải lịch sử điểm...</div>;
        }

        if (error) {
            return <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">{error}</div>;
        }

        if (transactions.length === 0) {
            return (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <h3 className="text-xl font-semibold text-gray-700">Chưa có giao dịch điểm</h3>
                    <p className="text-gray-500 mt-2">Mọi hoạt động tích và tiêu điểm của bạn sẽ được ghi nhận tại đây.</p>
                </div>
            );
        }

        return (
            <ul className="space-y-4">
                {transactions.map((transaction) => (
                    <li key={transaction.id} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
                        <div className="flex items-center gap-4">
                            {renderIcon(transaction.type)}
                            <div>
                                <p className="font-semibold text-gray-800">{transaction.description}</p>
                                <p className="text-sm text-gray-500">{new Date(transaction.createdAt).toLocaleString('vi-VN')}</p>
                            </div>
                        </div>
                        <p className={`font-bold text-lg ${transaction.type === 'EARNED' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'EARNED' ? '+' : '-'}{transaction.points}
                        </p>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Lịch sử điểm thưởng</h2>
                <p className="mt-1 text-gray-600">Theo dõi các hoạt động tích và tiêu điểm của bạn.</p>
            </div>

            <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg flex justify-between items-center">
                <div>
                    <p className="text-lg opacity-80">Tổng điểm hiện tại</p>
                    <p className="text-4xl font-bold">{customer?.loyaltyPoints?.toLocaleString('vi-VN') || 0}</p>
                </div>
                <Gift className="w-16 h-16 opacity-30" />
            </div>

            {renderContent()}
        </div>
    );
};

export default PointHistoryPage;

