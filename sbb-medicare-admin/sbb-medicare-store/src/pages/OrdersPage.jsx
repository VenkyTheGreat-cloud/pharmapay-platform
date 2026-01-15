import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { Eye } from 'lucide-react';
import OrderDetailsModal from '../components/OrderDetailsModal';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        limit: 20,
    });
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);

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

    const handleViewOrderDetails = (orderId) => {
        setSelectedOrderId(orderId);
        setShowOrderDetails(true);
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
                                                onClick={() => handleViewOrderDetails(order.id)}
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
            <OrderDetailsModal
                isOpen={showOrderDetails}
                onClose={() => {
                    setShowOrderDetails(false);
                    setSelectedOrderId(null);
                }}
                orderId={selectedOrderId}
            />
        </div>
    );
}
