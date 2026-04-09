import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TopNavBar = ({ activeScreen }) => {
  const navigation = useNavigation();
  const links = [
    { label: 'Home', screen: 'Landing' },
    { label: 'Features', screen: 'Features' },
    { label: 'How It Works', screen: 'HowItWorks' },
    { label: 'Pricing', screen: 'Pricing' },
  ];

  return (
    <View style={styles.navbar}>
      <TouchableOpacity style={styles.logo} onPress={() => navigation.navigate('Landing')}>
        <View style={styles.logoIcon}>
          <Ionicons name="storefront" size={16} color="#fff" />
        </View>
        <Text style={styles.logoText}>Pharma<Text style={{ color: '#10B981' }}>Gig</Text></Text>
      </TouchableOpacity>

      <View style={styles.links}>
        {links.map((l) => (
          <TouchableOpacity key={l.screen} onPress={() => navigation.navigate(l.screen)}>
            <Text style={[styles.linkText, activeScreen === l.screen && styles.linkActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.auth}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.getStartedBtn} onPress={() => navigation.navigate('PharmacySignup')}>
          <Text style={styles.getStartedText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={12} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)' } : {}),
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoIcon: { width: 28, height: 28, borderRadius: 7, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  links: { flexDirection: 'row', gap: 16 },
  linkText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  linkActive: { color: '#10B981', fontWeight: '700' },
  auth: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  getStartedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  getStartedText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});

export default TopNavBar;
