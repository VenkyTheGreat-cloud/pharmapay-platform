import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import OrderCard from '../../components/OrderCard';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { handleApiError } from '../../utils/helpers';
import CONFIG from '../../config/api';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All', status: null },
    { key: 'created', label: 'New Order', status: CONFIG.ORDER_STATUS.CREATED },
    { key: 'assigned', label: 'Assigned', status: CONFIG.ORDER_STATUS.ASSIGNED },
    { key: 'accepted', label: 'Accepted', status: CONFIG.ORDER_STATUS.ACCEPTED },
    { key: 'rejected', label: 'Rejected', status: CONFIG.ORDER_STATUS.REJECTED },
    { key: 'picked_up', label: 'Picked Up', status: CONFIG.ORDER_STATUS.PICKED_UP },
    { key: 'in_transit', label: 'In Transit', status: CONFIG.ORDER_STATUS.IN_TRANSIT },
    { key: 'payment_collection', label: 'Payment Collection', status: CONFIG.ORDER_STATUS.PAYMENT_COLLECTION },
    { key: 'delivered', label: 'Delivered', status: CONFIG.ORDER_STATUS.DELIVERED },
    { key: 'cancelled', label: 'Cancelled', status: CONFIG.ORDER_STATUS.CANCELLED },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [selectedFilter, orders]);

  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await apiService.getMyOrders();
      const orderData = response.data?.data?.orders || response.data?.data || response.data;
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(handleApiError(err));
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
    if (selectedFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) => order.status === filters.find((f) => f.key === selectedFilter)?.status
      );
      setFilteredOrders(filtered);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  if (loading) {
    return <LoadingScreen message="Loading orders..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => handleOrderPress(item)} />
        )}
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
            icon={error ? 'alert-circle-outline' : 'file-tray-outline'}
            message={
              error
                ? 'Unable to load orders. Pull down to retry.'
                : selectedFilter === 'all'
                  ? 'No orders available'
                  : `No ${filters.find((f) => f.key === selectedFilter)?.label.toLowerCase()} orders`
            }
          />
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
});

export default OrdersScreen;
