import React, { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';
import TopNavBar from '../../components/TopNavBar';

const LOGO = require('../../../assets/logo.png');

const ROLES = {
  owner: { label: 'Pharmacy Owner', icon: 'storefront-outline', color: '#10B981', colorLight: '#D1FAE5' },
  partner: { label: 'Delivery Partner', icon: 'bicycle-outline', color: '#3B82F6', colorLight: '#DBEAFE' },
};

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [role, setRole] = useState('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const activeRole = ROLES[role];

  const validateForm = () => {
    const newErrors = {};
    const trimmed = email.trim();
    if (!trimmed) {
      newErrors.email = role === 'partner' ? 'Phone number is required' : 'Email or phone is required';
    } else if (role === 'partner') {
      const digits = trimmed.replace(/[\s\-\+]/g, '');
      if (!/^\d{10,13}$/.test(digits)) newErrors.email = 'Enter a valid 10-digit phone number';
    } else {
      if (trimmed.includes('@')) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) newErrors.email = 'Enter a valid email address';
      } else {
        const digits = trimmed.replace(/[\s\-\+]/g, '');
        if (!/^\d{10,13}$/.test(digits)) newErrors.email = 'Enter a valid email or 10-digit phone number';
      }
    }
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) setError(result.message || 'Login failed.');
  };

  const handleRegister = async () => {
    if (role === 'owner') navigation.navigate('PharmacySignup');
    else {
      await AsyncStorage.setItem('pharma_user_role', 'delivery_boy');
      navigation.navigate('Register');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TopNavBar />

        <View style={styles.body}>
          {/* Logo */}
          <View style={styles.header}>
            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Enter your details to access your dashboard.</Text>
          </View>

          {/* Role Toggle */}
          <View style={styles.roleToggle}>
            {Object.entries(ROLES).map(([key, r]) => (
              <TouchableOpacity
                key={key}
                style={[styles.roleTab, role === key && { backgroundColor: r.colorLight, borderWidth: 1, borderColor: r.color }]}
                onPress={() => { setRole(key); setError(''); setErrors({}); }}
              >
                <Ionicons name={r.icon} size={15} color={role === key ? r.color : '#64748B'} />
                <Text style={[styles.roleTabText, role === key && { color: r.color, fontWeight: '700' }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? (
            <View style={[styles.messageBox, styles.errorBox]}>
              <Text style={styles.errorTextStyle}>{error}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Email/Phone Field */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {role === 'partner' ? 'Phone Number' : 'Email or Phone'}
                <Text style={{ color: '#EF4444' }}> *</Text>
              </Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name={role === 'partner' ? 'call-outline' : 'mail-outline'}
                  size={18}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { paddingLeft: 40 }]}
                  placeholder={role === 'partner' ? '+91 98765 43210' : 'owner@pharmacy.com'}
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); setError(''); }}
                  keyboardType={role === 'partner' ? 'phone-pad' : 'email-address'}
                  autoCapitalize="none"
                  maxLength={role === 'partner' ? 10 : undefined}
                />
              </View>
              {errors.email && <Text style={styles.errorHint}>{errors.email}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.field}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>
                  Password<Text style={{ color: '#EF4444' }}> *</Text>
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={[styles.forgotText, { color: activeRole.color }]}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 40, paddingRight: 44 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); setError(''); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorHint}>{errors.password}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: activeRole.color }, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleRegister} style={styles.registerLink}>
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={[styles.registerBold, { color: activeRole.color }]}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { flexGrow: 1 },
  body: { padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },

  header: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  logoImg: { width: 160, height: 60, marginBottom: 12 },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#64748B' },

  roleToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  roleTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  roleTabText: { fontSize: 13, fontWeight: '500', color: '#64748B' },

  messageBox: { padding: 12, borderRadius: 10, marginBottom: 16 },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  errorTextStyle: { color: '#DC2626', fontSize: 14 },

  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },

  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A', outlineStyle: 'none',
  },
  eyeBtn: { position: 'absolute', right: 12, top: 12, zIndex: 1 },
  errorHint: { color: '#EF4444', fontSize: 12, marginTop: 4 },

  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  forgotText: { fontSize: 12, fontWeight: '600' },

  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  registerLink: { alignItems: 'center', marginTop: 4 },
  registerText: { fontSize: 14, color: '#64748B' },
  registerBold: { fontWeight: '700' },
});

export default LoginScreen;
