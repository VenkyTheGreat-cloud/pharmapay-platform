import { useState, useEffect } from 'react';
import { deliveryBoysAPI } from '../services/api';
import { UserCheck, UserX, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';

export default function DeliveryBoysPage() {
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, active, inactive
    const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadDeliveryBoys();
    }, [activeTab]);

    const loadDeliveryBoys = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Build query params based on active tab
            let params = {};
            if (activeTab === 'active') {
                params.is_active = true;
            } else if (activeTab === 'inactive') {
                params.is_active = false;
            }
            
            const response = await deliveryBoysAPI.getAll(params);
            
            // Handle API response structure: { success: true, data: { delivery_boys: [...], count, active_count, inactive_count } }
            const responseData = response.data?.data || {};
            const deliveryBoysArray = responseData.delivery_boys || [];
            
            // Update counts from API response
            setCounts({
                total: responseData.count || deliveryBoysArray.length,
                active: responseData.active_count || 0,
                inactive: responseData.inactive_count || 0,
            });
            
            // Map snake_case to camelCase for consistency
            const mappedData = deliveryBoysArray.map(boy => ({
                id: boy.id,
                name: boy.name,
                email: boy.email,
                mobile: boy.mobile,
                address: boy.address,
                photoUrl: boy.photo_url || boy.photoUrl,
                status: boy.status,
                isActive: boy.is_active !== undefined ? boy.is_active : boy.isActive,
                createdAt: boy.created_at || boy.createdAt,
                updatedAt: boy.updated_at || boy.updatedAt,
                storeId: boy.store_id || boy.storeId,
                storeName: boy.store_name || boy.storeName,
            }));
            
            setDeliveryBoys(mappedData);
        } catch (error) {
            console.error('Error loading delivery boys:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to load delivery boys';
            setError(errorMsg);
            // Set empty array on error to prevent blank screen
            setDeliveryBoys([]);
            setCounts({ total: 0, active: 0, inactive: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this delivery boy?')) return;

        try {
            await deliveryBoysAPI.delete(userId);
            loadDeliveryBoys();
            alert('Delivery boy deleted successfully');
        } catch (error) {
            alert('Error deleting delivery boy');
        }
    };

    const handleToggleActive = async (userId, isActive) => {
        const action = isActive ? 'activate' : 'deactivate';
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this delivery boy?`)) return;

        try {
            await deliveryBoysAPI.toggleActive(userId, isActive);
            loadDeliveryBoys();
            alert(`Delivery boy ${action}d successfully`);
        } catch (error) {
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           `Error ${action}ing delivery boy`;
            alert(errorMsg);
        }
    };

    if (loading) {
        return (
            <div className="p-4 h-screen flex items-center justify-center bg-gray-100">
                <div>
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
                    <p className="text-gray-600 mt-3 text-sm">Loading delivery boys...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Fixed Header Section - Compact */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 -mx-4 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Delivery Boys</h1>
                        <p className="text-xs text-gray-600">Manage delivery personnel</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add New Delivery Boy</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex-shrink-0">
                    <p className="text-red-800 text-xs">
                        <strong>Error:</strong> {error}
                    </p>
                    <button
                        onClick={loadDeliveryBoys}
                        className="mt-2 text-red-600 hover:text-red-800 text-xs underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-4 flex gap-4 border-b flex-shrink-0">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-2 px-4 ${
                        activeTab === 'all'
                            ? 'border-b-2 border-primary-500 text-primary-600 font-semibold text-xs'
                            : 'text-gray-600'
                    }`}
                >
                    All ({counts.total})
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-2 px-4 ${
                        activeTab === 'active'
                            ? 'border-b-2 border-primary-500 text-primary-600 font-semibold text-xs'
                            : 'text-gray-600'
                    }`}
                >
                    Active ({counts.active})
                </button>
                <button
                    onClick={() => setActiveTab('inactive')}
                    className={`pb-2 px-4 ${
                        activeTab === 'inactive'
                            ? 'border-b-2 border-primary-500 text-primary-600 font-semibold text-xs'
                            : 'text-gray-600'
                    }`}
                >
                    Inactive ({counts.inactive})
                </button>
            </div>

            {/* Delivery Boys Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
                <div className="overflow-auto flex-1 min-h-0">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Registered
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {deliveryBoys.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="text-gray-400 text-sm">
                                            <p>No delivery boys found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                deliveryBoys.map((boy) => (
                                    <tr key={boy.id || Math.random()} className="hover:bg-primary-50 transition-colors border-b border-gray-100">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div>
                                                <div className="text-xs font-medium text-gray-900">{boy.name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{boy.email || ''}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs text-gray-700">{boy.mobile || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <StatusBadge isActive={boy.isActive} status={boy.status} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                            {boy.createdAt ? new Date(boy.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(boy);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-primary-600 hover:text-primary-700"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            {boy.isActive ? (
                                                <button
                                                    onClick={() => handleToggleActive(boy.id, false)}
                                                    className="text-orange-600 hover:text-orange-900"
                                                    title="Deactivate"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </button>
                                        ) : (
                                                <button
                                                    onClick={() => handleToggleActive(boy.id, true)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Activate"
                                                >
                                                    <UserCheck className="w-4 h-4" />
                                                </button>
                                            )}
                                                <button
                                                    onClick={() => handleDelete(boy.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            <AddUserModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    loadDeliveryBoys();
                }}
                userType="delivery_boy"
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                }}
                onSuccess={() => {
                    loadDeliveryBoys();
                }}
                user={selectedUser}
                userType="delivery_boy"
            />
        </div>
    );
}

function StatusBadge({ isActive, status }) {
    let config;

    // Use status field for display as per API spec
    if (status === 'pending') {
        config = { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' };
    } else if (status === 'approved') {
        config = { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' };
    } else if (status === 'rejected') {
        config = { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' };
    } else {
        config = { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown' };
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
