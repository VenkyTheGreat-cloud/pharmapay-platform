import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { pharmacyAPI } from '../../services/api';

const PRESET_COLORS = [
  '#20b1aa', '#3B82F6', '#8B5CF6', '#EC4899',
  '#EF4444', '#F59E0B', '#10B981', '#1F2937',
];

const PharmacyBrandingScreen = ({ navigation }) => {
  const [primaryColor, setPrimaryColor] = useState('#20b1aa');
  const [hexInput, setHexInput] = useState('#20b1aa');
  const [logoUri, setLogoUri] = useState(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const res = await pharmacyAPI.getMyPharmacy();
      const pharmacy = res.data?.data || res.data;
      if (pharmacy.primary_color) {
        setPrimaryColor(pharmacy.primary_color);
        setHexInput(pharmacy.primary_color);
      }
      if (pharmacy.logo_url) {
        setExistingLogoUrl(pharmacy.logo_url);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleHexChange = (text) => {
    setHexInput(text);
    if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
      setPrimaryColor(text);
    }
  };

  const selectPresetColor = (color) => {
    setPrimaryColor(color);
    setHexInput(color);
  };

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setLogoUri(asset.uri);
      uploadLogo(asset.uri);
    }
  };

  const [uploadMessage, setUploadMessage] = useState('');

  const uploadLogo = async (uri) => {
    setUploadingLogo(true);
    setUploadMessage('');
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // On web, fetch the blob from the data URI or object URL
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('logo', blob, 'logo.jpg');
      } else {
        // On native, use RN format
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('logo', { uri, name: filename, type });
      }

      await pharmacyAPI.uploadLogo(formData);
      setUploadMessage('Logo uploaded successfully!');
    } catch (err) {
      console.error('Logo upload error:', err);
      setUploadMessage('Upload failed. Please try again.');
      setLogoUri(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await pharmacyAPI.updateBranding({ primary_color: primaryColor });
      navigation.navigate('PharmacyPayment');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save branding.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20b1aa" />
      </View>
    );
  }

  const displayLogo = logoUri || existingLogoUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.navigate('PharmacyConfigure')} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, color: '#20b1aa', fontWeight: '600' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Brand Your Pharmacy</Text>
      <Text style={styles.subtitle}>Customize colors and upload your logo</Text>

      {/* Color Picker */}
      <Text style={styles.sectionTitle}>Primary Color</Text>
      <View style={styles.presetRow}>
        {PRESET_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.presetCircle,
              { backgroundColor: color },
              primaryColor === color && styles.presetCircleSelected,
            ]}
            onPress={() => selectPresetColor(color)}
          />
        ))}
      </View>

      <View style={styles.hexRow}>
        <Text style={styles.label}>Hex Code</Text>
        <TextInput
          style={styles.hexInput}
          value={hexInput}
          onChangeText={handleHexChange}
          placeholder="#20b1aa"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          maxLength={7}
        />
        <View style={[styles.colorPreviewBox, { backgroundColor: primaryColor }]} />
      </View>

      {/* Logo Upload */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Logo</Text>
      <TouchableOpacity style={styles.logoUploadArea} onPress={pickLogo} disabled={uploadingLogo}>
        {uploadingLogo ? (
          <ActivityIndicator size="large" color="#20b1aa" />
        ) : displayLogo ? (
          <Image source={{ uri: displayLogo }} style={styles.logoImage} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderIcon}>+</Text>
            <Text style={styles.logoPlaceholderText}>Tap to upload logo</Text>
          </View>
        )}
      </TouchableOpacity>
      {displayLogo && (
        <TouchableOpacity onPress={pickLogo} style={styles.changeLogo}>
          <Text style={styles.changeLogoText}>Change Logo</Text>
        </TouchableOpacity>
      )}

      {/* Preview */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Preview</Text>
      <View style={[styles.previewCard, { borderColor: primaryColor }]}>
        <View style={[styles.previewHeader, { backgroundColor: primaryColor }]}>
          {displayLogo ? (
            <Image source={{ uri: displayLogo }} style={styles.previewLogo} />
          ) : (
            <View style={styles.previewLogoPlaceholder}>
              <Text style={styles.previewLogoText}>Logo</Text>
            </View>
          )}
          <Text style={styles.previewTitle}>Your Pharmacy</Text>
        </View>
        <View style={styles.previewBody}>
          <TouchableOpacity style={[styles.previewButton, { backgroundColor: primaryColor }]}>
            <Text style={styles.previewButtonText}>Order Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
        onPress={handleNext}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextBtnText}>Next</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  presetCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  presetCircleSelected: {
    borderWidth: 3,
    borderColor: '#111827',
  },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  hexInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  colorPreviewBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  logoUploadArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoPlaceholderIcon: {
    fontSize: 36,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  logoPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  changeLogo: {
    alignItems: 'center',
    marginTop: 10,
  },
  changeLogoText: {
    color: '#20b1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCard: {
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  previewLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  previewLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLogoText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewBody: {
    padding: 16,
    alignItems: 'flex-start',
  },
  previewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  nextBtn: {
    backgroundColor: '#20b1aa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default PharmacyBrandingScreen;
