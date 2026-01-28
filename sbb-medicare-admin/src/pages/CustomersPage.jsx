import { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import { Search, Eye, Edit, Trash2, Plus } from 'lucide-react';
import AddCustomerModal from '../components/AddCustomerModal';
import EditCustomerModal from '../components/EditCustomerModal';
import { useAuth } from '../context/AuthContext';

export default function CustomersPage() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedCustomerOrders, setSelectedCustomerOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    // Check if user is admin (based on dashboardType or role)
    const isAdmin = user?.dashboardType === 'admin' || user?.role === 'admin' || user?.user_type === 'admin';
    
    // Check if user is super admin
    const isSuperAdmin = user?.role === 'super_admin' || 
                        user?.role === 'superadmin' || 
                        user?.user_type === 'super_admin' || 
                        user?.user_type === 'superadmin' ||
                        user?.dashboardType === 'super_admin';

    useEffect(() => {
        loadCustomers();
    }, []);

    const normalizeCustomer = (apiCustomer) => ({
        id: apiCustomer.id,
        name: apiCustomer.name || 'N/A',
        mobile: apiCustomer.mobile || 'N/A',
        area: apiCustomer.area || apiCustomer.area_name || apiCustomer.customer_area || null,
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

    const handleDelete = async () => {
        if (!customerToDelete) return;
        
        if (!window.confirm(`Are you sure you want to delete customer "${customerToDelete.name}"? This action cannot be undone.`)) {
            setCustomerToDelete(null);
            return;
        }

        try {
            await customersAPI.delete(customerToDelete.id);
            alert('Customer deleted successfully!');
            setCustomerToDelete(null);
            loadCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to delete customer';
            alert(`Error: ${errorMsg}`);
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
            if (customerRes.data?.data?.customer) {
                // Structure: { success: true, data: { customer: {...} } }
                apiCustomer = customerRes.data.data.customer;
            } else if (customerRes.data?.data && !Array.isArray(customerRes.data.data)) {
                // Structure: { success: true, data: {...} }
                apiCustomer = customerRes.data.data;
            } else if (customerRes.data?.customer) {
                // Structure: { success: true, customer: {...} }
                apiCustomer = customerRes.data.customer;
            } else if (customerRes.data && !Array.isArray(customerRes.data) && customerRes.data.id) {
                // Direct customer object
                apiCustomer = customerRes.data;
            }

            // Handle different possible response structures for orders
            let apiOrders = [];
            if (ordersRes.data?.data?.orders) {
                // Structure: { success: true, data: { orders: [...] } }
                apiOrders = ordersRes.data.data.orders;
            } else if (ordersRes.data?.data?.customer?.orders) {
                // Structure: { success: true, data: { customer: {...}, orders: [...] } }
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

            console.log('Parsed Customer:', apiCustomer); // Debug log
            console.log('Parsed Orders:', apiOrders); // Debug log

            if (apiCustomer) {
                const normalizedCustomer = normalizeCustomer(apiCustomer);
                console.log('Normalized Customer:', normalizedCustomer); // Debug log
                setSelectedCustomer(normalizedCustomer);
                setSelectedCustomerOrders(apiOrders);
                setShowModal(true);
            } else {
                // Fallback: Try to find customer from the current list
                const customerFromList = customers.find(c => c.id === customerId || c.id === String(customerId));
                if (customerFromList) {
                    console.log('Using customer from list as fallback:', customerFromList);
                    setSelectedCustomer(customerFromList);
                    setSelectedCustomerOrders(apiOrders);
                    setShowModal(true);
                } else {
                    console.error('Customer not found in response or list:', customerRes.data);
                    alert('Customer details not found');
                }
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
        <div className="p-4 h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Fixed Header Section - Compact */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 -mx-4 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Customers</h1>
                        <p className="text-xs text-gray-600">Manage customer information</p>
                    </div>
                    {!isAdmin && !isSuperAdmin && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add Customer</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 bg-white rounded-lg shadow-sm p-3 flex-shrink-0">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by name, mobile, or address..."
                            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 shadow-sm"
                    >
                        Search
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                    <div>
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
                        <p className="text-gray-600 mt-3 text-sm">Loading customers...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto flex-1 min-h-0">
                        <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Sl.No
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Mobile
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Area Name
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Address
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Registered
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="text-gray-400 text-sm">
                                            <p>No customers found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer, index) => (
                                    <tr key={customer.id} className="hover:bg-primary-50 transition-colors border-b border-gray-100">
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs font-medium text-gray-900">{customer.name}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs text-gray-900">{customer.mobile}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs text-gray-700">{customer.area || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-gray-700 max-w-xs truncate">
                                                {customer.address}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                            {customer.createdAt
                                                ? new Date(customer.createdAt).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => viewCustomerDetails(customer.id)}
                                                    className="text-primary-600 hover:text-primary-700"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCustomerToEdit(customer);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-primary-600 hover:text-primary-700"
                                                    title="Edit Customer"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setCustomerToDelete(customer)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Delete Customer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Customer Details Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                                {selectedCustomer && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        ID: {selectedCustomer.id}
                                    </p>
                                )}
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
                            {selectedCustomer ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Full Name
                                            </h3>
                                            <p className="text-base text-gray-900 font-medium">{selectedCustomer.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Mobile Number
                                            </h3>
                                            <p className="text-base text-gray-900">{selectedCustomer.mobile || 'N/A'}</p>
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
                                            <p className="text-sm text-gray-600 font-mono">{selectedCustomer.id || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Address
                                            </h3>
                                            <p className="text-base text-gray-900 whitespace-pre-line">
                                                {selectedCustomer.address || 'N/A'}
                                            </p>
                                        </div>
                                        {selectedCustomer.area && (
                                            <div>
                                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Area Name
                                                </h3>
                                                <p className="text-base text-gray-900">{selectedCustomer.area}</p>
                                            </div>
                                        )}
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
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Loading customer details...</p>
                                </div>
                            )}

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
                                                                    order.status === 'ASSIGNED' ? 'bg-primary-100 text-primary-800' :
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

            {/* Add Customer Modal */}
            <AddCustomerModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    loadCustomers();
                }}
            />

            {/* Edit Customer Modal */}
            <EditCustomerModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setCustomerToEdit(null);
                }}
                onSuccess={() => {
                    loadCustomers();
                }}
                customer={customerToEdit}
            />

            {/* Delete Confirmation Modal */}
            {customerToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Customer</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete customer <strong>"{customerToDelete.name}"</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCustomerToDelete(null)}
                                className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
