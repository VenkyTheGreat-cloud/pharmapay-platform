import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PLANS = [
  {
    name: 'Starter',
    price: '999',
    desc: 'Perfect for single store pharmacies just getting started.',
    popular: false,
    features: [
      'Up to 5 Delivery Partners',
      '100 Orders / month',
      'Basic Dashboard',
      'Standard Support',
    ],
  },
  {
    name: 'Growth',
    price: '2,499',
    desc: 'For growing pharmacies that need more power and reach.',
    popular: true,
    features: [
      'Up to 20 Delivery Partners',
      'Unlimited Orders',
      'White-labeled App',
      'Live GPS Tracking',
      'Advanced Analytics',
      'Priority Support',
    ],
  },
  {
    name: 'Enterprise',
    price: '5,999',
    desc: 'For pharmacy chains and high-volume operations.',
    popular: false,
    features: [
      'Unlimited Partners & Orders',
      'Custom Branding & Domain',
      'API Integrations (POS)',
      'Automated Settlements',
      'Dedicated Account Manager',
      '24/7 Phone Support',
    ],
  },
];

const FAQ = [
  {
    q: 'Is it really free for delivery partners?',
    a: 'Yes, delivery partners never pay a subscription fee. They keep 100% of their delivery earnings plus tips.',
  },
  {
    q: 'Can I change my plan later?',
    a: 'Absolutely. You can upgrade your pharmacy subscription at any time from your dashboard.',
  },
  {
    q: 'How are settlements handled?',
    a: 'We process payments securely and transfer funds to your registered bank account weekly. COD orders are reconciled through the app.',
  },
  {
    q: 'Do you provide the delivery fleet?',
    a: 'We provide the platform to manage your own fleet or connect with independent partners in your area. You maintain control of who delivers for you.',
  },
];

const PricingScreen = ({ navigation }) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
      <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity>

    <View style={styles.header}>
      <Text style={styles.title}>
        Simple, transparent{'\n'}
        <Text style={{ color: '#10B981' }}>pricing</Text>
      </Text>
      <Text style={styles.subtitle}>
        Choose the perfect plan for your pharmacy. No hidden fees. Cancel anytime.
      </Text>
    </View>

    {/* Badges */}
    <View style={styles.badgeRow}>
      <View style={[styles.badge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
        <Ionicons name="information-circle" size={16} color="#2563EB" />
        <Text style={[styles.badgeText, { color: '#1E40AF' }]}>Always 100% Free for Delivery Partners</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
        <Ionicons name="pricetag" size={14} color="#059669" />
        <Text style={[styles.badgeText, { color: '#065F46' }]}>One-time Setup Fee Applies</Text>
      </View>
    </View>

    {/* Plan Cards */}
    {PLANS.map((plan) => (
      <View
        key={plan.name}
        style={[
          styles.planCard,
          plan.popular && styles.planCardPopular,
        ]}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        <Text style={[styles.planName, plan.popular && { color: '#fff' }]}>{plan.name}</Text>
        <Text style={[styles.planDesc, plan.popular && { color: 'rgba(255,255,255,0.8)' }]}>{plan.desc}</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.priceSymbol, plan.popular && { color: '#fff' }]}>Rs </Text>
          <Text style={[styles.priceAmount, plan.popular && { color: '#fff' }]}>{plan.price}</Text>
          <Text style={[styles.pricePeriod, plan.popular && { color: 'rgba(255,255,255,0.7)' }]}>/month</Text>
        </View>
        <Text style={[styles.setupNote, plan.popular && { color: 'rgba(255,255,255,0.6)' }]}>+ one-time setup fee</Text>

        <View style={styles.featuresList}>
          {plan.features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark" size={16} color={plan.popular ? '#fff' : '#10B981'} />
              <Text style={[styles.featureText, plan.popular && { color: '#fff' }]}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.planBtn, plan.popular ? styles.planBtnPopular : styles.planBtnDefault]}
          onPress={() => navigation.navigate('PharmacySignup')}
        >
          <Text style={[styles.planBtnText, plan.popular && { color: '#10B981' }]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    ))}

    {/* FAQ */}
    <View style={styles.faqSection}>
      <View style={styles.faqHeader}>
        <Ionicons name="help-circle" size={24} color="#10B981" />
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
      </View>

      {FAQ.map((item) => (
        <View key={item.q} style={styles.faqItem}>
          <Text style={styles.faqQuestion}>{item.q}</Text>
          <Text style={styles.faqAnswer}>{item.a}</Text>
        </View>
      ))}
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 15, color: '#10B981', fontWeight: '600' },

  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8, lineHeight: 36 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22 },

  badgeRow: { gap: 8, marginBottom: 24 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: 13, fontWeight: '600' },

  planCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  planCardPopular: { backgroundColor: '#10B981', borderColor: '#10B981' },
  popularBadge: { backgroundColor: '#059669', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 12 },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  planName: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  planDesc: { fontSize: 13, color: '#64748B', marginBottom: 16 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceSymbol: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  priceAmount: { fontSize: 36, fontWeight: '800', color: '#0F172A' },
  pricePeriod: { fontSize: 14, color: '#94A3B8', marginLeft: 4 },
  setupNote: { fontSize: 12, color: '#94A3B8', marginTop: 2, marginBottom: 16 },

  featuresList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#334155' },

  planBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  planBtnDefault: { backgroundColor: '#F1F5F9' },
  planBtnPopular: { backgroundColor: '#fff' },
  planBtnText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  faqSection: { marginTop: 40 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  faqTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },

  faqItem: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 20, marginBottom: 20 },
  faqQuestion: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  faqAnswer: { fontSize: 14, color: '#64748B', lineHeight: 22 },
});

export default PricingScreen;
