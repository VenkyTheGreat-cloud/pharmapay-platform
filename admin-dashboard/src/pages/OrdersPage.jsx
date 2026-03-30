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


    return (
        <div className="p-4 h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Fixed Header Section - Compact */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 -mx-4 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Orders</h1>
                        <p className="text-xs text-gray-600">View and manage all orders</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4 bg-white rounded-lg shadow-sm p-3 flex-shrink-0">
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                    <div>
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
                        <p className="text-gray-600 mt-3 text-sm">Loading orders...</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col flex-1 min-h-0">
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
                                                className="text-primary-600 hover:text-primary-700"
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
