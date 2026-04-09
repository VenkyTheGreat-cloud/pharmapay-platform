import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TopNavBar = ({ activeScreen }) => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  const links = [
    { label: 'Home', screen: 'Landing' },
    { label: 'Features', screen: 'Features' },
    { label: 'How It Works', screen: 'HowItWorks' },
    { label: 'Pricing', screen: 'Pricing' },
  ];

  return (
    <View style={styles.container}>
      {/* Top row: Logo + Login */}
      <View style={[styles.topRow, isWide && styles.topRowWide]}>
        <TouchableOpacity style={styles.logo} onPress={() => navigation.navigate('Landing')}>
          <View style={styles.logoIcon}>
            <Ionicons name="storefront" size={14} color="#fff" />
          </View>
          <Text style={styles.logoText}>Pharma<Text style={{ color: '#10B981' }}>Gig</Text></Text>
        </TouchableOpacity>

        {/* Wide: inline links */}
        {isWide && (
          <View style={styles.inlineLinks}>
            {links.map((l) => (
              <TouchableOpacity key={l.screen} onPress={() => navigation.navigate(l.screen)}>
                <Text style={[styles.inlineLinkText, activeScreen === l.screen && styles.inlineLinkActive]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.authRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
          {isWide && (
            <TouchableOpacity style={styles.getStartedBtn} onPress={() => navigation.navigate('PharmacySignup')}>
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={12} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Narrow: scrollable pill tabs below */}
      {!isWide && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow} contentContainerStyle={styles.pillRowContent}>
          {links.map((l) => (
            <TouchableOpacity
              key={l.screen}
              style={[styles.pill, activeScreen === l.screen && styles.pillActive]}
              onPress={() => navigation.navigate(l.screen)}
            >
              <Text style={[styles.pillText, activeScreen === l.screen && styles.pillTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 50 } : {}),
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  topRowWide: { paddingHorizontal: 32 },

  logo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoIcon: { width: 26, height: 26, borderRadius: 7, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  inlineLinks: { flexDirection: 'row', gap: 24 },
  inlineLinkText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  inlineLinkActive: { color: '#10B981', fontWeight: '700' },

  authRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginText: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  getStartedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  getStartedText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  pillRow: { paddingBottom: 8 },
  pillRowContent: { paddingHorizontal: 12, gap: 6 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9' },
  pillActive: { backgroundColor: '#D1FAE5' },
  pillText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  pillTextActive: { color: '#065F46', fontWeight: '700' },
});

export default TopNavBar;
