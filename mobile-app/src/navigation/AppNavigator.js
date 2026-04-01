import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LandingScreen from '../screens/LandingScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Navigation
import HomeRouter from '../screens/HomeRouter';
import MainNavigator from './MainNavigator';

// Admin Screens
import AdminPanelScreen from '../screens/AdminPanelScreen';

// Pharmacy Owner Screens
import PharmacySignupScreen from '../screens/pharmacy/PharmacySignupScreen';
import PharmacyConfigureScreen from '../screens/pharmacy/PharmacyConfigureScreen';
import PharmacyBrandingScreen from '../screens/pharmacy/PharmacyBrandingScreen';
import PharmacyPaymentScreen from '../screens/pharmacy/PharmacyPaymentScreen';
import PharmacyStatusScreen from '../screens/pharmacy/PharmacyStatusScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, user, pharmacyStatus } = useAuth();
  const isPharmacyOwner = user?.role === 'admin' && pharmacyStatus && pharmacyStatus !== 'none';

  console.log('🧭 AppNavigator - loading:', loading, 'isAuthenticated:', isAuthenticated);

  if (loading) {
    console.log('⏳ Showing loading screen...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  console.log('✅ Loading complete, rendering navigation');

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="HomeRouter" component={HomeRouter} />
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
          <Stack.Screen name="PharmacyConfigure" component={PharmacyConfigureScreen} />
          <Stack.Screen name="PharmacyBranding" component={PharmacyBrandingScreen} />
          <Stack.Screen name="PharmacyPayment" component={PharmacyPaymentScreen} />
          <Stack.Screen name="PharmacyStatus" component={PharmacyStatusScreen} />
        </Stack.Group>
      ) : (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="PharmacySignup" component={PharmacySignupScreen} />
          <Stack.Screen name="PharmacyConfigure" component={PharmacyConfigureScreen} />
          <Stack.Screen name="PharmacyBranding" component={PharmacyBrandingScreen} />
          <Stack.Screen name="PharmacyPayment" component={PharmacyPaymentScreen} />
          <Stack.Screen name="PharmacyStatus" component={PharmacyStatusScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
