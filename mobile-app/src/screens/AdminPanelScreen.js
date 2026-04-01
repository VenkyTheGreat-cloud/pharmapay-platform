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
  ScrollView,
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

const TABS = ['Applications', 'Revenue', 'Analytics', 'Delivery Boys', 'Payments'];

const AdminPanelScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Applications');

  // Applications state (existing)
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ visible: false, pharmacyId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState(null);

  // Revenue state
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [revenueTransactions, setRevenueTransactions] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Analytics state
  const [pharmacyAnalytics, setPharmacyAnalytics] = useState(null);
  const [onboardingFunnel, setOnboardingFunnel] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Delivery Boys state
  const [deliveryBoyOverview, setDeliveryBoyOverview] = useState(null);
  const [deliveryBoysLoading, setDeliveryBoysLoading] = useState(false);

  // Payments state
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // ---- Applications logic (existing, unchanged) ----

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
    if (activeTab === 'Applications') await fetchPharmacies();
    else if (activeTab === 'Revenue') await fetchRevenueData();
    else if (activeTab === 'Analytics') await fetchAnalyticsData();
    else if (activeTab === 'Delivery Boys') await fetchDeliveryBoysData();
    else if (activeTab === 'Payments') await fetchPaymentsData();
    setRefreshing(false);
  };

  const handleApprove = async (id) => {
    const pharmacy = pharmacies.find(p => p.id === id);
    const slug = pharmacy?.slug || '';

    const doApprove = async () => {
      setActionLoading(id);
      try {
        await pharmacyAPI.approvePharmacy(id);
        await fetchPharmacies();
        const successMsg = `Pharmacy "${pharmacy?.name || slug}" is now LIVE!\n\nStore: https://${slug}.pharmapay.swinkpay-fintech.com\nAdmin: https://${slug}.pharmapay.swinkpay-fintech.com/admin\nClient Code: ${slug.toUpperCase()}-01`;
        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          const { Alert } = require('react-native');
          Alert.alert('Approved!', successMsg);
        }
      } catch (err) {
        const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to approve pharmacy.';
        if (Platform.OS === 'web') {
          window.alert('Error: ' + msg);
        } else {
          const { Alert } = require('react-native');
          Alert.alert('Error', msg);
        }
      } finally {
        setActionLoading(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Approve "${pharmacy?.name || slug}" and make it LIVE?`)) {
        await doApprove();
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Confirm', `Approve "${pharmacy?.name || slug}" and make it LIVE?`, [
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

  // ---- Tab data fetchers ----

  const fetchRevenueData = async () => {
    setRevenueLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        pharmacyAPI.getRevenueSummary(),
        pharmacyAPI.getRevenueTransactions(),
      ]);
      setRevenueSummary(summaryRes.data?.data || summaryRes.data);
      const txData = txRes.data?.data || txRes.data;
      setRevenueTransactions(Array.isArray(txData) ? txData : txData?.transactions || []);
    } catch (err) {
      console.error('Failed to load revenue data:', err);
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const [analyticsRes, funnelRes] = await Promise.all([
        pharmacyAPI.getPharmacyAnalytics(),
        pharmacyAPI.getOnboardingFunnel(),
      ]);
      setPharmacyAnalytics(analyticsRes.data?.data || analyticsRes.data);
      setOnboardingFunnel(funnelRes.data?.data || funnelRes.data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchDeliveryBoysData = async () => {
    setDeliveryBoysLoading(true);
    try {
      const res = await pharmacyAPI.getDeliveryBoyOverview();
      setDeliveryBoyOverview(res.data?.data || res.data);
    } catch (err) {
      console.error('Failed to load delivery boys data:', err);
    } finally {
      setDeliveryBoysLoading(false);
    }
  };

  const fetchPaymentsData = async () => {
    setPaymentsLoading(true);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        pharmacyAPI.getPaymentSummary(),
        pharmacyAPI.getPaymentHistory(),
      ]);
      setPaymentSummary(summaryRes.data?.data || summaryRes.data);
      const histData = historyRes.data?.data || historyRes.data;
      setPaymentHistory(Array.isArray(histData) ? histData : histData?.payments || []);
    } catch (err) {
      console.error('Failed to load payments data:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'Revenue' && !revenueSummary && !revenueLoading) {
      fetchRevenueData();
    } else if (activeTab === 'Analytics' && !pharmacyAnalytics && !analyticsLoading) {
      fetchAnalyticsData();
    } else if (activeTab === 'Delivery Boys' && !deliveryBoyOverview && !deliveryBoysLoading) {
      fetchDeliveryBoysData();
    } else if (activeTab === 'Payments' && !paymentSummary && !paymentsLoading) {
      fetchPaymentsData();
    }
  }, [activeTab]);

  // ---- Helpers ----

  const formatCurrency = (amount) => {
    if (amount == null) return '--';
    return '\u20B9' + Number(amount).toLocaleString('en-IN');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ---- Tab Renderers ----

  const renderTabBar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBar}
      contentContainerStyle={styles.tabBarContent}
    >
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ---- Revenue Tab ----

  const renderRevenueTab = () => {
    if (revenueLoading) {
      return (
        <View style={styles.centeredTab}>
          <ActivityIndicator size="large" color="#20b1aa" />
          <Text style={styles.loadingText}>Loading revenue data...</Text>
        </View>
      );
    }

    const summary = revenueSummary || {};
    const rawPlan = summary.planDistribution || summary.plan_distribution || [];
    const planDistribution = Array.isArray(rawPlan)
      ? rawPlan.reduce((acc, item) => { acc[item.plan] = parseInt(item.count) || 0; return acc; }, {})
      : rawPlan;

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20b1aa" colors={['#20b1aa']} />
        }
      >
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.activePharmacies ?? summary.active_pharmacies ?? '--'}</Text>
            <Text style={styles.summaryLabel}>Active Pharmacies</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{formatCurrency(summary.totalRevenue ?? summary.total_revenue)}</Text>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{formatCurrency(summary.monthlyRecurringRevenue ?? summary.monthly_recurring_revenue)}</Text>
            <Text style={styles.summaryLabel}>Monthly Recurring</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Plan Distribution</Text>
        <View style={styles.summaryRow}>
          {['starter', 'growth', 'enterprise'].map((plan) => (
            <View key={plan} style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{planDistribution[plan] ?? '--'}</Text>
              <Text style={styles.summaryLabel}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {revenueTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet.</Text>
        ) : (
          revenueTransactions.map((tx, index) => (
            <View key={tx.id || index} style={styles.listCard}>
              <View style={styles.listCardRow}>
                <Text style={styles.listCardName}>{tx.pharmacyName || tx.pharmacy_name || 'Unknown'}</Text>
                <Text style={styles.listCardAmount}>{formatCurrency(tx.amount)}</Text>
              </View>
              <View style={styles.listCardRow}>
                <Text style={styles.listCardDate}>{formatDate(tx.date || tx.created_at)}</Text>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: tx.status === 'success' || tx.status === 'completed' ? '#10B981' : tx.status === 'pending' ? '#F59E0B' : '#EF4444' },
                ]} />
                <Text style={styles.listCardStatus}>{tx.status || '--'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  // ---- Analytics Tab ----

  const FUNNEL_STEPS = ['Signed Up', 'Configured', 'Branded', 'Paid', 'Live'];
  const FUNNEL_KEYS = ['signed_up', 'configured', 'branded', 'paid', 'live'];

  const renderAnalyticsTab = () => {
    if (analyticsLoading) {
      return (
        <View style={styles.centeredTab}>
          <ActivityIndicator size="large" color="#20b1aa" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      );
    }

    const funnel = onboardingFunnel || {};
    const analytics = pharmacyAnalytics || {};
    // API returns array [{status, count}], convert to object {status: count}
    const rawStatus = analytics.statusBreakdown || analytics.status_breakdown || [];
    const statusBreakdown = Array.isArray(rawStatus)
      ? rawStatus.reduce((acc, item) => { acc[item.status] = parseInt(item.count) || 0; return acc; }, {})
      : rawStatus;
    const recentSignups = analytics.recentSignups || analytics.recent_signups || [];

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20b1aa" colors={['#20b1aa']} />
        }
      >
        <Text style={styles.sectionTitle}>Onboarding Funnel</Text>
        {FUNNEL_STEPS.map((step, i) => {
          const count = funnel[FUNNEL_KEYS[i]] ?? funnel[step.toLowerCase()] ?? '--';
          const maxCount = funnel[FUNNEL_KEYS[0]] || 1;
          const barWidth = count !== '--' ? Math.max((count / maxCount) * 100, 8) : 8;
          return (
            <View key={step} style={styles.funnelRow}>
              <Text style={styles.funnelLabel}>{step}</Text>
              <View style={styles.funnelBarBg}>
                <View style={[styles.funnelBar, { width: `${barWidth}%` }]} />
              </View>
              <Text style={styles.funnelCount}>{count}</Text>
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Status Breakdown</Text>
        <View style={styles.statusGrid}>
          {Object.entries(statusBreakdown).map(([status, count]) => {
            const color = STATUS_COLORS[status] || '#6B7280';
            return (
              <View key={status} style={styles.statusItem}>
                <View style={[styles.statusIndicator, { backgroundColor: color }]} />
                <Text style={styles.statusItemLabel}>{STATUS_LABELS[status] || status}</Text>
                <Text style={styles.statusItemCount}>{count}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Recent Signups</Text>
        {recentSignups.length === 0 ? (
          <Text style={styles.emptyText}>No recent signups.</Text>
        ) : (
          recentSignups.slice(0, 10).map((pharmacy, index) => (
            <View key={pharmacy.id || index} style={styles.listCard}>
              <View style={styles.listCardRow}>
                <Text style={styles.listCardName}>{pharmacy.name || 'Unnamed'}</Text>
                {renderStatusBadge(pharmacy.status)}
              </View>
              <View style={styles.listCardRow}>
                <Text style={styles.listCardDate}>{pharmacy.slug || '--'}</Text>
                <Text style={styles.listCardDate}>{formatDate(pharmacy.created_at || pharmacy.createdAt)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  // ---- Delivery Boys Tab ----

  const renderDeliveryBoysTab = () => {
    if (deliveryBoysLoading) {
      return (
        <View style={styles.centeredTab}>
          <ActivityIndicator size="large" color="#20b1aa" />
          <Text style={styles.loadingText}>Loading delivery boy data...</Text>
        </View>
      );
    }

    const overview = deliveryBoyOverview || {};
    const summary = overview.summary || overview;
    const perPharmacy = overview.perPharmacy || overview.per_pharmacy || [];

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20b1aa" colors={['#20b1aa']} />
        }
      >
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.totalDeliveryBoys ?? summary.total_delivery_boys ?? '--'}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.active ?? '--'}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.pendingApplications ?? summary.pending_applications ?? '--'}</Text>
            <Text style={styles.summaryLabel}>Pending Applications</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.approvedEngagements ?? summary.approved_engagements ?? '--'}</Text>
            <Text style={styles.summaryLabel}>Approved Engagements</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Per Pharmacy</Text>
        {perPharmacy.length === 0 ? (
          <Text style={styles.emptyText}>No data available.</Text>
        ) : (
          perPharmacy.map((item, index) => (
            <View key={item.pharmacyId || item.pharmacy_id || index} style={styles.listCard}>
              <View style={styles.listCardRow}>
                <Text style={styles.listCardName}>{item.pharmacyName || item.pharmacy_name || 'Unknown'}</Text>
                <Text style={styles.summaryNumberSmall}>{item.count ?? item.delivery_boys ?? '--'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  // ---- Payments Tab ----

  const renderPaymentsTab = () => {
    if (paymentsLoading) {
      return (
        <View style={styles.centeredTab}>
          <ActivityIndicator size="large" color="#20b1aa" />
          <Text style={styles.loadingText}>Loading payments data...</Text>
        </View>
      );
    }

    const summary = paymentSummary || {};
    const rawByPlan = summary.revenueByPlan || summary.revenue_by_plan || [];
    const revenueByPlan = Array.isArray(rawByPlan)
      ? rawByPlan.reduce((acc, item) => { acc[item.plan] = parseFloat(item.total) || 0; return acc; }, {})
      : rawByPlan;

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20b1aa" colors={['#20b1aa']} />
        }
      >
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: '#10B981' }]}>{formatCurrency(summary.totalCollected ?? summary.total_collected)}</Text>
            <Text style={styles.summaryLabel}>Total Collected</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>{formatCurrency(summary.pending)}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>{formatCurrency(summary.failed)}</Text>
            <Text style={styles.summaryLabel}>Failed</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Revenue by Plan</Text>
        <View style={styles.summaryRow}>
          {['starter', 'growth', 'enterprise'].map((plan) => (
            <View key={plan} style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{formatCurrency(revenueByPlan[plan])}</Text>
              <Text style={styles.summaryLabel}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment History</Text>
        {paymentHistory.length === 0 ? (
          <Text style={styles.emptyText}>No payments yet.</Text>
        ) : (
          paymentHistory.map((payment, index) => {
            const statusColor = payment.status === 'success' || payment.status === 'completed'
              ? '#10B981'
              : payment.status === 'pending'
                ? '#F59E0B'
                : '#EF4444';
            return (
              <View key={payment.id || index} style={styles.listCard}>
                <View style={styles.listCardRow}>
                  <Text style={styles.listCardName}>{payment.name || payment.pharmacyName || payment.pharmacy_name || 'Unknown'}</Text>
                  <Text style={styles.listCardAmount}>{formatCurrency(payment.amount)}</Text>
                </View>
                <View style={styles.listCardRow}>
                  <Text style={styles.listCardDate}>{payment.slug || '--'}</Text>
                  <View style={styles.listCardStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.listCardStatus, { color: statusColor }]}>{payment.status || '--'}</Text>
                  </View>
                </View>
                <Text style={styles.listCardDate}>{formatDate(payment.date || payment.created_at || payment.createdAt)}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  // ---- Applications Tab (existing content) ----

  const renderApplicationsTab = () => (
    <>
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
    </>
  );

  // ---- Render active tab content ----

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Applications':
        return renderApplicationsTab();
      case 'Revenue':
        return renderRevenueTab();
      case 'Analytics':
        return renderAnalyticsTab();
      case 'Delivery Boys':
        return renderDeliveryBoysTab();
      case 'Payments':
        return renderPaymentsTab();
      default:
        return null;
    }
  };

  // ---- Main Render ----

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

      {renderTabBar()}
      {renderTabContent()}

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
  centeredTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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

  // Tab Bar
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 48,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#20b1aa',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#20b1aa',
    fontWeight: '700',
  },

  // Tab content area
  tabContent: {
    flex: 1,
  },
  tabContentInner: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#20b1aa',
    marginBottom: 4,
  },
  summaryNumberSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#20b1aa',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // List cards (transactions, payments, signups)
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  listCardAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#20b1aa',
  },
  listCardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  listCardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCardStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  // Funnel
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  funnelLabel: {
    width: 85,
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  funnelBarBg: {
    flex: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    backgroundColor: '#20b1aa',
    borderRadius: 6,
  },
  funnelCount: {
    width: 36,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  // Status breakdown grid
  statusGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusItemLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  statusItemCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  // Existing styles (Applications tab)
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
