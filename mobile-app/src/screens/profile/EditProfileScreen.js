import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { isValidPhone } from '../../utils/helpers';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number (10 digits, starting with 6-9)';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await updateUser({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
    });

    setLoading(false);

    if (result.success) {
      setSuccess('Profile updated successfully');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <Alert type="error" message={error} /> : null}
        {success ? <Alert type="success" message={success} /> : null}

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="Enter your full name"
            error={errors.name}
          />

          <Input
            label="Email"
            value={user?.email}
            editable={false}
            style={styles.disabledInput}
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="Enter your 10-digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
          />

          <Input
            label="Address"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="Enter your address"
            multiline
            numberOfLines={3}
            error={errors.address}
          />

          <Button
            title="Update Profile"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  form: {
    flex: 1,
  },
  disabledInput: {
    opacity: 0.6,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default EditProfileScreen;
