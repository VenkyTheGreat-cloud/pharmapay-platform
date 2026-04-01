import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { pharmacyAPI } from '../../services/api';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 999,
    description: 'Perfect for small pharmacies just getting started',
    features: ['Online ordering', 'Basic analytics', 'Up to 100 products'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 2499,
    description: 'For growing pharmacies that need more power',
    features: ['Everything in Starter', 'Delivery tracking', 'Up to 1,000 products', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 5999,
    description: 'Full-featured platform for large pharmacies',
    features: ['Everything in Growth', 'Custom domain', 'Unlimited products', 'API access', 'Dedicated support'],
  },
];

const FEATURE_TOGGLES = [
  { key: 'online_ordering', label: 'Online Ordering', description: 'Accept orders from customers online' },
  { key: 'delivery_tracking', label: 'Delivery Tracking', description: 'Real-time order tracking for customers' },
  { key: 'inventory_management', label: 'Inventory Management', description: 'Track stock levels automatically' },
  { key: 'customer_notifications', label: 'Customer Notifications', description: 'Send SMS/push notifications' },
  { key: 'analytics_dashboard', label: 'Analytics Dashboard', description: 'View sales and performance data' },
];

const PharmacyConfigureScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [features, setFeatures] = useState({
    online_ordering: true,
    delivery_tracking: false,
    inventory_management: false,
    customer_notifications: false,
    analytics_dashboard: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await pharmacyAPI.getMyPharmacy();
      const pharmacy = res.data;
      if (pharmacy.plan) setSelectedPlan(pharmacy.plan);
      if (pharmacy.features) setFeatures((prev) => ({ ...prev, ...pharmacy.features }));
    } catch {
      // New pharmacy, use defaults
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (key) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pharmacyAPI.updateConfig({ plan: selectedPlan, features });
      navigation.navigate('PharmacyBranding');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save configuration.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20b1aa" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>Select the plan that fits your pharmacy</Text>

      {PLANS.map((plan) => {
        const selected = selectedPlan === plan.id;
        return (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selected && styles.planCardSelected]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.7}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, selected && styles.planNameSelected]}>{plan.name}</Text>
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={styles.planPrice}>
              Rs {plan.price.toLocaleString()}
              <Text style={styles.planPricePer}>/mo</Text>
            </Text>
            <Text style={styles.planDesc}>{plan.description}</Text>
            {plan.features.map((f, i) => (
              <Text key={i} style={styles.planFeature}>
                {'\u2022'} {f}
              </Text>
            ))}
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.title, { marginTop: 32 }]}>Features</Text>
      <Text style={styles.subtitle}>Toggle the features you need</Text>

      {FEATURE_TOGGLES.map((feat) => (
        <View key={feat.key} style={styles.featureRow}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureLabel}>{feat.label}</Text>
            <Text style={styles.featureDesc}>{feat.description}</Text>
          </View>
          <Switch
            value={features[feat.key]}
            onValueChange={() => toggleFeature(feat.key)}
            trackColor={{ false: '#D1D5DB', true: '#99e0dc' }}
            thumbColor={features[feat.key] ? '#20b1aa' : '#f4f3f4'}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save & Continue</Text>
        )}
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
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
  },
  planCardSelected: {
    borderColor: '#20b1aa',
    backgroundColor: '#F0FDFA',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  planNameSelected: {
    color: '#20b1aa',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#20b1aa',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#20b1aa',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  planPricePer: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  planDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  planFeature: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 2,
    paddingLeft: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureInfo: {
    flex: 1,
    marginRight: 12,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  saveBtn: {
    backgroundColor: '#20b1aa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default PharmacyConfigureScreen;
