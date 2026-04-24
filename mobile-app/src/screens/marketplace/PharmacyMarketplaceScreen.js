import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../../config/api';

const PharmacyMarketplaceScreen = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadData = async () => {
    try {
      await Promise.all([fetchPharmacies(), fetchMyApplications()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/marketplace/pharmacies`);
      const json = await res.json();
      if (json.success) {
        setPharmacies(json.data.pharmacies);
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const res = await fetch(`${CONFIG.API_URL}/marketplace/my-applications`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (json.success) {
        const map = {};
        json.data.applications.forEach((app) => {
          map[app.pharmacy_id] = app.status;
        });
        setApplications(map);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleApply = async (pharmacyId) => {
    setApplyingTo(pharmacyId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CONFIG.API_URL}/marketplace/apply/${pharmacyId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
      const json = await res.json();

      if (res.status === 409) {
        Alert.alert('Already Applied', json.error?.message || 'You have already applied to this pharmacy.');
        return;
      }

      if (!res.ok) {
        Alert.alert('Error', json.error?.message || 'Something went wrong.');
        return;
      }

      setApplications((prev) => ({ ...prev, [pharmacyId]: 'pending' }));
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setApplyingTo(null);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const renderBadge = (pharmacyId, isAccepting) => {
    const status = applications[pharmacyId];

    if (status === 'approved') {
      return (
        <View style={[styles.badge, styles.badgeApproved]}>
          <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>Approved</Text>
        </View>
      );
    }

    if (status === 'pending') {
      return (
        <View style={[styles.badge, styles.badgePending]}>
          <Ionicons name="time" size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>Pending</Text>
        </View>
      );
    }

    if (status === 'rejected') {
      return (
        <View style={[styles.badge, styles.badgeRejected]}>
          <Text style={styles.badgeText}>Rejected</Text>
        </View>
      );
    }

    if (status === 'paused') {
      return (
        <View style={[styles.badge, styles.badgePaused]}>
          <Text style={styles.badgeText}>Paused</Text>
        </View>
      );
    }

    // No application yet — show Apply button
    return (
      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => handleApply(pharmacyId)}
        disabled={applyingTo === pharmacyId}
      >
        {applyingTo === pharmacyId ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.applyButtonText}>Apply</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderPharmacyCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.pharmacyName}>{item.display_name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.locationText}>
            {[item.area, item.city].filter(Boolean).join(', ') || 'Location not set'}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          {item.is_accepting_riders ? (
            <View style={[styles.statusBadge, styles.statusAccepting]}>
              <Text style={styles.statusBadgeText}>Accepting riders</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusNotAccepting]}>
              <Text style={[styles.statusBadgeText, { color: '#6B7280' }]}>Not accepting</Text>
            </View>
          )}
          {renderBadge(item.id, item.is_accepting_riders)}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading pharmacies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Pharmacies Near You</Text>
      </View>

      <FlatList
        data={pharmacies}
        keyExtractor={(item) => item.id}
        renderItem={renderPharmacyCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No pharmacies found in your area</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardBody: {
    padding: 16,
  },
  pharmacyName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusAccepting: {
    backgroundColor: '#E6F5E0',
  },
  statusNotAccepting: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#118500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  badgeApproved: {
    backgroundColor: '#118500',
  },
  badgePending: {
    backgroundColor: '#F59E0B',
  },
  badgeRejected: {
    backgroundColor: '#EF4444',
  },
  badgePaused: {
    backgroundColor: '#6B7280',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default PharmacyMarketplaceScreen;
