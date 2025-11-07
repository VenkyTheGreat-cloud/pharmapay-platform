import { useState, useEffect } from 'react';
import { ordersAPI, paymentsAPI } from '../services/api';
import { Package, DollarSign, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
    const [orderStats, setOrderStats] = useState([]);
    const [paymentStats, setPaymentStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        loadStats();
    }, [dateRange]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const [ordersRes, paymentsRes] = await Promise.all([
                ordersAPI.getStatistics(dateRange),
                paymentsAPI.getStatistics(dateRange),
            ]);

            setOrderStats(ordersRes.data.statistics || []);
            setPaymentStats(paymentsRes.data.statistics || {});
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalOrders = orderStats.reduce((sum, day) => sum + parseInt(day.total_orders || 0), 0);
    const totalRevenue = orderStats.reduce((sum, day) => sum + parseFloat(day.total_amount || 0), 0);
    const deliveredOrders = orderStats.reduce((sum, day) => sum + parseInt(day.delivered_orders || 0), 0);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Overview of orders and deliveries</p>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6 bg-white rounded-lg shadow p-4 flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <input
                        type="date"
                        value={dateRange.date_from}
                        onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                        type="date"
                        value={dateRange.date_to}
                        onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading statistics...</p>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <StatCard
                            icon={<Package className="w-6 h-6" />}
                            label="Total Orders"
                            value={totalOrders}
                            color="blue"
                        />
                        <StatCard
                            icon={<DollarSign className="w-6 h-6" />}
                            label="Total Revenue"
                            value={`₹${totalRevenue.toFixed(2)}`}
                            color="green"
                        />
                        <StatCard
                            icon={<CheckCircle className="w-6 h-6" />}
                            label="Delivered"
                            value={deliveredOrders}
                            color="purple"
                        />
                        <StatCard
                            icon={<Clock className="w-6 h-6" />}
                            label="Pending"
                            value={totalOrders - deliveredOrders}
                            color="orange"
                        />
                    </div>

                    {/* Payment Stats */}
                    {paymentStats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cash:</span>
                                        <span className="font-semibold">{paymentStats.cash_payments || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bank:</span>
                                        <span className="font-semibold">{paymentStats.bank_payments || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Split:</span>
                                        <span className="font-semibold">{paymentStats.split_payments || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Collection</h3>
                                <p className="text-3xl font-bold text-green-600">
                                    ₹{parseFloat(paymentStats.total_cash || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">Total cash collected</p>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Transfers</h3>
                                <p className="text-3xl font-bold text-blue-600">
                                    ₹{parseFloat(paymentStats.total_bank || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">Total bank payments</p>
                            </div>
                        </div>
                    )}

                    {/* Orders Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Overview</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={orderStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="order_date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total_orders" fill="#3b82f6" name="Total Orders" />
                                <Bar dataKey="delivered_orders" fill="#10b981" name="Delivered" />
                            </BarChart>
                        </ResponsiveContainer>
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
