import 'dotenv/config';

export default {
  expo: {
    name: 'PharmaPay Delivery',
    slug: 'pharmapay-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#3B82F6',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pharmapay.delivery',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app needs access to your location to track deliveries and navigate to customers.',
        NSLocationAlwaysUsageDescription:
          'This app needs access to your location to track deliveries in the background.',
        NSCameraUsageDescription:
          'This app needs access to your camera to take photos of payment receipts and profile pictures.',
        NSPhotoLibraryUsageDescription:
          'This app needs access to your photo library to upload payment receipts and profile pictures.',
      },
    },
    android: {
      package: 'com.pharmapay.delivery',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      },
    },
    web: {},
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow PharmaPay to use your location to track deliveries.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'The app needs access to your photos to upload payment receipts.',
        },
      ],
    ],
    extra: {
      apiUrl: process.env.API_URL || 'https://pharmapay-api.onrender.com/api',
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      eas: {
        projectId: 'a0686e3d-7909-4dc1-8d80-cb448a35e70e',
      },
    },
  },
};
