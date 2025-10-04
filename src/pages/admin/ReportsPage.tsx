import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import axiosClient from '../../api/axiosClient';
import { DollarSign, ShoppingCart, Users, TrendingUp, Download } from 'lucide-react';

// --- Mock Data (Replace with actual API calls) ---
const monthlyRevenue = [
  { name: 'Thg 1', revenue: 4000 },
  { name: 'Thg 2', revenue: 3000 },
  { name: 'Thg 3', revenue: 5000 },
  { name: 'Thg 4', revenue: 4500 },
  { name: 'Thg 5', revenue: 6000 },
  { name: 'Thg 6', revenue: 5500 },
];

const topProducts = [
  { name: 'Áo Thun Cotton', sold: 120 },
  { name: 'Quần Jeans Slim-fit', sold: 98 },
  { name: 'Váy Hoa Mùa Hè', sold: 75 },
  { name: 'Áo Sơ Mi Oxford', sold: 60 },
  { name: 'Áo Khoác Bomber', sold: 45 },
];

const categoryDistribution = [
  { name: 'Áo Thun', value: 400 },
  { name: 'Quần Jeans', value: 300 },
  { name: 'Váy', value: 300 },
  { name: 'Áo Sơ Mi', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// --- Reusable Components ---
const StatCard = ({ title, value, icon: Icon, colorClass = 'text-indigo-600' }: { title: string, value: string, icon: React.ElementType, colorClass?: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center">
            <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    </div>
);

const ChartCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
    </div>
);


const ReportsPage: React.FC = () => {
    // In a real app, you would fetch this data from your backend
    // const [reportData, setReportData] = useState(null);
    // const [isLoading, setIsLoading] = useState(true);
    // useEffect(() => { ... fetch data ... }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Báo cáo & Thống kê</h1>
                <button className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm hover:bg-indigo-700">
                    <Download className="h-4 w-4" />
                    Xuất Báo cáo
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Tổng Doanh Thu" value="150.000.000đ" icon={DollarSign} colorClass="text-green-600" />
                <StatCard title="Tổng Đơn Hàng" value="1,250" icon={ShoppingCart} colorClass="text-blue-600" />
                <StatCard title="Khách Hàng Mới" value="320" icon={Users} colorClass="text-orange-600" />
                <StatCard title="Tỷ lệ Tăng trưởng" value="+15.2%" icon={TrendingUp} colorClass="text-purple-600" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Doanh thu theo tháng">
                    <LineChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()}đ`} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ChartCard>

                <ChartCard title="Top 5 sản phẩm bán chạy">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value: number) => `${value} sản phẩm`} />
                        <Legend />
                        <Bar dataKey="sold" name="Đã bán" fill="#818cf8" />
                    </BarChart>
                </ChartCard>

                 <ChartCard title="Phân phối theo danh mục">
                    <PieChart>
                        <Pie
                            data={categoryDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {categoryDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value} sản phẩm`} />
                        <Legend />
                    </PieChart>
                </ChartCard>
            </div>
        </div>
    );
};

export default ReportsPage;
