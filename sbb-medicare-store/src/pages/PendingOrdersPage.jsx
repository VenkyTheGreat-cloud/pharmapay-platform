import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { Eye } from 'lucide-react';

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
                                        <th className="px-6 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Date
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
                                                <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {(order.createdTime || order.created_at) ? new Date(order.createdTime || order.created_at).toLocaleDateString() : '-'}
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

            {/* Order Details Modal - Reuse from OrdersPage if needed */}
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
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Customer</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {selectedOrder.customerName || selectedOrder.customer_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status ? selectedOrder.status.replace(/_/g, ' ').toUpperCase() : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-base font-medium text-gray-900">
                                        ₹{(Number(selectedOrder.amount || selectedOrder.total_amount) || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
