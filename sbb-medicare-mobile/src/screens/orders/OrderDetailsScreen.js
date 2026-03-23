import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert as RNAlert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import apiService from '../../services/api';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import Alert from '../../components/Alert';
import {
  formatDateTime,
  formatCurrency,
  getOrderStatusColor,
  getOrderStatusLabel,
  openGoogleMaps,
  handleApiError,
} from '../../utils/helpers';
import CONFIG from '../../config/api';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [returnItemsPhoto, setReturnItemsPhoto] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrderById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      await apiService.updateOrderStatus(orderId, newStatus, '', returnItemsPhoto?.uri);

      setSuccess(`Order status updated to ${getOrderStatusLabel(newStatus)}`);
      setReturnItemsPhoto(null);
      await fetchOrderDetails();

      // Auto-hide success message
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setError(handleApiError(error));
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    if (
      newStatus === CONFIG.ORDER_STATUS.DELIVERED &&
      order.return_items === true &&
      !returnItemsPhoto &&
      !order.return_items_photo_url
    ) {
      RNAlert.alert(
        'Photo Required',
        'Please take a photo of the return items before marking as delivered.'
      );
      return;
    }

    RNAlert.alert(
      'Update Status',
      `Are you sure you want to update status to "${getOrderStatusLabel(newStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: () => updateStatus(newStatus) },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        RNAlert.alert(
          'Permission Required',
          'Please allow access to your photos to upload return items photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setReturnItemsPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      RNAlert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        RNAlert.alert(
          'Permission Required',
          'Please allow access to your camera to take return items photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setReturnItemsPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      RNAlert.alert('Error', 'Failed to take photo');
    }
  };

  const showPhotoOptions = () => {
    RNAlert.alert('Return Items Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const navigateToCustomer = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        RNAlert.alert(
          'Permission Required',
          'Please allow location access to use navigation.'
        );
        return;
      }

      if (order.customer_latitude && order.customer_longitude) {
        const url = openGoogleMaps(
          order.customer_latitude,
          order.customer_longitude,
          order.customer_name
        );

        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          RNAlert.alert('Error', 'Unable to open Google Maps');
        }
      } else {
        RNAlert.alert(
          'Location Not Available',
          'Customer location coordinates are not available.'
        );
      }
    } catch (error) {
      console.error('Navigation error:', error);
      RNAlert.alert('Error', 'Failed to open navigation');
    }
  };

  const callCustomer = () => {
    if (order.customer_phone) {
      const url = `tel:${order.customer_phone}`;
      Linking.openURL(url);
    } else {
      RNAlert.alert('Error', 'Customer phone number not available');
    }
  };

  const getNextStatus = () => {
    const statusFlow = {
      [CONFIG.ORDER_STATUS.ASSIGNED]: CONFIG.ORDER_STATUS.PICKED_UP,
      [CONFIG.ORDER_STATUS.PICKED_UP]: CONFIG.ORDER_STATUS.IN_TRANSIT,
      [CONFIG.ORDER_STATUS.IN_TRANSIT]: CONFIG.ORDER_STATUS.DELIVERED,
    };
    return statusFlow[order?.status];
  };

  const canUpdateStatus = () => {
    return [
      CONFIG.ORDER_STATUS.ASSIGNED,
      CONFIG.ORDER_STATUS.PICKED_UP,
      CONFIG.ORDER_STATUS.IN_TRANSIT,
    ].includes(order?.status);
  };

  const canRecordPayment = () => {
    return order?.status === CONFIG.ORDER_STATUS.DELIVERED && !order?.payment_id;
  };

  if (loading) {
    return <LoadingScreen message="Loading order details..." />;
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Alert type="error" message="Order not found" />
      </View>
    );
  }

  const statusColor = getOrderStatusColor(order.status);
  const statusLabel = getOrderStatusLabel(order.status);
  const nextStatus = getNextStatus();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Alert type="error" message={error} /> : null}
      {success ? <Alert type="success" message={success} /> : null}

      {/* Order Header */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Order ID:</Text>
          <Text style={styles.value}>#{order.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      {/* Customer Information */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer Information</Text>

        <View style={styles.row}>
          <Ionicons name="person-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>{order.customer_name}</Text>
        </View>

        {order.customer_phone && (
          <TouchableOpacity style={styles.row} onPress={callCustomer}>
            <Ionicons name="call-outline" size={20} color="#3B82F6" />
            <Text style={[styles.infoText, styles.link]}>
              {order.customer_phone}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.row}>
          <Ionicons name="location-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>{order.customer_address}</Text>
        </View>

        {order.customer_latitude && order.customer_longitude && (
          <Button
            title="Navigate to Customer"
            onPress={navigateToCustomer}
            variant="primary"
            style={styles.navButton}
          />
        )}
      </View>

      {/* Order Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(order.amount)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{formatDateTime(order.created_at)}</Text>
        </View>

        {order.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}
      </View>

      {/* Return Items Verification */}
      {(order.return_items === true || order.return_items_photo_url) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Return Items Verification</Text>

          {order.return_items_photo_url ? (
            <View style={styles.receiptContainer}>
              <Text style={[styles.infoText, { marginLeft: 0, marginBottom: 12 }]}>
                Return items photo verified:
              </Text>
              <Image
                source={{
                  uri: order.return_items_photo_url.startsWith('http') || order.return_items_photo_url.startsWith('data:')
                    ? order.return_items_photo_url
                    : `${CONFIG.API_URL}${order.return_items_photo_url}`
                }}
                style={styles.receiptImage}
              />
            </View>
          ) : returnItemsPhoto ? (
            <View style={styles.receiptContainer}>
              <Image
                source={{ uri: returnItemsPhoto.uri }}
                style={styles.receiptImage}
              />
              <Button
                title="Change Photo"
                onPress={showPhotoOptions}
                variant="secondary"
                style={styles.changeButton}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={showPhotoOptions}
            >
              <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
              <Text style={styles.uploadText}>Capture Return Items Photo</Text>
              <Text style={styles.uploadSubtext}>
                Required before marking as delivered
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsCard}>
        {canUpdateStatus() && nextStatus && (
          <Button
            title={`Mark as ${getOrderStatusLabel(nextStatus)}`}
            onPress={() => handleStatusUpdate(nextStatus)}
            loading={updating}
            variant="success"
            style={styles.actionButton}
          />
        )}

        {canRecordPayment() && (
          <Button
            title="Record Payment"
            onPress={() =>
              navigation.navigate('Payment', { orderId: order.id, order })
            }
            variant="primary"
            style={styles.actionButton}
          />
        )}

        {order.status === CONFIG.ORDER_STATUS.DELIVERED && order.payment_id && (
          <Alert
            type="success"
            message="Payment has been recorded for this order"
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  navButton: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  uploadButton: {
    alignItems: 'center',
    paddingVertical: 32,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  uploadSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9CA3AF',
  },
  receiptContainer: {
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeButton: {
    width: '100%',
  },
});

export default OrderDetailsScreen;
