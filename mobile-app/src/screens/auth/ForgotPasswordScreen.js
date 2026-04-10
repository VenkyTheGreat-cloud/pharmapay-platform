import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import { apiAxios } from '../../services/api';

const ACCENT = '#10B981';

const STEPS = { ENTER_IDENTIFIER: 1, VERIFY_CODE: 2, NEW_PASSWORD: 3, SUCCESS: 4 };

const ForgotPasswordScreen = ({ navigation }) => {
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

  // Step 1: Send verification code
  const handleSendCode = async () => {
    if (!identifier.trim()) { setError('Please enter your email or phone number.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await apiAxios.post('/auth/forgot-password/send-code', { identifier: identifier.trim() });
      const data = res.data?.data;
      setMaskedContact(data?.maskedContact || '');
      setCountdown(data?.expiresIn || 600);
      // Auto-fill OTP for testing (backend returns it since no SMS/email service)
      if (data?.otp) {
        setOtp(data.otp.split(''));
      }
      setStep(STEPS.VERIFY_CODE);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyCode = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await apiAxios.post('/auth/forgot-password/verify-code', { identifier: identifier.trim(), otp: code });
      const data = res.data?.data;
      setResetToken(data?.resetToken || '');
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await apiAxios.post('/auth/forgot-password/reset', { resetToken, newPassword });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiAxios.post('/auth/forgot-password/send-code', { identifier: identifier.trim() });
      const data = res.data?.data;
      setMaskedContact(data?.maskedContact || maskedContact);
      setCountdown(data?.expiresIn || 600);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={16} color="#64748B" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Ionicons name="storefront" size={22} color="#fff" />
          </View>
          <Text style={styles.brand}>Pharma<Text style={{ color: ACCENT }}>Gig</Text></Text>
        </View>

        {/* Step 1: Enter Email/Phone */}
        {step === STEPS.ENTER_IDENTIFIER && (
          <View>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email or phone number to receive a verification code
            </Text>

            {error ? <Alert type="error" message={error} /> : null}

            <View style={styles.form}>
              <Input
                label="Email or Phone"
                value={identifier}
                onChangeText={(text) => { setIdentifier(text); setError(''); }}
                placeholder="owner@pharmacy.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <Text style={styles.primaryBtnText}>Sending...</Text>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Verify Code */}
        {step === STEPS.VERIFY_CODE && (
          <View>
            <Text style={styles.title}>Verify your identity</Text>
            <Text style={styles.subtitle}>We've sent a 6-digit code to</Text>
            <Text style={styles.maskedContact}>{maskedContact}</Text>

            {error ? <Alert type="error" message={error} /> : null}

            <Text style={styles.otpLabel}>Enter 6-digit code</Text>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(i, v)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <View style={styles.timerRow}>
              <Text style={styles.timerText}>Code expires in {formatTime(countdown)}</Text>
              <TouchableOpacity onPress={handleResendCode} disabled={countdown > 0 || loading}>
                <Text style={[styles.resendText, countdown > 0 && { color: '#9CA3AF' }]}>Resend Code</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, (loading || otp.join('').length !== 6) && { opacity: 0.6 }]}
              onPress={handleVerifyCode}
              disabled={loading || otp.join('').length !== 6}
              activeOpacity={0.8}
            >
              {loading ? (
                <Text style={styles.primaryBtnText}>Verifying...</Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: New Password */}
        {step === STEPS.NEW_PASSWORD && (
          <View>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from previous passwords
            </Text>

            {error ? <Alert type="error" message={error} /> : null}

            <View style={styles.form}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 40, paddingRight: 44 }]}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setError(''); }}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 40, paddingRight: 44 }]}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <Text style={styles.primaryBtnText}>Resetting...</Text>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.primaryBtnText}>Reset Password</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 4: Success */}
        {step === STEPS.SUCCESS && (
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark-circle" size={48} color={ACCENT} />
            </View>
            <Text style={styles.successTitle}>Password Reset Successful!</Text>
            <Text style={styles.successDesc}>
              Your password has been successfully reset. You can now sign in with your new password.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.primaryBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={{ marginTop: 16 }}>
              <Text style={{ color: '#64748B', fontSize: 14, textAlign: 'center' }}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security badge (only on step 1) */}
        {step === STEPS.ENTER_IDENTIFIER && (
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={14} color={ACCENT} />
            <Text style={styles.trustText}>Secure password recovery</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center', maxWidth: 640, width: '100%', alignSelf: 'center' },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  header: { alignItems: 'center', marginBottom: 28 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brand: { fontSize: 22, fontWeight: '700', color: '#0F172A' },

  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 8, textAlign: 'center' },
  maskedContact: { fontSize: 15, color: ACCENT, fontWeight: '600', textAlign: 'center', marginBottom: 24 },

  form: { width: '100%' },

  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A',
  },
  eyeBtn: { position: 'absolute', right: 12, top: 12, zIndex: 1 },

  otpLabel: { fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'center', marginBottom: 12 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  otpInput: {
    width: 48, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1',
    backgroundColor: '#fff', fontSize: 20, fontWeight: '700', color: '#0F172A',
    textAlign: 'center',
  },

  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timerText: { fontSize: 13, color: '#64748B' },
  resendText: { fontSize: 13, fontWeight: '600', color: ACCENT },

  primaryBtn: {
    backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  successContainer: { alignItems: 'center' },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  successDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 16 },

  trustBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 32, backgroundColor: '#D1FAE5', alignSelf: 'center',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  trustText: { fontSize: 12, color: '#059669', fontWeight: '600' },
});

export default ForgotPasswordScreen;
