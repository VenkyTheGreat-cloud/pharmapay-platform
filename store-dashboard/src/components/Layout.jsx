import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Truck,
    Package,
    LogOut,
    Menu,
    X,
    User,
    Store,
    Phone,
    Clock,
    FileDown,
    PhoneOff
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import defaultLogo from '../assets/logo.jpg';

// Generate color shades from a hex color
function hexToHSL(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function generateShades(hex) {
    const [h, s] = hexToHSL(hex);
    return {
        50: `hsl(${h}, ${s}%, 95%)`,
        100: `hsl(${h}, ${s}%, 88%)`,
        200: `hsl(${h}, ${s}%, 78%)`,
        300: `hsl(${h}, ${s}%, 68%)`,
        400: `hsl(${h}, ${s}%, 55%)`,
        500: hex,
        600: `hsl(${h}, ${s}%, 42%)`,
        700: `hsl(${h}, ${s}%, 35%)`,
        800: `hsl(${h}, ${s}%, 28%)`,
        900: `hsl(${h}, ${s}%, 20%)`,
    };
}

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Apply dynamic theme color from branding
    useEffect(() => {
        const primaryColor = user?.branding?.primary_color;
        if (primaryColor && /^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
            const shades = generateShades(primaryColor);
            const root = document.documentElement;
            Object.entries(shades).forEach(([shade, value]) => {
                root.style.setProperty(`--primary-${shade}`, value);
            });
        }
    }, [user?.branding?.primary_color]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Delivery Boys', href: '/delivery-boys', icon: Truck },
        { name: 'Orders', href: '/orders', icon: Package },
        { name: 'Pending Orders', href: '/pending-orders', icon: Clock },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Day Calls', href: '/contacts', icon: Phone },
        { name: 'Reports', href: '/reports', icon: FileDown },
        { name: 'Dismissed Log', href: '/dismissed-captures', icon: PhoneOff },
    ];

    const isActive = (href) => location.pathname === href;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-30 w-64 h-screen bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <img src={user?.branding?.logo_url || defaultLogo} alt="Logo" className="w-12 h-auto max-h-12 rounded-md object-contain" />
                            <h1 className="text-xl font-bold text-gray-900">{user?.branding?.pharmacy_name || user?.storeName || 'PharmaGig'}</h1>
                        </div>

                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Logout button */}
                    <div className="p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:ml-64">
                {/* Top bar */}
                <header className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-4 ml-auto">
                            <span className="text-sm text-gray-600">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                            {/* Store Name and Profile Icon */}
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.storeName || user?.store_store_name || 'Store'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    title="View Profile"
                                >
                                    <User className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main>{children}</main>
            </div>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />
        </div>
    );
}
