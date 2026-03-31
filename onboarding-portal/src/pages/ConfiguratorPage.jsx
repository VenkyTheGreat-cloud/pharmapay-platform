import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pharmacyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StepIndicator from '../components/StepIndicator';
import { Package, Zap, Crown, Check, Settings, Save, ArrowRight, Loader2 } from 'lucide-react';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: '999',
        icon: Package,
        limits: { deliveryBoys: 10, outlets: 1 },
        description: 'Basic features for small pharmacies',
        features: ['10 delivery boys', '1 outlet', 'Basic features'],
    },
    {
        id: 'growth',
        name: 'Growth',
        price: '2,499',
        icon: Zap,
        limits: { deliveryBoys: 50, outlets: 5 },
        description: 'Reports & analytics for growing pharmacies',
        features: ['50 delivery boys', '5 outlets', 'Reports + analytics'],
        popular: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '5,999',
        icon: Crown,
        limits: { deliveryBoys: -1, outlets: -1 },
        description: 'Unlimited scale with premium features',
        features: ['Unlimited delivery boys', 'Unlimited outlets', 'Own branded listing', 'UPI included'],
    },
];

const FEATURES = [
    { key: 'gps_tracking', label: 'GPS Tracking', description: 'Real-time delivery tracking' },
    { key: 'photo_proof', label: 'Photo Proof of Delivery', description: 'Require photo on delivery' },
    { key: 'return_items', label: 'Return Items', description: 'Manage return item workflows' },
    { key: 'payment_cash', label: 'Cash Payments', description: 'Accept cash on delivery' },
    { key: 'payment_bank', label: 'Bank Transfer', description: 'Accept bank transfer payments' },
    { key: 'payment_split', label: 'Split Payments', description: 'Allow split payment methods' },
    { key: 'payment_credit', label: 'Credit Payments', description: 'Extend credit to customers' },
    { key: 'payment_upi', label: 'UPI Payments', description: 'Accept UPI payments' },
    { key: 'excel_export', label: 'Excel Export', description: 'Export reports to Excel' },
    { key: 'push_notifications', label: 'Push Notifications', description: 'Send delivery updates' },
    { key: 'multi_store', label: 'Multi-Store', description: 'Manage multiple store locations' },
];

export default function ConfiguratorPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [selectedPlan, setSelectedPlan] = useState('growth');
    const [features, setFeatures] = useState({
        gps_tracking: true,
        photo_proof: true,
        return_items: false,
        payment_cash: true,
        payment_bank: false,
        payment_split: false,
        payment_credit: false,
        payment_upi: false,
        excel_export: true,
        push_notifications: true,
        multi_store: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const response = await pharmacyAPI.getMyPharmacy();
            const data = response.data?.data;
            if (data?.config) {
                if (data.config.plan) setSelectedPlan(data.config.plan);
                if (data.config.features) {
                    setFeatures((prev) => ({ ...prev, ...data.config.features }));
                }
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                setError('Failed to load configuration.');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleFeature = (key) => {
        setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const getCurrentLimits = () => {
        const plan = PLANS.find((p) => p.id === selectedPlan);
        return plan?.limits || { deliveryBoys: 0, outlets: 0 };
    };

    const handleSaveAndContinue = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const limits = getCurrentLimits();
            await pharmacyAPI.updateConfig({
                plan: selectedPlan,
                features,
                limits,
            });
            setSuccess('Configuration saved!');
            setTimeout(() => navigate('/branding'), 500);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to save configuration.');
        } finally {
            setSaving(false);
        }
    };

    const limits = getCurrentLimits();

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
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">PharmaPay Builder</h1>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <StepIndicator currentStep={2} />

                <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-6 h-6 text-primary-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Configure Your Pharmacy</h2>
                </div>
                <p className="text-gray-500 mb-8">Choose a plan and select the features you need.</p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {success}
                    </div>
                )}

                {/* Plan Cards */}
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Plan</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                                    isSelected
                                        ? 'border-primary-500 bg-primary-50 shadow-md'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        Most Popular
                                    </span>
                                )}
                                <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-primary-500' : 'text-gray-400'}`} />
                                <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                                <div className="mt-1 mb-2">
                                    <span className="text-sm text-gray-500">Rs </span>
                                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-500 text-sm">/mo</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                                <ul className="space-y-1">
                                    {plan.features.map((feat, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                            <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                {isSelected && (
                                    <div className="absolute top-4 right-4">
                                        <Check className="w-5 h-5 text-primary-500" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Plan Limits (read-only) */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Limits</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">Max Delivery Boys</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {limits.deliveryBoys === -1 ? 'Unlimited' : limits.deliveryBoys}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">Max Outlets</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {limits.outlets === -1 ? 'Unlimited' : limits.outlets}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feature Toggles */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Toggles</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {FEATURES.map((feature) => (
                            <label
                                key={feature.key}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    features[feature.key]
                                        ? 'border-primary-200 bg-primary-50'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={features[feature.key] || false}
                                        onChange={() => toggleFeature(feature.key)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-300 peer-checked:bg-primary-500 rounded-full transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{feature.label}</p>
                                    <p className="text-xs text-gray-500">{feature.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end">
                    <button
                        onClick={handleSaveAndContinue}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save & Continue
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
