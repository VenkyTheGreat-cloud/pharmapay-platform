import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { X, Store, User, Mail, Phone, MapPin, Lock } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        setPasswordError('');
        setPasswordSuccess('');
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        // Validation
        if (passwordData.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await authAPI.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data?.success) {
                setPasswordSuccess('Password changed successfully!');
                setPasswordData({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                // Optionally close the form after success
                setTimeout(() => {
                    setShowChangePassword(false);
                    setPasswordSuccess('');
                }, 2000);
            } else {
                setPasswordError(response.data?.error?.message || 'Failed to change password');
            }
        } catch (error) {
            setPasswordError(
                error.response?.data?.error?.message || 
                'Failed to change password. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Store Profile</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {!showChangePassword ? (
                        <>
                            {/* Store Details */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Store className="w-6 h-6 text-primary-600" />
                                        <h3 className="text-xs font-medium text-gray-800">Store Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-600">Store Name</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {user?.storeName || user?.store_store_name || 'N/A'}
                                            </p>
                                        </div>
                                        {user?.store_store_name && (
                                            <div>
                                                <p className="text-sm text-gray-500">Store Display Name</p>
                                                <p className="text-base text-gray-900">
                                                    {user.store_store_name}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <User className="w-6 h-6 text-primary-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">Manager Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {user?.name || 'N/A'}
                                            </p>
                                        </div>
                                        {user?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Email</p>
                                                    <p className="text-base text-gray-900">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {user?.mobile && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Mobile</p>
                                                    <p className="text-base text-gray-900">
                                                        {user.mobile}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {user?.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Address</p>
                                                    <p className="text-base text-gray-900">
                                                        {user.address}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {user?.role && (
                                            <div>
                                                <p className="text-sm text-gray-500">Role</p>
                                                <p className="text-base text-gray-900 capitalize">
                                                    {user.role.replace('_', ' ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Change Password Button */}
                                <div className="pt-4 border-t">
                                    <button
                                        onClick={() => setShowChangePassword(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md transition-colors"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Change Password Form */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <Lock className="w-6 h-6 text-primary-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            name="oldPassword"
                                            value={passwordData.oldPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            required
                                            minLength={6}
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {passwordError && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                            {passwordError}
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                            {passwordSuccess}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmitting ? 'Changing...' : 'Change Password'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowChangePassword(false);
                                                setPasswordData({
                                                    oldPassword: '',
                                                    newPassword: '',
                                                    confirmPassword: ''
                                                });
                                                setPasswordError('');
                                                setPasswordSuccess('');
                                            }}
                                            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}



