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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pharmacyAPI } from '../../services/api';

const PharmacySignupScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    mobile: '',
    password: '',
    pharmacyName: '',
    slug: '',
  });
  const [slugStatus, setSlugStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [submitting, setSubmitting] = useState(false);
  const slugTimer = useRef(null);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const checkSlugAvailability = useCallback((slug) => {
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (!slug || slug.length < 3) {
      setSlugStatus(null);
      return;
    }
    setSlugStatus('checking');
    slugTimer.current = setTimeout(async () => {
      try {
        const res = await pharmacyAPI.checkSlug(slug);
        setSlugStatus(res.data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus(null);
      }
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

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.ownerName.trim()) return 'Owner name is required';
    if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required';
    if (!form.mobile.trim() || form.mobile.length < 10) return 'Valid mobile number is required';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    if (!form.pharmacyName.trim()) return 'Pharmacy name is required';
    if (!form.slug || form.slug.length < 3) return 'Slug must be at least 3 characters';
    if (slugStatus === 'taken') return 'This slug is already taken';
    return null;
  };

  const handleSignup = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }
    setSubmitting(true);
    try {
      const res = await pharmacyAPI.signup(form);
      const { token } = res.data;
      if (token) {
        await AsyncStorage.setItem('token', token);
      }
      navigation.replace('PharmacyConfigure');
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      Alert.alert('Signup Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const slugColor =
    slugStatus === 'available' ? '#10B981' : slugStatus === 'taken' ? '#EF4444' : '#6B7280';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Register Your Pharmacy</Text>
      <Text style={styles.subtitle}>Set up your pharmacy on PharmaPay</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Owner Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor="#9CA3AF"
          value={form.ownerName}
          onChangeText={(v) => updateField('ownerName', v)}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          value={form.email}
          onChangeText={(v) => updateField('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Mobile</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit mobile number"
          placeholderTextColor="#9CA3AF"
          value={form.mobile}
          onChangeText={(v) => updateField('mobile', v)}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 6 characters"
          placeholderTextColor="#9CA3AF"
          value={form.password}
          onChangeText={(v) => updateField('password', v)}
          secureTextEntry
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Pharmacy Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Apollo Pharmacy"
          placeholderTextColor="#9CA3AF"
          value={form.pharmacyName}
          onChangeText={handlePharmacyNameChange}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Slug (URL identifier)</Text>
        <TextInput
          style={[styles.input, { borderColor: slugStatus ? slugColor : '#D1D5DB' }]}
          placeholder="e.g. apollo-pharmacy"
          placeholderTextColor="#9CA3AF"
          value={form.slug}
          onChangeText={handleSlugChange}
          autoCapitalize="none"
        />
        <View style={styles.slugRow}>
          {slugStatus === 'checking' && (
            <ActivityIndicator size="small" color="#20b1aa" />
          )}
          {slugStatus === 'available' && (
            <Text style={[styles.slugHint, { color: '#10B981' }]}>Slug is available</Text>
          )}
          {slugStatus === 'taken' && (
            <Text style={[styles.slugHint, { color: '#EF4444' }]}>Slug is already taken</Text>
          )}
          {!slugStatus && form.slug.length > 0 && (
            <Text style={styles.slugHint}>yourpharmacy.pharmapay.com/{form.slug}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSignup}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
        <Text style={styles.loginText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#20b1aa',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 28,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  slugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    minHeight: 20,
  },
  slugHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  submitBtn: {
    backgroundColor: '#20b1aa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#20b1aa',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PharmacySignupScreen;
