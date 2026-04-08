import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { isValidEmail } from '../../utils/helpers';

const ROLES = {
  owner: { label: 'Pharmacy Owner', icon: 'medical', color: '#10B981', colorLight: '#D1FAE5' },
  partner: { label: 'Delivery Partner', icon: 'bicycle', color: '#3B82F6', colorLight: '#DBEAFE' },
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
    if (!email.trim()) {
      newErrors.email = 'Email or phone is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async () => {
    if (role === 'owner') {
      navigation.navigate('PharmacySignup');
    } else {
      await AsyncStorage.setItem('pharma_user_role', 'delivery_boy');
      navigation.navigate('Register');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.header}>
          <View style={[styles.logoIcon, { backgroundColor: activeRole.color }]}>
            <Ionicons name="storefront" size={22} color="#fff" />
          </View>
          <Text style={styles.brand}>
            Pharma<Text style={{ color: '#10B981' }}>Gig</Text>
          </Text>
          <Text style={styles.heading}>Sign in to your account</Text>
        </View>

        {/* Role Toggle */}
        <View style={styles.roleToggle}>
          {Object.entries(ROLES).map(([key, r]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.roleTab,
                role === key && { backgroundColor: r.colorLight, borderWidth: 1, borderColor: r.color },
              ]}
              onPress={() => { setRole(key); setError(''); }}
            >
              <Ionicons name={r.icon} size={16} color={role === key ? r.color : '#6B7280'} />
              <Text style={[styles.roleTabText, role === key && { color: r.color, fontWeight: '700' }]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Alert type="error" message={error} /> : null}

        <View style={styles.form}>
          <Input
            label="Email or Phone"
            value={email}
            onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: '' }); }}
            placeholder={role === 'owner' ? 'owner@pharmacy.com' : '+91 98765 43210'}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.inputLabel}>Password</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={[styles.forgotText, { color: activeRole.color }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <Input
            value={password}
            onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: '' }); }}
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
            {loading ? (
              <Text style={styles.loginButtonText}>Signing in...</Text>
            ) : (
              <View style={styles.loginButtonInner}>
                <Text style={styles.loginButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRegister} style={styles.registerLink}>
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={[styles.registerTextBold, { color: activeRole.color }]}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trust badge */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#6B7280" />
          <Text style={styles.trustText}>Trusted by 5000+ users across India</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: '#20b1aa', fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 28 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brand: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  heading: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },

  roleToggle: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    padding: 4, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0',
  },
  roleTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  roleTabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },

  form: { width: '100%' },
  passwordLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  forgotText: { fontSize: 12, fontWeight: '600' },

  loginButton: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  loginButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { fontSize: 14, color: '#6B7280' },
  registerTextBold: { fontWeight: '700' },

  trustBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 32,
  },
  trustText: { fontSize: 12, color: '#94A3B8' },
});

export default LoginScreen;
