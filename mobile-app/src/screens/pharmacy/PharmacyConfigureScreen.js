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
  useWindowDimensions,
  Platform,
} from 'react-native';
import { pharmacyAPI } from '../../services/api';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 999,
    description: 'Perfect for small pharmacies',
    highlights: ['Online ordering', 'Basic analytics', 'Up to 100 products'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 2499,
    popular: true,
    description: 'For growing pharmacies',
    highlights: ['Everything in Starter', 'Delivery tracking', 'Up to 1,000 products', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 5999,
    description: 'Full-featured platform',
    highlights: ['Everything in Growth', 'Custom domain', 'Unlimited products', 'API access'],
  },
];

// Feature-to-plan mapping: minimum plan required for each feature
const FEATURE_TOGGLES = [
  { key: 'online_ordering', label: 'Online Ordering', description: 'Accept orders from customers online', minPlan: 'starter', group: 'Core Operations' },
  { key: 'inventory_management', label: 'Inventory Management', description: 'Track stock levels automatically', minPlan: 'growth', group: 'Core Operations' },
  { key: 'delivery_tracking', label: 'Delivery Tracking', description: 'Real-time order tracking for customers', minPlan: 'growth', group: 'Customer Experience' },
  { key: 'customer_notifications', label: 'Customer Notifications', description: 'Send SMS/push notifications', minPlan: 'growth', group: 'Customer Experience' },
  { key: 'analytics_dashboard', label: 'Analytics Dashboard', description: 'View sales and performance data', minPlan: 'enterprise', group: 'Advanced Analytics' },
];

const PLAN_RANK = { starter: 0, growth: 1, enterprise: 2 };

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
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  useEffect(() => {
    loadConfig();
  }, []);

  // Auto-update feature toggles when plan changes
  useEffect(() => {
    setFeatures(prev => {
      const updated = { ...prev };
      FEATURE_TOGGLES.forEach(feat => {
        const allowed = PLAN_RANK[selectedPlan] >= PLAN_RANK[feat.minPlan];
        if (!allowed) updated[feat.key] = false;
        // Auto-enable features included in plan
        if (allowed && feat.minPlan === 'starter') updated[feat.key] = true;
      });
      return updated;
    });
  }, [selectedPlan]);

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
    const feat = FEATURE_TOGGLES.find(f => f.key === key);
    if (!feat) return;
    const allowed = PLAN_RANK[selectedPlan] >= PLAN_RANK[feat.minPlan];
    if (!allowed) return; // Locked — can't toggle
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

  const isFeatureLocked = (feat) => PLAN_RANK[selectedPlan] < PLAN_RANK[feat.minPlan];
  const getRequiredPlan = (feat) => PLANS.find(p => p.id === feat.minPlan)?.name;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#139900" />
      </View>
    );
  }

  // Group features by category
  const groups = {};
  FEATURE_TOGGLES.forEach(f => {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  });

  const renderPlansPanel = () => (
    <View style={isWide ? styles.leftPanel : null}>
      <Text style={styles.sectionTitle}>Choose Your Plan</Text>
      {PLANS.map((plan) => {
        const selected = selectedPlan === plan.id;
        return (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selected && styles.planCardSelected]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.7}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={[styles.planName, selected && styles.planNameSelected]}>{plan.name}</Text>
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={styles.planPrice}>
              ₹{plan.price.toLocaleString('en-IN')}
              <Text style={styles.planPricePer}>/mo</Text>
            </Text>
            <Text style={styles.planDesc}>{plan.description}</Text>
            {plan.highlights.map((f, i) => (
              <Text key={i} style={styles.planFeature}>✓ {f}</Text>
            ))}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFeaturesPanel = () => (
    <View style={isWide ? styles.rightPanel : null}>
      <Text style={styles.sectionTitle}>Features</Text>
      <Text style={styles.subtitle}>Toggles update based on your selected plan</Text>

      {Object.entries(groups).map(([groupName, groupFeatures]) => (
        <View key={groupName}>
          <Text style={styles.groupLabel}>{groupName}</Text>
          {groupFeatures.map((feat) => {
            const locked = isFeatureLocked(feat);
            return (
              <View key={feat.key} style={[styles.featureRow, locked && styles.featureRowLocked]}>
                <View style={styles.featureInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.featureLabel, locked && styles.featureLabelLocked]}>{feat.label}</Text>
                    {locked && <Text style={styles.lockIcon}>🔒</Text>}
                  </View>
                  <Text style={[styles.featureDesc, locked && styles.featureDescLocked]}>
                    {locked ? `Requires ${getRequiredPlan(feat)} Plan` : feat.description}
                  </Text>
                </View>
                <Switch
                  value={features[feat.key]}
                  onValueChange={() => toggleFeature(feat.key)}
                  disabled={locked}
                  trackColor={{ false: '#D1D5DB', true: '#99e0dc' }}
                  thumbColor={locked ? '#ccc' : features[feat.key] ? '#139900' : '#f4f3f4'}
                />
              </View>
            );
          })}
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
          <Text style={styles.saveBtnText}>Save & Continue →</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#139900', fontWeight: '600' }}>← Back</Text>
      </TouchableOpacity>

      {isWide ? (
        <View style={styles.splitLayout}>
          {renderPlansPanel()}
          {renderFeaturesPanel()}
        </View>
      ) : (
        <>
          {renderPlansPanel()}
          <View style={{ height: 24 }} />
          {renderFeaturesPanel()}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  splitLayout: { flexDirection: 'row', gap: 24 },
  leftPanel: { flex: 1 },
  rightPanel: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  groupLabel: { fontSize: 12, fontWeight: '700', color: '#139900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  planCardSelected: { borderColor: '#139900', backgroundColor: '#F0FDF4' },
  popularBadge: {
    backgroundColor: '#139900',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  planName: { fontSize: 18, fontWeight: '700', color: '#374151' },
  planNameSelected: { color: '#139900' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { borderColor: '#139900' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#139900' },
  planPrice: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  planPricePer: { fontSize: 14, fontWeight: '400', color: '#6B7280' },
  planDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  planFeature: { fontSize: 13, color: '#374151', marginBottom: 2, paddingLeft: 4 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureRowLocked: { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6' },
  featureInfo: { flex: 1, marginRight: 12 },
  featureLabel: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  featureLabelLocked: { color: '#9CA3AF' },
  featureDesc: { fontSize: 12, color: '#6B7280' },
  featureDescLocked: { color: '#D1D5DB', fontStyle: 'italic' },
  lockIcon: { fontSize: 12 },
  saveBtn: { backgroundColor: '#139900', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});

export default PharmacyConfigureScreen;
