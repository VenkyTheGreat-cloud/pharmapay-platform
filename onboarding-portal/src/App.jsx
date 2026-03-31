import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import BrandingPage from './pages/BrandingPage';
import BuildStatusPage from './pages/BuildStatusPage';

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
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route
                path="/signup"
                element={isAuthenticated ? <Navigate to="/configure" replace /> : <SignupPage />}
            />
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/configure" replace /> : <LoginPage />}
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
                path="/build-status"
                element={
                    <ProtectedRoute>
                        <BuildStatusPage />
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
