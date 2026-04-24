import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopNavBar from '../components/TopNavBar';

const STEPS = [
  {
    number: '1',
    icon: 'people',
    color: '#6366F1',
    title: 'Choose Your Role',
    desc: 'Are you a pharmacy owner looking to launch delivery operations? Or a delivery partner looking for flexible earning? Select your path and get started in seconds.',
    visual: 'roles',
  },
  {
    number: '2',
    icon: 'settings',
    color: '#3B82F6',
    title: 'Sign Up & Configure',
    desc: 'Create your account with basic details. Pharmacy owners choose a plan, customize branding, and configure features. Delivery partners just need a phone number.',
    visual: 'form',
  },
  {
    number: '3',
    icon: 'rocket',
    color: '#139900',
    title: 'Go Live & Thrive',
    desc: 'Pharmacy owners get a live storefront, admin dashboard, and delivery tracking. Delivery partners start receiving orders and earning immediately.',
    visual: 'live',
  },
];

const HowItWorksScreen = ({ navigation }) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <TopNavBar activeScreen="HowItWorks" />

    {/* Hero Header */}
    <View style={styles.heroSection}>
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>
          How PharmaGig <Text style={styles.heroTitleGreen}>works</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          A simple, seamless process to get you started in minutes, no matter your role.
        </Text>
      </View>
    </View>

    <View style={styles.bodyWrap}>

    {STEPS.map((step, i) => (
      <View key={step.number} style={styles.stepContainer}>
        {/* Visual mockup */}
        <View style={[styles.mockup, { borderColor: step.color + '30' }]}>
          {step.visual === 'roles' && (
            <View style={styles.rolesVisual}>
              <View style={styles.roleCircle}>
                <View style={[styles.roleIconBg, { backgroundColor: '#F0F9EC' }]}>
                  <Ionicons name="storefront" size={28} color="#139900" />
                </View>
                <Text style={styles.roleLabel}>Owner</Text>
              </View>
              <Text style={styles.orText}>or</Text>
              <View style={styles.roleCircle}>
                <View style={[styles.roleIconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="bicycle" size={28} color="#3B82F6" />
                </View>
                <Text style={styles.roleLabel}>Partner</Text>
              </View>
            </View>
          )}
          {step.visual === 'form' && (
            <View style={styles.formVisual}>
              <View style={styles.formBar} />
              <View style={styles.formBar} />
              <View style={[styles.formBar, { width: '60%' }]} />
              <View style={styles.formRow}>
                <View style={styles.formBox} />
                <View style={styles.formBox} />
              </View>
              <View style={[styles.formButton, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.formButtonText}>Submit</Text>
              </View>
            </View>
          )}
          {step.visual === 'live' && (
            <View style={styles.liveVisual}>
              <View style={styles.phoneFrame}>
                <View style={styles.phoneScreen}>
                  <Ionicons name="map" size={32} color="#139900" style={{ opacity: 0.5 }} />
                </View>
                <View style={styles.phoneFooter}>
                  <View>
                    <Text style={styles.earningLabel}>Earnings</Text>
                    <Text style={styles.earningAmount}>Rs 1,250</Text>
                  </View>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Step content */}
        <View style={styles.stepContent}>
          <View style={[styles.stepIconCircle, { backgroundColor: step.color }]}>
            <Ionicons name={step.icon} size={22} color="#fff" />
          </View>
          <View style={styles.stepNumberBg}>
            <Text style={styles.stepNumberText}>{step.number}</Text>
          </View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDesc}>{step.desc}</Text>
        </View>
      </View>
    ))}

    {/* CTA */}
    <View style={styles.ctaSection}>
      <Text style={styles.ctaTitle}>Ready to take the next step?</Text>
      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: '#139900' }]}
        onPress={() => navigation.navigate('PharmacySignup')}
      >
        <Text style={styles.ctaBtnText}>Create Pharmacy Account</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.ctaBtnOutline}
        onPress={async () => {
          await AsyncStorage.setItem('pharma_user_role', 'delivery_boy');
          navigation.navigate('Register');
        }}
      >
        <Text style={styles.ctaBtnOutlineText}>Register as Partner</Text>
      </TouchableOpacity>
    </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },

  heroSection: { backgroundColor: '#F1F5F9', paddingTop: 48, paddingBottom: 40, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  heroContent: { maxWidth: 700, alignSelf: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#1E293B', textAlign: 'center', lineHeight: 48, letterSpacing: -0.5 },
  heroTitleGreen: { color: '#139900' },
  heroSubtitle: { fontSize: 15, color: '#64748B', lineHeight: 24, textAlign: 'center', marginTop: 12, maxWidth: 600 },

  bodyWrap: { maxWidth: 1100, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 32 },

  stepContainer: { marginBottom: 40, paddingHorizontal: 20 },

  mockup: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, marginBottom: 20, alignItems: 'center', justifyContent: 'center', minHeight: 180 },

  rolesVisual: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  roleCircle: { alignItems: 'center' },
  roleIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  roleLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  orText: { fontSize: 24, color: '#CBD5E1', fontWeight: '300' },

  formVisual: { width: '80%', gap: 10 },
  formBar: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, width: '100%' },
  formRow: { flexDirection: 'row', gap: 10 },
  formBox: { flex: 1, height: 50, backgroundColor: '#E2E8F0', borderRadius: 8 },
  formButton: { height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  formButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  liveVisual: { alignItems: 'center' },
  phoneFrame: { width: 180, backgroundColor: '#0F172A', borderRadius: 20, padding: 12, borderWidth: 3, borderColor: '#1E293B' },
  phoneScreen: { width: '100%', height: 100, backgroundColor: '#1E293B', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  phoneFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  earningLabel: { fontSize: 10, color: '#94A3B8' },
  earningAmount: { fontSize: 18, fontWeight: '700', color: '#fff' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#139900' },
  liveText: { fontSize: 11, color: '#139900', fontWeight: '600' },

  stepContent: {},
  stepIconCircle: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stepNumberBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepNumberText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  stepDesc: { fontSize: 15, color: '#64748B', lineHeight: 22 },

  ctaSection: { marginTop: 20, alignItems: 'center', paddingHorizontal: 20 },
  ctaTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  ctaBtn: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ctaBtnOutline: { borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  ctaBtnOutlineText: { color: '#334155', fontSize: 16, fontWeight: '700' },
});

export default HowItWorksScreen;
