import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../../config/api';

const MyPharmaciesScreen = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyPharmacies();
  }, []);

  const fetchMyPharmacies = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.MARKETPLACE.MY_APPLICATIONS}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json();

      if (json.success) {
        const approved = json.data.applications.filter(
          (app) => app.status === 'approved'
        );
        setPharmacies(approved);
      }
    } catch (error) {
      console.error('Error fetching my pharmacies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyPharmacies();
  }, []);

  const isExpired = (contractEnd) => {
    if (!contractEnd) return false;
    return new Date(contractEnd) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPharmacyCard = ({ item }) => {
    const expired = isExpired(item.contract_end);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.pharmacyName}>
            {item.pharmacy_name || item.display_name || 'Pharmacy'}
          </Text>
          <View style={[styles.statusBadge, expired ? styles.badgeExpired : styles.badgeActive]}>
            <Text style={styles.badgeText}>{expired ? 'Expired' : 'Active'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={styles.detailValue}>{item.status}</Text>
        </View>

        {item.rate_per_km != null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate per KM</Text>
            <Text style={styles.detailValue}>Rs. {item.rate_per_km}</Text>
          </View>
        )}

        {item.base_rate != null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Base Rate</Text>
            <Text style={styles.detailValue}>Rs. {item.base_rate}</Text>
          </View>
        )}

        {item.contract_period && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contract Period</Text>
            <Text style={styles.detailValue}>{item.contract_period}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contract Start</Text>
          <Text style={styles.detailValue}>{formatDate(item.contract_start)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contract End</Text>
          <Text style={styles.detailValue}>{formatDate(item.contract_end)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your pharmacies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pharmacies</Text>
      </View>

      <FlatList
        data={pharmacies}
        keyExtractor={(item) => String(item.id)}
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
            <Text style={styles.emptyText}>No approved pharmacies yet</Text>
            <Text style={styles.emptySubtext}>
              Apply to pharmacies in the Marketplace to get started
            </Text>
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pharmacyName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: '#059669',
  },
  badgeExpired: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default MyPharmaciesScreen;
