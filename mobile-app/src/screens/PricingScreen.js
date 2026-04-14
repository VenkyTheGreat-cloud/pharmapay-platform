import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopNavBar from '../components/TopNavBar';

const PLANS = [
  {
    name: 'Starter', price: '999', popular: false,
    desc: 'Perfect for single store pharmacies just getting started.',
    features: ['Up to 5 Delivery Partners', '100 Orders / month', 'Basic Dashboard', 'Standard Support'],
  },
  {
    name: 'Growth', price: '2499', popular: true,
    desc: 'For growing pharmacies with active delivery operations.',
    features: ['Up to 20 Delivery Partners', 'Unlimited Orders', 'White-labeled App', 'Live GPS Tracking', 'Advanced Analytics', 'Priority Support'],
  },
  {
    name: 'Enterprise', price: '5999', popular: false,
    desc: 'Multi store chains needing full control and automation.',
    features: ['Unlimited Partners & Orders', 'Custom Branding & Domain', 'API Integrations (POS)', 'Automated Settlements', 'Dedicated Account Manager', '24/7 Phone Support'],
  },
];

const FAQ = [
  { q: 'Is it really free for delivery partners?', a: 'Yes, delivery partners never pay a subscription fee. They keep 100% of their delivery earnings plus tips.' },
  { q: 'Can I change my plan later?', a: 'Absolutely. You can upgrade your pharmacy subscription at any time from your dashboard.' },
  { q: 'How are settlements handled?', a: 'We process payments securely and transfer funds to your registered bank account weekly. COD orders are reconciled through the app.' },
  { q: 'Do you provide the delivery fleet?', a: 'We provide the platform to manage your own fleet or connect with independent partners in your area. You maintain control of who delivers for you.' },
];

const PricingScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TopNavBar activeScreen="Pricing" />

      {/* Hero Header */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Simple, transparent{' '}<Text style={styles.heroTitleGreen}>pricing</Text></Text>
          <Text style={styles.heroSubtitle}>Choose the perfect plan for your pharmacy. No hidden fees. Cancel anytime.</Text>
        </View>
      </View>

      <View style={styles.body}>

        {/* Badges */}
        <View style={[styles.badgeRow, isWide && { flexDirection: 'row', justifyContent: 'center' }]}>
          <View style={[styles.badge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#2563EB" />
            <Text style={[styles.badgeText, { color: '#1E40AF' }]}>Always 100% Free for Delivery Partners</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Ionicons name="pricetag" size={14} color="#059669" />
            <Text style={[styles.badgeText, { color: '#065F46' }]}>One-time Setup Fee Applies</Text>
          </View>
        </View>

        {/* Plan Cards */}
        <View style={isWide ? styles.plansRow : undefined}>
          {PLANS.map((plan) => (
            <View key={plan.name} style={[styles.planCard, plan.popular && styles.planCardPopular, isWide && { flex: 1 }]}>
              {plan.popular && (
                <View style={styles.popularBadge}><Text style={styles.popularText}>MOST POPULAR</Text></View>
              )}
              <Text style={[styles.planName, plan.popular && { color: '#10B981' }]}>{plan.name}</Text>
              <Text style={styles.planDesc}>{plan.desc}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceAmount, plan.popular && { color: '#10B981' }]}>Rs {plan.price}</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
              <Text style={styles.setupNote}>+ one-time setup fee</Text>
              <View style={styles.featuresList}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.planBtn, plan.popular && styles.planBtnPopular]}
                onPress={() => navigation.navigate('PharmacySignup')}
              >
                <Text style={[styles.planBtnText, plan.popular && { color: '#fff' }]}>Get Started</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeader}>
            <Ionicons name="help-circle" size={22} color="#10B981" />
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          </View>
          {FAQ.map((item) => (
            <View key={item.q} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.q}</Text>
              <Text style={styles.faqAnswer}>{item.a}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },
  heroSection: { backgroundColor: '#F1F5F9', paddingTop: 48, paddingBottom: 40, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  heroContent: { maxWidth: 700, alignSelf: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 36, fontWeight: '800', fontStyle: 'italic', color: '#1E293B', textAlign: 'center', lineHeight: 48 },
  heroTitleGreen: { color: '#10B981', fontStyle: 'italic' },
  heroSubtitle: { fontSize: 15, color: '#64748B', lineHeight: 24, textAlign: 'center', marginTop: 12 },

  body: { padding: 24, maxWidth: 1100, width: '100%', alignSelf: 'center' },

  badgeRow: { gap: 8, marginBottom: 24, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: '600' },

  plansRow: { flexDirection: 'row', gap: 16 },
  planCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  planCardPopular: { borderColor: '#10B981', borderWidth: 2 },
  popularBadge: { backgroundColor: '#10B981', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 12 },
  popularText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  planName: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  planDesc: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceAmount: { fontSize: 32, fontWeight: '800', color: '#0F172A' },
  pricePeriod: { fontSize: 14, color: '#94A3B8', marginLeft: 4 },
  setupNote: { fontSize: 12, color: '#94A3B8', marginTop: 2, marginBottom: 16 },

  featuresList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#334155' },

  planBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F1F5F9' },
  planBtnPopular: { backgroundColor: '#10B981' },
  planBtnText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  faqSection: { marginTop: 32 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, justifyContent: 'center' },
  faqTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 20, marginBottom: 20 },
  faqQuestion: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  faqAnswer: { fontSize: 14, color: '#64748B', lineHeight: 22 },
});

export default PricingScreen;
