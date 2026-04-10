import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthNavBar from '../components/AuthNavBar';
import { Pill, Phone, Lock, Loader2, Eye, EyeOff, Store, Bike, ArrowRight } from 'lucide-react';

const ROLES = {
    owner: { label: 'Pharmacy Owner', icon: Pill, color: 'emerald' },
    partner: { label: 'Delivery Partner', icon: Bike, color: 'blue' },
};

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [role, setRole] = useState('owner');
    const [mobileEmail, setMobileEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const activeColor = role === 'owner' ? 'emerald' : 'blue';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(mobileEmail, password);

        if (result.success) {
            navigate(result.isPlatformAdmin ? '/admin-panel' : '/configure');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const buttonClasses = role === 'owner'
        ? 'bg-emerald-500 hover:bg-emerald-600'
        : 'bg-blue-500 hover:bg-blue-600';

    const focusClasses = role === 'owner'
        ? 'focus:ring-emerald-500 focus:border-emerald-500'
        : 'focus:ring-blue-500 focus:border-blue-500';

    return (
        <div className="min-h-screen bg-[#f0f5f4] flex flex-col">
            <AuthNavBar />

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-3">
                            <Store className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                            Pharma<span className="text-emerald-500">Gig</span>
                        </p>
                        <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Welcome back</h1>
                        <p className="text-gray-500 mt-1 text-sm">Enter your details to access your dashboard.</p>
                    </div>

                    {/* Role Toggle */}
                    <div className="flex bg-white rounded-xl border border-gray-200 p-1 mb-6">
                        {Object.entries(ROLES).map(([key, r]) => {
                            const Icon = r.icon;
                            const isActive = role === key;
                            const activeBg = key === 'owner' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-blue-50 border-blue-500 text-blue-700';
                            return (
                                <button
                                    key={key}
                                    onClick={() => { setRole(key); setError(''); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${isActive ? `${activeBg} border` : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {r.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {role === 'partner' ? 'Phone Number' : 'Email or Phone'}
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={mobileEmail}
                                        onChange={(e) => { setMobileEmail(e.target.value); setError(''); }}
                                        required
                                        placeholder={role === 'partner' ? '+91 98765 43210' : 'owner@pharmacy.com'}
                                        className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg ${focusClasses} focus:ring-2 outline-none transition-colors`}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <Link
                                        to="/forgot-password"
                                        className={`text-xs font-semibold ${role === 'owner' ? 'text-emerald-600 hover:text-emerald-700' : 'text-blue-600 hover:text-blue-700'}`}
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        required
                                        placeholder="Enter your password"
                                        className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg ${focusClasses} focus:ring-2 outline-none transition-colors`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full ${buttonClasses} text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                                ) : (
                                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-semibold underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
