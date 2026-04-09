import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert as RNAlert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import PasswordStrength from '../../components/PasswordStrength';
import TopNavBar from '../../components/TopNavBar';
import { isValidPhone } from '../../utils/helpers';

const ACCENT = '#3B82F6';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [agreedTerms, setAgreedTerms] = useState(false);

  const updateField = (f, v) => { setFormData({ ...formData, [f]: v }); setErrors({ ...errors, [f]: '' }); };

  const validateForm = () => {
    const e = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) e.name = 'Full name required (min 2 chars)';
    if (!formData.phone.trim()) e.phone = 'Phone number is required';
    else if (!isValidPhone(formData.phone)) e.phone = 'Invalid phone (10 digits, starting 6-9)';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 6) e.password = 'Min 6 characters';
    if (!formData.confirmPassword) e.confirmPassword = 'Confirm your password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
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
    const data = { name: formData.name.trim(), mobile: formData.phone.trim(), password: formData.password };
    if (formData.email.trim()) data.email = formData.email.trim().toLowerCase();
    if (photo) data.photo = photo.uri;
    const result = await register(data);
    setLoading(false);
    if (result.success && result.pending) {
      RNAlert.alert('Registration Successful!', result.message || 'Your account is pending admin approval.', [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
    } else if (!result.success) setError(result.message);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TopNavBar />
        <View style={styles.body}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoIcon}><Ionicons name="storefront" size={22} color="#fff" /></View>
            <Text style={styles.brand}>Pharma<Text style={{ color: '#10B981' }}>Gig</Text></Text>
            <Text style={styles.heading}>Create your account</Text>
            <Text style={styles.subheading}>Join as a delivery partner and earn on your schedule.</Text>
          </View>

          {/* Role Toggle */}
          <View style={styles.roleToggle}>
            <TouchableOpacity style={styles.roleTabInactive} onPress={() => navigation.navigate('PharmacySignup')}>
              <Ionicons name="storefront-outline" size={15} color="#64748B" />
              <Text style={styles.roleTabTextInactive}>Pharmacy Owner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleTabActive}>
              <Ionicons name="bicycle-outline" size={15} color={ACCENT} />
              <Text style={styles.roleTabTextActive}>Delivery Partner</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error ? <Alert type="error" message={error} /> : null}

            {/* Photo Upload */}
            <Text style={styles.fieldLabel}>Delivery Partner Photo (Optional)</Text>
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

            <Input label="Full Name" value={formData.name} onChangeText={(t) => updateField('name', t)} placeholder="e.g. Rahul Sharma" autoCapitalize="words" error={errors.name} />
            <Input label="Phone Number *" value={formData.phone} onChangeText={(t) => updateField('phone', t)} placeholder="+91 98765 43210" keyboardType="phone-pad" maxLength={10} error={errors.phone} />
            <Input label="Password" value={formData.password} onChangeText={(t) => updateField('password', t)} placeholder="Create a password" secureTextEntry error={errors.password} />
            <View style={{ marginTop: -8, marginBottom: 8 }}><PasswordStrength password={formData.password} accentColor={ACCENT} /></View>
            <Input label="Confirm Password" value={formData.confirmPassword} onChangeText={(t) => updateField('confirmPassword', t)} placeholder="Re-enter password" secureTextEntry error={errors.confirmPassword} />

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedTerms(!agreedTerms)} activeOpacity={0.7}>
              <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
                {agreedTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.termsText}>I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text></Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorHint}>{errors.terms}</Text>}

            <TouchableOpacity style={[styles.registerBtn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.registerBtnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? <Text style={{ color: ACCENT, fontWeight: '700' }}>Log in</Text></Text>
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

  header: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  brand: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#64748B' },

  roleToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  roleTabInactive: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  roleTabTextInactive: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  roleTabActive: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#3B82F6' },
  roleTabTextActive: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },

  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  photoBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImg: { width: 56, height: 56 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  uploadBtnText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  photoHint: { fontSize: 11, color: '#94A3B8' },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  termsText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 20 },
  termsLink: { color: '#3B82F6', fontWeight: '600', textDecorationLine: 'underline' },
  errorHint: { color: '#EF4444', fontSize: 12, marginTop: -8, marginBottom: 8 },

  registerBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  loginLink: { alignItems: 'center', marginTop: 4 },
  loginText: { fontSize: 14, color: '#64748B' },
});

export default RegisterScreen;
