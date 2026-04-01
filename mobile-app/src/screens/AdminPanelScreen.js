import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { pharmacyAPI } from '../services/api';

const STATUS_COLORS = {
  pending_approval: '#F59E0B',
  submitted: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
  live: '#8B5CF6',
};

const STATUS_LABELS = {
  pending_approval: 'Pending Approval',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  live: 'Live',
};

const AdminPanelScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ visible: false, pharmacyId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState(null);

  const fetchPharmacies = useCallback(async () => {
    try {
      setError(null);
      const response = await pharmacyAPI.listAllPharmacies();
      const data = response.data?.data || response.data;
      const list = data?.pharmacies || (Array.isArray(data) ? data : []);
      setPharmacies(list);
    } catch (err) {
      console.error('Failed to load pharmacies:', err);
      setError('Failed to load pharmacies. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    await fetchPharmacies();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPharmacies();
    setRefreshing(false);
  };

  const handleApprove = async (id) => {
    const doApprove = async () => {
      setActionLoading(id);
      try {
        await pharmacyAPI.approvePharmacy(id);
        await fetchPharmacies();
      } catch (err) {
        const msg = err?.response?.data?.error || 'Failed to approve pharmacy.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          const { Alert } = require('react-native');
          Alert.alert('Error', msg);
        }
      } finally {
        setActionLoading(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Approve this pharmacy application?')) {
        await doApprove();
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Confirm', 'Approve this pharmacy application?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: doApprove },
      ]);
    }
  };

  const openRejectModal = (id) => {
    setRejectReason('');
    setRejectModal({ visible: true, pharmacyId: id });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please provide a reason for rejection.');
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Required', 'Please provide a reason for rejection.');
      }
      return;
    }

    const id = rejectModal.pharmacyId;
    setRejectModal({ visible: false, pharmacyId: null });
    setActionLoading(id);

    try {
      await pharmacyAPI.rejectPharmacy(id, rejectReason.trim());
      await fetchPharmacies();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to reject pharmacy.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Error', msg);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const getFeaturesCount = (pharmacy) => {
    if (!pharmacy.features) return 0;
    if (typeof pharmacy.features === 'object') {
      return Object.values(pharmacy.features).filter(Boolean).length;
    }
    return 0;
  };

  const renderStatusBadge = (status) => {
    const color = STATUS_COLORS[status] || '#6B7280';
    const label = STATUS_LABELS[status] || status;
    return (
      <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderActions = (pharmacy) => {
    const isLoading = actionLoading === pharmacy.id;

    if (isLoading) {
      return <ActivityIndicator size="small" color="#20b1aa" style={{ marginTop: 8 }} />;
    }

    if (pharmacy.status === 'submitted') {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleApprove(pharmacy.id)}
          >
            <Text style={styles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => openRejectModal(pharmacy.id)}
          >
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (pharmacy.status === 'pending_approval') {
      return <Text style={styles.statusNote}>Awaiting submission</Text>;
    }

    if (pharmacy.status === 'live') {
      return <Text style={styles.statusNoteLive}>Live {'\u2713'}</Text>;
    }

    return null;
  };

  const renderPharmacyCard = ({ item }) => {
    const brandingColor = item.branding?.primary_color || item.branding?.primaryColor || null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name || 'Unnamed Pharmacy'}</Text>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Slug:</Text>
            <Text style={styles.detailValue}>{item.slug || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan:</Text>
            <Text style={styles.detailValue}>{item.plan || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Owner:</Text>
            <Text style={styles.detailValue}>{item.owner?.email || item.owner_email || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Features:</Text>
            <Text style={styles.detailValue}>{getFeaturesCount(item)} enabled</Text>
          </View>
          {brandingColor && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand Color:</Text>
              <View style={styles.colorSwatchRow}>
                <View style={[styles.colorSwatch, { backgroundColor: brandingColor }]} />
                <Text style={styles.detailValue}>{brandingColor}</Text>
              </View>
            </View>
          )}
        </View>

        {renderActions(item)}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#20b1aa" />
        <Text style={styles.loadingText}>Loading pharmacies...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Pharmacy Applications ({pharmacies.length})
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={pharmacies}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPharmacyCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#20b1aa"
            colors={['#20b1aa']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pharmacy applications yet.</Text>
          </View>
        }
      />

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModal({ visible: false, pharmacyId: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Pharmacy</Text>
            <Text style={styles.modalLabel}>Reason for rejection:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setRejectModal({ visible: false, pharmacyId: null })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalRejectBtn]}
                onPress={handleReject}
              >
                <Text style={styles.modalRejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#20b1aa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    width: 90,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  colorSwatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statusNote: {
    marginTop: 10,
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  statusNoteLive: {
    marginTop: 10,
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  modalRejectBtn: {
    backgroundColor: '#EF4444',
  },
  modalRejectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminPanelScreen;
