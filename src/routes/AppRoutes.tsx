import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import HomePage from '../pages/customer/HomePage';
import ProductPage from '../pages/customer/ProductPage';
import ProductDetailPage from '../pages/customer/ProductDetailPage';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import OrderConfirmationPage from '../pages/customer/OrderConfirmationPage'; // <-- Thêm import
import AccountLayout from '../pages/customer/AccountLayout';
import OrderHistoryPage from '../pages/customer/OrderHistoryPage';
import OrderDetailPage from '../pages/customer/OrderDetailPage';
import ProfilePage from '../pages/customer/ProfilePage';
import AboutPage from '../pages/customer/AboutPage';
import ContactPage from '../pages/customer/ContactPage';
import SearchResultsPage from '../pages/customer/SearchResultsPage';
import OrderManagementPage from '../pages/admin/OrderManagementPage';    
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
import CustomerManagementPage from '../pages/admin/CustomerManagementPage';   
import AdminCustomerDetailPage from '../pages/admin/AdminCustomerDetailPage';
import WarehouseManagementPage from '../pages/admin/WarehouseManagementPage';
import InventoryManagementPage from '../pages/admin/InventoryManagementPage';
import VoucherManagementPage from '../pages/admin/VoucherManagementPage';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/admin/DashboardPage';
import ProductManagementPage from '../pages/admin/ProductManagementPage';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import AdminProductDetailPage from '../pages/admin/AdminProductDetailPage';

const AppRoutes: React.FC = () => {
    const { isLoading } = useAuth();
    if(isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    }
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Layout */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation" element={<OrderConfirmationPage />} /> {/* <-- Route mới */}
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="search" element={<SearchResultsPage />} />
        </Route>

        {/* Account Routes (Protected) */}
        <Route element={<ProtectedRoute requireAdmin={false} />}>
            <Route path="/account" element={<CustomerLayout />}>
                <Route element={<AccountLayout />}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="orders" element={<OrderHistoryPage />} />
                    <Route path="orders/:orderId" element={<OrderDetailPage />} />
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
            <Route path="products/:productId" element={<AdminProductDetailPage />} />
            <Route path="orders" element={<OrderManagementPage />} />
            <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
            <Route path="customers" element={<CustomerManagementPage />} />
            <Route path="customers/:customerId" element={<AdminCustomerDetailPage />} />
            <Route path="warehouses" element={<WarehouseManagementPage />} />
            <Route path="inventory" element={<InventoryManagementPage />} />
            <Route path="vouchers" element={<VoucherManagementPage />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;