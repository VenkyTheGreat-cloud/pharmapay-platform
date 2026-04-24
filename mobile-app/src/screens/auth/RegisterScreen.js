import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert as RNAlert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';
import PasswordStrength from '../../components/PasswordStrength';
import TopNavBar from '../../components/TopNavBar';
import { isValidPhone } from '../../utils/helpers';

const LOGO = require('../../../assets/logo.png');
const ACCENT = '#3B82F6';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const updateField = (f, v) => { setForm({ ...form, [f]: v }); setErrors({ ...errors, [f]: '' }); setError(''); };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Full name required (min 2 chars)';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!isValidPhone(form.phone)) e.phone = 'Enter a valid 10-digit mobile number starting with 6-9';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreedTerms) e.terms = 'Please agree to Terms & Privacy Policy';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImage = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) { RNAlert.alert('Permission Required', 'Allow photo access.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!r.canceled) setPhoto(r.assets[0]);
  };

  const takePhoto = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) { RNAlert.alert('Permission Required', 'Allow camera access.'); return; }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!r.canceled) setPhoto(r.assets[0]);
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'web') { pickImage(); return; }
    RNAlert.alert('Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true); setError('');
    const data = { name: form.name.trim(), mobile: form.phone.trim(), password: form.password };
    if (photo) data.photo = photo.uri;
    const result = await register(data);
    setLoading(false);
    if (result.success && result.pending) {
      const msg = result.message || 'Your account is pending admin approval.';
      if (Platform.OS === 'web') {
        setSuccessMsg(msg);
        setTimeout(() => navigation.navigate('Login'), 3000);
      } else {
        RNAlert.alert('Registration Successful!', msg, [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
      }
    } else if (!result.success) setError(result.message);
  };

  const renderField = (label, key, placeholder, opts = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{opts.optional ? '' : <Text style={{ color: '#EF4444' }}> *</Text>}
      </Text>
      <View style={styles.inputRow}>
        {opts.icon && (
          <Ionicons name={opts.icon} size={18} color="#94A3B8" style={styles.inputIcon} />
        )}
        <TextInput
          style={[styles.input, opts.icon && { paddingLeft: 40 }, opts.secureTextEntry && { paddingRight: 44 }]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={form[key]}
          onChangeText={opts.onChangeText || ((v) => updateField(key, opts.filter ? opts.filter(v) : v))}
          keyboardType={opts.keyboardType || 'default'}
          autoCapitalize={opts.autoCapitalize || 'none'}
          maxLength={opts.maxLength}
          secureTextEntry={opts.secureTextEntry && !(opts.showState)}
          autoComplete={opts.autoComplete}
        />
        {opts.eyeToggle}
      </View>
      {opts.hint}
      {errors[key] && <Text style={styles.errorHint}>{errors[key]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TopNavBar />
        <View style={styles.body}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join as a delivery partner and earn on your schedule.</Text>

          {/* Role Toggle */}
          <View style={styles.roleToggle}>
            <TouchableOpacity style={styles.roleTab} onPress={() => navigation.navigate('PharmacySignup')}>
              <Ionicons name="storefront-outline" size={15} color="#64748B" />
              <Text style={styles.roleTabText}>Pharmacy Owner</Text>
            </TouchableOpacity>
            <View style={[styles.roleTab, styles.roleTabActive]}>
              <Ionicons name="bicycle-outline" size={15} color={ACCENT} />
              <Text style={[styles.roleTabText, { color: ACCENT, fontWeight: '700' }]}>Delivery Partner</Text>
            </View>
          </View>

          {successMsg ? (
            <View style={[styles.messageBox, styles.successBox]}>
              <Text style={styles.successTextStyle}>{successMsg}</Text>
            </View>
          ) : null}
          {error ? (
            <View style={[styles.messageBox, styles.errorBox]}>
              <Text style={styles.errorTextStyle}>{error}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Photo Upload */}
            <Text style={styles.label}>Delivery Partner Photo <Text style={{ color: '#94A3B8', fontWeight: '400' }}>(Optional)</Text></Text>
            <View style={styles.photoRow}>
              <TouchableOpacity onPress={showPhotoOptions} style={styles.photoBox}>
                {photo ? <Image source={{ uri: photo.uri }} style={styles.photoImg} /> : <Ionicons name="camera" size={24} color="#94A3B8" />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={showPhotoOptions}>
                <Ionicons name="cloud-upload-outline" size={16} color={ACCENT} />
                <Text style={styles.uploadBtnText}>Upload Photo</Text>
              </TouchableOpacity>
              <Text style={styles.photoHint}>JPG, PNG (Max 5MB)</Text>
            </View>

            {renderField('Full Name', 'name', 'e.g. Rahul Sharma', { icon: 'person-outline', autoCapitalize: 'words' })}
            {renderField('Phone Number', 'phone', '+91 98765 43210', {
              icon: 'call-outline',
              keyboardType: 'phone-pad',
              maxLength: 10,
              filter: (v) => v.replace(/[^0-9]/g, ''),
              hint: form.phone.length > 0 && form.phone.length < 10 ? (
                <Text style={styles.errorHint}>Must be 10 digits ({form.phone.length}/10)</Text>
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
              {errors.password && <Text style={styles.errorHint}>{errors.password}</Text>}
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

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedTerms(!agreedTerms)} activeOpacity={0.7}>
              <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
                {agreedTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.termsText}>I agree to the <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>Terms & Conditions</Text> and <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text></Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorHint}>{errors.terms}</Text>}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
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
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: ACCENT, fontWeight: '700' }}>Log in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  body: { padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },

  header: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  logoImg: { width: 160, height: 60, marginBottom: 12 },

  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20, textAlign: 'center' },

  roleToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  roleTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  roleTabActive: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: ACCENT },
  roleTabText: { fontSize: 13, fontWeight: '500', color: '#64748B' },

  messageBox: { padding: 12, borderRadius: 10, marginBottom: 16 },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  errorTextStyle: { color: '#DC2626', fontSize: 14 },
  successBox: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  successTextStyle: { color: '#16A34A', fontSize: 14 },

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
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  photoBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImg: { width: 56, height: 56 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  uploadBtnText: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  photoHint: { fontSize: 11, color: '#94A3B8' },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: ACCENT, borderColor: ACCENT },
  termsText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 20 },
  termsLink: { color: ACCENT, fontWeight: '600', textDecorationLine: 'underline' },

  submitBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: '#64748B', fontSize: 14 },
});

export default RegisterScreen;
