import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LOGO = require('../../assets/logo.png');

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;

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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Top row: Logo + Links + Auth */}
      <View style={[styles.topRow, isWide && styles.topRowWide]}>
        <TouchableOpacity style={styles.logo} onPress={() => navigation.navigate('Landing')}>
          <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
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
          <TouchableOpacity style={styles.getStartedBtn} onPress={() => navigation.navigate('PharmacySignup')}>
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'web' ? 0 : STATUS_BAR_HEIGHT,
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 50 } : {}),
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 12,
  },
  topRowWide: { paddingHorizontal: 48 },

  logo: { flexDirection: 'row', alignItems: 'center' },
  logoImg: { width: 120, height: 40 },

  inlineLinks: { flexDirection: 'row', gap: 28 },
  inlineLinkText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  inlineLinkActive: { color: '#10B981', fontWeight: '700' },

  authRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  loginText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  getStartedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  getStartedText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  pillRow: { paddingBottom: 8 },
  pillRowContent: { paddingHorizontal: 12, gap: 6 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9' },
  pillActive: { backgroundColor: '#D1FAE5' },
  pillText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  pillTextActive: { color: '#065F46', fontWeight: '700' },
});

export default TopNavBar;
