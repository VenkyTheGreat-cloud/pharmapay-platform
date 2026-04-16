import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';
import { pharmacyAPI } from '../../services/api';

const PLAN_DETAILS = {
  starter: { name: 'Starter', price: 999 },
  growth: { name: 'Growth', price: 2499 },
  enterprise: { name: 'Enterprise', price: 5999 },
};

const PharmacyPaymentScreen = ({ navigation }) => {
  const [appName, setAppName] = useState('');
  const [plan, setPlan] = useState(null);
  const [pharmacyName, setPharmacyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [paying, setPaying] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    loadPharmacy();
  }, []);

  const loadPharmacy = async () => {
    try {
      const res = await pharmacyAPI.getMyPharmacy();
      const pharmacy = res.data?.data || res.data;
      if (pharmacy.app_name) {
        setAppName(pharmacy.app_name);
        setNameSaved(true);
      }
      if (pharmacy.plan) setPlan(pharmacy.plan);
      if (pharmacy.name) setPharmacyName(pharmacy.name);
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  };

  const [payError, setPayError] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSaveAppName = async () => {
    if (!appName.trim()) {
      setNameError('Please enter an app name.');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      await pharmacyAPI.updateAppName(appName.trim());
      setNameSaved(true);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save app name.';
      setNameError(msg);
    } finally {
      setSavingName(false);
    }
  };

  const handlePay = async () => {
    if (!nameSaved) {
      setPayError('Please save your app name before proceeding to payment.');
      return;
    }
    setPaying(true);
    setPayError('');
    try {
      const res = await pharmacyAPI.initiatePayment();
      const data = res.data?.data || res.data;
      const paymentUrl = data?.paymentUrl;
      if (paymentUrl) {
        // On web, use window.location to redirect (Linking.openURL may not work)
        if (Platform.OS === 'web') {
          window.location.href = paymentUrl;
        } else {
          await Linking.openURL(paymentUrl);
          navigation.replace('PharmacyStatus');
        }
      } else {
        setPayError('No payment URL received. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Payment initiation failed.';
      setPayError(msg);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20b1aa" />
      </View>
    );
  }

  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.starter;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.navigate('PharmacyBranding')} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, color: '#20b1aa', fontWeight: '600' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>Review your plan and complete payment</Text>

      {/* App Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Name</Text>
        <Text style={styles.disclaimer}>
          This name will appear on your pharmacy's customer-facing app. You can change it later from the admin panel.
        </Text>
        <View style={styles.appNameRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={appName}
            onChangeText={(v) => {
              setAppName(v);
              setNameSaved(false);
            }}
            placeholder="e.g. Apollo Health"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={[styles.saveNameBtn, savingName && { opacity: 0.6 }]}
            onPress={handleSaveAppName}
            disabled={savingName}
          >
            {savingName ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveNameText}>{nameSaved ? 'Saved' : 'Save'}</Text>
            )}
          </TouchableOpacity>
        </View>
        {nameError ? (
          <Text style={{ color: '#DC2626', fontSize: 13, marginTop: 6 }}>{nameError}</Text>
        ) : null}
      </View>

      {/* Plan Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pharmacy</Text>
            <Text style={styles.summaryValue}>{pharmacyName || '-'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>{planInfo.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Monthly Total</Text>
            <Text style={styles.summaryTotalValue}>Rs {planInfo.price.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payBtn, paying && styles.payBtnDisabled]}
        onPress={handlePay}
        disabled={paying}
      >
        {paying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payBtnText}>Pay Now via PharmaGig</Text>
        )}
      </TouchableOpacity>

      {payError ? (
        <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 12, marginTop: 12 }}>
          <Text style={{ color: '#DC2626', fontSize: 14 }}>{payError}</Text>
        </View>
      ) : null}

      <Text style={styles.secureText}>
        Payment is processed securely through PharmaGig. You will be redirected to complete payment.
      </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  appNameRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
  saveNameBtn: {
    backgroundColor: '#20b1aa',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  saveNameText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#20b1aa',
  },
  payBtn: {
    backgroundColor: '#20b1aa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secureText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
});

export default PharmacyPaymentScreen;
