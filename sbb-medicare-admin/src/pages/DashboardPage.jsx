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
        <div className="p-6">
            {/* Fixed Header Section */}
            <div className="sticky top-0 z-20 bg-gray-100 pb-6 -mx-6 px-6 pt-6 border-b border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Orders and collections for the selected date</p>
                    </div>

                    {/* Date filter for orders table */}
                    <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date:</label>
                            <input
                                type="date"
                                value={filters.selectedDate}
                                onChange={(e) => setFilters({ ...filters, selectedDate: e.target.value })}
                                max={getMaxDate()}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={loadDashboardData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                                title="Refresh orders for selected date"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading orders...</p>
                </div>
            ) : (
                <>
                    {/* Stats Cards for selected range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                        <StatCard
                            icon={<Package className="w-6 h-6" />}
                            label="Created Orders"
                            value={totalOrders}
                            color="blue"
                        />
                        <StatCard
                            icon={<Clock className="w-6 h-6" />}
                            label="Assigned Orders"
                            value={assignedOrders}
                            color="orange"
                        />
                        <StatCard
                            icon={<CheckCircle className="w-6 h-6" />}
                            label="Picked / In Transit"
                            value={pickedUpOrders}
                            color="green"
                        />
                        <StatCard
                            icon={<CheckCircle className="w-6 h-6" />}
                            label="Delivered Orders"
                            value={deliveredOrders}
                            color="green"
                        />
                        <StatCard
                            icon={<IndianRupee className="w-6 h-6" />}
                            label="Collected Amount"
                            value={`₹${collectedAmount.toFixed(2)}`}
                            color="purple"
                        />
                    </div>

                    {/* Orders Table for selected date */}
                    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                        <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">Orders for Selected Date</h2>
                            <div className="flex items-center gap-3">
                                {/* Status Filter */}
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by Order ID"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Sl.No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Order #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Area Name
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
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                                No orders found for the selected date.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order, index) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {trimOrderId(order.orderNumber || order.id || 'N/A')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>{order.customerName || 'N/A'}</div>
                                                    <div className="text-gray-500 text-xs">{order.customerMobile || ''}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {order.customerArea || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>{order.deliveryBoyName || 'Not assigned'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₹{parseFloat(order.amount || 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'PICKED_UP' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-800' :
                                                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {order.status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.createdTime
                                                        ? new Date(order.createdTime).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleViewOrderDetails(order.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                        title="View Order Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Details
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
