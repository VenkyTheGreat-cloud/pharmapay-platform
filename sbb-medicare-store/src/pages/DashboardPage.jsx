import { useState, useEffect, useMemo } from 'react';
import { ordersAPI } from '../services/api';
import { Package, DollarSign, CheckCircle, Truck, Calendar, IndianRupee } from 'lucide-react';

export default function DashboardPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            // Fetch orders (we'll filter by date and status on the client)
            const res = await ordersAPI.getAll({ page: 1, limit: 1000 });
            const list = res.data?.data?.orders || res.data?.data || [];
            setOrders(list);
        } catch (error) {
            console.error('Error loading orders for dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const {
        filteredByDate,
        summary,
        filteredForList,
    } = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                filteredByDate: [],
                summary: {
                    totalCreated: 0,
                    totalDelivered: 0,
                    totalAssigned: 0,
                    totalPickedUp: 0,
                    totalCollectedAmount: 0,
                },
                filteredForList: [],
            };
        }

        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(`${dateRange.to}T23:59:59`) : null;

        const inRange = orders.filter((order) => {
            const created = (order.createdTime || order.created_at) ? new Date(order.createdTime || order.created_at) : null;
            if (!created) return false;
            if (fromDate && created < fromDate) return false;
            if (toDate && created > toDate) return false;
            return true;
        });

        const totalCreated = inRange.length;
        const totalDelivered = inRange.filter((o) => o.status === 'DELIVERED').length;
        const totalAssigned = inRange.filter((o) => o.status === 'ASSIGNED').length;
        const totalPickedUp = inRange.filter((o) => o.status === 'PICKED_UP').length;

        const totalCollectedAmount = inRange
            .filter((o) => o.status === 'DELIVERED' || o.status === 'PAYMENT_COLLECTION')
            .reduce((sum, o) => sum + (Number(o.amount || o.total_amount) || 0), 0);

        // For list: show ALL statuses (ASSIGNED, IN_TRANSIT, DELIVERED, etc.)
        const list = inRange;

        return {
            filteredByDate: inRange,
            summary: {
                totalCreated,
                totalDelivered,
                totalAssigned,
                totalPickedUp,
                totalCollectedAmount,
            },
            filteredForList: list,
        };
    }, [orders, dateRange]);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Orders and collections for the selected date range</p>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6 bg-white rounded-lg shadow p-4 flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <button
                    type="button"
                    onClick={loadOrders}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading statistics...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                        <StatCard
                            icon={<Package className="w-6 h-6" />}
                            label="Total Created Orders"
                            value={summary.totalCreated}
                            color="blue"
                        />
                        <StatCard
                            icon={<IndianRupee className="w-6 h-6" />}
                            label="Total Collected Amount"
                            value={`₹${summary.totalCollectedAmount.toFixed(2)}`}
                            color="green"
                        />
                        <StatCard
                            icon={<CheckCircle className="w-6 h-6" />}
                            label="Total Delivered Orders"
                            value={summary.totalDelivered}
                            color="purple"
                        />
                        <StatCard
                            icon={<Truck className="w-6 h-6" />}
                            label="Assigned Orders"
                            value={summary.totalAssigned}
                            color="orange"
                        />
                        <StatCard
                            icon={<Truck className="w-6 h-6" />}
                            label="PickedUp Orders"
                            value={summary.totalPickedUp}
                            color="orange"
                        />
                    </div>

                    {/* Orders List for selected date range (non-ongoing only) */}
                    <div className="bg-white rounded-lg shadow p-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders in Date Range</h3>
                        {filteredForList.length === 0 ? (
                            <p className="text-gray-600 text-sm">No orders found for the selected date range.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Order ID
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Customer
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Delivery Boy
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Date &amp; Time
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                        {filteredForList.map((order) => (
                                            <tr key={order.id}>
                                                <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">
                                                    {order.orderNumber || order.order_number}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="text-gray-900">{order.customerName || order.customer_name}</div>
                                                    <div className="text-xs text-gray-500">{order.customerMobile || order.customer_phone || order.customer_mobile}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="text-gray-900">
                                                        {order.deliveryBoyName || order.delivery_boy_name || 'Not assigned'}
                                                    </div>
                                                    {(order.deliveryBoyMobile || order.delivery_boy_mobile) && (
                                                        <div className="text-xs text-gray-500">
                                                            {order.deliveryBoyMobile || order.delivery_boy_mobile}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                                                    {(order.createdTime || order.created_at)
                                                        ? new Date(order.createdTime || order.created_at).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                                                    ₹{(Number(order.amount || order.total_amount) || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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

function StatusBadge({ status }) {
    if (!status) return null;
    const labelMap = {
        ASSIGNED: 'Assigned',
        PICKED_UP: 'PickedUp',
        IN_TRANSIT: 'InTransit',
        PAYMENT_COLLECTION: 'Payment Collected',
        DELIVERED: 'Delivered',
        CANCELLED: 'Cancelled',
    };
    const colorMap = {
        ASSIGNED: 'bg-purple-100 text-purple-800',
        PICKED_UP: 'bg-yellow-100 text-yellow-800',
        PAYMENT_COLLECTION: 'bg-indigo-100 text-indigo-800',
        DELIVERED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };

    const key = status.toUpperCase();
    const label = labelMap[key] || status;
    const colors = colorMap[key] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors}`}>
            {label}
        </span>
    );
}
