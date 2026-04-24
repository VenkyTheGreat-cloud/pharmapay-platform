import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Platform,
  NativeModules,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const { CaptureNativeModule } = NativeModules;

const ACCENT = '#3B82F6';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        apiService.getMyOrders().catch(() => ({ data: [] })),
        apiService.getPaymentStatistics().catch(() => ({ data: {} })),
      ]);
      const orderData = ordersRes.data?.data || ordersRes.data;
      setOrders(Array.isArray(orderData) ? orderData : []);
      setStats(statsRes.data?.data || statsRes.data || {});
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-start capture monitor service on Android (after permissions are granted)
    if (Platform.OS === 'android' && CaptureNativeModule) {
      CaptureNativeModule.checkCapturePermissions()
        .then((perms) => {
          if (perms.recordAudio && perms.readPhoneState) {
            return CaptureNativeModule.startCaptureMonitor();
          }
        })
        .catch(() => {});
    }
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const activeOrders = orders.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status));
  const completedToday = orders.filter(o => o.status === 'DELIVERED');
  const totalEarnings = stats.totalEarnings ?? stats.total_earnings ?? 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Partner'}!</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.subheading}>Here's what's happening today.</Text>

      {/* Stat Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Today's Earnings"
          value={`Rs ${totalEarnings.toLocaleString('en-IN')}`}
          icon="wallet-outline"
          color="#139900"
        />
        <StatCard
          title="Deliveries Done"
          value={String(completedToday.length)}
          icon="checkmark-circle-outline"
          color="#3B82F6"
        />
        <StatCard
          title="Active Orders"
          value={String(activeOrders.length)}
          icon="bicycle-outline"
          color="#F59E0B"
        />
        <StatCard
          title="Rating"
          value={stats.rating || '4.9/5'}
          icon="star-outline"
          color="#8B5CF6"
        />
      </View>

      {/* Active Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {activeOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle" size={40} color="#139900" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyDesc}>No active deliveries right now.</Text>
          </View>
        ) : (
          activeOrders.slice(0, 4).map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('Orders', {
                screen: 'OrderDetails',
                params: { orderId: order.id },
              })}
            >
              <View style={styles.orderIconCircle}>
                <Ionicons name="cube-outline" size={20} color={ACCENT} />
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>Order #{order.orderNumber || order.id}</Text>
                <Text style={styles.orderAddress} numberOfLines={1}>
                  {order.customer_address || order.customer_name || 'Delivery'}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>Rs {order.amount || 0}</Text>
                <Text style={styles.orderStatus}>{order.status?.replace('_', ' ')}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Marketplace')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F0F9EC' }]}>
              <Ionicons name="storefront-outline" size={22} color="#139900" />
            </View>
            <Text style={styles.actionLabel}>Browse Pharmacies</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={async () => {
              if (Platform.OS === 'android' && CaptureNativeModule) {
                try {
                  const perms = await CaptureNativeModule.checkCapturePermissions();
                  if (!perms.recordAudio || !perms.readPhoneState || !perms.readCallLog) {
                    const granted = await CaptureNativeModule.requestCapturePermissions();
                    if (!granted) {
                      Alert.alert(
                        'Permissions Required',
                        'Voice capture needs microphone, phone state, and call log permissions. Please grant them in app settings.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Open Settings', onPress: () => CaptureNativeModule.openAppSettings() },
                        ]
                      );
                      return;
                    }
                  }
                } catch (e) {
                  console.log('Permission check error:', e);
                }
              }
              navigation.navigate('Orders', { screen: 'CaptureReview' });
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="mic-outline" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.actionLabel}>Incoming Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Orders')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="list-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabel}>All Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="person-outline" size={22} color="#8B5CF6" />
            </View>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statTitle}>{title}</Text>
      <Ionicons name={icon} size={18} color="#94A3B8" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { fontSize: 14, color: '#64748B' },
  userName: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  subheading: { fontSize: 14, color: '#64748B', marginBottom: 20 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statTitle: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#0F172A' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  viewAll: { fontSize: 13, fontWeight: '600', color: ACCENT },

  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#64748B', marginTop: 4 },

  orderCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  orderIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1 },
  orderNumber: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  orderAddress: { fontSize: 12, color: '#64748B', marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderAmount: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  orderStatus: { fontSize: 11, color: '#139900', fontWeight: '600', marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center' },
});

export default DashboardScreen;
