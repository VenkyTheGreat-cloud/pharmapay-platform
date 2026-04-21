import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pharmacyAPI } from '../services/api';
import AuthNavBar from '../components/AuthNavBar';
import { Store, Mail, Phone, Lock, Link as LinkIcon, Check, X, Loader2, Pill, Bike, Eye, EyeOff, User } from 'lucide-react';

const SLUG_REGEX = /^[a-z][a-z0-9-]{1,58}[a-z0-9]$/;

export default function SignupPage() {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [role, setRole] = useState('owner');
    const [form, setForm] = useState({
        ownerName: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        pharmacyName: '',
        slug: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [slugStatus, setSlugStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 60);
    };

    const checkSlugAvailability = useCallback(async (slug) => {
        if (!slug || slug.length < 3) {
            setSlugStatus(null);
            return;
        }
        if (!SLUG_REGEX.test(slug)) {
            setSlugStatus('invalid');
            return;
        }
        setSlugStatus('checking');
        try {
            const response = await pharmacyAPI.checkSlug(slug);
            setSlugStatus(response.data?.data?.available ? 'available' : 'taken');
        } catch {
            setSlugStatus('taken');
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.slug) {
                checkSlugAvailability(form.slug);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [form.slug, checkSlugAvailability]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'pharmacyName') {
                updated.slug = generateSlug(value);
            }
            return updated;
        });
        setError('');
        setSuccess('');
    };

    const handleSlugChange = (e) => {
        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setForm((prev) => ({ ...prev, slug }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!SLUG_REGEX.test(form.slug)) {
            setError('Slug must start with a letter, end with a letter or number, be 3-60 characters, and contain only lowercase letters, numbers, and hyphens.');
            return;
        }
        if (slugStatus === 'taken') {
            setError('This slug is already taken. Please choose a different one.');
            return;
        }
        if (slugStatus === 'checking') {
            setError('Please wait for slug availability check to complete.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const result = await signup({
            ownerName: form.ownerName,
            email: form.email,
            mobile: form.mobile,
            password: form.password,
            pharmacyName: form.pharmacyName,
            slug: form.slug,
        });

        if (result.success) {
            setSuccess('Account created successfully! Redirecting...');
            setTimeout(() => navigate('/configure'), 1000);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#f0f5f4] flex flex-col">
            <AuthNavBar />

            <div className="flex-1 flex items-center justify-center p-4 py-8">
                <div className="w-full max-w-lg">
                    {/* Logo */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-3">
                            <Pill className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                            Pharma<span className="text-emerald-500">Gig</span>
                        </p>
                        <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Create your account</h1>
                        <p className="text-gray-500 mt-1 text-sm">Start managing your pharmacy deliveries today.</p>
                    </div>

                    {/* Role Toggle */}
                    <div className="flex bg-white rounded-xl border border-gray-200 p-1 mb-6">
                        {[
                            { key: 'owner', label: 'Pharmacy Owner', icon: Pill },
                            { key: 'partner', label: 'Delivery Partner', icon: Bike },
                        ].map(({ key, label, icon: Icon }) => {
                            const isActive = role === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => { setRole(key); setError(''); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${isActive ? 'bg-emerald-50 border border-emerald-500 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
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

                        {success && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Owner Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Owner Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={form.ownerName}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Dr. Rajesh Kumar"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Pharmacy Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name</label>
                                <div className="relative">
                                    <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="pharmacyName"
                                        value={form.pharmacyName}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Apollo Pharmacy"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="owner@pharmacy.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={form.mobile}
                                        onChange={handleChange}
                                        required
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Store URL Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Store URL Slug <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="slug"
                                        value={form.slug}
                                        onChange={handleSlugChange}
                                        required
                                        placeholder="e.g. apollo-pharmacy"
                                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {slugStatus === 'checking' && (
                                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                        )}
                                        {slugStatus === 'available' && (
                                            <Check className="w-4 h-4 text-green-500" />
                                        )}
                                        {(slugStatus === 'taken' || slugStatus === 'invalid') && (
                                            <X className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Your store will be accessible at: <span className="font-mono font-medium">pharmagig.in/{form.slug || 'your-store'}</span>
                                </p>
                                {slugStatus === 'available' && (
                                    <p className="mt-1 text-xs text-green-600 font-medium">Slug is available!</p>
                                )}
                                {slugStatus === 'taken' && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">Slug is already taken. Try a different one.</p>
                                )}
                                {slugStatus === 'invalid' && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">Slug must start with a letter, be 3-60 chars, and use only lowercase letters, numbers, and hyphens.</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        placeholder="Create a strong password"
                                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
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

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        placeholder="Re-enter your password"
                                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {form.confirmPassword && form.password === form.confirmPassword && (
                                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Passwords match
                                    </p>
                                )}
                                {form.confirmPassword && form.password !== form.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || slugStatus === 'checking' || slugStatus === 'taken' || slugStatus === 'invalid'}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
