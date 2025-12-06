import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowUpRight,
  CircleUser,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
  Loader2,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts"
import {
  getDashboardStats,
  getRevenueByMonth,
  getNewCustomersByMonth,
  getTopProducts,
  getRecentSales,
} from '../../api/dashboardApi';
import type {
  DashboardStatsDTO,
  MonthlyRevenueDTO,
  MonthlyCustomerDTO,
  TopProductDTO,
  RecentSaleDTO,
} from '../../types/dashboard';

// --- Các UI Component tái sử dụng ---
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`font-semibold leading-none tracking-tight ${className}`} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = "CardContent";

// --- Component Dashboard Chính ---
const DashboardPage: React.FC = () => {
    // States cho dữ liệu
    const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
    const [revenueData, setRevenueData] = useState<MonthlyRevenueDTO[]>([]);
    const [subscriptionsData, setSubscriptionsData] = useState<MonthlyCustomerDTO[]>([]);
    const [topProductsData, setTopProductsData] = useState<TopProductDTO[]>([]);
    const [recentSalesData, setRecentSalesData] = useState<RecentSaleDTO[]>([]);
    
    // States cho loading
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingRevenue, setLoadingRevenue] = useState(true);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingTopProducts, setLoadingTopProducts] = useState(true);
    const [loadingRecentSales, setLoadingRecentSales] = useState(true);
    
    // States cho errors
    const [error, setError] = useState<string | null>(null);

    // Lazy load dữ liệu stats
    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoadingStats(true);
                const data = await getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error('Lỗi khi tải thống kê:', err);
                setError('Không thể tải thống kê');
            } finally {
                setLoadingStats(false);
            }
        };
        loadStats();
    }, []);

    // Lazy load doanh thu theo tháng
    useEffect(() => {
        const loadRevenue = async () => {
            try {
                setLoadingRevenue(true);
                const data = await getRevenueByMonth();
                // Chuyển đổi format tháng nếu cần
                const formattedData = data.map(item => ({
                    month: item.month || `Thg ${data.indexOf(item) + 1}`,
                    total: item.total,
                }));
                setRevenueData(formattedData);
            } catch (err) {
                console.error('Lỗi khi tải doanh thu:', err);
            } finally {
                setLoadingRevenue(false);
            }
        };
        loadRevenue();
    }, []);

    // Lazy load khách hàng mới theo tháng
    useEffect(() => {
        const loadCustomers = async () => {
            try {
                setLoadingCustomers(true);
                const data = await getNewCustomersByMonth();
                // Chuyển đổi format tháng nếu cần
                const formattedData = data.map(item => ({
                    month: item.month || `Thg ${data.indexOf(item) + 1}`,
                    count: item.count,
                }));
                setSubscriptionsData(formattedData);
            } catch (err) {
                console.error('Lỗi khi tải khách hàng:', err);
            } finally {
                setLoadingCustomers(false);
            }
        };
        loadCustomers();
    }, []);

    // Lazy load top sản phẩm
    useEffect(() => {
        const loadTopProducts = async () => {
            try {
                setLoadingTopProducts(true);
                const data = await getTopProducts(5);
                setTopProductsData(data);
            } catch (err) {
                console.error('Lỗi khi tải top sản phẩm:', err);
            } finally {
                setLoadingTopProducts(false);
            }
        };
        loadTopProducts();
    }, []);

    // Lazy load đơn hàng gần đây
    useEffect(() => {
        const loadRecentSales = async () => {
            try {
                setLoadingRecentSales(true);
                const data = await getRecentSales(5);
                setRecentSalesData(data);
            } catch (err) {
                console.error('Lỗi khi tải đơn hàng gần đây:', err);
            } finally {
                setLoadingRecentSales(false);
            }
        };
        loadRecentSales();
    }, []);
    
  return (
    // KHẮC PHỤC: Đã xóa class "-m-8" gây lỗi chồng chéo layout
    <main className="flex flex-1 flex-col gap-4 md:gap-8">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalRevenue ? stats.totalRevenue.toLocaleString('vi-VN') : '0'} ₫
                </div>
                <p className="text-xs text-muted-foreground">+20.1% so với tháng trước</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Khách hàng mới
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  +{stats?.subscriptions ? stats.subscriptions.toLocaleString('vi-VN') : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +180.1% so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh số</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  +{stats?.sales ? stats.sales.toLocaleString('vi-VN') : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +19% so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  +{stats?.activeNow || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +201 so với giờ trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts and Recent Sales Grid */}
      <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
         <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Tổng quan Doanh thu</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loadingRevenue ? (
              <div className="flex items-center justify-center h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueData}>
                   <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value as number / 1000000)}tr`} />
                   <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '0.5rem' }} formatter={(value) => [`${(value as number).toLocaleString('vi-VN')} ₫`, 'Doanh thu']} />
                   <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary text-indigo-600" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Khách hàng mới</CardTitle>
            <CardDescription>Tăng trưởng khách hàng trong năm.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCustomers ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={subscriptionsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '0.5rem' }} formatter={(value) => [value, 'Khách hàng']} />
                    <Line type="monotone" dataKey="count" stroke="currentColor" strokeWidth={2} className="text-green-500" dot={{ r: 4, fill: "currentColor" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
         <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Sản phẩm bán chạy</CardTitle>
                <CardDescription>Top 5 sản phẩm có doanh số cao nhất.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTopProducts ? (
                <div className="flex items-center justify-center h-[350px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={topProductsData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '0.5rem' }} formatter={(value) => [value, 'Số lượng']} />
                      <Bar dataKey="total" fill="currentColor" radius={[0, 4, 4, 0]} className="fill-primary text-cyan-500" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  Không có dữ liệu
                </div>
              )}
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                 <CardTitle>Doanh số gần đây</CardTitle>
                <CardDescription>
                    Có 265 đơn hàng trong tháng này.
                </CardDescription>
            </div>
           
          </CardHeader>
          <CardContent className="grid gap-8">
            {loadingRecentSales ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentSalesData.length > 0 ? (
              recentSalesData.map((sale, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{sale.name}</p>
                    <p className="text-sm text-muted-foreground">{sale.email}</p>
                  </div>
                  <div className="ml-auto font-medium">+{sale.amount.toLocaleString('vi-VN')} ₫</div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default DashboardPage;
