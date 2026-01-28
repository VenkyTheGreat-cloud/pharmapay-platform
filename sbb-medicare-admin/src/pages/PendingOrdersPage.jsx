import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { Clock, Eye, Package, Search } from 'lucide-react';
import OrderDetailsModal from '../components/OrderDetailsModal';

export default function PendingOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        loadPendingOrders();
    }, []);

    const loadPendingOrders = async () => {
        try {
            setLoading(true);
            const params = {
                page: 1,
                limit: 100,
            };
            const response = await ordersAPI.getPendingTillYesterday(params);
            console.log('Pending Orders API Response:', response.data);
            
            // Handle different possible response structures
            let allList = [];
            if (response.data?.data?.orders) {
                allList = response.data.data.orders;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                allList = response.data.data;
            } else if (response.data?.orders) {
                allList = response.data.orders;
            } else if (Array.isArray(response.data)) {
                allList = response.data;
            }
            
            // Normalize order data
            const normalizedOrders = allList.map(order => ({
                id: order.id,
                orderNumber: order.order_number || order.orderNumber,
                customerName: order.customer_name || order.customerName,
                customerMobile: order.customer_phone || order.customer_mobile || order.customerMobile,
                customerArea: order.customer_area || order.customerArea,
                deliveryBoyName: order.delivery_boy_name || order.deliveryBoyName,
                deliveryBoyMobile: order.delivery_boy_mobile || order.deliveryBoyMobile,
                status: order.status,
                amount: parseFloat(order.total_amount || order.amount || 0),
                paymentMode: order.payment_mode || order.paymentMode,
                paymentStatus: order.payment_status || order.paymentStatus,
                customerComments: order.customer_comments || order.customerComments || order.comments || order.notes,
                address: order.customer_address || order.address || order.delivery_address,
                createdTime: order.created_at || order.created_time || order.createdTime || order.order_date,
                deliveredAt: order.delivered_at || order.deliveredAt || order.delivered_time,
                items: order.items || order.medicines || [],
                returnItems: order.return_items || order.returnItems || false,
                returnAdjustAmount: parseFloat(order.return_adjust_amount || order.returnAdjustAmount || 0),
            }));
            
            setOrders(normalizedOrders);
        } catch (error) {
            console.error('Error loading pending orders:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to load pending orders';
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((order) => {
        // Filter by status
        if (statusFilter !== 'ALL' && order.status !== statusFilter) {
            return false;
        }
        
        // Filter by search query (order ID)
        if (searchQuery.trim()) {
            const orderIdStr = (order.orderNumber || order.id || '').toString().toLowerCase();
            const searchStr = searchQuery.toLowerCase().trim();
            if (!orderIdStr.includes(searchStr)) {
                return false;
            }
        }
        
        return true;
    });

    const handleViewOrderDetails = (orderId) => {
        setSelectedOrderId(orderId);
        setShowOrderDetails(true);
    };

    // Utility function to trim order ID in the middle
    const trimOrderId = (orderId) => {
        if (!orderId || orderId.length <= 15) return orderId;
        const start = orderId.substring(0, 8);
        const end = orderId.substring(orderId.length - 7);
        return `${start}...${end}`;
    };

    // Get unique statuses from orders for filter dropdown
    const uniqueStatuses = ['ALL', ...new Set(orders.map(o => o.status).filter(Boolean))];

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="p-4 h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Fixed Header Section - Compact */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 -mx-4 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Pending Orders</h1>
                        <p className="text-xs text-gray-600">Orders pending till yesterday</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                    <div>
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
                        <p className="text-gray-600 mt-3 text-sm">Loading pending orders...</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Orders Table */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
                        <div className="px-4 py-2 border-b bg-gradient-to-r from-gray-50 to-primary-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0">
                            <h2 className="text-sm font-semibold text-gray-800">Pending Orders List</h2>
                            <div className="flex items-center gap-2">
                                {/* Status Filter */}
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none border-2 border-primary-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-gray-700 bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                                    >
                                        {uniqueStatuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status === 'ALL' ? 'All Status' : status}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                        </svg>
                                    </div>
                                </div>
                                {/* Search by Order ID */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-primary-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by Order ID"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-3 py-1.5 border-2 border-primary-200 rounded-lg text-xs text-gray-700 bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-44 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-auto flex-1 min-h-0">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Sl.No
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Order #
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Area
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Delivery Boy
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Mode of Payment
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Return Items
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Return Adjust Amount
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="12" className="px-6 py-12 text-center">
                                                <div className="text-gray-400 text-sm">
                                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p>No pending orders found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order, index) => (
                                            <tr key={order.id} className="hover:bg-primary-50 transition-colors border-b border-gray-100">
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                                    {formatDate(order.createdTime)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {trimOrderId(order.orderNumber || order.id || 'N/A')}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                    <div className="font-medium text-gray-900">{order.customerName || 'N/A'}</div>
                                                    <div className="text-gray-500 text-xs mt-0.5">{order.customerMobile || ''}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                                                    {order.customerArea || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                    <div className="text-gray-700">{order.deliveryBoyName || 'Not assigned'}</div>
                                                    {order.deliveryBoyMobile && (
                                                        <div className="text-gray-500 text-xs mt-0.5">{order.deliveryBoyMobile}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-green-700">
                                                    ₹{parseFloat(order.amount || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                                                    {order.paymentMode || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                    <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded ${
                                                        order.returnItems ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {order.returnItems ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-red-700">
                                                    {order.returnAdjustAmount > 0 ? `₹${order.returnAdjustAmount.toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm ${
                                                        order.status === 'DELIVERED' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                                                        order.status === 'ASSIGNED' ? 'bg-gradient-to-r from-primary-400 to-primary-600 text-white' :
                                                        order.status === 'PICKED_UP' ? 'bg-gradient-to-r from-secondary-400 to-secondary-600 text-white' :
                                                        order.status === 'IN_TRANSIT' ? 'bg-gradient-to-r from-secondary-400 to-secondary-600 text-white' :
                                                        order.status === 'CANCELLED' ? 'bg-gradient-to-r from-red-400 to-red-600 text-white' :
                                                        'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                                                    }`}>
                                                        {order.status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                    <button
                                                        onClick={() => handleViewOrderDetails(order.id)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm"
                                                        title="View Order Details"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Details</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
