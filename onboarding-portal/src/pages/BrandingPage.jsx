import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pharmacyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StepIndicator from '../components/StepIndicator';
import { Palette, Upload, Image, Eye, Send, ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';

const PRESET_COLORS = [
    { name: 'Teal', value: '#20b1aa' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
];

export default function BrandingPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const fileInputRef = useRef(null);

    const [pharmacyName, setPharmacyName] = useState('Your Pharmacy');
    const [primaryColor, setPrimaryColor] = useState('#20b1aa');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [existingLogo, setExistingLogo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadBranding();
    }, []);

    const loadBranding = async () => {
        try {
            const response = await pharmacyAPI.getMyPharmacy();
            const data = response.data?.data;
            if (data) {
                if (data.pharmacyName) setPharmacyName(data.pharmacyName);
                if (data.branding?.primaryColor) setPrimaryColor(data.branding.primaryColor);
                if (data.branding?.logoUrl) setExistingLogo(data.branding.logoUrl);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                setError('Failed to load branding settings.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5MB.');
            return;
        }
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setLogoPreview(e.target.result);
        reader.readAsDataURL(file);
        setError('');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadLogo = async () => {
        if (!logoFile) return true;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('logo', logoFile);
            await pharmacyAPI.uploadLogo(formData);
            return true;
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to upload logo.');
            return false;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitForReview = async () => {
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            // Upload logo if a new one was selected
            if (logoFile) {
                const uploaded = await uploadLogo();
                if (!uploaded) {
                    setSubmitting(false);
                    return;
                }
            }

            // Save branding
            await pharmacyAPI.updateBranding({ primaryColor });

            // Submit for approval
            await pharmacyAPI.submitForApproval();

            setSuccess('Submitted for review! Redirecting...');
            setTimeout(() => navigate('/build-status'), 1500);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to submit. Please try again.');
            setSubmitting(false);
        }
    };

    const currentLogo = logoPreview || existingLogo;

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
                <StepIndicator currentStep={3} />

                <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-6 h-6 text-primary-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Brand Your Pharmacy</h2>
                </div>
                <p className="text-gray-500 mb-8">Customize the look and feel of your pharmacy app.</p>

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

                {/* Color Picker */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Color</h3>

                    <div className="flex items-center gap-4 mb-4">
                        <div
                            className="w-16 h-16 rounded-full border-2 border-gray-200 shadow-inner flex-shrink-0"
                            style={{ backgroundColor: primaryColor }}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hex Color</label>
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                                        setPrimaryColor(val);
                                    }
                                }}
                                maxLength={7}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 mb-2">Presets</p>
                        <div className="flex gap-3">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setPrimaryColor(color.value)}
                                    title={color.name}
                                    className={`w-10 h-10 rounded-lg border-2 transition-transform hover:scale-110 ${
                                        primaryColor.toLowerCase() === color.value.toLowerCase()
                                            ? 'border-gray-900 scale-110'
                                            : 'border-gray-200'
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Image className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Logo</h3>
                    </div>

                    {(logoPreview || existingLogo) && !logoFile && existingLogo ? (
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Current Logo</p>
                            <img
                                src={existingLogo}
                                alt="Current logo"
                                className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-gray-50 p-2"
                            />
                        </div>
                    ) : null}

                    {logoPreview ? (
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">New Logo Preview</p>
                            <div className="relative inline-block">
                                <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-gray-50 p-2"
                                />
                                <button
                                    onClick={removeLogo}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                            isDragging
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center gap-2">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                            ) : (
                                <Upload className="w-8 h-8 text-gray-400" />
                            )}
                            <p className="text-sm text-gray-600">
                                <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG, SVG up to 5MB</p>
                        </div>
                    </div>
                </div>

                {/* Preview Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Brand Preview</h3>
                    </div>
                    <div
                        className="rounded-xl p-6 text-white"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <div className="flex items-center gap-4">
                            {currentLogo ? (
                                <img
                                    src={currentLogo}
                                    alt="Logo preview"
                                    className="w-14 h-14 object-contain rounded-lg bg-white p-1"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Image className="w-7 h-7 text-white/70" />
                                </div>
                            )}
                            <div>
                                <h4 className="text-xl font-bold">{pharmacyName}</h4>
                                <p className="text-sm text-white/80">Your trusted pharmacy partner</p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <div className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium">Order Now</div>
                            <div className="bg-white text-gray-800 rounded-lg px-3 py-1.5 text-xs font-medium">View Menu</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/configure')}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button
                        onClick={handleSubmitForReview}
                        disabled={submitting || uploading}
                        className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Submit for Review
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
