import { useState, useEffect, useMemo } from 'react';
import { ordersAPI, deliveryBoysAPI } from '../services/api';
import { Package, Calendar, Filter, Eye, Plus, UserPlus, Trash2, Edit } from 'lucide-react';
import CreateOrderModal from '../components/CreateOrderModal';
import EditOrderModal from '../components/EditOrderModal';

// Helper function to get today's date in IST (Indian Standard Time, UTC+5:30)
const getTodayIST = () => {
    const now = new Date();
    // Use Intl.DateTimeFormat to get date in IST timezone
    const istDateString = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
    
    // Return in YYYY-MM-DD format (en-CA locale already returns this format)
    return istDateString;
};

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

export default function OrdersPage() {
    const [allOrders, setAllOrders] = useState([]); // Store all downloaded orders
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        selectedDate: getTodayIST(),
        orderId: '',
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('');

    // Load orders only when date changes
    useEffect(() => {
        loadOrders();
    }, [filters.selectedDate]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = {};
            // Only filter by selected date in API call
            if (filters.selectedDate) {
                params.dateFrom = filters.selectedDate;
                params.dateTo = filters.selectedDate;
            }
            params.page = 1;
            params.limit = 1000; // Get all orders for the day
            
            const response = await ordersAPI.getAll(params);
            // Backend: { success, data: { orders: [...], pagination: {...} } }
            const list = response.data?.data?.orders || response.data?.data || [];
            
            // Filter orders for the selected date (00:00:00 to 23:59:59)
            let filteredOrders = Array.isArray(list) ? list : [];
            if (filters.selectedDate) {
                const selectedDateObj = new Date(filters.selectedDate);
                const startOfDay = new Date(selectedDateObj);
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date(selectedDateObj);
                endOfDay.setHours(23, 59, 59, 999);
                
                filteredOrders = filteredOrders.filter((order) => {
                    const created = (order.createdTime || order.created_at) ? new Date(order.createdTime || order.created_at) : null;
                    if (!created) return false;
                    return created >= startOfDay && created <= endOfDay;
                });
            }
            
            // Store all downloaded orders (no local filtering here)
            setAllOrders(filteredOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            setAllOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Local filtering using useMemo - filters by status and orderId without API call
    const orders = useMemo(() => {
        let filtered = [...allOrders];

        // Filter by status
        if (filters.status && filters.status.trim()) {
            const statusUpper = filters.status.toUpperCase();
            filtered = filtered.filter((order) => {
                const orderStatus = (order.status || '').toUpperCase();
                return orderStatus === statusUpper;
            });
        }

        // Filter by order ID
        if (filters.orderId && filters.orderId.trim()) {
            const searchId = filters.orderId.trim();
            filtered = filtered.filter((order) => {
                const orderNumber = (order.orderNumber || order.order_number || '').toString();
                return orderNumber.includes(searchId);
            });
        }

        return filtered;
    }, [allOrders, filters.status, filters.orderId]);

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

    const openEditModal = async (order) => {
        try {
            // Fetch full order details to ensure we have all the data
            const response = await ordersAPI.getById(order.id);
            setSelectedOrder(response.data?.data || order);
            setShowEditModal(true);
        } catch (error) {
            console.error('Error loading order details:', error);
            // If API call fails, use the order data we have
            setSelectedOrder(order);
            setShowEditModal(true);
        }
    };

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

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Create and manage all orders</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date:</label>
                            <input
                                type="date"
                                value={filters.selectedDate}
                                onChange={(e) => setFilters({ ...filters, selectedDate: e.target.value })}
                                max={getTodayIST()}
                                className="border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={loadOrders}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center gap-1.5 text-sm"
                        >
                            <Calendar className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md flex items-center gap-1.5 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create Order
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading orders...</p>
                </div>
            ) : (
                <div className="px-4 pb-4 flex flex-col flex-1 min-h-0">
                    <div className="bg-white rounded-lg shadow p-4 flex flex-col flex-1 min-h-0">
                    <div className="flex justify-between items-center mb-2 flex-shrink-0">
                        <h3 className="text-base font-semibold text-gray-900">Orders List</h3>
                        <div className="flex items-center gap-2">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
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
                            <input
                                type="text"
                                value={filters.orderId}
                                onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
                                placeholder="Search by Order ID"
                                className="border border-gray-300 rounded px-2.5 py-1.5 text-sm w-44"
                            />
                            {(filters.status || filters.orderId) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilters({
                                            ...filters,
                                            status: '',
                                            orderId: '',
                                        });
                                    }}
                                    className="bg-gray-200 text-gray-800 px-2.5 py-1.5 rounded-lg hover:bg-gray-300 text-sm"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    {orders.length === 0 ? (
                        <p className="text-gray-600 text-sm">No orders found.</p>
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
                                                <tr key={order.id} className="hover:bg-primary-50 transition-colors border-b border-gray-100">
                                                    <td className="px-4 py-4 text-sm text-gray-900 text-center">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900 max-w-[150px]">
                                                        {formatOrderNumber(orderNumber)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{order.customerName || order.customer_name}</div>
                                                        <div className="text-sm text-gray-500">{order.customerMobile || order.customer_phone || order.customer_mobile}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{order.customer_area || order.customerArea || '-'}</div>
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ minWidth: '150px' }}>
                                                        <div className="flex items-center justify-start gap-3">
                                                            <button
                                                                onClick={() => viewOrderDetails(order.id)}
                                                                className="text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-primary-50 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                            {/* Edit button - Hide for cancelled and delivered orders */}
                                                            {order.status !== 'CANCELLED' && 
                                                             order.status !== 'cancelled' && 
                                                             order.status !== 'DELIVERED' && 
                                                             order.status !== 'delivered' && (
                                                                <button
                                                                    onClick={() => openEditModal(order)}
                                                                    className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                                                                    title="Edit Order"
                                                                >
                                                                    <Edit className="w-5 h-5" />
                                                                </button>
                                                            )}
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
                                        })}
                                </tbody>
                                </table>
                            </div>
                        )}
                    </div>
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

            {/* Edit Order Modal */}
            <EditOrderModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedOrder(null);
                }}
                onSuccess={() => {
                    loadOrders();
                }}
                order={selectedOrder}
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                                    className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md"
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
                                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
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
