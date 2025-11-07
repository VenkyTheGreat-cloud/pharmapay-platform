import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { UserCheck, UserX, Users, Clock, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function DeliveryBoysPage() {
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, active, pending
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadDeliveryBoys();
        loadPendingRequests();
    }, []);

    const loadDeliveryBoys = async () => {
        try {
            const response = await usersAPI.getDeliveryBoys();
            setDeliveryBoys(response.data.delivery_boys || []);
        } catch (error) {
            console.error('Error loading delivery boys:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingRequests = async () => {
        try {
            const response = await usersAPI.getPendingRequests();
            setPendingRequests(response.data.pending_requests || []);
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    };

    const handleApprove = async (userId) => {
        if (!confirm('Approve this delivery boy?')) return;

        try {
            await usersAPI.updateStatus(userId, 'active');
            loadDeliveryBoys();
            loadPendingRequests();
            alert('Delivery boy approved successfully');
        } catch (error) {
            alert('Error approving delivery boy');
        }
    };

    const handleReject = async (userId) => {
        if (!confirm('Reject this delivery boy request?')) return;

        try {
            await usersAPI.updateStatus(userId, 'rejected');
            loadDeliveryBoys();
            loadPendingRequests();
            alert('Request rejected');
        } catch (error) {
            alert('Error rejecting request');
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this delivery boy?')) return;

        try {
            await usersAPI.delete(userId);
            loadDeliveryBoys();
            alert('Delivery boy deleted successfully');
        } catch (error) {
            alert('Error deleting delivery boy');
        }
    };

    const handleDeactivate = async (userId) => {
        if (!confirm('Deactivate this delivery boy?')) return;

        try {
            await usersAPI.updateStatus(userId, 'inactive');
            loadDeliveryBoys();
            alert('Delivery boy deactivated');
        } catch (error) {
            alert('Error deactivating delivery boy');
        }
    };

    const filteredDeliveryBoys = deliveryBoys.filter((boy) => {
        if (activeTab === 'active') return boy.status === 'active';
        if (activeTab === 'pending') return boy.status === 'pending';
        return true;
    });

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading delivery boys...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Delivery Boys</h1>
                    <p className="text-gray-600 mt-1">Manage delivery personnel</p>
                </div>
            </div>

            {/* Pending Requests Alert */}
            {pendingRequests.length > 0 && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800">
                        You have {pendingRequests.length} pending approval request(s)
                    </span>
                </div>
            )}

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
                    All ({deliveryBoys.length})
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-2 px-4 ${
                        activeTab === 'active'
                            ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                            : 'text-gray-600'
                    }`}
                >
                    Active ({deliveryBoys.filter((b) => b.status === 'active').length})
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 px-4 ${
                        activeTab === 'pending'
                            ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                            : 'text-gray-600'
                    }`}
                >
                    Pending ({pendingRequests.length})
                </button>
            </div>

            {/* Delivery Boys Table */}
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
                        {filteredDeliveryBoys.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No delivery boys found
                                </td>
                            </tr>
                        ) : (
                            filteredDeliveryBoys.map((boy) => (
                                <tr key={boy.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{boy.full_name}</div>
                                            <div className="text-sm text-gray-500">{boy.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{boy.mobile_number}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={boy.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(boy.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {boy.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(boy.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(boy.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : boy.status === 'active' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDeactivate(boy.id)}
                                                    className="text-orange-600 hover:text-orange-900"
                                                    title="Deactivate"
                                                >
                                                    <UserX className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(boy.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleDelete(boy.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const statusConfig = {
        active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
        inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
