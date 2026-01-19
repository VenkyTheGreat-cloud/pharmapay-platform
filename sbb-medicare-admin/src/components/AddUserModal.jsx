import { useState } from 'react';
import { X } from 'lucide-react';
import { deliveryBoysAPI, accessControlAPI } from '../services/api';

export default function AddUserModal({ isOpen, onClose, onSuccess, userType = 'delivery_boy' }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        mobile: '',
        address: '',
        store_name: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (userType === 'delivery_boy') {
                // Backend requires password for delivery boy
                await deliveryBoysAPI.create({
                    name: formData.name,
                    email: formData.email,
                    mobile: formData.mobile,
                    address: formData.address,
                    password: formData.password,
                });
            } else {
                await accessControlAPI.create({
                    name: formData.name,
                    email: formData.email,
                    mobile: formData.mobile,
                    password: formData.password,
                    address: formData.address,
                    store_name: formData.store_name,
                });
            }

            alert(`${userType === 'store_staff' ? 'Store Manager' : 'Delivery Boy'} created successfully!`);
            onSuccess();
            onClose();
            setFormData({
                email: '',
                password: '',
                name: '',
                mobile: '',
                address: '',
                store_name: '',
            });
        } catch (err) {
            const errorMsg = err.response?.data?.error?.message || 
                           err.response?.data?.message || 
                           'Failed to create user';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Add {userType === 'store_staff' ? 'Store Staff' : 'Delivery Boy'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password *
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                minLength={6}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Minimum 6 characters (used for login)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mobile Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {userType === 'store_staff' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Store Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.store_name}
                                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {loading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
