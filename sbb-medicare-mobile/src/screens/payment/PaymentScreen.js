import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { formatCurrency, handleApiError } from '../../utils/helpers';
import CONFIG from '../../config/api';

const PaymentScreen = ({ route, navigation }) => {
  const { orderId, order } = route.params;

  const [paymentMode, setPaymentMode] = useState(CONFIG.PAYMENT_MODES.CASH);
  const [cashAmount, setCashAmount] = useState(order.amount.toString());
  const [bankAmount, setBankAmount] = useState('0');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const paymentModes = [
    { key: CONFIG.PAYMENT_MODES.CASH, label: 'Cash', icon: 'cash-outline' },
    {
      key: CONFIG.PAYMENT_MODES.BANK,
      label: 'Bank Transfer',
      icon: 'card-outline',
    },
    { key: CONFIG.PAYMENT_MODES.CREDIT, label: 'Credit', icon: 'wallet-outline' },
  ];

  const handlePaymentModeChange = (mode) => {
    setPaymentMode(mode);
    setErrors({});

    // Reset amounts based on mode
    if (mode === CONFIG.PAYMENT_MODES.CASH) {
      setCashAmount(order.amount.toString());
      setBankAmount('0');
    } else if (mode === CONFIG.PAYMENT_MODES.BANK || mode === CONFIG.PAYMENT_MODES.CREDIT) {
      setCashAmount('0');
      setBankAmount(order.amount.toString());
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const cash = parseFloat(cashAmount) || 0;
    const bank = parseFloat(bankAmount) || 0;
    const total = cash + bank;

    if (total !== parseFloat(order.amount)) {
      newErrors.amount = `Total payment must equal ${formatCurrency(order.amount)}`;
    }

    if ((paymentMode === CONFIG.PAYMENT_MODES.BANK || paymentMode === CONFIG.PAYMENT_MODES.CREDIT) && !transactionRef.trim()) {
      newErrors.transactionRef = 'Transaction reference is required';
    }

    if (!receiptPhoto) {
      newErrors.receipt = 'Please upload a payment receipt photo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        RNAlert.alert(
          'Permission Required',
          'Please allow access to your photos to upload receipt.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setReceiptPhoto(result.assets[0]);
        setErrors({ ...errors, receipt: '' });
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
          'Please allow access to your camera to take receipt photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setReceiptPhoto(result.assets[0]);
        setErrors({ ...errors, receipt: '' });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      RNAlert.alert('Error', 'Failed to take photo');
    }
  };

  const showPhotoOptions = () => {
    RNAlert.alert('Receipt Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    RNAlert.alert(
      'Confirm Payment',
      'Are you sure you want to record this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: submitPayment },
      ]
    );
  };

  const submitPayment = async () => {
    try {
      setLoading(true);
      setError('');

      const paymentData = {
        order_id: orderId,
        amount: parseFloat(order.amount),
        payment_mode: paymentMode,
        cash_amount: parseFloat(cashAmount) || 0,
        bank_amount: parseFloat(bankAmount) || 0,
        transaction_reference: transactionRef.trim() || null,
        receipt_photo: receiptPhoto.uri,
      };

      await apiService.createPayment(paymentData);

      RNAlert.alert('Success', 'Payment recorded successfully', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Error recording payment:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Alert type="error" message={error} /> : null}

      {/* Order Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order #{orderId}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{order.customer_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount:</Text>
          <Text style={styles.amountValue}>{formatCurrency(order.amount)}</Text>
        </View>
      </View>

      {/* Payment Mode Selection */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Mode</Text>
        <View style={styles.modeContainer}>
          {paymentModes.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modeButton,
                paymentMode === mode.key && styles.modeButtonActive,
              ]}
              onPress={() => handlePaymentModeChange(mode.key)}
            >
              <Ionicons
                name={mode.icon}
                size={24}
                color={paymentMode === mode.key ? '#FFFFFF' : '#6B7280'}
              />
              <Text
                style={[
                  styles.modeText,
                  paymentMode === mode.key && styles.modeTextActive,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Details</Text>

        {(paymentMode === CONFIG.PAYMENT_MODES.CASH ||
          paymentMode === CONFIG.PAYMENT_MODES.SPLIT) && (
            <Input
              label="Cash Amount"
              value={cashAmount}
              onChangeText={setCashAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={paymentMode === CONFIG.PAYMENT_MODES.SPLIT}
            />
          )}

        {(paymentMode === CONFIG.PAYMENT_MODES.BANK ||
          paymentMode === CONFIG.PAYMENT_MODES.CREDIT) && (
            <>
              <Input
                label={paymentMode === CONFIG.PAYMENT_MODES.BANK ? "Bank Transfer Amount" : "Credit Amount"}
                value={bankAmount}
                onChangeText={setBankAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={false}
              />
              <Input
                label="Transaction Reference"
                value={transactionRef}
                onChangeText={setTransactionRef}
                placeholder="Enter transaction ID/reference"
                error={errors.transactionRef}
              />
            </>
          )}

        {errors.amount && (
          <Text style={styles.errorText}>{errors.amount}</Text>
        )}
        {errors.split && <Text style={styles.errorText}>{errors.split}</Text>}
      </View>

      {/* Receipt Upload */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Receipt</Text>

        {receiptPhoto ? (
          <View style={styles.receiptContainer}>
            <Image
              source={{ uri: receiptPhoto.uri }}
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
            <Text style={styles.uploadText}>Upload Receipt Photo</Text>
            <Text style={styles.uploadSubtext}>
              Take a photo or choose from gallery
            </Text>
          </TouchableOpacity>
        )}

        {errors.receipt && (
          <Text style={styles.errorText}>{errors.receipt}</Text>
        )}
      </View>

      {/* Submit Button */}
      <Button
        title="Record Payment"
        onPress={handleSubmit}
        loading={loading}
        variant="success"
        style={styles.submitButton}
      />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  modeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  modeText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  uploadButton: {
    alignItems: 'center',
    paddingVertical: 48,
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginBottom: 32,
  },
});

export default PaymentScreen;
