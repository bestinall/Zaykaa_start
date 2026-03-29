import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChefBookingPage from './pages/ChefBookingPage';
import OrderPage from './pages/OrderPage';
import ChefDashboard from './pages/ChefDashboard';
import RecipeBook from './pages/RecipeBook';
import Card from './components/ui/Card';
import Skeleton from './components/ui/Skeleton';

const ProtectedRoute = ({ children, requiredRole, requiredRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <Card hover={false} className="w-full max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Loading</p>
          <h1 className="mt-4 text-3xl text-slate-950 dark:text-white">Preparing your Zaykaa workspace</h1>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-11 w-40 rounded-2xl" />
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : null);

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recipes"
          element={
            <ProtectedRoute>
              <RecipeBook />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chef-dashboard"
          element={
            <ProtectedRoute requiredRole="chef">
              <ChefDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/book-chef"
          element={
            <ProtectedRoute>
              <ChefBookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order"
          element={
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <AnimatedRoutes />
            </Router>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
