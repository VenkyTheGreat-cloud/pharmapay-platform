import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    UserCog,
    Truck,
    LogOut,
    Menu,
    X,
    UserCircle,
    Clock,
    Phone,
    FileSpreadsheet,
    PhoneOff
} from 'lucide-react';
import { useState } from 'react';
import ProfileModal from './ProfileModal';
import logo from '../assets/logo.jpg';


export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Pending Orders', href: '/pending-orders', icon: Clock },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Store Staff', href: '/store-staff', icon: UserCog },
        { name: 'Delivery Boys', href: '/delivery-boys', icon: Truck },
        { name: 'Day Calls', href: '/contacts', icon: Phone },
        { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
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
                            <img src={logo} alt="PharmaPay Logo" className="w-12 h-auto max-h-12 rounded-md object-contain" />
                            <h1 className="text-xl font-bold text-gray-900">PharmaPay</h1>
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
                                    ? 'bg-primary-50 text-primary-600 font-semibold'
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
                            <span className="text-sm text-gray-600 hidden md:block">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                            {/* Admin Name and Profile Icon */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-900">
                                    {user?.name || user?.full_name || 'Admin'}
                                </span>
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                    title="View Profile"
                                >
                                    <UserCircle className="w-8 h-8 text-gray-600 hover:text-primary-600" />
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
