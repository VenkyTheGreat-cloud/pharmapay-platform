import { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import { Search, Eye, MapPin } from 'lucide-react';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedCustomerOrders, setSelectedCustomerOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const normalizeCustomer = (apiCustomer) => ({
        id: apiCustomer.id,
        name: apiCustomer.name,
        mobile: apiCustomer.mobile,
        address: apiCustomer.address,
        landmark: apiCustomer.landmark,
        orderCount: apiCustomer.orderCount,
        createdAt: apiCustomer.createdAt,
    });

    const loadCustomers = async (params = {}) => {
        try {
            setLoading(true);
            const response = await customersAPI.getAll(params);
            const list = response.data?.data?.data || [];
            setCustomers(list.map(normalizeCustomer));
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (searchQuery.trim().length < 2) {
            loadCustomers();
            return;
        }

        try {
            await loadCustomers({ search: searchQuery });
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    };

    const viewCustomerDetails = async (customerId) => {
        try {
            const [customerRes, ordersRes] = await Promise.all([
                customersAPI.getById(customerId),
                customersAPI.getOrdersForCustomer(customerId),
            ]);

            const apiCustomer = customerRes.data?.data;
            const apiOrders = ordersRes.data?.data?.orders || [];

            setSelectedCustomer(normalizeCustomer(apiCustomer));
            setSelectedCustomerOrders(apiOrders);
            setShowModal(true);
        } catch (error) {
            console.error('Error loading customer details:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                <p className="text-gray-600 mt-1">View customer information (Read-only)</p>
            </div>

            {/* Search */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by name, mobile, or address..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Search
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading customers...</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mobile
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Registered
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{customer.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {customer.address}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.createdAt
                                                ? new Date(customer.createdAt).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => viewCustomerDetails(customer.id)}
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

            {/* Customer Details Modal */}
            {showModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    ID: {selectedCustomer.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-64px)] space-y-6">
                            {/* Top section: customer details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Full Name
                                        </h3>
                                        <p className="text-sm text-gray-900">{selectedCustomer.name}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Mobile Number
                                        </h3>
                                        <p className="text-sm text-gray-900">{selectedCustomer.mobile}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Registered On
                                        </h3>
                                        <p className="text-sm text-gray-900">
                                            {selectedCustomer.createdAt
                                                ? new Date(selectedCustomer.createdAt).toLocaleString()
                                                : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Address
                                        </h3>
                                        <p className="text-sm text-gray-900 whitespace-pre-line">
                                            {selectedCustomer.address}
                                        </p>
                                    </div>
                                    {selectedCustomer.landmark && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Landmark
                                            </h3>
                                            <p className="text-sm text-gray-900">{selectedCustomer.landmark}</p>
                                        </div>
                                    )}
                                    {selectedCustomer.orderCount !== undefined && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Total Orders
                                            </h3>
                                            <p className="text-sm text-gray-900">{selectedCustomer.orderCount}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Orders */}
                            <div className="pt-4 border-t">
                                <h3 className="font-semibold text-gray-800 mb-3">Customer Orders</h3>
                                {selectedCustomerOrders.length === 0 ? (
                                    <p className="text-sm text-gray-500">No orders found for this customer.</p>
                                ) : (
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                        {selectedCustomerOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="border rounded-lg p-3 bg-gray-50"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {order.orderNumber}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {order.orderDate
                                                                ? new Date(order.orderDate).toLocaleDateString()
                                                                : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            ₹{order.amount}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {order.status}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Order Items */}
                                                {order.items && order.items.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-semibold text-gray-700 mb-1">
                                                            Items
                                                        </p>
                                                        <ul className="text-xs text-gray-800 list-disc list-inside space-y-0.5">
                                                            {order.items.map((item) => (
                                                                <li key={item.id}>
                                                                    {item.name || item.medicine_name} —{' '}
                                                                    {item.quantity} × ₹
                                                                    {item.price ?? item.price_per_unit}{' '}
                                                                    (= ₹{item.total ?? item.total_price})
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
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
