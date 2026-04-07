import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert as RNAlert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import PasswordStrength from '../../components/PasswordStrength';
import { isValidEmail, isValidPhone } from '../../utils/helpers';

const ACCENT = '#3B82F6';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
  });

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) newErrors.name = 'Full name is required (min 2 characters)';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!isValidPhone(formData.phone)) newErrors.phone = 'Invalid phone (10 digits, starting with 6-9)';
    if (formData.email.trim() && !isValidEmail(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        RNAlert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setPhoto(result.assets[0]);
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'web') { pickImage(); return; }
    RNAlert.alert('Profile Photo', 'Choose an option', [
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError('');

    const registrationData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase() || undefined,
      mobile: formData.phone.trim(),
      password: formData.password,
      address: formData.address.trim() || undefined,
    };
    if (photo) registrationData.photo = photo.uri;

    const result = await register(registrationData);
    setLoading(false);

    if (result.success && result.pending) {
      RNAlert.alert(
        'Registration Successful!',
        result.message || 'Your account is pending admin approval. You will be able to login once approved.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Ionicons name="bicycle" size={24} color="#fff" />
          </View>
          <Text style={styles.brand}>SwinkPay<Text style={{ color: ACCENT }}>Pharma</Text></Text>
        </View>

        <Text style={styles.title}>Delivery Partner Registration</Text>
        <Text style={styles.subtitle}>Join as a delivery partner and start earning</Text>

        {error ? <Alert type="error" message={error} /> : null}

        {/* Photo Upload */}
        <TouchableOpacity style={styles.photoContainer} onPress={showPhotoOptions}>
          {photo ? (
            <View>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity style={styles.photoDelete} onPress={() => setPhoto(null)}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={28} color="#94A3B8" />
            </View>
          )}
          <Text style={styles.photoText}>{photo ? 'Change Photo' : 'Add Photo'}</Text>
          <Text style={styles.photoHint}>JPG, PNG (Optional)</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <Input
            label="Full Name *"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="e.g. Rahul Sharma"
            autoCapitalize="words"
            error={errors.name}
          />

          <Input
            label="Phone Number *"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="your@email.com (optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Address"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="Your address (optional)"
            multiline
            numberOfLines={2}
          />

          {/* Password with strength */}
          <Input
            label="Password *"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            placeholder="Create a strong password"
            secureTextEntry
            error={errors.password}
          />
          <View style={{ marginTop: -8, marginBottom: 8 }}>
            <PasswordStrength password={formData.password} accentColor={ACCENT} />
          </View>

          {/* Confirm Password */}
          <Input
            label="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            placeholder="Re-enter your password"
            secureTextEntry
            error={errors.confirmPassword}
          />
          {formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword && (
            <View style={styles.matchRow}>
              <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              <Text style={{ fontSize: 12, color: '#22C55E' }}>Passwords match</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <Text style={styles.registerButtonText}>Creating account...</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.registerButtonText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={{ color: ACCENT, fontWeight: '700' }}>Login here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 48 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: '#20b1aa', fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 20 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  brand: { fontSize: 22, fontWeight: '700', color: '#0F172A' },

  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 20 },

  photoContainer: { alignSelf: 'center', alignItems: 'center', marginBottom: 24 },
  photoPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  photo: { width: 96, height: 96, borderRadius: 48 },
  photoDelete: {
    position: 'absolute', top: -2, right: -2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },
  photoText: { marginTop: 8, fontSize: 13, color: ACCENT, fontWeight: '600' },
  photoHint: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  form: { width: '100%' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -8, marginBottom: 8 },

  registerButton: {
    backgroundColor: ACCENT, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loginLink: { marginTop: 20, alignItems: 'center' },
  loginText: { fontSize: 14, color: '#64748B' },
});

export default RegisterScreen;
