import { useState, useEffect } from 'react';
import { accessControlAPI } from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';

export default function StoreStaffPage() {
    const [storeStaff, setStoreStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, active, inactive
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadStoreStaff();
    }, [activeTab]);

    const loadStoreStaff = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Always fetch all records, then filter client-side
            const response = await accessControlAPI.getAll();
            
            // Handle API response structure: { success: true, data: { store_managers: [...] } }
            const responseData = response.data?.data || {};
            const storeManagersArray = responseData.store_managers || [];
            
            // Map snake_case to camelCase for consistency
            // Handle is_active as string ("true", "false", "pending") or boolean
            const mappedData = storeManagersArray.map(manager => {
                // Convert is_active string to boolean for internal use
                let isActiveValue = manager.is_active;
                if (typeof isActiveValue === 'string') {
                    isActiveValue = isActiveValue === 'true';
                } else if (isActiveValue === undefined || isActiveValue === null) {
                    isActiveValue = false;
                }
                
                return {
                    id: manager.id,
                    name: manager.name,
                    email: manager.email,
                    mobile: manager.mobile,
                    address: manager.address,
                    storeName: manager.store_name || manager.storeName,
                    role: manager.role,
                    isActive: isActiveValue,
                    isActiveRaw: manager.is_active, // Keep raw value for filtering
                    status: manager.status || (isActiveValue ? 'active' : 'inactive'),
                    createdAt: manager.created_at || manager.createdAt,
                    updatedAt: manager.updated_at || manager.updatedAt,
                };
            });
            
            setStoreStaff(mappedData);
        } catch (error) {
            console.error('Error loading store staff:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to load store staff';
            setError(errorMsg);
            setStoreStaff([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (userId, isActive) => {
        const action = isActive ? 'activate' : 'deactivate';
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this store manager?`)) return;

        try {
            await accessControlAPI.toggleActive(userId, isActive);
            loadStoreStaff();
            alert(`Store manager ${action}d successfully`);
        } catch (error) {
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           `Error ${action}ing store manager`;
            alert(errorMsg);
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this store staff member?')) return;

        try {
            await accessControlAPI.delete(userId);
            loadStoreStaff();
            alert('Store staff deleted successfully');
        } catch (error) {
            alert('Error deleting store staff');
        }
    };

    // Filter based on is_active raw value (string: "true", "false", "pending")
    const filteredStoreStaff = storeStaff.filter((staff) => {
        if (activeTab === 'active') {
            return staff.isActiveRaw === 'true' || staff.isActiveRaw === true;
        }
        if (activeTab === 'inactive') {
            return staff.isActiveRaw === 'false' || staff.isActiveRaw === false;
        }
        return true; // 'all' tab shows everything
    });
    
    // Calculate tab counts based on raw is_active values
    const activeCount = storeStaff.filter(s => s.isActiveRaw === 'true' || s.isActiveRaw === true).length;
    const inactiveCount = storeStaff.filter(s => s.isActiveRaw === 'false' || s.isActiveRaw === false).length;

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading store staff...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                        <strong>Error:</strong> {error}
                    </p>
                    <button
                        onClick={loadStoreStaff}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                    >
                        Retry
                    </button>
                </div>
            )}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Store Staff</h1>
                    <p className="text-gray-600 mt-1">Manage store staff members</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-primary-700 flex items-center gap-2 shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    Add New Store Staff
                </button>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-2 px-4 ${
                        activeTab === 'all'
                            ? 'border-b-2 border-primary-500 text-primary-600 font-semibold'
                            : 'text-gray-600'
                    }`}
                >
                    All ({storeStaff.length})
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-2 px-4 ${
                        activeTab === 'active'
                            ? 'border-b-2 border-primary-500 text-primary-600 font-semibold'
                            : 'text-gray-600'
                    }`}
                >
                    Active ({activeCount})
                </button>
                <button
                    onClick={() => setActiveTab('inactive')}
                    className={`pb-2 px-4 ${
                        activeTab === 'inactive'
                            ? 'border-b-2 border-primary-500 text-primary-600 font-semibold'
                            : 'text-gray-600'
                    }`}
                >
                    Inactive ({inactiveCount})
                </button>
            </div>

            {/* Store Staff Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Registered
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStoreStaff.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No store staff found
                                </td>
                            </tr>
                        ) : (
                            filteredStoreStaff.map((staff) => (
                                <tr key={staff.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                                            <div className="text-sm text-gray-500">{staff.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{staff.mobile}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge isActive={staff.isActive} status={staff.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(staff);
                                                    setShowEditModal(true);
                                                }}
                                                className="text-primary-600 hover:text-primary-700"
                                                title="Edit"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(staff.id)}
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
                    loadStoreStaff();
                }}
                userType="store_staff"
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                }}
                onSuccess={() => {
                    loadStoreStaff();
                }}
                user={selectedUser}
                userType="store_staff"
            />
        </div>
    );
}

function StatusBadge({ isActive, status }) {
    // Use status field if available, otherwise fallback to isActive
    const displayStatus = status || (isActive ? 'active' : 'inactive');
    
    let config;
    if (displayStatus === 'active') {
        config = { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' };
    } else {
        config = { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' };
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
