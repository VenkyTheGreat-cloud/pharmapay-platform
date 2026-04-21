import { useState, useEffect } from 'react';
import { deliveryBoysAPI, marketplaceAPI } from '../services/api';
import { UserCheck, UserX, Clock, Plus, Edit, Trash2, Truck, ClipboardList, Calendar, Check, X, Loader2 } from 'lucide-react';
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

    // Top-level page tab: 'deliveryBoys' or 'applications'
    const [pageTab, setPageTab] = useState('deliveryBoys');

    // Applications state
    const [applications, setApplications] = useState([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [appsError, setAppsError] = useState(null);
    const [approveModal, setApproveModal] = useState({ open: false, application: null });
    const [rejectModal, setRejectModal] = useState({ open: false, application: null });
    const [approveForm, setApproveForm] = useState({
        ratePerKm: '',
        baseRate: '',
        contractPeriod: '3',
        termsNotes: '',
    });
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadDeliveryBoys();
    }, [activeTab]);

    useEffect(() => {
        if (pageTab === 'applications') {
            loadApplications();
        }
    }, [pageTab]);

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

    const loadApplications = async () => {
        try {
            setAppsLoading(true);
            setAppsError(null);
            const response = await marketplaceAPI.getApplications();
            const data = response.data?.data?.applications || response.data?.data || response.data?.applications || [];
            setApplications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading applications:', err);
            setAppsError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load applications');
            setApplications([]);
        } finally {
            setAppsLoading(false);
        }
    };

    const handleMarkF2F = async (appId) => {
        try {
            setActionLoading(true);
            await marketplaceAPI.markF2F(appId);
            loadApplications();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to mark F2F done');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!approveModal.application) return;
        try {
            setActionLoading(true);
            const today = new Date();
            const months = parseInt(approveForm.contractPeriod);
            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + months);

            await marketplaceAPI.approveWithTerms(approveModal.application.id, {
                rate_per_km: parseFloat(approveForm.ratePerKm),
                base_rate: parseFloat(approveForm.baseRate),
                contract_period_months: months,
                terms_notes: approveForm.termsNotes,
                contract_start: today.toISOString().split('T')[0],
                contract_end: endDate.toISOString().split('T')[0],
            });
            setApproveModal({ open: false, application: null });
            setApproveForm({ ratePerKm: '', baseRate: '', contractPeriod: '3', termsNotes: '' });
            loadApplications();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve application');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectModal.application) return;
        try {
            setActionLoading(true);
            await marketplaceAPI.rejectApplication(rejectModal.application.id, rejectReason);
            setRejectModal({ open: false, application: null });
            setRejectReason('');
            loadApplications();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject application');
        } finally {
            setActionLoading(false);
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

    const getContractEndDate = () => {
        const today = new Date();
        const months = parseInt(approveForm.contractPeriod);
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + months);
        return endDate.toLocaleDateString();
    };

    // Show loading only for the delivery boys tab initial load
    if (loading && pageTab === 'deliveryBoys') {
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
                    {pageTab === 'deliveryBoys' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add New Delivery Boy</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    )}
                </div>

                {/* Top-Level Page Tabs */}
                <div className="mt-3 flex gap-1">
                    <button
                        onClick={() => setPageTab('deliveryBoys')}
                        className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                            pageTab === 'deliveryBoys'
                                ? 'bg-white text-primary-700 border border-b-0 border-primary-200'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                        }`}
                    >
                        <Truck className="w-3.5 h-3.5" />
                        Delivery Boys
                    </button>
                    <button
                        onClick={() => setPageTab('applications')}
                        className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                            pageTab === 'applications'
                                ? 'bg-white text-primary-700 border border-b-0 border-primary-200'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                        }`}
                    >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Applications
                    </button>
                </div>
            </div>

            {/* ==================== DELIVERY BOYS TAB ==================== */}
            {pageTab === 'deliveryBoys' && (
                <>
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
                    </div>
                </>
            )}

            {/* ==================== APPLICATIONS TAB ==================== */}
            {pageTab === 'applications' && (
                <>
                    {appsError && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex-shrink-0">
                            <p className="text-red-800 text-xs">
                                <strong>Error:</strong> {appsError}
                            </p>
                            <button
                                onClick={loadApplications}
                                className="mt-2 text-red-600 hover:text-red-800 text-xs underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {appsLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                                <p className="text-gray-600 mt-3 text-sm">Loading applications...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
                            <div className="overflow-auto flex-1 min-h-0">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">Phone</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">Photo</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">Applied Date</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">F2F Status</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {applications.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center">
                                                    <div className="text-gray-400 text-sm">
                                                        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                        <p>No applications found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            applications.map((app) => (
                                                <tr key={app.id} className="hover:bg-primary-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-xs font-medium text-gray-900">{app.name || app.user_name || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-xs text-gray-700">{app.phone || app.mobile || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {(app.photo_url || app.photoUrl) ? (
                                                            <img
                                                                src={app.photo_url || app.photoUrl}
                                                                alt={app.name || 'Applicant'}
                                                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <span className="text-xs text-gray-500">{(app.name || '?')[0]?.toUpperCase()}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                                        {app.applied_at || app.created_at
                                                            ? new Date(app.applied_at || app.created_at).toLocaleDateString()
                                                            : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {app.f2f_done || app.f2f_completed ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                Completed <Check className="w-3 h-3 ml-1" />
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                <Clock className="w-3 h-3 mr-1" /> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                                                        <ApplicationActions
                                                            app={app}
                                                            onMarkF2F={() => handleMarkF2F(app.id)}
                                                            onApprove={() => {
                                                                setApproveForm({ ratePerKm: '', baseRate: '', contractPeriod: '3', termsNotes: '' });
                                                                setApproveModal({ open: true, application: app });
                                                            }}
                                                            onReject={() => {
                                                                setRejectReason('');
                                                                setRejectModal({ open: true, application: app });
                                                            }}
                                                            actionLoading={actionLoading}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ==================== APPROVE MODAL ==================== */}
            {approveModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-green-600" />
                                Approve Application - {approveModal.application?.name || approveModal.application?.user_name}
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Rate per KM (INR)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 8.00"
                                    value={approveForm.ratePerKm}
                                    onChange={(e) => setApproveForm(f => ({ ...f, ratePerKm: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Base Rate (INR)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 30.00"
                                    value={approveForm.baseRate}
                                    onChange={(e) => setApproveForm(f => ({ ...f, baseRate: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Contract Period</label>
                                <div className="flex gap-4 mt-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="contractPeriod"
                                            value="3"
                                            checked={approveForm.contractPeriod === '3'}
                                            onChange={(e) => setApproveForm(f => ({ ...f, contractPeriod: e.target.value }))}
                                            className="text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">3 Months</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="contractPeriod"
                                            value="6"
                                            checked={approveForm.contractPeriod === '6'}
                                            onChange={(e) => setApproveForm(f => ({ ...f, contractPeriod: e.target.value }))}
                                            className="text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">6 Months</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Terms & Notes</label>
                                <textarea
                                    placeholder="Enter terms and conditions or notes..."
                                    value={approveForm.termsNotes}
                                    onChange={(e) => setApproveForm(f => ({ ...f, termsNotes: e.target.value }))}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                />
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="font-medium">Contract Start:</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="font-medium">Contract End:</span>
                                    <span>{getContractEndDate()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setApproveModal({ open: false, application: null })}
                                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading || !approveForm.ratePerKm || !approveForm.baseRate}
                                className="px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== REJECT MODAL ==================== */}
            {rejectModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <X className="w-4 h-4 text-red-600" />
                                Reject Application - {rejectModal.application?.name || rejectModal.application?.user_name}
                            </h3>
                        </div>
                        <div className="p-5">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Rejection</label>
                            <textarea
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                            />
                        </div>
                        <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModal({ open: false, application: null })}
                                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}
                                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

function ApplicationActions({ app, onMarkF2F, onApprove, onReject, actionLoading }) {
    const f2fDone = app.f2f_done || app.f2f_completed;
    const status = app.status || app.application_status;

    if (status === 'approved') {
        return (
            <div className="text-xs">
                <span className="text-green-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Approved
                </span>
                {(app.contract_end || app.rate_per_km) && (
                    <span className="text-gray-500 text-[10px] block mt-0.5">
                        {app.rate_per_km && `${app.rate_per_km}/km`}
                        {app.contract_end && ` | Ends ${new Date(app.contract_end).toLocaleDateString()}`}
                    </span>
                )}
            </div>
        );
    }

    if (status === 'rejected') {
        return (
            <span className="text-red-700 font-semibold text-xs flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Rejected
            </span>
        );
    }

    if (!f2fDone) {
        return (
            <button
                onClick={onMarkF2F}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
            >
                <UserCheck className="w-3.5 h-3.5" />
                Mark F2F Done
            </button>
        );
    }

    // F2F done but not yet approved/rejected
    return (
        <div className="flex gap-2">
            <button
                onClick={onApprove}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
            >
                <Check className="w-3.5 h-3.5" />
                Approve
            </button>
            <button
                onClick={onReject}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
            >
                <X className="w-3.5 h-3.5" />
                Reject
            </button>
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
