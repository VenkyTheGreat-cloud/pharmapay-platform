import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';
import { pharmacyAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  pending_approval: {
    icon: '\u23F3',
    title: 'Under Review',
    message: 'Your pharmacy is being reviewed by our team. This usually takes 1-2 business days.',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  submitted: {
    icon: '\u23F3',
    title: 'Under Review',
    message: 'Your pharmacy submission is being reviewed. We will notify you once approved.',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  approved: {
    icon: '\u2705',
    title: 'Approved!',
    message: 'Your pharmacy has been approved. We are setting everything up for you.',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  live: {
    icon: '\uD83D\uDE80',
    title: 'Your Pharmacy is Live!',
    message: 'Congratulations! Your pharmacy is up and running.',
    color: '#20b1aa',
    bgColor: '#F0FDFA',
  },
  rejected: {
    icon: '\u274C',
    title: 'Changes Requested',
    message: 'Please address the feedback below and resubmit.',
    color: '#EF4444',
    bgColor: '#FEF2F2',
  },
};

const PharmacyStatusScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const res = await pharmacyAPI.getBuildStatus();
      const data = res.data?.data || res.data;
      setPharmacy(data);
    } catch {
      // Try fallback
      try {
        const res = await pharmacyAPI.getMyPharmacy();
        const data = res.data?.data || res.data;
        setPharmacy(data);
      } catch {
        // Will show loading state
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRefresh = () => {
    setLoading(true);
    loadStatus();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20b1aa" />
        <Text style={styles.loadingText}>Loading status...</Text>
      </View>
    );
  }

  const status = pharmacy?.status || 'pending_approval';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_approval;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Navigation */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Landing')}>
          <Text style={{ fontSize: 16, color: '#20b1aa', fontWeight: '600' }}>← Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          if (Platform.OS === 'web') { logout(); } else {
            const { Alert } = require('react-native');
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ]);
          }
        }}>
          <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: config.bgColor, borderColor: config.color }]}>
        <Text style={styles.statusIcon}>{config.icon}</Text>
        <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
        <Text style={styles.statusMessage}>{config.message}</Text>
      </View>

      {/* Live — show URLs */}
      {status === 'live' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Pharmacy Details</Text>

          {pharmacy.store_url && (
            <View style={styles.urlCard}>
              <Text style={styles.urlLabel}>Store URL</Text>
              <TouchableOpacity onPress={() => Linking.openURL(pharmacy.store_url)}>
                <Text style={styles.urlValue}>{pharmacy.store_url}</Text>
              </TouchableOpacity>
            </View>
          )}

          {pharmacy.admin_url && (
            <View style={styles.urlCard}>
              <Text style={styles.urlLabel}>Admin Panel</Text>
              <TouchableOpacity onPress={() => Linking.openURL(pharmacy.admin_url)}>
                <Text style={styles.urlValue}>{pharmacy.admin_url}</Text>
              </TouchableOpacity>
            </View>
          )}

          {pharmacy.client_code && (
            <View style={styles.urlCard}>
              <Text style={styles.urlLabel}>Client Code</Text>
              <Text style={styles.clientCode}>{pharmacy.client_code}</Text>
            </View>
          )}
        </View>
      )}

      {/* Rejected — show reason */}
      {status === 'rejected' && pharmacy.rejection_reason && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <View style={styles.reasonCard}>
            <Text style={styles.reasonText}>{pharmacy.rejection_reason}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('PharmacyConfigure')}
          >
            <Text style={styles.editBtnText}>Edit Configuration</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
        <Text style={styles.refreshBtnText}>Refresh Status</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  statusCard: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    marginBottom: 28,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  urlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urlLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  urlValue: {
    fontSize: 15,
    color: '#20b1aa',
    fontWeight: '600',
  },
  clientCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 2,
  },
  reasonCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  reasonText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  editBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  refreshBtn: {
    borderWidth: 2,
    borderColor: '#20b1aa',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  refreshBtnText: {
    color: '#20b1aa',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PharmacyStatusScreen;
