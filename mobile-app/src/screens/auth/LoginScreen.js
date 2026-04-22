import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import TopNavBar from '../../components/TopNavBar';

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
      // For owner, validate email format if it contains @, or phone format otherwise
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
            <View style={styles.logoIcon}>
              <Ionicons name="storefront" size={22} color="#fff" />
            </View>
            <Text style={styles.brand}>Pharma<Text style={{ color: '#10B981' }}>Gig</Text></Text>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Enter your details to access your dashboard.</Text>
          </View>

          {/* Role Toggle */}
          <View style={styles.roleToggle}>
            {Object.entries(ROLES).map(([key, r]) => (
              <TouchableOpacity
                key={key}
                style={[styles.roleTab, role === key && { backgroundColor: r.colorLight, borderWidth: 1, borderColor: r.color }]}
                onPress={() => { setRole(key); setError(''); }}
              >
                <Ionicons name={r.icon} size={15} color={role === key ? r.color : '#64748B'} />
                <Text style={[styles.roleTabText, role === key && { color: r.color, fontWeight: '700' }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error ? <Alert type="error" message={error} /> : null}

            <Input
              label={role === 'partner' ? 'Phone Number *' : 'Email or Phone *'}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
              placeholder={role === 'partner' ? '+91 98765 43210' : 'owner@pharmacy.com'}
              keyboardType={role === 'partner' ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              error={errors.email}
            />

            <View style={styles.passwordLabelRow}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotText, { color: activeRole.color }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <Input
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: activeRole.color }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
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
  logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  brand: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#64748B' },

  roleToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  roleTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  roleTabText: { fontSize: 13, fontWeight: '500', color: '#64748B' },

  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },

  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  forgotText: { fontSize: 12, fontWeight: '600' },

  loginButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  loginButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  registerLink: { alignItems: 'center', marginTop: 4 },
  registerText: { fontSize: 14, color: '#64748B' },
  registerBold: { fontWeight: '700' },
});

export default LoginScreen;
