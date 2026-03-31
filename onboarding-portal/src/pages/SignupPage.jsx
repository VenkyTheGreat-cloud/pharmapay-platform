import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pharmacyAPI } from '../services/api';
import { Store, Mail, Phone, Lock, Link as LinkIcon, Check, X, Loader2 } from 'lucide-react';

const SLUG_REGEX = /^[a-z][a-z0-9-]{1,58}[a-z0-9]$/;

export default function SignupPage() {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [form, setForm] = useState({
        ownerName: '',
        email: '',
        mobile: '',
        password: '',
        pharmacyName: '',
        slug: '',
    });
    const [slugStatus, setSlugStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
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

    // Debounced slug check
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">PharmaPay</h1>
                    <p className="text-gray-500 mt-1">Builder Portal - Create your pharmacy app</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Your Account</h2>

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={form.ownerName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Your full name"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Email & Mobile */}
                        <div className="grid grid-cols-2 gap-4">
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
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={form.mobile}
                                        onChange={handleChange}
                                        required
                                        placeholder="9876543210"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    placeholder="Min 6 characters"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <hr className="my-2 border-gray-200" />

                        {/* Pharmacy Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name</label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="pharmacyName"
                                    value={form.pharmacyName}
                                    onChange={handleChange}
                                    required
                                    placeholder="My Pharmacy"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="slug"
                                    value={form.slug}
                                    onChange={handleSlugChange}
                                    required
                                    placeholder="my-pharmacy"
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
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
                                Your store URL: <span className="font-mono font-medium">{form.slug || 'slug'}.pharmapay.swinkpay-fintech.com</span>
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

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || slugStatus === 'checking' || slugStatus === 'taken' || slugStatus === 'invalid'}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
