import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, User, AlertCircle, Eye, EyeOff, Loader2, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = {
    ENTER_IDENTIFIER: 1,
    VERIFY_CODE: 2,
    NEW_PASSWORD: 3,
    SUCCESS: 4,
};

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.ENTER_IDENTIFIER);
    const [identifier, setIdentifier] = useState('');
    const [maskedContact, setMaskedContact] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    const otpRefs = useRef([]);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!identifier.trim()) {
            setError('Please enter your email or phone number');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.forgotPasswordSendCode(identifier.trim());
            const data = res.data?.data;
            setMaskedContact(data?.maskedContact || '');
            setCountdown(data?.expiresIn || 600);
            setStep(STEPS.VERIFY_CODE);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter the 6-digit code');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.forgotPasswordVerifyCode(identifier.trim(), code);
            const data = res.data?.data;
            setResetToken(data?.resetToken || '');
            setStep(STEPS.NEW_PASSWORD);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Invalid or expired code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await authAPI.forgotPasswordReset(resetToken, newPassword);
            setStep(STEPS.SUCCESS);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.forgotPasswordSendCode(identifier.trim());
            const data = res.data?.data;
            setMaskedContact(data?.maskedContact || maskedContact);
            setCountdown(data?.expiresIn || 600);
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">PharmaGig</h1>
                        <p className="text-gray-600 mt-2">Store Manager Dashboard</p>
                    </div>

                    {/* Step 1: Enter Email/Phone */}
                    {step === STEPS.ENTER_IDENTIFIER && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Forgot Password</h2>
                            <p className="text-gray-500 text-center text-sm mb-6">
                                Enter your email or phone number to receive a verification code
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSendCode} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email or Phone</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="Email address or mobile number"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                    ) : (
                                        <>Send Verification Code <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>

                            <p className="mt-4 text-center text-sm text-gray-500">
                                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
                                    <ArrowLeft className="w-3 h-3" /> Back to Login
                                </Link>
                            </p>
                        </>
                    )}

                    {/* Step 2: Verify Code */}
                    {step === STEPS.VERIFY_CODE && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Verify Your Identity</h2>
                            <p className="text-gray-500 text-center text-sm mb-1">We've sent a 6-digit code to</p>
                            <p className="text-primary-600 text-center text-sm font-medium mb-6">{maskedContact}</p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter 6-digit code</label>
                                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => (otpRefs.current[i] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                className="w-11 h-11 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">
                                        Code expires in {formatTime(countdown)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleResendCode}
                                        disabled={countdown > 0 || loading}
                                        className={`font-medium ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700 cursor-pointer'}`}
                                    >
                                        Resend Code
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.join('').length !== 6}
                                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                    ) : (
                                        <>Verify & Continue <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 3: New Password */}
                    {step === STEPS.NEW_PASSWORD && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Create New Password</h2>
                            <p className="text-gray-500 text-center text-sm mb-6">
                                Your new password must be at least 6 characters
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showNewPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
                                    ) : (
                                        <>Reset Password <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 4: Success */}
                    {step === STEPS.SUCCESS && (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                You can now sign in with your new password.
                            </p>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                Sign In <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
