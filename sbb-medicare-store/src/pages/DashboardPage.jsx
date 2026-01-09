import { useState, useEffect, useMemo } from 'react';
import { ordersAPI } from '../services/api';
import { Package, DollarSign, CheckCircle, Truck, Calendar, IndianRupee, Eye } from 'lucide-react';

// Helper function to format image URL - handles base64 data and regular URLs
const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    const trimmedUrl = url.trim();
    
    // Return null for empty or invalid URLs
    if (!trimmedUrl || trimmedUrl === ',' || trimmedUrl.length === 0) return null;
    
    // If it's already a data URI, use as-is
    if (trimmedUrl.startsWith('data:')) {
        return trimmedUrl;
    }
    
    // If it's a full URL (http/https), use as-is
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
    }
    
    // If it starts with a forward slash, it's a relative path - use as-is
    if (trimmedUrl.startsWith('/')) {
        return trimmedUrl;
    }
    
    // For anything else that's reasonably long, treat as base64
    // This is the safest approach - if it's not a recognized URL format and is long, it's likely base64
    if (trimmedUrl.length > 20) {
        // Format as base64 data URI (assume JPEG)
        // This will work for base64 strings like "9j/4AAQSkZJRgABAQAAA..."
        return `data:image/jpeg;base64,${trimmedUrl}`;
    }
    
    // For short strings, return as-is (might be a filename or short identifier)
    return trimmedUrl;
};

export default function DashboardPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            // Fetch orders (we'll filter by date and status on the client)
            const res = await ordersAPI.getAll({ page: 1, limit: 1000 });
            const list = res.data?.data?.orders || res.data?.data || [];
            setOrders(list);
        } catch (error) {
            console.error('Error loading orders for dashboard:', error);
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
            alert('Error loading order details. Please try again.');
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

    const {
        filteredByDate,
        summary,
        filteredForList,
    } = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                filteredByDate: [],
                summary: {
                    totalCreated: 0,
                    totalDelivered: 0,
                    totalAssigned: 0,
                    totalPickedUp: 0,
                    totalCollectedAmount: 0,
                },
                filteredForList: [],
            };
        }

        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(`${dateRange.to}T23:59:59`) : null;

        const inRange = orders.filter((order) => {
            const created = (order.createdTime || order.created_at) ? new Date(order.createdTime || order.created_at) : null;
            if (!created) return false;
            if (fromDate && created < fromDate) return false;
            if (toDate && created > toDate) return false;
            return true;
        });

        const totalCreated = inRange.length;
        const totalDelivered = inRange.filter((o) => o.status === 'DELIVERED').length;
        const totalAssigned = inRange.filter((o) => o.status === 'ASSIGNED').length;
        const totalPickedUp = inRange.filter((o) => o.status === 'PICKED_UP').length;

        const totalCollectedAmount = inRange
            .filter((o) => o.status === 'DELIVERED' || o.status === 'PAYMENT_COLLECTION')
            .reduce((sum, o) => sum + (Number(o.amount || o.total_amount) || 0), 0);

        // For list: show ALL statuses (ASSIGNED, IN_TRANSIT, DELIVERED, etc.)
        const list = inRange;

        return {
            filteredByDate: inRange,
            summary: {
                totalCreated,
                totalDelivered,
                totalAssigned,
                totalPickedUp,
                totalCollectedAmount,
            },
            filteredForList: list,
        };
    }, [orders, dateRange]);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Orders and collections for the selected date range</p>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6 bg-white rounded-lg shadow p-4 flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <button
                    type="button"
                    onClick={loadOrders}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading statistics...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                        <StatCard
                            icon={<Package className="w-6 h-6" />}
                            label="Total Created Orders"
                            value={summary.totalCreated}
                            color="blue"
                        />
                        <StatCard
                            icon={<IndianRupee className="w-6 h-6" />}
                            label="Total Collected Amount"
                            value={`₹${summary.totalCollectedAmount.toFixed(2)}`}
                            color="green"
                        />
                        <StatCard
                            icon={<CheckCircle className="w-6 h-6" />}
                            label="Total Delivered Orders"
                            value={summary.totalDelivered}
                            color="purple"
                        />
                        <StatCard
                            icon={<Truck className="w-6 h-6" />}
                            label="Assigned Orders"
                            value={summary.totalAssigned}
                            color="orange"
                        />
                        <StatCard
                            icon={<Truck className="w-6 h-6" />}
                            label="PickedUp Orders"
                            value={summary.totalPickedUp}
                            color="orange"
                        />
                    </div>

                    {/* Orders List for selected date range (non-ongoing only) */}
                    <div className="bg-white rounded-lg shadow p-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders in Date Range</h3>
                        {filteredForList.length === 0 ? (
                            <p className="text-gray-600 text-sm">No orders found for the selected date range.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Order ID
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Customer
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Area
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Delivery Boy
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Date &amp; Time
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Amount
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                        {filteredForList.map((order) => {
                                            const orderNumber = order.orderNumber || order.order_number || '';

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
                                            <tr key={order.id}>
                                                <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 max-w-[160px]">
                                                    {formatOrderNumber(orderNumber)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="text-gray-900">{order.customerName || order.customer_name}</div>
                                                    <div className="text-xs text-gray-500">{order.customerMobile || order.customer_phone || order.customer_mobile}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="text-gray-900">{order.customer_area || order.customerArea || '-'}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="text-gray-900">
                                                        {order.deliveryBoyName || order.delivery_boy_name || 'Not assigned'}
                            </div>
                                                    {(order.deliveryBoyMobile || order.delivery_boy_mobile) && (
                                                        <div className="text-xs text-gray-500">
                                                            {order.deliveryBoyMobile || order.delivery_boy_mobile}
                            </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                                                    {(order.createdTime || order.created_at)
                                                        ? new Date(order.createdTime || order.created_at).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                                                    ₹{(Number(order.amount || order.total_amount) || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => viewOrderDetails(order.id)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                        </div>
                    )}
                    </div>
                </>
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
                                                <p className="text-sm text-gray-500">Area</p>
                                                <p className="text-base text-gray-900">
                                                    {selectedOrder.customer_area || selectedOrder.customerArea || 'N/A'}
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
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                            {/* Payment Summary */}
                                            {selectedOrder.payment_summary ? (
                                                <>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Total Amount</span>
                                                        <span className="text-xl font-bold text-gray-900">
                                                            ₹{(Number(selectedOrder.payment_summary.total_amount) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="text-sm font-medium text-gray-700">Total Paid</span>
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
                                                            selectedOrder.payment_summary.payment_status === 'FULL' || selectedOrder.payment_summary.is_fully_paid || selectedOrder.payment_summary.payment_status === 'PAID'
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

                                            {/* Individual Payment Methods */}
                                            {selectedOrder.payments && Array.isArray(selectedOrder.payments) && selectedOrder.payments.length > 0 && (
                                                <div className="pt-3 border-t">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Methods</h4>
                                                    <div className="space-y-3">
                                                        {selectedOrder.payments.map((payment, index) => {
                                                            const cashAmount = Number(payment.cash_amount || payment.cashAmount || 0);
                                                            const bankAmount = Number(payment.bank_amount || payment.bankAmount || 0);
                                                            const totalAmount = cashAmount + bankAmount;
                                                            const paymentMode = payment.payment_mode || payment.paymentMode || 'N/A';
                                                            const transactionRef = payment.transaction_reference || payment.transactionReference;
                                                            const paymentStatus = payment.status || 'PENDING';
                                                            const createdAt = payment.created_at || payment.createdAt;
                                                            const createdByName = payment.created_by_name || payment.createdByName;

                                                            return (
                                                                <div key={payment.id || index} className="bg-white p-3 rounded-lg border border-gray-200">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div>
                                                                            <span className="text-sm font-semibold text-gray-900">
                                                                                {paymentMode.replace(/_/g, ' ')}
                                                                            </span>
                                                                            <span className={`ml-2 text-xs font-semibold rounded-full px-2 py-0.5 ${
                                                                                paymentStatus === 'CONFIRMED'
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : paymentStatus === 'PENDING'
                                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                                    : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                                {paymentStatus}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-base font-bold text-gray-900">
                                                                            ₹{totalAmount.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                    {cashAmount > 0 && bankAmount > 0 && (
                                                                        <div className="text-xs text-gray-600 mb-1">
                                                                            Cash: ₹{cashAmount.toFixed(2)} + Bank: ₹{bankAmount.toFixed(2)}
                                                                        </div>
                                                                    )}
                                                                    {cashAmount > 0 && bankAmount === 0 && (
                                                                        <div className="text-xs text-gray-600 mb-1">
                                                                            Cash Payment
                                                                        </div>
                                                                    )}
                                                                    {bankAmount > 0 && cashAmount === 0 && (
                                                                        <div className="text-xs text-gray-600 mb-1">
                                                                            Bank/UPI Payment
                                                                        </div>
                                                                    )}
                                                                    {transactionRef && (
                                                                        <div className="text-xs text-gray-600 mb-1">
                                                                            <span className="font-medium">Txn Ref:</span> <span className="font-mono">{transactionRef}</span>
                                                                        </div>
                                                                    )}
                                                                    {createdAt && (
                                                                        <div className="text-xs text-gray-500">
                                                                            {new Date(createdAt).toLocaleString()}
                                                                        </div>
                                                                    )}
                                                                    {createdByName && (
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            Collected by: {createdByName}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
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
                                      (() => {
                                        // Check for receipt photos in payments array
                                        const payments = selectedOrder.payments || [];
                                        const receiptPhotos = payments
                                            .map(payment => payment.receipt_photo_url || payment.receiptPhotoUrl)
                                            .filter(url => url && url.trim() && url.trim() !== ',' && formatImageUrl(url));
                                        
                                        // Also check direct order level receipt_photo_url (fallback)
                                        if (selectedOrder.receipt_photo_url || selectedOrder.receiptPhotoUrl) {
                                            const directUrl = selectedOrder.receipt_photo_url || selectedOrder.receiptPhotoUrl;
                                            if (directUrl && directUrl.trim() && directUrl.trim() !== ',') {
                                                receiptPhotos.push(directUrl);
                                            }
                                        }
                                        
                                        return receiptPhotos.length > 0;
                                      })()) && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Receipt Photo</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                                {(() => {
                                                    // Get all valid receipt photos from payments array
                                                    const payments = selectedOrder.payments || [];
                                                    const receiptPhotos = payments
                                                        .map(payment => payment.receipt_photo_url || payment.receiptPhotoUrl)
                                                        .filter(url => url && url.trim() && url.trim() !== ',' && formatImageUrl(url));
                                                    
                                                    // Also check direct order level receipt_photo_url (fallback)
                                                    if (selectedOrder.receipt_photo_url || selectedOrder.receiptPhotoUrl) {
                                                        const directUrl = selectedOrder.receipt_photo_url || selectedOrder.receiptPhotoUrl;
                                                        if (directUrl && directUrl.trim() && directUrl.trim() !== ',') {
                                                            receiptPhotos.push(directUrl);
                                                        }
                                                    }
                                                    
                                                    return receiptPhotos.map((photoUrl, index) => {
                                                        // Ensure we format the URL - treat any non-URL string longer than 20 chars as base64
                                                        let formattedUrl = formatImageUrl(photoUrl);
                                                        
                                                        // Double-check: if it's still not a data URI or full URL, and it's long, format as base64
                                                        if (formattedUrl && !formattedUrl.startsWith('data:') && !formattedUrl.startsWith('http') && formattedUrl.length > 20) {
                                                            formattedUrl = `data:image/jpeg;base64,${formattedUrl}`;
                                                        }
                                                        
                                                        if (!formattedUrl) return null;
                                                        
                                                        return (
                                                            <div key={index} className="flex justify-center">
                                                                <img
                                                                    src={formattedUrl}
                                                                    alt={`Receipt ${index + 1}`}
                                                                    className="rounded-lg border border-gray-200 shadow-sm object-contain max-w-md max-h-64"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        const errorMsg = e.target.nextElementSibling;
                                                                        if (errorMsg) errorMsg.style.display = 'block';
                                                                    }}
                                                                />
                                                                <p className="text-sm text-gray-500 mt-2 text-center" style={{ display: 'none' }}>
                                                                    Failed to load receipt image
                                                                </p>
                                                            </div>
                                                        );
                                                    }).filter(Boolean);
                                                })()}
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

function StatCard({ icon, label, value, color }) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    if (!status) return null;
    const labelMap = {
        ASSIGNED: 'Assigned',
        ACCEPTED: 'Accepted',
        REJECTED: 'Rejected',
        PICKED_UP: 'PickedUp',
        IN_TRANSIT: 'InTransit',
        PAYMENT_COLLECTION: 'Payment Collected',
        DELIVERED: 'Delivered',
        CANCELLED: 'Cancelled',
    };
    const colorMap = {
        ASSIGNED: 'bg-purple-100 text-purple-800',
        ACCEPTED: 'bg-blue-100 text-blue-800',
        REJECTED: 'bg-red-100 text-red-800',
        PICKED_UP: 'bg-yellow-100 text-yellow-800',
        IN_TRANSIT: 'bg-orange-100 text-orange-800',
        PAYMENT_COLLECTION: 'bg-indigo-100 text-indigo-800',
        DELIVERED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };

    const key = status.toUpperCase();
    const label = labelMap[key] || status;
    const colors = colorMap[key] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors}`}>
            {label}
        </span>
    );
}
