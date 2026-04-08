import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LandingScreen from '../screens/LandingScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Navigation
import HomeRouter from '../screens/HomeRouter';
import MainNavigator from './MainNavigator';

// Admin Screens
import AdminPanelScreen from '../screens/AdminPanelScreen';

// Info Screens
import FeaturesScreen from '../screens/FeaturesScreen';
import HowItWorksScreen from '../screens/HowItWorksScreen';
import PricingScreen from '../screens/PricingScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';

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
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Features" component={FeaturesScreen} />
          <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
          <Stack.Screen name="Pricing" component={PricingScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
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
