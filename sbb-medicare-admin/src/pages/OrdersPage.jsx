import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { Eye } from 'lucide-react';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        limit: 20,
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadOrders();
    }, [filters.status, filters.page, filters.limit]);

    const normalizeOrder = (apiOrder) => ({
        id: apiOrder.id,
        orderNumber: apiOrder.orderNumber,
        customerName: apiOrder.customerName,
        customerMobile: apiOrder.customerMobile,
        deliveryBoyName: apiOrder.deliveryBoyName,
        deliveryBoyMobile: apiOrder.deliveryBoyMobile,
        status: apiOrder.status,
        amount: apiOrder.amount,
        paymentMode: apiOrder.paymentMode,
        paymentStatus: apiOrder.paymentStatus,
        customerComments: apiOrder.customerComments,
        address: apiOrder.address,
        createdTime: apiOrder.createdTime,
        deliveredAt: apiOrder.deliveredAt,
        items: apiOrder.items || [],
    });

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = {
                status: filters.status || undefined,
                page: filters.page,
                limit: filters.limit,
            };
            const response = await ordersAPI.getAll(params);
            const list = response.data?.data?.orders || [];
            setOrders(list.map(normalizeOrder));
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewOrderDetails = async (orderId) => {
        try {
            const response = await ordersAPI.getById(orderId);
            const apiOrder = response.data?.data;
            setSelectedOrder(normalizeOrder(apiOrder));
            setShowModal(true);
        } catch (error) {
            console.error('Error loading order details:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            ASSIGNED: 'bg-purple-100 text-purple-800',
            PICKED_UP: 'bg-yellow-100 text-yellow-800',
            IN_TRANSIT: 'bg-orange-100 text-orange-800',
            DELIVERED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-600 mt-1">View and manage all orders</p>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="border border-gray-300 rounded px-3 py-2"
                        >
                            <option value="">All Status</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
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
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {order.orderNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.customerName}</div>
                                            <div className="text-sm text-gray-500">{order.customerMobile}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {order.deliveryBoyName || 'Not assigned'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">₹{order.amount}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.createdTime
                                                ? new Date(order.createdTime).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => viewOrderDetails(order.id)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Details"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Order Details Modal */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-700">Order Number</h3>
                                    <p className="text-gray-900">{selectedOrder.orderNumber}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Customer</h3>
                                    <p className="text-gray-900">{selectedOrder.customerName}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customerMobile}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.address}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Items</h3>
                                    <pre className="text-sm bg-gray-50 p-3 rounded">
                                        {JSON.stringify(selectedOrder.items, null, 2)}
                                    </pre>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Total Amount</h3>
                                    <p className="text-xl font-bold text-gray-900">₹{selectedOrder.amount}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Status</h3>
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                            selectedOrder.status
                                        )}`}
                                    >
                                        {selectedOrder.status}
                                    </span>
                                </div>

                                {selectedOrder.deliveryBoyName && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Delivery Boy</h3>
                                        <p className="text-gray-900">{selectedOrder.deliveryBoyName}</p>
                                        <p className="text-sm text-gray-600">{selectedOrder.deliveryBoyMobile}</p>
                                    </div>
                                )}

                                {selectedOrder.customerComments && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Customer Comments</h3>
                                        <p className="text-gray-900">{selectedOrder.customerComments}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
