import { NativeModules, Platform } from 'react-native';

export const CaptureNativeModule = Platform.OS === 'android'
  ? NativeModules.CaptureNativeModule
  : null;

export const isCaptureAvailable = () => !!CaptureNativeModule;
