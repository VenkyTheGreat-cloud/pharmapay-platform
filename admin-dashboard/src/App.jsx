import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PendingOrdersPage from './pages/PendingOrdersPage';
import DeliveryBoysPage from './pages/DeliveryBoysPage';
import StoreStaffPage from './pages/StoreStaffPage';
import CustomersPage from './pages/CustomersPage';
import ContactsPage from './pages/ContactsPage';
import ReportsPage from './pages/ReportsPage';
import PharmacyApprovalsPage from './pages/PharmacyApprovalsPage';

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Layout>{children}</Layout>;
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/pending-orders"
                element={
                    <ProtectedRoute>
                        <PendingOrdersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/delivery-boys"
                element={
                    <ProtectedRoute>
                        <DeliveryBoysPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/store-staff"
                element={
                    <ProtectedRoute>
                        <StoreStaffPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/customers"
                element={
                    <ProtectedRoute>
                        <CustomersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/contacts"
                element={
                    <ProtectedRoute>
                        <ContactsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/reports"
                element={
                    <ProtectedRoute>
                        <ReportsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/pharmacy-approvals"
                element={
                    <ProtectedRoute>
                        <PharmacyApprovalsPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter basename="/admin">
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
