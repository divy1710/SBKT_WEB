import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import Purchases from '../pages/purchases/Purchases';
import Suppliers from '../pages/suppliers/Suppliers';
import Inventory from '../pages/inventory/Inventory';
import Employees from '../pages/employees/Employees';
import Attendance from '../pages/attendance/Attendance';
import Salary from '../pages/salary/Salary';
import Advances from '../pages/advances/Advances';
import Reports from '../pages/reports/Reports';
import Users from '../pages/auth/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

const AppRouter = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: '10px',
                fontSize: '14px',
                padding: '12px 16px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#f8fafc' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/purchases" element={
                <ProtectedRoute roles={['ADMIN', 'PURCHASE_MANAGER', 'ACCOUNTANT']}>
                  <Purchases />
                </ProtectedRoute>
              } />
              <Route path="/suppliers" element={
                <ProtectedRoute roles={['ADMIN', 'PURCHASE_MANAGER']}>
                  <Suppliers />
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute roles={['ADMIN', 'PURCHASE_MANAGER', 'STORE_MANAGER']}>
                  <Inventory />
                </ProtectedRoute>
              } />
              <Route path="/employees" element={
                <ProtectedRoute roles={['ADMIN', 'HR_MANAGER']}>
                  <Employees />
                </ProtectedRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedRoute roles={['ADMIN', 'HR_MANAGER']}>
                  <Attendance />
                </ProtectedRoute>
              } />
              <Route path="/salary" element={
                <ProtectedRoute roles={['ADMIN', 'HR_MANAGER', 'ACCOUNTANT']}>
                  <Salary />
                </ProtectedRoute>
              } />
              <Route path="/advances" element={
                <ProtectedRoute roles={['ADMIN', 'HR_MANAGER', 'ACCOUNTANT']}>
                  <Advances />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute roles={['ADMIN', 'ACCOUNTANT', 'HR_MANAGER', 'PURCHASE_MANAGER', 'STORE_MANAGER']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute roles={['ADMIN']}>
                  <Users />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppRouter;
