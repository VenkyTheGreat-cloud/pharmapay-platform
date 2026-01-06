import { useState, useEffect } from 'react';
import { ordersAPI, deliveryBoysAPI } from '../services/api';
import { Package, Calendar, Filter, Eye, Plus, UserPlus, Trash2 } from 'lucide-react';
import CreateOrderModal from '../components/CreateOrderModal';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: '',
        dateTo: '',
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('');

    useEffect(() => {
        loadOrders();
    }, [filters]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.status) params.status = filters.status.toUpperCase();
            if (filters.dateFrom) params.dateFrom = filters.dateFrom;
            if (filters.dateTo) params.dateTo = filters.dateTo;
            params.page = 1;
            params.limit = 20;
            
            const response = await ordersAPI.getAll(params);
            // Backend: { success, data: { orders: [...], pagination: {...} } }
            const list = response.data?.data?.orders || response.data?.data || [];
            setOrders(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const viewOrderDetails = async (orderId) => {
        try {
            const response = await ordersAPI.getById(orderId);
            // Backend: { success, data: {...order} }
            setSelectedOrder(response.data?.data);
            setShowViewModal(true);
        } catch (error) {
            console.error('Error loading order details:', error);
        }
    };

    const loadDeliveryBoys = async () => {
        try {
            const response = await deliveryBoysAPI.listApproved();
            // Backend: { success, data: { delivery_boys: [...], count: ... } }
            const list = response.data?.data?.delivery_boys || response.data?.data || [];
            setDeliveryBoys(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading delivery boys:', error);
            setDeliveryBoys([]);
        }
    };

    const openAssignModal = async (order) => {
        setSelectedOrder(order);
        await loadDeliveryBoys();
        setSelectedDeliveryBoy(order.delivery_boy_id || '');
        setShowAssignModal(true);
    };

    const handleAssign = async () => {
        if (!selectedDeliveryBoy) {
            alert('Please select a delivery boy');
            return;
        }

        try {
            await ordersAPI.assign(selectedOrder.id, selectedDeliveryBoy);
            alert('Order assigned successfully!');
            setShowAssignModal(false);
            setSelectedOrder(null);
            setSelectedDeliveryBoy('');
            loadOrders();
        } catch (error) {
            console.error('Error assigning order:', error);
            alert(error.response?.data?.message || 'Error assigning order');
        }
    };

    const handleDelete = async (orderId, orderNumber) => {
        if (!confirm(`Are you sure you want to delete order "${orderNumber}"?`)) {
            return;
        }

        try {
            await ordersAPI.delete(orderId);
            alert('Order deleted successfully!');
            loadOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert(error.response?.data?.message || 'Error deleting order');
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        const normalized = status.toUpperCase();
        const colors = {
            ASSIGNED: 'bg-purple-100 text-purple-800',
            ACCEPTED: 'bg-blue-100 text-blue-800',
            REJECTED: 'bg-red-100 text-red-800',
            PICKED_UP: 'bg-yellow-100 text-yellow-800',
            IN_TRANSIT: 'bg-orange-100 text-orange-800',
            PAYMENT_COLLECTION: 'bg-indigo-100 text-indigo-800',
            DELIVERED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };
        return colors[normalized] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-600 mt-1">Create and manage all orders</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create New Order
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                        >
                            <option value="">All Status</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="PICKED_UP">Picked Up</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="PAYMENT_COLLECTION">Payment Collection</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading orders...</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[150px]">
                                    Order #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Delivery Boy
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const orderNumber = order.orderNumber || order.order_number || '';

                                    // Format order number by trimming the middle for long IDs
                                    const formatOrderNumber = (orderNum) => {
                                        if (!orderNum) return '-';

                                        const maxLength = 18;
                                        if (orderNum.length <= maxLength) {
                                            return <span className="font-medium text-sm break-all">{orderNum}</span>;
                                        }

                                        const start = orderNum.slice(0, 10);
                                        const end = orderNum.slice(-6);

                                        return (
                                            <span className="font-medium text-sm break-all">
                                                {start}...{end}
                                            </span>
                                        );
                                    };

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-gray-900 max-w-[150px]">
                                                {formatOrderNumber(orderNumber)}
                                            </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.customerName || order.customer_name}</div>
                                            <div className="text-sm text-gray-500">{order.customerMobile || order.customer_phone || order.customer_mobile}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {order.deliveryBoyName || order.delivery_boy_name || 'Not assigned'}
                                            </div>
                                            {order.deliveryBoyMobile || order.delivery_boy_mobile ? (
                                                <div className="text-sm text-gray-500">{order.deliveryBoyMobile || order.delivery_boy_mobile}</div>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">₹{order.amount || order.total_amount || '0.00'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status ? order.status.replace(/_/g, ' ') : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(order.createdTime || order.created_at) ? new Date(order.createdTime || order.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center justify-start gap-3">
                                                <button
                                                    onClick={() => viewOrderDetails(order.id)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                {/* Show Assign button for: unassigned orders, REJECTED orders (to reassign), or ASSIGNED orders (to change assignment) */}
                                                {((order.status === 'REJECTED' || order.status === 'rejected') ||
                                                  !(order.deliveryBoyId || order.assigned_delivery_boy_id) ||
                                                  (order.status === 'ASSIGNED' || order.status === 'assigned')) && (
                                                    <button
                                                        onClick={() => openAssignModal(order)}
                                                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                                        title="Assign/Reassign Delivery Boy"
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {(order.status === 'ASSIGNED' || order.status === 'assigned') && (
                                                    <button
                                                        onClick={() => handleDelete(order.id, order.orderNumber || order.order_number)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Order Modal */}
            <CreateOrderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    loadOrders();
                }}
            />

            {/* Assign Delivery Boy Modal */}
            {showAssignModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Assign Delivery Boy
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Order: <span className="font-semibold">{selectedOrder.orderNumber || selectedOrder.order_number || 'N/A'}</span>
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Delivery Boy
                                </label>
                                <select
                                    value={selectedDeliveryBoy}
                                    onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a delivery boy</option>
                                    {deliveryBoys.length === 0 ? (
                                        <option value="" disabled>No approved delivery boys available</option>
                                    ) : (
                                        deliveryBoys.map(boy => (
                                            <option key={boy.id} value={boy.id}>
                                                {boy.name} - {boy.mobile}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAssign}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                                >
                                    Assign
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedOrder(null);
                                        setSelectedDeliveryBoy('');
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {showViewModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedOrder.orderNumber || selectedOrder.order_number || 'N/A'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Order Information */}
                                <div className="space-y-6">
                                    {/* Order Status */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Current Status</h3>
                                        <span
                                            className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                                                selectedOrder.status
                                            )}`}
                                        >
                                            {selectedOrder.status ? selectedOrder.status.replace(/_/g, ' ').toUpperCase() : 'N/A'}
                                        </span>
                                    </div>

                                    {/* Customer Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                            <div>
                                                <p className="text-sm text-gray-500">Name</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {selectedOrder.customerName || selectedOrder.customer_name || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Mobile</p>
                                                <p className="text-base text-gray-900">
                                                    {selectedOrder.customerMobile || selectedOrder.customer_phone || selectedOrder.customer_mobile || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Address</p>
                                                <p className="text-base text-gray-900">
                                                    {selectedOrder.customerAddress || selectedOrder.customer_address || selectedOrder.address || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Boy Information */}
                                    {(selectedOrder.deliveryBoyName || selectedOrder.delivery_boy_name) && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Boy</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                                <div>
                                                    <p className="text-sm text-gray-500">Name</p>
                                                    <p className="text-base font-medium text-gray-900">
                                                        {selectedOrder.deliveryBoyName || selectedOrder.delivery_boy_name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Mobile</p>
                                                    <p className="text-base text-gray-900">
                                                        {selectedOrder.deliveryBoyMobile || selectedOrder.delivery_boy_mobile || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                            {selectedOrder.payment_summary ? (
                                                <>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Total Amount</span>
                                                        <span className="text-xl font-bold text-gray-900">
                                                            ₹{(Number(selectedOrder.payment_summary.total_amount) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Paid Amount</span>
                                                        <span className="text-lg font-semibold text-gray-900">
                                                            ₹{(Number(selectedOrder.payment_summary.total_paid) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Remaining Amount</span>
                                                        <span className="text-lg font-semibold text-gray-900">
                                                            ₹{(Number(selectedOrder.payment_summary.remaining_amount) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Payment Status</span>
                                                        <span className={`text-sm font-semibold rounded-full px-2 py-1 ${
                                                            selectedOrder.payment_summary.payment_status === 'FULL' || selectedOrder.payment_summary.is_fully_paid
                                                                ? 'bg-green-100 text-green-800'
                                                                : selectedOrder.payment_summary.payment_status === 'PARTIAL'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {selectedOrder.payment_summary.payment_status || 'PENDING'}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Total Amount</span>
                                                        <span className="text-xl font-bold text-gray-900">
                                                            ₹{(Number(selectedOrder.amount || selectedOrder.total_amount) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Paid Amount</span>
                                                        <span className="text-lg font-semibold text-gray-900">
                                                            ₹{(Number(selectedOrder.paidAmount || selectedOrder.paid_amount) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Remaining Amount</span>
                                                        <span className="text-lg font-semibold text-gray-900">
                                                            ₹{((Number(selectedOrder.amount || selectedOrder.total_amount) || 0) - (Number(selectedOrder.paidAmount || selectedOrder.paid_amount) || 0)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {(selectedOrder.payment_status) && (
                                                        <div className="flex justify-between items-center border-b pb-2">
                                                            <span className="text-sm font-medium text-gray-700">Payment Status</span>
                                                            <span className={`text-sm font-semibold rounded-full px-2 py-1 ${
                                                                selectedOrder.payment_status === 'FULL' || selectedOrder.payment_status === 'PAID'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : selectedOrder.payment_status === 'PARTIAL'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {selectedOrder.payment_status}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {(selectedOrder.paymentMode || selectedOrder.payment_mode) && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">Payment Mode</span>
                                                    <span className="text-base font-semibold text-blue-600">
                                                        {selectedOrder.paymentMode || selectedOrder.payment_mode}
                                                    </span>
                                                </div>
                                            )}
                                            {(selectedOrder.transactionReference || selectedOrder.transaction_reference) && (
                                                <div className="pt-2 border-t">
                                                    <p className="text-sm text-gray-500 mb-1">Transaction Reference</p>
                                                    <p className="text-base text-gray-900 font-mono">
                                                        {selectedOrder.transactionReference || selectedOrder.transaction_reference}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Status Timeline */}
                                <div className="space-y-6">
                                    {/* Status Timeline */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Status Timeline</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="space-y-4">
                                                {/* Created */}
                                                {selectedOrder.created_at || selectedOrder.createdTime ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Order Created</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.created_at || selectedOrder.createdTime).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Assigned */}
                                                {selectedOrder.assigned_at ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Assigned to Delivery Boy</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.assigned_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Accepted */}
                                                {selectedOrder.accepted_at ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Accepted by Delivery Boy</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.accepted_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Picked Up */}
                                                {selectedOrder.picked_up_at ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Picked Up</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.picked_up_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* In Transit */}
                                                {selectedOrder.in_transit_at ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">In Transit</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.in_transit_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Payment Collection */}
                                                {selectedOrder.payment_collection_at ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Payment Collected</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.payment_collection_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Delivered */}
                                                {selectedOrder.delivered_at ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Delivered</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.delivered_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Cancelled */}
                                                {selectedOrder.cancelled_at ? (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Cancelled</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.cancelled_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Comments */}
                                    {(selectedOrder.customerComments || selectedOrder.customer_comments) && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Comments</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-900">
                                                    {selectedOrder.customerComments || selectedOrder.customer_comments}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {selectedOrder.notes && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Receipt Photo - Only for DELIVERED orders */}
                                    {((selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'delivered') && 
                                      (selectedOrder.receipt_photo_url || selectedOrder.receiptPhotoUrl)) && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Receipt Photo</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg flex justify-center">
                                                <img
                                                    src={selectedOrder.receipt_photo_url || selectedOrder.receiptPhotoUrl}
                                                    alt="Receipt"
                                                    className="rounded-lg border border-gray-200 shadow-sm object-contain max-w-md max-h-64"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                                <p className="text-sm text-gray-500 mt-2 text-center" style={{ display: 'none' }}>
                                                    Failed to load receipt image
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
