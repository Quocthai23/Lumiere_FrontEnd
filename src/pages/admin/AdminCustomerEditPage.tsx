import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Customer } from '../../types/customer';
import { Save, ArrowLeft } from 'lucide-react';

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
    <div className={`p-6 ${className}`}>{children}</div>
);

const AdminCustomerEditPage: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(customerId);

    const [customer, setCustomer] = useState<Partial<Customer>>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
    });
    const [isLoading, setIsLoading] = useState(isEditing);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing) {
            axiosClient.get(`/customers/${customerId}`)
                .then(response => {
                    setCustomer(response.data);
                })
                .catch(() => {
                    setError('Không thể tải thông tin khách hàng.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [customerId, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (isEditing) {
                await axiosClient.put(`/customers/${customerId}`, customer);
            } else {
                await axiosClient.post('/customers', customer);
            }
            navigate('/admin/customers');
        } catch (err) {
            setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            setIsLoading(false);
        }
    };
    
    if (isLoading && isEditing) {
        return <div>Đang tải...</div>;
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-6">
                <div>
                     <Link to="/admin/customers" className="flex items-center gap-2 text-indigo-600 hover:underline mb-2 text-sm">
                        <ArrowLeft size={16}/> Quay lại danh sách
                     </Link>
                    <h1 className="text-2xl font-bold">{isEditing ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'}</h1>
                </div>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">
                    <Save size={16} />
                    <span>{isLoading ? 'Đang lưu...' : 'Lưu'}</span>
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin chi tiết</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="firstName" className="font-medium">Tên</label>
                        <input id="firstName" name="firstName" value={customer.firstName} onChange={handleChange} className="w-full border rounded-md p-2 bg-gray-50" />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="lastName" className="font-medium">Họ</label>
                        <input id="lastName" name="lastName" value={customer.lastName} onChange={handleChange} className="w-full border rounded-md p-2 bg-gray-50" />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="email" className="font-medium">Email</label>
                        <input id="email" name="email" type="email" value={customer.email} onChange={handleChange} className="w-full border rounded-md p-2 bg-gray-50" required />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="phone" className="font-medium">Số điện thoại</label>
                        <input id="phone" name="phone" value={customer.phone} onChange={handleChange} className="w-full border rounded-md p-2 bg-gray-50" />
                    </div>
                     <div className="md:col-span-2 space-y-2">
                        <label htmlFor="address" className="font-medium">Địa chỉ</label>
                        <textarea id="address" name="address" value={customer.address} onChange={handleChange} rows={3} className="w-full border rounded-md p-2 bg-gray-50" />
                    </div>
                </CardContent>
            </Card>
        </form>
    );
};

export default AdminCustomerEditPage;
