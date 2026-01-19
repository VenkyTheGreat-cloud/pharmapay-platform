import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { Package, CheckCircle, Clock, IndianRupee, Eye, RefreshCw, Search } from 'lucide-react';
import OrderDetailsModal from '../components/OrderDetailsModal';

export default function DashboardPage() {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [filters, setFilters] = useState(() => {
        // Get current date in IST (UTC+5:30)
        const getISTDate = () => {
            const now = new Date();
            // Convert to IST: UTC+5:30
            const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            // Format as YYYY-MM-DD
            const year = istTime.getFullYear();
            const month = String(istTime.getMonth() + 1).padStart(2, '0');
            const day = String(istTime.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        return {
            selectedDate: getISTDate(),
        };
    });

    useEffect(() => {
        loadDashboardData();
    }, [filters.selectedDate]); // Reload when date filter changes

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Build params with date filter - use the same date for from and to (00:00:00 to 23:59:59)
            const params = {
                page: 1,
                limit: 500,
                date_from: filters.selectedDate,
                date_to: filters.selectedDate,
            };
            const allRes = await ordersAPI.getAll(params);
            console.log('Dashboard Orders API Full Response:', allRes); // Debug log
            console.log('Dashboard Orders API Response Data:', allRes.data); // Debug log
            
            // Handle different possible response structures
            let allList = [];
            if (allRes.data?.data?.orders) {
                // Structure: { success: true, data: { orders: [...] } }
                allList = allRes.data.data.orders;
                console.log('Found orders in allRes.data.data.orders:', allList.length); // Debug log
            } else if (allRes.data?.data && Array.isArray(allRes.data.data)) {
                // Structure: { success: true, data: [...] }
                allList = allRes.data.data;
                console.log('Found orders in allRes.data.data (array):', allList.length); // Debug log
            } else if (allRes.data?.orders) {
                // Structure: { success: true, orders: [...] }
                allList = allRes.data.orders;
                console.log('Found orders in allRes.data.orders:', allList.length); // Debug log
            } else if (Array.isArray(allRes.data)) {
                // Direct array
                allList = allRes.data;
                console.log('Found orders in allRes.data (direct array):', allList.length); // Debug log
            } else {
                console.warn('No orders found in expected response structure. Response:', allRes.data); // Debug log
            }
            
            // Normalize order data (handle snake_case to camelCase)
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
            }));
            
            console.log('Normalized Orders:', normalizedOrders); // Debug log
            console.log('Total orders from API:', normalizedOrders.length); // Debug log
            setAllOrders(normalizedOrders);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to load orders';
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = allOrders.filter((order) => {
        // Since API already filters by date, we trust the API response
        // Only do client-side filtering for status and search
        
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

    // Stats for the selected date range
    const totalOrders = filteredOrders.length;
    const assignedOrders = filteredOrders.filter((o) => o.status === 'ASSIGNED').length;
    const pickedUpOrders = filteredOrders.filter(
        (o) => o.status === 'PICKED_UP' || o.status === 'IN_TRANSIT'
    ).length;
    const deliveredOrders = filteredOrders.filter((o) => o.status === 'DELIVERED').length;
    const collectedAmount = filteredOrders
        .filter((o) => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + (o.amount || 0), 0);

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

    // Get max date (today in IST) for date picker
    const getMaxDate = () => {
        const now = new Date();
        const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const year = istTime.getFullYear();
        const month = String(istTime.getMonth() + 1).padStart(2, '0');
        const day = String(istTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get unique statuses from orders for filter dropdown
    const uniqueStatuses = ['ALL', ...new Set(allOrders.map(o => o.status).filter(Boolean))];

    return (
        <div className="p-4">
            {/* Fixed Header Section - Compact */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-50 to-indigo-50 pb-3 -mx-4 px-4 pt-4 border-b-2 border-blue-200 mb-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Orders and collections for the selected date</p>
                    </div>

                    {/* Date filter for orders table - Compact */}
                    <div className="bg-white rounded-lg shadow-sm px-3 py-2 flex items-center gap-3 border border-blue-100">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Date:</label>
                            <input
                                type="date"
                                value={filters.selectedDate}
                                onChange={(e) => setFilters({ ...filters, selectedDate: e.target.value })}
                                max={getMaxDate()}
                                className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={loadDashboardData}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:from-blue-400 disabled:to-indigo-400 disabled:cursor-not-allowed shadow-sm"
                                title="Refresh orders for selected date"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-3 text-sm">Loading orders...</p>
                </div>
            ) : (
                <>
                    {/* Stats Cards for selected range - Colorful */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <StatCard
                            icon={<Package className="w-5 h-5" />}
                            label="Created Orders"
                            value={totalOrders}
                            color="blue"
                        />
                        <StatCard
                            icon={<Clock className="w-5 h-5" />}
                            label="Assigned Orders"
                            value={assignedOrders}
                            color="orange"
                        />
                        <StatCard
                            icon={<CheckCircle className="w-5 h-5" />}
                            label="Picked / In Transit"
                            value={pickedUpOrders}
                            color="green"
                        />
                        <StatCard
                            icon={<CheckCircle className="w-5 h-5" />}
                            label="Delivered Orders"
                            value={deliveredOrders}
                            color="green"
                        />
                        <StatCard
                            icon={<IndianRupee className="w-5 h-5" />}
                            label="Collected Amount"
                            value={`₹${collectedAmount.toFixed(2)}`}
                            color="purple"
                        />
                    </div>

                    {/* Orders Table for selected date */}
                    <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden border border-gray-200">
                        <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-blue-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-base font-semibold text-gray-800">Orders for Selected Date</h2>
                            <div className="flex items-center gap-2">
                                {/* Status Filter */}
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none border-2 border-blue-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-gray-700 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
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
                                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by Order ID"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-3 py-1.5 border-2 border-blue-200 rounded-lg text-xs text-gray-700 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-44 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Sl.No
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Order #
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Area Name
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Delivery Boy
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center">
                                                <div className="text-gray-400 text-sm">
                                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p>No orders found for the selected date.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order, index) => (
                                            <tr key={order.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                                                    {index + 1}
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
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                                                    <div>{order.deliveryBoyName || 'Not assigned'}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-green-700">
                                                    ₹{parseFloat(order.amount || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm ${
                                                        order.status === 'DELIVERED' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                                                        order.status === 'ASSIGNED' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                                                        order.status === 'PICKED_UP' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                                                        order.status === 'IN_TRANSIT' ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                                                        order.status === 'CANCELLED' ? 'bg-gradient-to-r from-red-400 to-red-600 text-white' :
                                                        'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                                                    }`}>
                                                        {order.status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                                    {order.createdTime
                                                        ? new Date(order.createdTime).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                    <button
                                                        onClick={() => handleViewOrderDetails(order.id)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
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
                </>
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

function StatCard({ icon, label, value, color }) {
    const colorClasses = {
        blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200',
        green: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-200',
        purple: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200',
        orange: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200',
    };

    const labelColors = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 border border-gray-100">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className={`text-xs font-semibold ${labelColors[color]} mb-1`}>{label}</p>
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}
