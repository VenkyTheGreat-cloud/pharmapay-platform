import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import BrandingPage from './pages/BrandingPage';
import PaymentPage from './pages/PaymentPage';
import BuildStatusPage from './pages/BuildStatusPage';
import AdminPanelPage from './pages/AdminPanelPage';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function AppRoutes() {
    const { isAuthenticated, isPlatformAdmin } = useAuth();

    return (
        <Routes>
            <Route
                path="/signup"
                element={isAuthenticated ? <Navigate to={isPlatformAdmin ? '/admin-panel' : '/configure'} replace /> : <SignupPage />}
            />
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to={isPlatformAdmin ? '/admin-panel' : '/configure'} replace /> : <LoginPage />}
            />
            <Route
                path="/configure"
                element={
                    <ProtectedRoute>
                        <ConfiguratorPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branding"
                element={
                    <ProtectedRoute>
                        <BrandingPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payment"
                element={
                    <ProtectedRoute>
                        <PaymentPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/build-status"
                element={
                    <ProtectedRoute>
                        <BuildStatusPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-panel"
                element={
                    <ProtectedRoute>
                        <AdminPanelPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/signup" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
