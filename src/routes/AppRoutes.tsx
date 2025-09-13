import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import HomePage from '../pages/customer/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/admin/DashboardPage';
import ProductManagementPage from '../pages/admin/ProductManagementPage';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';


const AppRoutes: React.FC = () => {
    const { isLoading } = useAuth();
    if(isLoading) {
        return <div>Loading...</div>
    }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductManagementPage />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
