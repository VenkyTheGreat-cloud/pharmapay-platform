import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatDate,
  formatCurrency,
  getOrderStatusColor,
  getOrderStatusLabel,
} from '../utils/helpers';

const OrderCard = ({ order, onPress }) => {
  const statusColor = getOrderStatusColor(order.status);
  const statusLabel = getOrderStatusLabel(order.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="person-outline" size={16} color="#6B7280" />
        <Text style={styles.text}>{order.customer_name}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={16} color="#6B7280" />
        <Text style={styles.text} numberOfLines={1}>
          {order.customer_address}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
        <Text style={styles.text}>{formatDate(order.created_at)}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.amount}>{formatCurrency(order.amount)}</Text>
        <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#139900',
  },
});

export default OrderCard;
