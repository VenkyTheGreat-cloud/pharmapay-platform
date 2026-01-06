import { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Building, Key } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e) => {
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

        try {
            setLoading(true);
            const response = await authAPI.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });

            if (response.data?.success) {
                setPasswordSuccess('Password changed successfully!');
                setPasswordData({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                // Optionally close the password form after 2 seconds
                setTimeout(() => {
                    setShowChangePassword(false);
                    setPasswordSuccess('');
                }, 2000);
            }
        } catch (error) {
            const errorMsg =
                error.response?.data?.error?.message ||
                error.response?.data?.message ||
                'Failed to change password. Please try again.';
            setPasswordError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Profile Details</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {!showChangePassword ? (
                        <>
                            {/* Profile Information */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <User className="w-5 h-5 text-gray-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {user?.name || user?.full_name || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {user?.email || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Mobile</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {user?.mobile || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {user?.storeName && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <Building className="w-5 h-5 text-gray-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Store Name</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {user.storeName}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {user?.address && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Address</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {user.address}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <User className="w-5 h-5 text-gray-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Role</p>
                                        <p className="text-lg font-semibold text-gray-900 capitalize">
                                            {user?.role || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {user?.createdAt && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <User className="w-5 h-5 text-gray-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Member Since</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Change Password Button */}
                            <div className="border-t pt-4">
                                <button
                                    onClick={() => setShowChangePassword(true)}
                                    className="flex items-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Key className="w-5 h-5" />
                                    <span>Change Password</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Change Password Form */}
                            <div className="mb-4">
                                <button
                                    onClick={() => {
                                        setShowChangePassword(false);
                                        setPasswordError('');
                                        setPasswordSuccess('');
                                        setPasswordData({
                                            oldPassword: '',
                                            newPassword: '',
                                            confirmPassword: '',
                                        });
                                    }}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    ← Back to Profile
                                </button>
                            </div>

                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h3>

                            {passwordError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                                    {passwordSuccess}
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Old Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.oldPassword}
                                        onChange={(e) =>
                                            setPasswordData({
                                                ...passwordData,
                                                oldPassword: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            setPasswordData({
                                                ...passwordData,
                                                newPassword: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        minLength={6}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordData({
                                                ...passwordData,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setPasswordError('');
                                            setPasswordSuccess('');
                                            setPasswordData({
                                                oldPassword: '',
                                                newPassword: '',
                                                confirmPassword: '',
                                            });
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}



