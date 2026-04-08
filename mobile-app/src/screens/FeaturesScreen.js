import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OWNER_FEATURES = [
  { icon: 'storefront-outline', title: 'White-labeled Platform', desc: 'Launch your pharmacy\'s custom-branded delivery app. Your logo, your colors, your rules.' },
  { icon: 'navigate-outline', title: 'Live GPS Tracking', desc: 'Track every delivery in real-time. Monitor partner locations and optimize routes.' },
  { icon: 'people-outline', title: 'Partner Management', desc: 'Hire, manage, and evaluate delivery partners. Set schedules, zones, and performance goals.' },
  { icon: 'cash-outline', title: 'Automated Settlements', desc: 'Automatic COD reconciliation, weekly payouts, and detailed financial reports.' },
  { icon: 'bar-chart-outline', title: 'Advanced Analytics', desc: 'Track orders, revenue, delivery times, and partner performance with rich dashboards.' },
  { icon: 'shield-checkmark-outline', title: 'Secure Verification', desc: 'OTP-based delivery confirmation, digital receipts, and tamper-proof audit trails.' },
];

const PARTNER_FEATURES = [
  { icon: 'time-outline', title: 'Flexible Earning', desc: 'Work on your own schedule. Accept or decline deliveries. No minimum hours.' },
  { icon: 'map-outline', title: 'Smart Navigation', desc: 'In-app GPS navigation optimized for fast medicine delivery in your city.' },
  { icon: 'wallet-outline', title: 'Transparent Payouts', desc: 'See your earnings in real-time. Weekly direct bank transfers, no hidden deductions.' },
  { icon: 'checkmark-circle-outline', title: 'Easy Onboarding', desc: 'Sign up in minutes. No vehicle ownership required. Start earning the same day.' },
];

const FeaturesScreen = ({ navigation }) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
      <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity>

    <View style={styles.header}>
      <Text style={styles.title}>
        Powerful features for modern{' '}
        <Text style={{ color: '#10B981' }}>pharmacies</Text>
      </Text>
      <Text style={styles.subtitle}>
        Everything you need to run a successful medicine delivery operation.
      </Text>
    </View>

    {/* Pharmacy Owners */}
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>For Pharmacy Owners</Text>
      <View style={styles.proBadge}><Text style={styles.proBadgeText}>Pro Tools</Text></View>
    </View>

    {OWNER_FEATURES.map((f) => (
      <View key={f.title} style={styles.featureCard}>
        <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <Ionicons name={f.icon} size={24} color="#10B981" />
        </View>
        <Text style={styles.featureTitle}>{f.title}</Text>
        <Text style={styles.featureDesc}>{f.desc}</Text>
      </View>
    ))}

    {/* Delivery Partners */}
    <View style={[styles.sectionHeader, { marginTop: 32 }]}>
      <Text style={styles.sectionTitle}>For Delivery Partners</Text>
      <View style={[styles.proBadge, { backgroundColor: '#DBEAFE' }]}>
        <Text style={[styles.proBadgeText, { color: '#1E40AF' }]}>100% Free</Text>
      </View>
    </View>

    {PARTNER_FEATURES.map((f) => (
      <View key={f.title} style={styles.featureCardRow}>
        <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Ionicons name={f.icon} size={24} color="#3B82F6" />
        </View>
        <View style={styles.featureTextWrap}>
          <Text style={styles.featureTitle}>{f.title}</Text>
          <Text style={styles.featureDesc}>{f.desc}</Text>
        </View>
      </View>
    ))}

    {/* CTA */}
    <View style={styles.cta}>
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={() => navigation.navigate('RoleSelect')}
      >
        <Text style={styles.ctaBtnText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 15, color: '#10B981', fontWeight: '600' },

  header: { marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8, lineHeight: 34 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  proBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  proBadgeText: { fontSize: 12, fontWeight: '700', color: '#065F46' },

  featureCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  featureCardRow: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', gap: 16 },
  iconCircle: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureTextWrap: { flex: 1 },
  featureTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  featureDesc: { fontSize: 14, color: '#64748B', lineHeight: 20 },

  cta: { marginTop: 32, alignItems: 'center' },
  ctaBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FeaturesScreen;
