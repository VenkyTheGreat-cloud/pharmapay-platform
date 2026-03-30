import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';

const ChangePasswordScreen = ({ navigation }) => {
  const { changePassword } = useAuth();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
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

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (
      formData.oldPassword &&
      formData.newPassword &&
      formData.oldPassword === formData.newPassword
    ) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await changePassword(formData.oldPassword, formData.newPassword);

    setLoading(false);

    if (result.success) {
      setSuccess('Password changed successfully');
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
            label="Current Password"
            value={formData.oldPassword}
            onChangeText={(text) => updateField('oldPassword', text)}
            placeholder="Enter your current password"
            secureTextEntry
            error={errors.oldPassword}
          />

          <Input
            label="New Password"
            value={formData.newPassword}
            onChangeText={(text) => updateField('newPassword', text)}
            placeholder="Enter new password (min 6 characters)"
            secureTextEntry
            error={errors.newPassword}
          />

          <Input
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            placeholder="Re-enter new password"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            title="Change Password"
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
  submitButton: {
    marginTop: 8,
  },
});

export default ChangePasswordScreen;
