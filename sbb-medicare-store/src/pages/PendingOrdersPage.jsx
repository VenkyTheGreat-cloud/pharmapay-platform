import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { Eye } from 'lucide-react';

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

// Helper function to get status color
const getStatusColor = (status) => {
    if (!status) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    const normalized = status.toUpperCase();
    const colors = {
        ASSIGNED: 'bg-gradient-to-r from-primary-400 to-primary-600 text-white',
        ACCEPTED: 'bg-gradient-to-r from-primary-400 to-primary-600 text-white',
        REJECTED: 'bg-gradient-to-r from-red-400 to-red-600 text-white',
        PICKED_UP: 'bg-gradient-to-r from-secondary-400 to-secondary-600 text-white',
        IN_TRANSIT: 'bg-gradient-to-r from-secondary-400 to-secondary-600 text-white',
        PAYMENT_COLLECTION: 'bg-gradient-to-r from-indigo-400 to-indigo-600 text-white',
        DELIVERED: 'bg-gradient-to-r from-green-400 to-green-600 text-white',
        CANCELLED: 'bg-gradient-to-r from-red-400 to-red-600 text-white',
    };
    return colors[normalized] || 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
};

export default function PendingOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    // Handle Escape key to close Order Details Modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showViewModal) {
                setShowViewModal(false);
            }
        };

        if (showViewModal) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showViewModal]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getPendingTillYesterday({ page: 1, limit: 100 });
            const list = response.data?.data?.orders || response.data?.data || [];
            setOrders(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading pending orders:', error);
            alert(error.response?.data?.error?.message || error.response?.data?.message || 'Error loading pending orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const viewOrderDetails = async (orderId) => {
        try {
            const response = await ordersAPI.getById(orderId);
            setSelectedOrder(response.data?.data);
            setShowViewModal(true);
        } catch (error) {
            console.error('Error loading order details:', error);
            alert('Error loading order details. Please try again.');
        }
    };

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
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Pending Orders (Till Yesterday)</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Orders pending till yesterday</p>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="px-4 pb-4 mt-4 flex flex-col flex-1 min-h-0">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
                    <div className="px-4 py-2 border-b bg-gradient-to-r from-gray-50 to-primary-50 flex-shrink-0">
                        <h3 className="text-xs font-medium text-gray-800">Pending Orders List</h3>
                    </div>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-600 text-xs">No pending orders found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 border border-gray-200 rounded">
                            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                                <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[80px]">
                                            Sl.No
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[150px]">
                                            Order #
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Area
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Delivery Boy
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Return Items
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Return Adjust Amount
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order, index) => {
                                        const orderNumber = order.orderNumber || order.order_number || '';
                                        
                                        return (
                                            <tr key={order.id} className="hover:bg-primary-50 transition-colors border-b border-gray-100">
                                                <td className="px-4 py-3 text-xs font-medium text-gray-900 text-center">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {(order.createdTime || order.created_at) ? new Date(order.createdTime || order.created_at).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-medium text-gray-900 max-w-[150px]">
                                                    {formatOrderNumber(orderNumber)}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="text-xs font-medium text-gray-900">{order.customerName || order.customer_name}</div>
                                                    <div className="text-xs text-gray-500">{order.customerMobile || order.customer_phone || order.customer_mobile}</div>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="text-xs font-medium text-gray-900">{order.customer_area || order.customerArea || '-'}</div>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="text-xs font-medium text-gray-900">
                                                        {order.deliveryBoyName || order.delivery_boy_name || 'Not assigned'}
                                                    </div>
                                                    {order.deliveryBoyMobile || order.delivery_boy_mobile ? (
                                                        <div className="text-xs text-gray-500">{order.deliveryBoyMobile || order.delivery_boy_mobile}</div>
                                                    ) : null}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="text-xs font-medium text-gray-900">₹{order.amount || order.total_amount || '0.00'}</div>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {order.returnItems || order.return_items ? 'Yes' : 'No'}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {order.returnAdjustAmount || order.return_adjust_amount 
                                                        ? `₹${(Number(order.returnAdjustAmount || order.return_adjust_amount)).toFixed(2)}`
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm ${getStatusColor(
                                                            order.status
                                                        )}`}
                                                    >
                                                        {order.status ? order.status.replace(/_/g, ' ') : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap" style={{ minWidth: '150px' }}>
                                                    <button
                                                        onClick={() => viewOrderDetails(order.id)}
                                                        className="text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-primary-50 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
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
            </div>

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

                                            {/* Return Items Information */}
                                            <div className="pt-3 border-t">
                                                <div className="flex justify-between items-center pb-2">
                                                    <span className="text-sm font-medium text-gray-700">Return Items</span>
                                                    <span className={`text-sm font-semibold rounded-full px-2 py-1 ${
                                                        selectedOrder.returnItems || selectedOrder.return_items
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {selectedOrder.returnItems || selectedOrder.return_items ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                                {(selectedOrder.returnAdjustAmount || selectedOrder.return_adjust_amount) && (
                                                    <div className="flex justify-between items-center pt-2 border-t">
                                                        <span className="text-sm font-medium text-gray-700">Return Adjust Amount</span>
                                                        <span className="text-lg font-semibold text-gray-900">
                                                            ₹{(Number(selectedOrder.returnAdjustAmount || selectedOrder.return_adjust_amount) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

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
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Order Created</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.created_at || selectedOrder.createdTime).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Assigned */}
                                                {selectedOrder.assigned_at && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Assigned to Delivery Boy</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.assigned_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Accepted */}
                                                {selectedOrder.accepted_at && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Accepted by Delivery Boy</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.accepted_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Picked Up */}
                                                {selectedOrder.picked_up_at && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Picked Up</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.picked_up_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* In Transit */}
                                                {selectedOrder.in_transit_at && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">In Transit</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.in_transit_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Payment Collection */}
                                                {selectedOrder.payment_collection_at && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Payment Collected</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.payment_collection_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Delivered */}
                                                {selectedOrder.delivered_at && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Delivered</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.delivered_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Cancelled */}
                                                {selectedOrder.cancelled_at && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">Cancelled</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(selectedOrder.cancelled_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
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
