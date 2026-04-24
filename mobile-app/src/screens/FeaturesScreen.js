import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopNavBar from '../components/TopNavBar';

const OWNER_FEATURES = [
  { icon: 'phone-portrait-outline', title: 'White-labeled Platform', desc: "Launch your pharmacy's custom-branded delivery app. Your logo, your colors, your rules." },
  { icon: 'location-outline', title: 'Live GPS Tracking', desc: 'Track every order in real-time from dispatch to doorstep delivery.' },
  { icon: 'people-outline', title: 'Partner Management', desc: 'Assign orders, track performance, and manage your delivery fleet from one dashboard.' },
  { icon: 'cash-outline', title: 'Automated Settlements', desc: 'Seamlessly handle COD, online payments, and daily or weekly partner payouts.' },
  { icon: 'trending-up-outline', title: 'Advanced Analytics', desc: 'Get insights into delivery times, partner performance, and customer satisfaction.' },
  { icon: 'shield-checkmark-outline', title: 'Secure Verification', desc: 'KYC verified delivery partners and secure OTP-based delivery confirmation.' },
];

const PARTNER_FEATURES = [
  { icon: 'time-outline', title: 'Flexible Earning', desc: 'Work on your own schedule. Accept or decline deliveries. No minimum hours.' },
  { icon: 'map-outline', title: 'Smart Navigation', desc: 'In-app GPS navigation optimized for fast medicine delivery in your city.' },
  { icon: 'wallet-outline', title: 'Transparent Payouts', desc: 'See your earnings in real-time. Weekly direct bank transfers, no hidden deductions.' },
  { icon: 'checkmark-circle-outline', title: 'Easy Onboarding', desc: 'Sign up in minutes. No vehicle ownership required. Start earning the same day.' },
];

const FeaturesScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TopNavBar activeScreen="Features" />

      {/* Hero Header */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Powerful features for modern{'\n'}
            <Text style={styles.heroTitleGreen}>pharmacies</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Everything you need to run a successful medicine delivery operation, whether you're managing a pharmacy or driving the deliveries.
          </Text>
        </View>
      </View>

      {/* Body Content */}
      <View style={styles.bodyWrap}>
        {/* Pharmacy Owners */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>For Pharmacy Owners</Text>
          <View style={styles.proBadge}><Text style={styles.proBadgeText}>Pro Tools</Text></View>
        </View>

        <View style={isWide ? styles.gridRow : undefined}>
          {OWNER_FEATURES.map((f) => (
            <View key={f.title} style={[styles.featureCard, isWide && styles.featureCardWide]}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0F9EC' }]}>
                <Ionicons name={f.icon} size={22} color="#139900" />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Partners */}
        <View style={[styles.sectionHeader, { marginTop: 40 }]}>
          <Text style={styles.sectionTitle}>For Delivery Partners</Text>
          <View style={[styles.proBadge, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.proBadgeText, { color: '#1E40AF' }]}>100% Free</Text>
          </View>
        </View>

        <View style={isWide ? styles.gridRow : undefined}>
          {PARTNER_FEATURES.map((f) => (
            <View key={f.title} style={[styles.featureCard, isWide && styles.featureCardWide]}>
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name={f.icon} size={22} color="#3B82F6" />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('PharmacySignup')}>
            <Text style={styles.ctaBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },

  // Hero section - light gray bg, full width
  heroSection: { backgroundColor: '#F1F5F9', paddingTop: 48, paddingBottom: 40, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  heroContent: { maxWidth: 700, alignSelf: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#1E293B', textAlign: 'center', lineHeight: 48, letterSpacing: -0.5 },
  heroTitleGreen: { color: '#139900' },
  heroSubtitle: { fontSize: 15, color: '#64748B', lineHeight: 24, textAlign: 'center', marginTop: 12, maxWidth: 600 },

  // Body
  bodyWrap: { maxWidth: 1100, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 32 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  proBadge: { backgroundColor: '#F0F9EC', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  proBadgeText: { fontSize: 12, fontWeight: '700', color: '#0D6600' },

  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featureCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  featureCardWide: { flex: 1, minWidth: 280, maxWidth: '33%' },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  featureTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  featureDesc: { fontSize: 14, color: '#64748B', lineHeight: 22 },

  cta: { marginTop: 40, alignItems: 'center' },
  ctaBtn: { backgroundColor: '#139900', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FeaturesScreen;
