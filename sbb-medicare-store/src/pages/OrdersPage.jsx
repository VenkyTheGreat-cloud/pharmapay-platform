import { useState, useEffect } from 'react';
import { ordersAPI, deliveryBoysAPI } from '../services/api';
import { Package, Calendar, Filter, Eye, Plus, UserPlus, Trash2 } from 'lucide-react';
import CreateOrderModal from '../components/CreateOrderModal';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        date: '',
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
            const params = {
                status: filters.status || undefined,
                date: filters.date || undefined,
                page: 1,
                limit: 20,
            };
            const response = await ordersAPI.getAll(params);
            // Backend: { success, data: { orders: [...], pagination: {...} } }
            const list = response.data?.data?.orders || [];
            setOrders(list);
        } catch (error) {
            console.error('Error loading orders:', error);
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
            const response = await deliveryBoysAPI.list({ status: 'approved', isActive: true });
            // Backend: { success, data: [...] }
            const list = response.data?.data || [];
            setDeliveryBoys(list);
        } catch (error) {
            console.error('Error loading delivery boys:', error);
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
                            <option value="new">New</option>
                            <option value="assigned">Assigned</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="in_transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
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
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.createdTime ? new Date(order.createdTime).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => viewOrderDetails(order.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                {(order.status === 'ASSIGNED' || !order.deliveryBoyId) && (
                                                    <button
                                                        onClick={() => openAssignModal(order)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Assign Delivery Boy"
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {order.status === 'ASSIGNED' && (
                                                    <button
                                                        onClick={() => handleDelete(order.id, order.orderNumber)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
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
                                Order: <span className="font-semibold">{selectedOrder.order_number}</span>
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
                                    {deliveryBoys.map(boy => (
                                        <option key={boy.id} value={boy.id}>
                                            {boy.full_name} - {boy.mobile_number}
                                        </option>
                                    ))}
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
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-700">Order Number</h3>
                                    <p className="text-gray-900">{selectedOrder.order_number}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Customer</h3>
                                    <p className="text-gray-900">{selectedOrder.customer_name}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customer_mobile}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customer_address}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Items</h3>
                                    <pre className="text-sm bg-gray-50 p-3 rounded">
                                        {JSON.stringify(selectedOrder.items, null, 2)}
                                    </pre>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Total Amount</h3>
                                    <p className="text-xl font-bold text-gray-900">₹{selectedOrder.total_amount}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Status</h3>
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                            selectedOrder.status
                                        )}`}
                                    >
                                        {selectedOrder.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>

                                {selectedOrder.delivery_boy_name && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Delivery Boy</h3>
                                        <p className="text-gray-900">{selectedOrder.delivery_boy_name}</p>
                                        <p className="text-sm text-gray-600">{selectedOrder.delivery_boy_mobile}</p>
                                    </div>
                                )}

                                {selectedOrder.notes && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Notes</h3>
                                        <p className="text-gray-900">{selectedOrder.notes}</p>
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
