import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import { isValidEmail } from '../../utils/helpers';
import { apiAxios } from '../../services/api';

const ACCENT = '#10B981';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    setError('');
    try {
      await apiAxios.post('/auth/reset-password', { email: email.trim().toLowerCase() });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to reset password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={16} color="#64748B" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Ionicons name="medical" size={24} color="#fff" />
          </View>
          <Text style={styles.brand}>SwinkPay<Text style={{ color: ACCENT }}>Pharma</Text></Text>
        </View>

        {success ? (
          /* Success State */
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark-circle" size={48} color={ACCENT} />
            </View>
            <Text style={styles.successTitle}>Password Reset Sent!</Text>
            <Text style={styles.successDesc}>
              A temporary password has been sent to{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>{email}</Text>.
              {'\n\n'}Please check your inbox and login with the temporary password, then change it from your profile.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Continue to Login</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          /* Email Input State */
          <View>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address and we'll send you a temporary password.
            </Text>

            {error ? <Alert type="error" message={error} /> : null}

            <View style={styles.form}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={(text) => { setEmail(text); setError(''); }}
                placeholder="owner@pharmacy.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <Text style={styles.primaryBtnText}>Sending...</Text>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Security badge */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={14} color={ACCENT} />
          <Text style={styles.trustText}>Secure password recovery</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  header: { alignItems: 'center', marginBottom: 28 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brand: { fontSize: 22, fontWeight: '700', color: '#0F172A' },

  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 24 },

  form: { width: '100%' },

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
  successTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  successDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 16 },

  trustBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 32, backgroundColor: '#D1FAE5', alignSelf: 'center',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  trustText: { fontSize: 12, color: '#059669', fontWeight: '600' },
});

export default ForgotPasswordScreen;
