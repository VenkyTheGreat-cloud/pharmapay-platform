import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
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
import TopNavBar from '../../components/TopNavBar';

const LOGO = require('../../../assets/logo.png');
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
  const [agreedTerms, setAgreedTerms] = useState(false);
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
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address (e.g. owner@pharmacy.com)';
    if (!form.mobile.trim()) return 'Phone number is required';
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) return 'Enter a valid 10-digit mobile number starting with 6-9';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.slug || form.slug.length < 3) return 'Store URL slug must be at least 3 characters';
    if (slugStatus === 'taken') return 'This slug is already taken';
    if (!agreedTerms) return 'Please agree to the Terms & Conditions and Privacy Policy';
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
      <TopNavBar />

      <View style={styles.bodyWrap}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
      </View>

      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Start managing your pharmacy deliveries today.</Text>

      {/* Role Toggle */}
      <View style={styles.roleToggle}>
        <View style={[styles.roleTab, styles.roleTabActive]}>
          <Ionicons name="storefront-outline" size={15} color={ACCENT} />
          <Text style={[styles.roleTabText, { color: ACCENT, fontWeight: '700' }]}>Pharmacy Owner</Text>
        </View>
        <TouchableOpacity style={styles.roleTab} onPress={() => navigation.navigate('Register')}>
          <Ionicons name="bicycle-outline" size={15} color="#64748B" />
          <Text style={styles.roleTabText}>Delivery Partner</Text>
        </TouchableOpacity>
      </View>

      {message.text ? (
        <View style={[styles.messageBox, message.type === 'error' ? styles.errorBox : styles.successBox]}>
          <Text style={[styles.messageText, message.type === 'error' ? styles.errorTextStyle : styles.successTextStyle]}>{message.text}</Text>
        </View>
      ) : null}

      <View style={styles.formCard}>
      {renderField('Pharmacy Owner Name', 'ownerName', 'e.g. Dr. Rajesh Kumar', { icon: 'person-outline', autoCapitalize: 'words' })}
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
            <Text style={styles.slugHint}>{form.slug}.pharmagig.swinkpay-fintech.com</Text>
          )}
        </View>
      </View>

      {/* Terms Checkbox */}
      <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedTerms(!agreedTerms)} activeOpacity={0.7}>
        <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
          {agreedTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>Terms & Conditions</Text> and <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

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
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
        <Text style={styles.loginLinkText}>
          Already have an account? <Text style={{ color: ACCENT, fontWeight: '700' }}>Log in</Text>
        </Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { paddingBottom: 40 },
  bodyWrap: { padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },

  header: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  logoImg: { width: 160, height: 60, marginBottom: 12 },

  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20, textAlign: 'center' },

  roleToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  roleTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  roleTabActive: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#10B981' },
  roleTabText: { fontSize: 13, fontWeight: '500', color: '#64748B' },

  messageBox: { padding: 12, borderRadius: 10, marginBottom: 16 },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  successBox: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  messageText: { fontSize: 14 },
  errorTextStyle: { color: '#DC2626' },
  successTextStyle: { color: '#16A34A' },

  formCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 16,
  },

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

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  termsText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 20 },
  termsLink: { color: '#10B981', fontWeight: '600', textDecorationLine: 'underline' },

  submitBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: '#64748B', fontSize: 14 },
});

export default PharmacySignupScreen;
