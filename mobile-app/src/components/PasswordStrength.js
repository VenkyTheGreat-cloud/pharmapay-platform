import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const getStrength = (password) => {
  if (!password) return { level: 0, label: '', color: '#D1D5DB' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: '#EF4444' };
  if (score <= 3) return { level: 2, label: 'Medium', color: '#EAB308' };
  return { level: 3, label: 'Strong', color: '#22C55E' };
};

const PasswordStrength = ({ password, accentColor = '#10B981' }) => {
  if (!password) return null;

  const { level, label, color } = getStrength(password);

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.barSegment,
              { backgroundColor: i <= level ? color : '#E5E7EB' },
            ]}
          />
        ))}
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
      <View style={styles.checks}>
        {checks.map((c) => (
          <View key={c.label} style={styles.checkRow}>
            <Text style={[styles.checkIcon, { color: c.met ? '#22C55E' : '#9CA3AF' }]}>
              {c.met ? '✓' : '○'}
            </Text>
            <Text style={[styles.checkText, c.met && styles.checkTextMet]}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  barSegment: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontWeight: '600', marginLeft: 8 },
  checks: { gap: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkIcon: { fontSize: 12, fontWeight: '700', width: 14 },
  checkText: { fontSize: 12, color: '#6B7280' },
  checkTextMet: { color: '#374151' },
});

export default PasswordStrength;
