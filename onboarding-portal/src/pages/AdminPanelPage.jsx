import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Building2, Check, X, Clock, Eye, Rocket, ChevronDown, ChevronUp, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_TABS = ['all', 'pending_approval', 'submitted', 'approved', 'rejected', 'live'];

const STATUS_LABELS = {
    pending_approval: 'Pending',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    building: 'Building',
    live: 'Live',
};

const STATUS_COLORS = {
    pending_approval: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    building: 'bg-purple-100 text-purple-800',
    live: 'bg-emerald-100 text-emerald-800',
};

export default function AdminPanelPage() {
    const { logout } = useAuth();
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [rejectModal, setRejectModal] = useState({ open: false, id: null });
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadPharmacies();
    }, []);

    const loadPharmacies = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminAPI.listPharmacies();
            const data = response.data?.data || response.data || [];
            setPharmacies(Array.isArray(data) ? data : data.pharmacies || []);
        } catch (err) {
            const errorMsg = err.response?.data?.error?.message || 'Failed to load pharmacy applications';
            setError(errorMsg);
            setPharmacies([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setActionLoading(id);
            await adminAPI.approve(id);
            await loadPharmacies();
        } catch {
            alert('Failed to approve pharmacy');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        try {
            setActionLoading(rejectModal.id);
            await adminAPI.reject(rejectModal.id, rejectReason);
            setRejectModal({ open: false, id: null });
            setRejectReason('');
            await loadPharmacies();
        } catch {
            alert('Failed to reject pharmacy');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredPharmacies = activeTab === 'all'
        ? pharmacies
        : pharmacies.filter((p) => p.status === activeTab);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary-600" />
                        <h1 className="text-xl font-bold text-gray-900">PharmaPay Admin Panel</h1>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Building2 className="w-8 h-8 text-primary-600" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Pharmacy Approvals</h2>
                        <p className="text-sm text-gray-500">Review and manage pharmacy applications</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                        <button onClick={loadPharmacies} className="ml-4 underline">Retry</button>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {tab === 'all' ? 'All' : STATUS_LABELS[tab] || tab}
                            <span className="ml-1.5 text-xs">
                                ({tab === 'all' ? pharmacies.length : pharmacies.filter((p) => p.status === tab).length})
                            </span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : filteredPharmacies.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No pharmacy applications found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pharmacy</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredPharmacies.map((pharmacy) => {
                                        const id = pharmacy.id || pharmacy._id;
                                        const status = pharmacy.status || 'pending_approval';
                                        const expanded = expandedId === id;

                                        return (
                                            <PharmacyRow
                                                key={id}
                                                pharmacy={pharmacy}
                                                status={status}
                                                expanded={expanded}
                                                onToggle={() => setExpandedId(expanded ? null : id)}
                                                onApprove={() => handleApprove(id)}
                                                onReject={() => setRejectModal({ open: true, id })}
                                                actionLoading={actionLoading === id}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {rejectModal.open && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
                            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection:</p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows={4}
                                placeholder="Enter rejection reason..."
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => { setRejectModal({ open: false, id: null }); setRejectReason(''); }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectReason.trim() || actionLoading}
                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Rejecting...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PharmacyRow({ pharmacy, status, expanded, onToggle, onApprove, onReject, actionLoading }) {
    const statusColor = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    const statusLabel = STATUS_LABELS[status] || status;

    return (
        <>
            <tr className="hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm font-medium text-gray-900">{pharmacy.name}</span>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{pharmacy.slug}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pharmacy.owner_name || pharmacy.owner_email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{pharmacy.plan}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusLabel}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pharmacy.submitted_at ? new Date(pharmacy.submitted_at).toLocaleDateString() :
                     pharmacy.created_at ? new Date(pharmacy.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                        {status === 'submitted' && (
                            <>
                                <button onClick={onApprove} disabled={actionLoading}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                    <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button onClick={onReject} disabled={actionLoading}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                                    <X className="w-3.5 h-3.5" /> Reject
                                </button>
                            </>
                        )}
                        {status === 'approved' && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <Check className="w-3.5 h-3.5" /> Approved
                            </span>
                        )}
                        {status === 'rejected' && (
                            <button onClick={onApprove} disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                <Eye className="w-3.5 h-3.5" /> Re-review
                            </button>
                        )}
                        {status === 'pending_approval' && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3.5 h-3.5" /> Awaiting submission
                            </span>
                        )}
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
                                {pharmacy.features && typeof pharmacy.features === 'object' ? (
                                    <ul className="space-y-1">
                                        {Object.entries(pharmacy.features).map(([key, value]) => (
                                            <li key={key} className="text-sm text-gray-600 flex items-center gap-2">
                                                {value ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                                                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-gray-400">No features data</p>}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Branding</h4>
                                <div className="space-y-2">
                                    {pharmacy.primary_color && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: pharmacy.primary_color }} />
                                            <span className="text-sm text-gray-600">{pharmacy.primary_color}</span>
                                        </div>
                                    )}
                                    {pharmacy.logo_url && (
                                        <img src={pharmacy.logo_url} alt="Logo" className="w-10 h-10 rounded object-contain border" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Limits</h4>
                                <p className="text-sm text-gray-600">Delivery Boys: {pharmacy.max_delivery_boys}</p>
                                <p className="text-sm text-gray-600">Outlets: {pharmacy.max_outlets}</p>
                            </div>
                        </div>
                        {status === 'rejected' && pharmacy.rejection_reason && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                                <p className="text-sm text-red-600 mt-1">{pharmacy.rejection_reason}</p>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}
