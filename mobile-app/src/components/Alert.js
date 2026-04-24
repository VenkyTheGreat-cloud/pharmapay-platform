import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Alert = ({ type = 'info', message }) => {
  const config = {
    success: {
      backgroundColor: '#E6F5E0',
      borderColor: '#139900',
      iconColor: '#139900',
      textColor: '#0D6600',
      icon: 'checkmark-circle',
    },
    error: {
      backgroundColor: '#FEE2E2',
      borderColor: '#EF4444',
      iconColor: '#EF4444',
      textColor: '#991B1B',
      icon: 'close-circle',
    },
    warning: {
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
      iconColor: '#F59E0B',
      textColor: '#92400E',
      icon: 'warning',
    },
    info: {
      backgroundColor: '#DBEAFE',
      borderColor: '#3B82F6',
      iconColor: '#3B82F6',
      textColor: '#1E40AF',
      icon: 'information-circle',
    },
  }[type];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.iconColor} />
      <Text style={[styles.text, { color: config.textColor }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Alert;
