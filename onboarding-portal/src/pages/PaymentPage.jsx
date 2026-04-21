import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pharmacyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StepIndicator from '../components/StepIndicator';
import {
    Package, CreditCard, ArrowLeft, ArrowRight, AlertTriangle,
    Loader2, ExternalLink,
} from 'lucide-react';

const PLANS = {
    starter: {
        name: 'Starter',
        monthly: 999,
        setupFee: 2000,
        deliveryBoys: 5,
        outlets: 1,
    },
    growth: {
        name: 'Growth',
        monthly: 2499,
        setupFee: 5000,
        deliveryBoys: 15,
        outlets: 3,
    },
    enterprise: {
        name: 'Enterprise',
        monthly: 5999,
        setupFee: 10000,
        deliveryBoys: 'Unlimited',
        outlets: 10,
    },
};

export default function PaymentPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [pharmacy, setPharmacy] = useState(null);
    const [appName, setAppName] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingName, setSavingName] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');
    const [nameSuccess, setNameSuccess] = useState('');

    useEffect(() => {
        loadPharmacy();
    }, []);

    const loadPharmacy = async () => {
        try {
            const response = await pharmacyAPI.getMyPharmacy();
            const data = response.data?.data;
            setPharmacy(data);
            if (data?.name) setAppName(data.name);
        } catch (err) {
            setError('Failed to load pharmacy data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAppName = async () => {
        if (!appName.trim()) {
            setError('App name is required.');
            return;
        }
        setSavingName(true);
        setError('');
        setNameSuccess('');
        try {
            await pharmacyAPI.updateAppName(appName.trim());
            setNameSuccess('App name saved successfully.');
            setTimeout(() => setNameSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to save app name.');
        } finally {
            setSavingName(false);
        }
    };

    const handlePayNow = async () => {
        setPaying(true);
        setError('');
        try {
            const response = await pharmacyAPI.initiatePayment();
            const paymentUrl = response.data?.data?.paymentUrl || response.data?.paymentUrl;
            if (paymentUrl) {
                window.location.href = paymentUrl;
            } else {
                setError('Payment URL not received. Please try again.');
                setPaying(false);
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to initiate payment.');
            setPaying(false);
        }
    };

    const planKey = pharmacy?.plan || 'starter';
    const plan = PLANS[planKey] || PLANS.starter;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

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

                <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-6 h-6 text-primary-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
                </div>
                <p className="text-gray-500 mb-8">Set your app name and complete payment to launch your pharmacy.</p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {nameSuccess && (
                    <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {nameSuccess}
                    </div>
                )}

                {/* Section 1: App Name */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">App Name</h3>
                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="Enter your app name"
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                        <button
                            onClick={handleSaveAppName}
                            disabled={savingName}
                            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            {savingName ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            Save
                        </button>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            Selecting the app name is entirely the pharmacy owner's responsibility. Please verify the name is available on Google Play Store before proceeding. SwinkPay Fintech Pvt Ltd bears no responsibility for app name conflicts or trademark issues.
                        </p>
                    </div>
                </div>

                {/* Section 2: Order Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-600">Plan</span>
                            <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-600">Monthly Fee</span>
                            <span className="text-sm font-medium text-gray-900">Rs {plan.monthly.toLocaleString('en-IN')}/mo</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-600">Setup Fee (one-time)</span>
                            <span className="text-sm font-medium text-gray-900">Rs {plan.setupFee.toLocaleString('en-IN')}</span>
                        </div>

                        <hr className="border-gray-200" />

                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-600">Delivery Boys Limit</span>
                            <span className="text-sm text-gray-900">{plan.deliveryBoys}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-600">Outlets Limit</span>
                            <span className="text-sm text-gray-900">{plan.outlets}</span>
                        </div>

                        <hr className="border-gray-200" />

                        <div className="flex items-center justify-between py-3 bg-primary-50 rounded-lg px-4 -mx-1">
                            <span className="text-sm font-semibold text-primary-800">Total to Pay Now</span>
                            <span className="text-lg font-bold text-primary-700">Rs {plan.setupFee.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Section 3: Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/branding')}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button
                        onClick={handlePayNow}
                        disabled={paying}
                        className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {paying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-4 h-4" />
                                Pay Now
                                <ExternalLink className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
