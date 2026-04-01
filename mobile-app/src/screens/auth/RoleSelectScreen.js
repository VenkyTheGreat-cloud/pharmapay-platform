import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ROLE_KEY = 'pharma_user_role';

const RoleSelectScreen = ({ navigation }) => {
  const handleDeliveryBoy = async () => {
    await AsyncStorage.setItem(ROLE_KEY, 'delivery_boy');
    navigation.replace('Login');
  };

  const handlePharmacyOwner = () => {
    navigation.navigate('PharmacySignup');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, color: '#20b1aa', fontWeight: '600' }}>← Back to Home</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>SwinkPayPharma</Text>
        <Text style={styles.subtitle}>Choose how you'd like to get started</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.roleButton} onPress={handleDeliveryBoy}>
          <Text style={styles.roleEmoji}>🚴</Text>
          <Text style={styles.roleTitle}>I am a delivery boy</Text>
          <Text style={styles.roleDesc}>Deliver orders and earn money</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.roleButtonOutline]}
          onPress={handlePharmacyOwner}
        >
          <Text style={styles.roleEmoji}>🏪</Text>
          <Text style={[styles.roleTitle, styles.roleTitleOutline]}>I own a pharmacy</Text>
          <Text style={[styles.roleDesc, { color: '#6B7280' }]}>Set up and manage your pharmacy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  buttons: {
    gap: 16,
  },
  roleButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  roleButtonOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleTitleOutline: {
    color: '#3B82F6',
  },
  roleDesc: {
    fontSize: 14,
    color: '#E5E7EB',
  },
});

export default RoleSelectScreen;
