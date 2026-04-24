import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
} from 'react-native';

const { CaptureNativeModule } = NativeModules;
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { handleApiError } from '../../utils/helpers';

const CaptureReviewScreen = ({ navigation }) => {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [convertibleCount, setConvertibleCount] = useState(0);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'dismissed'
  const [dismissedCaptures, setDismissedCaptures] = useState([]);
  const [dismissedCount, setDismissedCount] = useState(0);

  // Convert modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [customerComments, setCustomerComments] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerMobile, setNewCustomerMobile] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [medicines, setMedicines] = useState('');
  const [area, setArea] = useState('');
  const [converting, setConverting] = useState(false);
  const [dismissing, setDismissing] = useState(null);
  const [permStatus, setPermStatus] = useState(null);
  const [notifAccess, setNotifAccess] = useState(null);

  useEffect(() => {
    fetchCaptures();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS !== 'android' || !CaptureNativeModule) return;
    try {
      const [perms, notif] = await Promise.all([
        CaptureNativeModule.checkCapturePermissions(),
        CaptureNativeModule.isNotificationAccessEnabled(),
      ]);
      setPermStatus(perms);
      setNotifAccess(notif);
    } catch {}
  };

  const fetchCaptures = async () => {
    try {
      const [activeRes, dismissedRes] = await Promise.all([
        apiService.getConvertibleCaptures().catch(() => ({ data: { data: { captures: [], convertible_count: 0 } } })),
        apiService.getDismissedCaptures().catch(() => ({ data: { data: { captures: [], dismissed_count: 0 } } })),
      ]);
      const activeData = activeRes.data?.data || activeRes.data;
      setCaptures(activeData.captures || []);
      setConvertibleCount(activeData.convertible_count || 0);

      const dismissedData = dismissedRes.data?.data || dismissedRes.data;
      setDismissedCaptures(dismissedData.captures || []);
      setDismissedCount(dismissedData.dismissed_count || 0);
    } catch (error) {
      console.error('Error fetching captures:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCaptures();
  }, []);

  const openConvertModal = (capture) => {
    setSelectedCapture(capture);
    setOrderNumber('');
    setTotalAmount('');

    const extracted = capture.extracted_data || {};

    // Pre-fill medicines
    if (extracted.medicines && extracted.medicines.length > 0) {
      const medicineList = extracted.medicines.map((m) => {
        let desc = m.name;
        if (m.strength) desc += ` ${m.strength}`;
        if (m.form) desc += ` ${m.form}`;
        if (m.quantity) desc += ` x${m.quantity}`;
        return desc;
      }).join('\n');
      setMedicines(medicineList);
    } else {
      setMedicines('');
    }

    // Pre-fill area
    setArea(extracted.area || '');

    // Pre-fill comments from transcript
    setCustomerComments(capture.transcript || capture.message_text || '');

    // Pre-fill customer fields — always editable
    // Phone: caller_number is most reliable (from caller ID), then extracted, then matched
    setNewCustomerMobile(capture.caller_number || extracted.customer_phone || capture.matched_customer_mobile || '');
    // Name: extracted from transcript > matched > sender
    setNewCustomerName(extracted.customer_name || capture.matched_customer_name || capture.sender_name || '');
    // Address: matched > extracted area
    setNewCustomerAddress(capture.matched_customer_address || extracted.area || '');

    setShowConvertModal(true);
  };

  const handleConvert = async () => {
    if (!orderNumber.trim()) {
      Alert.alert('Required', 'Please enter an order number');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert('Required', 'Please enter a valid total amount');
      return;
    }

    setConverting(true);
    try {
      // Build comments: medicines + any additional notes
      const fullComments = [medicines.trim(), customerComments.trim()]
        .filter(Boolean)
        .join('\n---\n');

      const body = {
        orderNumber: orderNumber.trim(),
        totalAmount: parseFloat(totalAmount),
        customerComments: fullComments || undefined,
      };

      if (!newCustomerMobile.trim()) {
        Alert.alert('Required', 'Customer mobile number is required');
        setConverting(false);
        return;
      }

      // Always use editable customer fields (even for matched customers)
      if (selectedCapture.matched_customer_id && newCustomerMobile.trim() === (selectedCapture.matched_customer_mobile || '')) {
        body.customerId = selectedCapture.matched_customer_id;
      } else {
        body.newCustomer = {
          name: newCustomerName.trim() || 'Unknown',
          mobile: newCustomerMobile.trim(),
          address: newCustomerAddress.trim() || area.trim() || null,
          area: area.trim() || null,
        };
      }

      await apiService.convertCaptureToOrder(selectedCapture.id, body);
      setShowConvertModal(false);
      setSelectedCapture(null);
      Alert.alert('Success', 'Order created from capture');
      fetchCaptures();
    } catch (error) {
      const msg = error.response?.data?.message || handleApiError(error);
      Alert.alert('Error', msg);
    } finally {
      setConverting(false);
    }
  };

  const handleDismiss = (capture) => {
    Alert.alert(
      'Dismiss Capture',
      'Select reason for dismissing:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam / Wrong call', onPress: () => doDismiss(capture, 'Spam or wrong call') },
        { text: 'Not an order', onPress: () => doDismiss(capture, 'Not an order') },
        { text: 'Duplicate', onPress: () => doDismiss(capture, 'Duplicate capture') },
      ]
    );
  };

  const doDismiss = async (capture, reason) => {
    setDismissing(capture.id);
    try {
      await apiService.dismissCapture(capture.id, reason);
      fetchCaptures();
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setDismissing(null);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return '#139900';
      case 'medium': return '#F59E0B';
      case 'low': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderCaptureCard = ({ item }) => {
    const extracted = item.extracted_data || {};
    const isVoice = item.channel === 'voice';
    const medicines = extracted.medicines || [];

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.channelRow}>
            <Ionicons
              name={isVoice ? 'call-outline' : 'logo-whatsapp'}
              size={20}
              color={isVoice ? '#3B82F6' : '#25D366'}
            />
            <Text style={styles.channelLabel}>
              {isVoice ? 'Voice Call' : 'WhatsApp'}
            </Text>
            {extracted.confidence && (
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(extracted.confidence) + '20' }]}>
                <Text style={[styles.confidenceText, { color: getConfidenceColor(extracted.confidence) }]}>
                  {extracted.confidence}
                </Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
            <Text style={{ fontSize: 10, color: '#D1D5DB' }}>
              {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Caller info */}
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{item.caller_number || 'Unknown'}</Text>
        </View>
        {item.sender_name && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{item.sender_name}</Text>
          </View>
        )}

        {/* Customer match */}
        {item.matched_customer_id ? (
          <View style={styles.matchBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#139900" />
            <Text style={styles.matchText}>
              Matched: {item.matched_customer_name} ({item.matched_customer_mobile})
            </Text>
          </View>
        ) : (
          <View style={[styles.matchBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="alert-circle" size={14} color="#F59E0B" />
            <Text style={[styles.matchText, { color: '#92400E' }]}>New customer</Text>
          </View>
        )}

        {/* Medicines */}
        {medicines.length > 0 && (
          <View style={styles.medicinesContainer}>
            <Text style={styles.sectionLabel}>Medicines:</Text>
            {medicines.map((med, idx) => (
              <View key={idx} style={styles.medicineRow}>
                <Ionicons name="medical-outline" size={14} color="#3B82F6" />
                <Text style={styles.medicineText}>
                  {med.name}
                  {med.strength ? ` ${med.strength}` : ''}
                  {med.form ? ` ${med.form}` : ''}
                  {med.quantity ? ` x${med.quantity}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Area */}
        {extracted.area && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{extracted.area}</Text>
          </View>
        )}

        {/* Transcript / message preview */}
        {(item.transcript || item.message_text) && (
          <Text style={styles.previewText} numberOfLines={2}>
            {item.transcript || item.message_text}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => handleDismiss(item)}
            disabled={dismissing === item.id}
          >
            <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
            <Text style={styles.dismissButtonText}>
              {dismissing === item.id ? 'Dismissing...' : 'Dismiss'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 10 }}
            onPress={() => {
              Alert.alert(
                'Record Details',
                `Speak order details for caller ${item.caller_number || 'unknown'}:\n\n"Customer name, Area, Medicines"`,
                [{
                  text: 'Record',
                  onPress: async () => {
                    try {
                      await CaptureNativeModule.testRecording();
                      Alert.alert('Recording', 'Speak now! Recording for 5 seconds.\nPull to refresh after.');
                    } catch (e) {
                      Alert.alert('Error', e.message || 'Failed');
                    }
                  },
                }, { text: 'Cancel', style: 'cancel' }]
              );
            }}
          >
            <Ionicons name="mic-outline" size={18} color="#139900" />
            <Text style={{ fontSize: 13, color: '#139900', fontWeight: '600' }}>Record</Text>
          </TouchableOpacity>
          <Button
            title="Convert to Order"
            variant="primary"
            onPress={() => openConvertModal(item)}
            style={styles.convertButton}
            textStyle={{ fontSize: 14 }}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading captures..." />;
  }

  return (
    <View style={styles.container}>
      {/* Permission Status */}
      {Platform.OS === 'android' && permStatus && (
        <View style={{ backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ fontSize: 11, color: '#6B7280', lineHeight: 16 }}>
            Mic: {permStatus.recordAudio ? 'OK' : 'DENIED'} | Phone: {permStatus.readPhoneState ? 'OK' : 'DENIED'} | CallLog: {permStatus.readCallLog ? 'OK' : 'DENIED'} | Notif: {permStatus.postNotifications ? 'OK' : 'DENIED'} | WhatsApp: {notifAccess ? 'OK' : 'OFF'}
          </Text>
          {(!permStatus.recordAudio || !permStatus.readPhoneState) && (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await CaptureNativeModule.requestCapturePermissions();
                  checkPermissions();
                } catch {}
              }}
              style={{ marginTop: 4 }}
            >
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>Tap to grant missing permissions</Text>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  const result = await CaptureNativeModule.testRecording();
                  Alert.alert('Test Recording', result + '\n\nSpeak into the mic for 5 seconds. Check server logs after.');
                } catch (e) {
                  Alert.alert('Test Failed', e.message || 'Recording test failed');
                }
              }}
            >
              <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>Test Record 5s</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => CaptureNativeModule?.openBatteryOptimizationSettings()}>
              <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '600' }}>Battery Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Record Order Button */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#139900', marginHorizontal: 16, marginTop: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, gap: 10 }}
        onPress={() => {
          Alert.alert(
            'Record Order',
            'After tapping OK, speak clearly for 10 seconds:\n\n"Customer name [NAME],\nPhone [NUMBER],\nArea [AREA],\nMedicines [LIST]"\n\nExample: "Customer name Ramesh, phone 9876543210, area Kukatpally, medicines Dolo 650 two strips, Crocin syrup one bottle"',
            [{
              text: 'Start Recording',
              onPress: async () => {
                try {
                  const ctx = require('react-native').NativeModules.CaptureNativeModule;
                  const result = await ctx.testRecording();
                  Alert.alert('Recording', 'Speak the order now! Recording for 5 seconds...');
                } catch (e) {
                  Alert.alert('Error', e.message || 'Failed to start recording');
                }
              },
            }, { text: 'Cancel', style: 'cancel' }]
          );
        }}
      >
        <Ionicons name="mic" size={22} color="#FFFFFF" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Record Order</Text>
          <Text style={{ color: '#E6F5E0', fontSize: 11 }}>Speak: Name, Phone, Area, Medicines</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#E6F5E0" />
      </TouchableOpacity>

      {/* Tabs: Active / Dismissed */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 10, backgroundColor: '#fff', borderRadius: 10, padding: 3, borderWidth: 1, borderColor: '#E5E7EB' }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: activeTab === 'active' ? '#3B82F6' : 'transparent' }}
          onPress={() => setActiveTab('active')}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === 'active' ? '#fff' : '#6B7280' }}>
            Active ({convertibleCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: activeTab === 'dismissed' ? '#6B7280' : 'transparent' }}
          onPress={() => setActiveTab('dismissed')}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === 'dismissed' ? '#fff' : '#6B7280' }}>
            Dismissed ({dismissedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'active' && convertibleCount > 0 && (
        <View style={styles.headerBadge}>
          <Ionicons name="notifications-outline" size={18} color="#3B82F6" />
          <Text style={styles.headerBadgeText}>
            {convertibleCount} capture{convertibleCount !== 1 ? 's' : ''} ready for conversion
          </Text>
        </View>
      )}

      <FlatList
        data={activeTab === 'active' ? captures : dismissedCaptures}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'active' ? renderCaptureCard : ({ item }) => {
          const extracted = item.extracted_data || {};
          return (
            <View style={[styles.card, { opacity: 0.7 }]}>
              <View style={styles.cardHeader}>
                <View style={styles.channelRow}>
                  <Ionicons name={item.channel === 'voice' ? 'call-outline' : 'logo-whatsapp'} size={18} color="#9CA3AF" />
                  <Text style={[styles.channelLabel, { color: '#9CA3AF' }]}>{item.channel === 'voice' ? 'Voice Call' : 'WhatsApp'}</Text>
                  <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '600' }}>DISMISSED</Text>
                  </View>
                </View>
                <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
              </View>
              {item.caller_number && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color="#9CA3AF" />
                  <Text style={[styles.infoText, { color: '#9CA3AF' }]}>{item.caller_number}</Text>
                </View>
              )}
              {item.sender_name && (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={14} color="#9CA3AF" />
                  <Text style={[styles.infoText, { color: '#9CA3AF' }]}>{item.sender_name}</Text>
                </View>
              )}
              {(item.transcript || item.message_text) && (
                <Text style={[styles.previewText, { color: '#D1D5DB' }]} numberOfLines={2}>
                  {item.transcript || item.message_text}
                </Text>
              )}
              {extracted.medicines && extracted.medicines.length > 0 && (
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  Medicines: {extracted.medicines.map(m => m.name).join(', ')}
                </Text>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={activeTab === 'active' ? 'mic-off-outline' : 'trash-outline'}
            message={activeTab === 'active' ? 'No captures ready for conversion' : 'No dismissed captures'}
          />
        }
      />

      {/* Convert Modal */}
      <Modal
        visible={showConvertModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConvertModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Convert to Order</Text>
                <TouchableOpacity onPress={() => setShowConvertModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Timestamp */}
              {selectedCapture?.created_at && (
                <View style={[styles.modalSection, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>
                    {new Date(selectedCapture.created_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF' }}>
                    ({formatTime(selectedCapture.created_at)})
                  </Text>
                </View>
              )}

              {/* Customer info — always editable */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Customer Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Customer name"
                  placeholderTextColor="#9CA3AF"
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={newCustomerMobile}
                  onChangeText={setNewCustomerMobile}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Area / Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Delivery area or address"
                  placeholderTextColor="#9CA3AF"
                  value={area}
                  onChangeText={setArea}
                />
              </View>

              {/* Medicines — editable */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Medicines</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. Dolo 650 x2, Crocin syrup x1"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={medicines}
                  onChangeText={setMedicines}
                />
              </View>

              {/* Order details */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Order Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. ORD-001"
                  placeholderTextColor="#9CA3AF"
                  value={orderNumber}
                  onChangeText={setOrderNumber}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Total Amount *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Additional notes (transcript shown here)..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={customerComments}
                  onChangeText={setCustomerComments}
                />
              </View>

              {/* Submit */}
              <Button
                title="Create Order"
                variant="success"
                loading={converting}
                onPress={handleConvert}
                style={{ marginTop: 8, marginBottom: 24 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  phoneText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F5E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D6600',
  },
  medicinesContainer: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  medicineText: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  previewText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dismissButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  convertButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  modalMedicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  modalMedicineText: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  matchedCustomerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F5E0',
    padding: 12,
    borderRadius: 8,
  },
  matchedCustomerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0D6600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
});

export default CaptureReviewScreen;
