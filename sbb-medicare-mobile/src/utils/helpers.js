import CONFIG from '../config/api';

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format date and time
export const formatDateTime = (dateString) => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

// Format currency
export const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

// Get order status color
export const getOrderStatusColor = (status) => {
  const colors = {
    [CONFIG.ORDER_STATUS.NEW]: '#3B82F6', // blue
    [CONFIG.ORDER_STATUS.ASSIGNED]: '#8B5CF6', // purple
    [CONFIG.ORDER_STATUS.PICKED_UP]: '#F59E0B', // orange
    [CONFIG.ORDER_STATUS.IN_TRANSIT]: '#10B981', // green
    [CONFIG.ORDER_STATUS.DELIVERED]: '#059669', // dark green
    [CONFIG.ORDER_STATUS.CANCELLED]: '#EF4444', // red
  };
  return colors[status] || '#6B7280';
};

// Get order status label
export const getOrderStatusLabel = (status) => {
  const labels = {
    [CONFIG.ORDER_STATUS.NEW]: 'New',
    [CONFIG.ORDER_STATUS.ASSIGNED]: 'Assigned',
    [CONFIG.ORDER_STATUS.PICKED_UP]: 'Picked Up',
    [CONFIG.ORDER_STATUS.IN_TRANSIT]: 'In Transit',
    [CONFIG.ORDER_STATUS.DELIVERED]: 'Delivered',
    [CONFIG.ORDER_STATUS.CANCELLED]: 'Cancelled',
  };
  return labels[status] || status;
};

// Get payment mode label
export const getPaymentModeLabel = (mode) => {
  const labels = {
    [CONFIG.PAYMENT_MODES.CASH]: 'Cash',
    [CONFIG.PAYMENT_MODES.BANK]: 'Bank Transfer',
    [CONFIG.PAYMENT_MODES.SPLIT]: 'Split Payment',
  };
  return labels[mode] || mode;
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Open Google Maps for navigation
export const openGoogleMaps = (latitude, longitude, label = 'Destination') => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  return url;
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(2); // Distance in km
};

// Handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data?.message || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};
