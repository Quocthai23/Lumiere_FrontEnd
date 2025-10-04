import React from 'react';
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

// --- Dữ liệu giả lập cho biểu đồ ---
const revenueData = [
  { month: "Thg 1", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 2", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 3", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 4", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 5", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 6", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 7", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 8", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 9", total: 95000000 },
  { month: "Thg 10", total: 123000000 },
  { month: "Thg 11", total: Math.floor(Math.random() * 50000000) + 10000000 },
  { month: "Thg 12", total: Math.floor(Math.random() * 50000000) + 10000000 },
]

const subscriptionsData = [
    { month: "Thg 1", count: Math.floor(Math.random() * 100) + 50 },
    { month: "Thg 2", count: Math.floor(Math.random() * 100) + 50 },
    { month: "Thg 3", count: Math.floor(Math.random() * 100) + 50 },
    { month: "Thg 4", count: Math.floor(Math.random() * 100) + 50 },
    { month: "Thg 5", count: 180 },
    { month: "Thg 6", count: 210 },
    { month: "Thg 7", count: 250 },
    { month: "Thg 8", count: 230 },
    { month: "Thg 9", count: 300 },
    { month: "Thg 10", count: 350 },
    { month: "Thg 11", count: Math.floor(Math.random() * 100) + 50 },
    { month: "Thg 12", count: Math.floor(Math.random() * 100) + 50 },
];

const topProductsData = [
    { name: "Áo Thun Basic", total: 450 },
    { name: "Quần Jeans Slim", total: 380 },
    { name: "Váy Hoa Mùa Hè", total: 290 },
    { name: "Sơ Mi Oxford", total: 250 },
    { name: "Áo Khoác Bomber", total: 180 },
];

const recentSalesData = [
    { name: "Olivia Martin", email: "olivia.martin@email.com", amount: 1999000 },
    { name: "Jackson Lee", email: "jackson.lee@email.com", amount: 390000 },
    { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: 299000 },
    { name: "William Kim", email: "will@email.com", amount: 99000 },
    { name: "Sofia Davis", email: "sofia.davis@email.com", amount: 390000 },
]

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
    const stats = {
        totalRevenue: 123456789,
        subscriptions: 2350,
        sales: 12234,
        activeNow: 573,
    };
    
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
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('vi-VN')} ₫</div>
            <p className="text-xs text-muted-foreground">+20.1% so với tháng trước</p>
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
            <div className="text-2xl font-bold">+{stats.subscriptions.toLocaleString('vi-VN')}</div>
            <p className="text-xs text-muted-foreground">
              +180.1% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh số</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.sales.toLocaleString('vi-VN')}</div>
            <p className="text-xs text-muted-foreground">
              +19% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.activeNow}</div>
            <p className="text-xs text-muted-foreground">
              +201 so với giờ trước
            </p>
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
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueData}>
                 <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value as number / 1000000)}tr`} />
                 <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '0.5rem' }} formatter={(value) => [`${(value as number).toLocaleString('vi-VN')} ₫`, 'Doanh thu']} />
                 <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary text-indigo-600" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Khách hàng mới</CardTitle>
            <CardDescription>Tăng trưởng khách hàng trong năm.</CardDescription>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
                <LineChart data={subscriptionsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '0.5rem' }} formatter={(value) => [value, 'Khách hàng']} />
                    <Line type="monotone" dataKey="count" stroke="currentColor" strokeWidth={2} className="text-green-500" dot={{ r: 4, fill: "currentColor" }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
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
                 <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={topProductsData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={120} />
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '0.5rem' }} formatter={(value) => [value, 'Số lượng']} />
                        <Bar dataKey="total" fill="currentColor" radius={[0, 4, 4, 0]} className="fill-primary text-cyan-500" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
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
            {recentSalesData.map((sale, index) => (
                 <div key={index} className="flex items-center gap-4">
                    <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">{sale.name}</p>
                        <p className="text-sm text-muted-foreground">{sale.email}</p>
                    </div>
                    <div className="ml-auto font-medium">+{sale.amount.toLocaleString('vi-VN')} ₫</div>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default DashboardPage;
