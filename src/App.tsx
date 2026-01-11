import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import OrderDetails from "./pages/OrderDetails";
import BusinessProfile from "./pages/BusinessProfile";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import NotFound from "./pages/NotFound";
import RegisterBusiness from "./pages/RegisterBusiness";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { Navigate, useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'admin' | 'business' }) => {
  const { user, profile, loading } = useFirebaseAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to={role === 'admin' ? "/admin/login" : "/login"} />;

  // If user is logged in, but has no business profile (onboarding required)
  // and they are NOT trying to access register-business, redirect them there.
  if (profile?.onboardingRequired && location.pathname !== '/register-business') {
    return <Navigate to="/register-business" />;
  }

  // If user HAS business profile but tries to go to register-business, send to dashboard
  if (!profile?.onboardingRequired && location.pathname === '/register-business') {
    return <Navigate to="/dashboard" />;
  }

  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'admin' ? "/admin/dashboard" : "/dashboard"} />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FirebaseAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/register-business" element={
              <ProtectedRoute role="business">
                <RegisterBusiness />
              </ProtectedRoute>
            } />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute role="business">
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/customers" element={
              <ProtectedRoute role="business">
                <Customers />
              </ProtectedRoute>
            } />

            <Route path="/customers/:id" element={
              <ProtectedRoute role="business">
                <CustomerDetails />
              </ProtectedRoute>
            } />

            <Route path="/orders/:orderId" element={
              <ProtectedRoute role="business">
                <OrderDetails />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute role="business">
                <BusinessProfile />
              </ProtectedRoute>
            } />

            <Route path="/products" element={
              <ProtectedRoute role="business">
                <Products />
              </ProtectedRoute>
            } />

            <Route path="/products/new" element={
              <ProtectedRoute role="business">
                <AddProduct />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </FirebaseAuthProvider>
  </QueryClientProvider>
);

export default App;
