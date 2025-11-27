import { useState, useEffect } from 'react';
import { accessControlAPI } from '../services/api';
import { UserCheck, UserX, Plus, Edit, Trash2 } from 'lucide-react';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';

export default function StoreStaffPage() {
    const [storeStaff, setStoreStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, active, inactive
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadStoreStaff();
    }, []);

    const loadStoreStaff = async () => {
        try {
            const response = await accessControlAPI.getAll();
            setStoreStaff(response.data?.data || []);
        } catch (error) {
            console.error('Error loading store staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (userId) => {
        if (!confirm('Activate this store staff member?')) return;

        try {
            await accessControlAPI.toggleActive(userId, true);
            loadStoreStaff();
            alert('Store staff activated successfully');
        } catch (error) {
            alert('Error activating store staff');
        }
    };

    const handleDeactivate = async (userId) => {
        if (!confirm('Deactivate this store staff member?')) return;

        try {
            await accessControlAPI.toggleActive(userId, false);
            loadStoreStaff();
            alert('Store staff deactivated');
        } catch (error) {
            alert('Error deactivating store staff');
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

    const filteredStoreStaff = storeStaff.filter((staff) => {
        if (activeTab === 'active') return staff.isActive;
        if (activeTab === 'inactive') return !staff.isActive;
        return true;
    });

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading store staff...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Store Staff</h1>
                    <p className="text-gray-600 mt-1">Manage store staff members</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
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
                            ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                            : 'text-gray-600'
                    }`}
                >
                    All ({storeStaff.length})
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-2 px-4 ${
                        activeTab === 'active'
                            ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                            : 'text-gray-600'
                    }`}
                >
                    Active ({storeStaff.filter((s) => s.isActive).length})
                </button>
                <button
                    onClick={() => setActiveTab('inactive')}
                    className={`pb-2 px-4 ${
                        activeTab === 'inactive'
                            ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                            : 'text-gray-600'
                    }`}
                >
                    Inactive ({storeStaff.filter((s) => !s.isActive).length})
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
                                        <StatusBadge isActive={staff.isActive} />
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
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Edit"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            {staff.isActive ? (
                                                <button
                                                    onClick={() => handleDeactivate(staff.id)}
                                                    className="text-orange-600 hover:text-orange-900"
                                                    title="Deactivate"
                                                >
                                                    <UserX className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivate(staff.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Activate"
                                                >
                                                    <UserCheck className="w-5 h-5" />
                                                </button>
                                            )}
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

function StatusBadge({ isActive }) {
    const config = isActive
        ? { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' }
        : { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' };

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
