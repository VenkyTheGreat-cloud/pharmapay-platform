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
        name: apiCustomer.name || 'N/A',
        mobile: apiCustomer.mobile || 'N/A',
        address: apiCustomer.address || 'N/A',
        landmark: apiCustomer.landmark || null,
        orderCount: parseInt(apiCustomer.order_count || apiCustomer.orderCount || apiCustomer.total_orders || 0),
        createdAt: apiCustomer.created_at || apiCustomer.createdAt,
        email: apiCustomer.email || null,
    });

    const loadCustomers = async (params = {}) => {
        try {
            setLoading(true);
            const response = await customersAPI.getAll(params);
            console.log('Customers API Response:', response.data); // Debug log
            
            // Handle different possible response structures
            let list = [];
            if (response.data?.data?.customers) {
                // Structure: { success: true, data: { customers: [...] } }
                list = response.data.data.customers;
            } else if (response.data?.data?.data) {
                // Structure: { success: true, data: { data: [...] } }
                list = response.data.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...] }
                list = response.data.data;
            } else if (Array.isArray(response.data)) {
                // Direct array
                list = response.data;
            }
            
            console.log('Parsed customers list:', list); // Debug log
            setCustomers(list.map(normalizeCustomer));
        } catch (error) {
            console.error('Error loading customers:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to load customers';
            alert(`Error: ${errorMsg}`);
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
            setLoading(true);
            const [customerRes, ordersRes] = await Promise.all([
                customersAPI.getById(customerId),
                customersAPI.getOrdersForCustomer(customerId),
            ]);

            console.log('Customer Details Response:', customerRes.data); // Debug log
            console.log('Customer Orders Response:', ordersRes.data); // Debug log

            // Handle different possible response structures for customer
            let apiCustomer = null;
            if (customerRes.data?.data) {
                apiCustomer = customerRes.data.data;
            } else if (customerRes.data) {
                apiCustomer = customerRes.data;
            }

            // Handle different possible response structures for orders
            let apiOrders = [];
            if (ordersRes.data?.data?.orders) {
                // Structure: { success: true, data: { orders: [...] } }
                apiOrders = ordersRes.data.data.orders;
            } else if (ordersRes.data?.data && Array.isArray(ordersRes.data.data)) {
                // Structure: { success: true, data: [...] }
                apiOrders = ordersRes.data.data;
            } else if (ordersRes.data?.orders) {
                // Structure: { success: true, orders: [...] }
                apiOrders = ordersRes.data.orders;
            } else if (Array.isArray(ordersRes.data)) {
                // Direct array
                apiOrders = ordersRes.data;
            }

            if (apiCustomer) {
                setSelectedCustomer(normalizeCustomer(apiCustomer));
                setSelectedCustomerOrders(apiOrders);
                setShowModal(true);
            } else {
                alert('Customer details not found');
            }
        } catch (error) {
            console.error('Error loading customer details:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to load customer details';
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Full Name
                                        </h3>
                                        <p className="text-base text-gray-900 font-medium">{selectedCustomer.name}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Mobile Number
                                        </h3>
                                        <p className="text-base text-gray-900">{selectedCustomer.mobile}</p>
                                    </div>
                                    {selectedCustomer.email && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Email
                                            </h3>
                                            <p className="text-base text-gray-900">{selectedCustomer.email}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Customer ID
                                        </h3>
                                        <p className="text-sm text-gray-600 font-mono">{selectedCustomer.id}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Address
                                        </h3>
                                        <p className="text-base text-gray-900 whitespace-pre-line">
                                            {selectedCustomer.address}
                                        </p>
                                    </div>
                                    {selectedCustomer.landmark && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Landmark
                                            </h3>
                                            <p className="text-base text-gray-900">{selectedCustomer.landmark}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Registered On
                                        </h3>
                                        <p className="text-base text-gray-900">
                                            {selectedCustomer.createdAt
                                                ? new Date(selectedCustomer.createdAt).toLocaleString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Total Orders
                                        </h3>
                                        <p className="text-base text-gray-900 font-semibold">{selectedCustomer.orderCount || selectedCustomerOrders.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Orders */}
                            <div className="pt-6 border-t">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Orders ({selectedCustomerOrders.length})</h3>
                                {selectedCustomerOrders.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500">No orders found for this customer.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                        {selectedCustomerOrders.map((order) => (
                                            <div
                                                key={order.id || order.order_id}
                                                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <p className="text-base font-semibold text-gray-900 mb-1">
                                                            Order #{order.orderNumber || order.order_number || order.id}
                                                        </p>
                                                        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                                            {order.orderDate && (
                                                                <span>
                                                                    📅 {new Date(order.orderDate || order.order_date || order.created_at || order.createdTime).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {order.status && (
                                                                <span className={`px-2 py-1 rounded-full ${
                                                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                                    order.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                                                    order.status === 'PICKED_UP' ? 'bg-yellow-100 text-yellow-800' :
                                                                    order.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {order.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            ₹{parseFloat(order.amount || order.total_amount || 0).toFixed(2)}
                                                        </p>
                                                        {order.payment_mode && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                💳 {order.payment_mode}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Order Items */}
                                                {(order.items || order.medicines) && (order.items?.length > 0 || order.medicines?.length > 0) && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                                            Order Items
                                                        </p>
                                                        <ul className="space-y-1.5">
                                                            {(order.items || order.medicines || []).map((item, idx) => (
                                                                <li key={item.id || idx} className="text-sm text-gray-800 flex justify-between items-center">
                                                                    <span>
                                                                        {item.name || item.medicine_name || 'Item'} 
                                                                        <span className="text-gray-500 ml-2">
                                                                            (Qty: {item.quantity || 0})
                                                                        </span>
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        ₹{parseFloat(item.total || item.total_price || (item.price || item.price_per_unit || 0) * (item.quantity || 0)).toFixed(2)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Delivery Information */}
                                                {(order.deliveryBoyName || order.delivery_boy_name) && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-xs text-gray-600">
                                                            🚚 Delivered by: <span className="font-medium">{order.deliveryBoyName || order.delivery_boy_name}</span>
                                                        </p>
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
