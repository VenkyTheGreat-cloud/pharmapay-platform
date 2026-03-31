import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pharmacyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StepIndicator from '../components/StepIndicator';
import {
    Clock, CheckCircle, XCircle, Loader2, Rocket,
    Copy, ExternalLink, ArrowLeft, Check,
} from 'lucide-react';

export default function BuildStatusPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [pharmacy, setPharmacy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedField, setCopiedField] = useState(null);
    const pollRef = useRef(null);

    useEffect(() => {
        loadStatus();
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const loadStatus = async () => {
        try {
            const response = await pharmacyAPI.getMyPharmacy();
            const data = response.data?.data;
            setPharmacy(data);

            // Start polling if building
            if (data?.status === 'building') {
                startPolling();
            }
        } catch (err) {
            setError('Failed to load status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startPolling = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const response = await pharmacyAPI.getBuildStatus();
                const data = response.data?.data;
                setPharmacy((prev) => ({ ...prev, ...data }));
                if (data?.status !== 'building') {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
            } catch {
                // Silently fail polling
            }
        }, 10000);
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    const status = pharmacy?.status || 'pending_approval';
    const slug = pharmacy?.slug || '';
    const clientCode = slug ? `${slug.toUpperCase()}-01` : '';
    const storeUrl = `https://${slug}.pharmapay.swinkpay-fintech.com`;
    const adminUrl = `https://${slug}.pharmapay.swinkpay-fintech.com/admin`;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">PharmaPay Builder</h1>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <StepIndicator currentStep={4} />

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Pending / Submitted */}
                {(status === 'pending_approval' || status === 'submitted') && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
                            <Clock className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Our team is reviewing your pharmacy configuration. We'll notify you once it's approved.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
                            <Clock className="w-4 h-4" />
                            Typically takes 1-2 business days
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/configure')}
                                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Edit Configuration
                            </button>
                            <button
                                onClick={() => navigate('/branding')}
                                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Edit Branding
                            </button>
                        </div>
                    </div>
                )}

                {/* Approved */}
                {status === 'approved' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Approved!</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Your pharmacy has been approved. Build will start soon.
                        </p>
                        <div className="mt-8 inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            Build will begin shortly
                        </div>
                    </div>
                )}

                {/* Rejected */}
                {status === 'rejected' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Changes Requested</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-4">
                            Your submission needs some changes before it can be approved.
                        </p>
                        {pharmacy?.rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
                                <p className="text-sm font-medium text-red-800 mb-1">Reason:</p>
                                <p className="text-sm text-red-700">{pharmacy.rejection_reason}</p>
                            </div>
                        )}
                        <button
                            onClick={() => navigate('/configure')}
                            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Configuration
                        </button>
                    </div>
                )}

                {/* Building */}
                {status === 'building' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Building Your App...</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            We're setting up your pharmacy platform. This may take a few minutes.
                        </p>
                        <div className="mt-8">
                            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div className="bg-primary-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Auto-refreshing every 10 seconds</p>
                        </div>
                    </div>
                )}

                {/* Live */}
                {status === 'live' && (
                    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border border-green-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                            <Rocket className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Pharmacy is Live!</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Congratulations! Your pharmacy platform is up and running.
                        </p>

                        <div className="max-w-md mx-auto space-y-4 text-left">
                            {/* Store URL */}
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Store URL</p>
                                <div className="flex items-center justify-between">
                                    <a
                                        href={storeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium truncate mr-2 flex items-center gap-1"
                                    >
                                        {storeUrl}
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                    <button
                                        onClick={() => copyToClipboard(storeUrl, 'store')}
                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                    >
                                        {copiedField === 'store' ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Admin URL */}
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Admin Dashboard</p>
                                <div className="flex items-center justify-between">
                                    <a
                                        href={adminUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium truncate mr-2 flex items-center gap-1"
                                    >
                                        {adminUrl}
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                    <button
                                        onClick={() => copyToClipboard(adminUrl, 'admin')}
                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                    >
                                        {copiedField === 'admin' ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Client Code */}
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Client Code</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-mono font-semibold text-gray-900">{clientCode}</span>
                                    <button
                                        onClick={() => copyToClipboard(clientCode, 'code')}
                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                    >
                                        {copiedField === 'code' ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
