import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pharmacyAPI } from '../../services/api';
import PasswordStrength from '../../components/PasswordStrength';

const ACCENT = '#10B981';

const PharmacySignupScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    pharmacyName: '',
    slug: '',
  });
  const [slugStatus, setSlugStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const slugTimer = useRef(null);

  const generateSlug = (name) =>
    name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const checkSlugAvailability = useCallback((slug) => {
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (!slug || slug.length < 3) { setSlugStatus(null); return; }
    setSlugStatus('checking');
    slugTimer.current = setTimeout(async () => {
      try {
        const res = await pharmacyAPI.checkSlug(slug);
        const available = res.data?.data?.available ?? res.data?.available;
        setSlugStatus(available ? 'available' : 'taken');
      } catch { setSlugStatus(null); }
    }, 600);
  }, []);

  const handlePharmacyNameChange = (value) => {
    const slug = generateSlug(value);
    setForm((prev) => ({ ...prev, pharmacyName: value, slug }));
    checkSlugAvailability(slug);
  };

  const handleSlugChange = (value) => {
    const slug = generateSlug(value);
    setForm((prev) => ({ ...prev, slug }));
    checkSlugAvailability(slug);
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.ownerName.trim() || form.ownerName.trim().length < 2) return 'Owner name is required (min 2 characters)';
    if (!form.pharmacyName.trim()) return 'Pharmacy name is required';
    if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required';
    if (!form.mobile.trim() || !/^[6-9]\d{9}$/.test(form.mobile)) return 'Valid 10-digit mobile number starting with 6-9';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.slug || form.slug.length < 3) return 'Slug must be at least 3 characters';
    if (slugStatus === 'taken') return 'This slug is already taken';
    return null;
  };

  const handleSignup = async () => {
    const error = validate();
    if (error) { setMessage({ type: 'error', text: error }); return; }
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await pharmacyAPI.signup(form);
      const data = res.data?.data || res.data;
      if (data?.token) await AsyncStorage.setItem('token', data.token);
      setMessage({ type: 'success', text: 'Account created successfully! Redirecting...' });
      setTimeout(() => navigation.replace('PharmacyConfigure'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Signup failed.';
      setMessage({ type: 'error', text: msg });
    } finally { setSubmitting(false); }
  };

  const slugColor = slugStatus === 'available' ? '#10B981' : slugStatus === 'taken' ? '#EF4444' : '#6B7280';

  const renderField = (label, key, placeholder, opts = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{opts.required !== false && <Text style={{ color: '#EF4444' }}> *</Text>}
      </Text>
      <View style={styles.inputRow}>
        {opts.icon && (
          <Ionicons name={opts.icon} size={18} color="#94A3B8" style={styles.inputIcon} />
        )}
        <TextInput
          style={[styles.input, opts.icon && { paddingLeft: 40 }, opts.style]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={form[key]}
          onChangeText={opts.onChangeText || ((v) => updateField(key, opts.filter ? opts.filter(v) : v))}
          keyboardType={opts.keyboardType || 'default'}
          autoCapitalize={opts.autoCapitalize || 'none'}
          maxLength={opts.maxLength}
          secureTextEntry={opts.secureTextEntry}
          autoComplete={opts.autoComplete}
        />
        {opts.rightIcon}
      </View>
      {opts.hint}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoIcon}>
          <Ionicons name="medical" size={24} color="#fff" />
        </View>
        <Text style={styles.brand}>SwinkPay<Text style={{ color: ACCENT }}>Pharma</Text></Text>
      </View>

      <Text style={styles.title}>Create Pharmacy Account</Text>
      <Text style={styles.subtitle}>Set up your pharmacy on SwinkPayPharma</Text>

      {message.text ? (
        <View style={[styles.messageBox, message.type === 'error' ? styles.errorBox : styles.successBox]}>
          <Text style={[styles.messageText, message.type === 'error' ? styles.errorTextStyle : styles.successTextStyle]}>{message.text}</Text>
        </View>
      ) : null}

      {renderField('Owner Name', 'ownerName', 'e.g. Dr. Rajesh Kumar', { icon: 'person-outline', autoCapitalize: 'words' })}
      {renderField('Pharmacy Name', 'pharmacyName', 'e.g. Apollo Pharmacy', {
        icon: 'medical-outline',
        onChangeText: handlePharmacyNameChange,
        autoCapitalize: 'words',
      })}
      {renderField('Email', 'email', 'owner@pharmacy.com', { icon: 'mail-outline', keyboardType: 'email-address' })}
      {renderField('Phone Number', 'mobile', '10-digit mobile number', {
        icon: 'call-outline',
        keyboardType: 'phone-pad',
        maxLength: 10,
        filter: (v) => v.replace(/[^0-9]/g, ''),
        hint: form.mobile.length > 0 && form.mobile.length < 10 ? (
          <Text style={styles.errorHint}>Must be 10 digits ({form.mobile.length}/10)</Text>
        ) : null,
      })}

      {/* Password */}
      <View style={styles.field}>
        <Text style={styles.label}>Password <Text style={{ color: '#EF4444' }}>*</Text></Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { paddingLeft: 40, paddingRight: 44 }]}
            placeholder="Create a strong password"
            placeholderTextColor="#9CA3AF"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <PasswordStrength password={form.password} accentColor={ACCENT} />
      </View>

      {/* Confirm Password */}
      <View style={styles.field}>
        <Text style={styles.label}>Confirm Password <Text style={{ color: '#EF4444' }}>*</Text></Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { paddingLeft: 40, paddingRight: 44 }]}
            placeholder="Re-enter your password"
            placeholderTextColor="#9CA3AF"
            value={form.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        {form.confirmPassword.length > 0 && form.password === form.confirmPassword && (
          <View style={styles.matchRow}>
            <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
            <Text style={{ fontSize: 12, color: '#22C55E' }}>Passwords match</Text>
          </View>
        )}
        {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
          <Text style={styles.errorHint}>Passwords do not match</Text>
        )}
      </View>

      {/* Slug */}
      <View style={styles.field}>
        <Text style={styles.label}>Store URL Slug <Text style={{ color: '#EF4444' }}>*</Text></Text>
        <View style={styles.inputRow}>
          <Ionicons name="link-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { paddingLeft: 40, borderColor: slugStatus ? slugColor : '#D1D5DB' }]}
            placeholder="e.g. apollo-pharmacy"
            placeholderTextColor="#9CA3AF"
            value={form.slug}
            onChangeText={handleSlugChange}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.slugRow}>
          {slugStatus === 'checking' && <ActivityIndicator size="small" color={ACCENT} />}
          {slugStatus === 'available' && (
            <View style={styles.matchRow}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={{ fontSize: 12, color: '#10B981' }}>Available</Text>
            </View>
          )}
          {slugStatus === 'taken' && (
            <Text style={styles.errorHint}>Slug is already taken</Text>
          )}
          {!slugStatus && form.slug.length > 0 && (
            <Text style={styles.slugHint}>{form.slug}.pharmapay.swinkpay-fintech.com</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSignup}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.submitText}>Create Account</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
        <Text style={styles.loginLinkText}>
          Already have an account? <Text style={{ color: ACCENT, fontWeight: '700' }}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: '#20b1aa', fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 20 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  brand: { fontSize: 22, fontWeight: '700', color: '#0F172A' },

  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 20 },

  messageBox: { padding: 12, borderRadius: 10, marginBottom: 16 },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  successBox: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  messageText: { fontSize: 14 },
  errorTextStyle: { color: '#DC2626' },
  successTextStyle: { color: '#16A34A' },

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
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },

  slugRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, minHeight: 18 },
  slugHint: { fontSize: 12, color: '#64748B' },

  submitBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: '#64748B', fontSize: 14 },
});

export default PharmacySignupScreen;
