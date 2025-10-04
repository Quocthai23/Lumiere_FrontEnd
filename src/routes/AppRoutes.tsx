import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import AccountLayout from '../pages/customer/AccountLayout';

// Customer Pages
import HomePage from '../pages/customer/HomePage';
import ProductPage from '../pages/customer/ProductPage';
import ProductDetailPage from '../pages/customer/ProductDetailPage';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import OrderConfirmationPage from '../pages/customer/OrderConfirmationPage';
import OrderHistoryPage from '../pages/customer/OrderHistoryPage';
import OrderDetailPage from '../pages/customer/OrderDetailPage';
import ProfilePage from '../pages/customer/ProfilePage';
import AboutPage from '../pages/customer/AboutPage';
import ContactPage from '../pages/customer/ContactPage';
import SearchResultsPage from '../pages/customer/SearchResultsPage';
import WishlistPage from '../pages/customer/WishlistPage';
import CollectionsPage from '../pages/customer/CollectionsPage';
import CollectionDetailPage from '../pages/customer/CollectionDetailPage';
import AddressPage from '../pages/customer/AddressPage';
import ComparisonPage from '../pages/customer/ComparisonPage';
import LoyaltyPage from '../pages/customer/LoyaltyPage';
import NotificationsPage from '../pages/customer/NotificationsPage';

// Admin Pages
import DashboardPage from '../pages/admin/DashboardPage';
import ProductManagementPage from '../pages/admin/ProductManagementPage';
import AdminProductDetailPage from '../pages/admin/AdminProductDetailPage';
import OrderManagementPage from '../pages/admin/OrderManagementPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
import CustomerManagementPage from '../pages/admin/CustomerManagementPage';
import AdminCustomerDetailPage from '../pages/admin/AdminCustomerDetailPage';
import AdminCustomerEditPage from '../pages/admin/AdminCustomerEditPage';
import WarehouseManagementPage from '../pages/admin/WarehouseManagementPage';
import InventoryManagementPage from '../pages/admin/InventoryManagementPage';
import VoucherManagementPage from '../pages/admin/VoucherManagementPage';
import ReportsPage from '../pages/admin/ReportsPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import ReviewManagementPage from '../pages/admin/ReviewManagementPage';
import QAManagementPage from '../pages/admin/QAManagementPage';
import CollectionManagementPage from '../pages/admin/CollectionManagementPage'; // Import trang mới
import AdminCollectionEditPage from '../pages/admin/AdminCollectionEditPage'; // Import trang mới


// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Auth & Routing
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

const AppRoutes: React.FC = () => {
    const { isLoading } = useAuth();
    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    }
    return (
        <BrowserRouter>
            <Routes>
                {/* Customer Layout - Public Routes */}
                <Route path="/" element={<CustomerLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="products" element={<ProductPage />} />
                    <Route path="products/:slug" element={<ProductDetailPage />} />
                    <Route path="collections" element={<CollectionsPage />} />
                    <Route path="collections/:slug" element={<CollectionDetailPage />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="search" element={<SearchResultsPage />} />
                    <Route path="compare" element={<ComparisonPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="order-confirmation" element={<OrderConfirmationPage />} />
                </Route>

                {/* Protected Customer Account Routes */}
                <Route element={<ProtectedRoute requireAdmin={false} />}>
                    <Route path="/account" element={<CustomerLayout />}>
                        <Route element={<AccountLayout />}>
                            <Route index element={<Navigate to="profile" replace />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="addresses" element={<AddressPage />} />
                            <Route path="orders" element={<OrderHistoryPage />} />
                            <Route path="wishlist" element={<WishlistPage />} />
                            <Route path="orders/:orderId" element={<OrderDetailPage />} />
                            <Route path="loyalty" element={<LoyaltyPage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                        </Route>
                    </Route>
                </Route>

                {/* Auth Pages */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Admin Layout & Routes (Protected) */}
                <Route element={<ProtectedRoute requireAdmin={true} />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="products" element={<ProductManagementPage />} />
                        <Route path="products/new" element={<AdminProductDetailPage />} />
                        <Route path="products/edit/:productId" element={<AdminProductDetailPage />} />
                        <Route path="orders" element={<OrderManagementPage />} />
                        <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
                        <Route path="customers" element={<CustomerManagementPage />} />
                        <Route path="customers/new" element={<AdminCustomerEditPage />} />
                        <Route path="customers/:customerId" element={<AdminCustomerDetailPage />} />
                        <Route path="customers/edit/:customerId" element={<AdminCustomerEditPage />} />
                        <Route path="warehouses" element={<WarehouseManagementPage />} />
                        <Route path="inventory" element={<InventoryManagementPage />} />
                        <Route path="vouchers" element={<VoucherManagementPage />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="notifications" element={<AdminNotificationsPage />} />
                        <Route path="reviews" element={<ReviewManagementPage />} />
                        <Route path="qa" element={<QAManagementPage />} />
                        <Route path="collections" element={<CollectionManagementPage />} /> {/* Thêm route mới */}
                        <Route path="collections/new" element={<AdminCollectionEditPage />} /> {/* Thêm route mới */}
                        <Route path="collections/edit/:collectionId" element={<AdminCollectionEditPage />} /> {/* Thêm route mới */}
                    </Route>
                </Route>

            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;

