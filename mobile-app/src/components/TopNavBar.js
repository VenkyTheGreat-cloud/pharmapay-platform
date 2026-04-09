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
    <View style={[styles.navbar, isWide && styles.navbarWide]}>
      <TouchableOpacity style={styles.logo} onPress={() => navigation.navigate('Landing')}>
        <View style={styles.logoIcon}>
          <Ionicons name="storefront" size={14} color="#fff" />
        </View>
        {isWide && <Text style={styles.logoText}>Pharma<Text style={{ color: '#10B981' }}>Gig</Text></Text>}
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linksScroll}>
        {links.map((l) => (
          <TouchableOpacity key={l.screen} onPress={() => navigation.navigate(l.screen)} style={styles.linkBtn}>
            <Text style={[styles.linkText, activeScreen === l.screen && styles.linkActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.auth}>
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
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 50 } : {}),
  },
  navbarWide: { paddingHorizontal: 24 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 },
  logoIcon: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  linksScroll: { flexDirection: 'row', gap: 4, flex: 1 },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  linkText: { fontSize: 11, fontWeight: '500', color: '#64748B' },
  linkActive: { color: '#10B981', fontWeight: '700' },
  auth: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  loginText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  getStartedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  getStartedText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});

export default TopNavBar;
