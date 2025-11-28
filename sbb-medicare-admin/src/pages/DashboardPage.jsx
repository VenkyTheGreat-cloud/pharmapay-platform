import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { Package, DollarSign, CheckCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(() => {
        const today = new Date();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const fmt = (d) => d.toISOString().split('T')[0];
        return {
            fromDate: fmt(sevenDaysAgo),
            toDate: fmt(today),
        };
    });

    useEffect(() => {
        loadDashboardData();
    }, [filters.fromDate, filters.toDate]); // Reload when date filters change

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Build params with date filters if API supports them
            const params = {
                page: 1,
                limit: 500,
                date_from: filters.fromDate,
                date_to: filters.toDate,
            };
            const allRes = await ordersAPI.getAll(params);
            console.log('Dashboard Orders API Response:', allRes.data); // Debug log
            
            // Handle different possible response structures
            let allList = [];
            if (allRes.data?.data?.orders) {
                // Structure: { success: true, data: { orders: [...] } }
                allList = allRes.data.data.orders;
            } else if (allRes.data?.data && Array.isArray(allRes.data.data)) {
                // Structure: { success: true, data: [...] }
                allList = allRes.data.data;
            } else if (allRes.data?.orders) {
                // Structure: { success: true, orders: [...] }
                allList = allRes.data.orders;
            } else if (Array.isArray(allRes.data)) {
                // Direct array
                allList = allRes.data;
            }
            
            // Normalize order data (handle snake_case to camelCase)
            const normalizedOrders = allList.map(order => ({
                id: order.id,
                orderNumber: order.order_number || order.orderNumber,
                customerName: order.customer_name || order.customerName,
                customerMobile: order.customer_mobile || order.customerMobile,
                deliveryBoyName: order.delivery_boy_name || order.deliveryBoyName,
                deliveryBoyMobile: order.delivery_boy_mobile || order.deliveryBoyMobile,
                status: order.status,
                amount: parseFloat(order.amount || order.total_amount || 0),
                paymentMode: order.payment_mode || order.paymentMode,
                paymentStatus: order.payment_status || order.paymentStatus,
                customerComments: order.customer_comments || order.customerComments || order.comments,
                address: order.address || order.delivery_address,
                createdTime: order.created_time || order.createdTime || order.created_at || order.order_date,
                deliveredAt: order.delivered_at || order.deliveredAt || order.delivered_time,
                items: order.items || order.medicines || [],
            }));
            
            console.log('Normalized Orders:', normalizedOrders); // Debug log
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
        if (!order.createdTime) {
            // If no createdTime, include it (might be a data issue)
            return true;
        }
        
        // Handle different date formats
        let orderDate;
        if (typeof order.createdTime === 'string') {
            orderDate = order.createdTime.split('T')[0];
        } else if (order.createdTime instanceof Date) {
            orderDate = order.createdTime.toISOString().split('T')[0];
        } else {
            return true; // Include if date format is unknown
        }
        
        if (filters.fromDate && orderDate < filters.fromDate) return false;
        if (filters.toDate && orderDate > filters.toDate) return false;
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

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Orders overview, filters, and details</p>
                </div>

                {/* Date filter for full orders table */}
                <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
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
                            icon={<DollarSign className="w-6 h-6" />}
                            label="Delivered Orders"
                            value={deliveredOrders}
                            color="purple"
                        />
                        <StatCard
                            icon={<DollarSign className="w-6 h-6" />}
                            label="Collected Amount"
                            value={`₹${collectedAmount.toFixed(2)}`}
                            color="purple"
                        />
                    </div>

                    {/* Orders Table for selected date range */}
                    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Orders in Date Range</h2>
                            <p className="text-xs text-gray-500">
                                Showing {filteredOrders.length} of {allOrders.length} orders
                            </p>
                        </div>
                        <div className="overflow-x-auto">
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
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                No orders in this date range
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {order.orderNumber || order.id || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>{order.customerName || 'N/A'}</div>
                                                    <div className="text-gray-500 text-xs">{order.customerMobile || ''}</div>
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
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
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
