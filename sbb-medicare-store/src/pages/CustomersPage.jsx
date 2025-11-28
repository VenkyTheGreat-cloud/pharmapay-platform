import { useState, useEffect } from 'react';
import { customersAPI, ordersAPI } from '../services/api';
import { Users, Search, Eye, MapPin, Plus, Edit, Trash2, Package } from 'lucide-react';
import AddCustomerModal from '../components/AddCustomerModal';
import EditCustomerModal from '../components/EditCustomerModal';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await customersAPI.getAll();
            // Backend format: { success, data: { customers: [...], count: ... } }
            const list = response.data?.data?.customers || response.data?.data?.data || [];
            setCustomers(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading customers:', error);
            setCustomers([]);
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
            const response = await customersAPI.search(searchQuery);
            // Backend format: { success, data: { customers: [...], count: ... } }
            const list = response.data?.data?.customers || response.data?.data?.data || [];
            setCustomers(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error searching customers:', error);
            setCustomers([]);
        }
    };

    const viewCustomerDetails = async (customerId) => {
        try {
            const response = await customersAPI.getById(customerId);
            // Backend: { success, data: {...customer} }
            const customerData = response.data?.data || response.data;
            setSelectedCustomer(customerData);
            setShowViewModal(true);
            
            // Load customer orders if mobile number is available
            if (customerData.mobile || customerData.mobile_number) {
                await loadCustomerOrders(customerData.mobile || customerData.mobile_number);
            }
        } catch (error) {
            console.error('Error loading customer details:', error);
            alert('Error loading customer details. Please try again.');
        }
    };

    const loadCustomerOrders = async (mobile) => {
        try {
            setLoadingOrders(true);
            const response = await ordersAPI.getByCustomerMobile(mobile);
            // Backend: { success, data: [...] }
            const orders = response.data?.data || [];
            setCustomerOrders(Array.isArray(orders) ? orders : []);
        } catch (error) {
            console.error('Error loading customer orders:', error);
            setCustomerOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleEdit = async (customerId) => {
        try {
            const response = await customersAPI.getById(customerId);
            // Backend: { success, data: {...customer} }
            const customerData = response.data?.data || response.data;
            setSelectedCustomer(customerData);
            setShowEditModal(true);
        } catch (error) {
            console.error('Error loading customer details:', error);
            alert('Error loading customer details. Please try again.');
        }
    };

    const handleDelete = async (customerId, customerName) => {
        if (!confirm(`Are you sure you want to delete customer "${customerName}"?`)) {
            return;
        }

        try {
            await customersAPI.delete(customerId);
            alert('Customer deleted successfully!');
            loadCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert(error.response?.data?.message || 'Error deleting customer');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-600 mt-1">Manage customer information</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add New Customer
                </button>
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
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                                            <div className="text-sm font-medium text-gray-900">
                                                {customer.name}
                                            </div>
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
                                            {customer.created_at || customer.createdAt ? new Date(customer.created_at || customer.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => viewCustomerDetails(customer.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(customer.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id, customer.name)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
                    setSelectedCustomer(null);
                }}
                onSuccess={() => {
                    loadCustomers();
                }}
                customer={selectedCustomer}
            />

            {/* Customer Details Modal */}
            {showViewModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setCustomerOrders([]);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Customer Information */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-700 text-sm">Full Name</h3>
                                        <p className="text-gray-900 mt-1">{selectedCustomer.name || selectedCustomer.full_name || 'N/A'}</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-700 text-sm">Mobile Number</h3>
                                        <p className="text-gray-900 mt-1">{selectedCustomer.mobile || selectedCustomer.mobile_number || 'N/A'}</p>
                                    </div>

                                    <div className="col-span-2">
                                        <h3 className="font-semibold text-gray-700 text-sm">Address</h3>
                                        <p className="text-gray-900 mt-1">{selectedCustomer.address || 'N/A'}</p>
                                    </div>

                                    {selectedCustomer.landmark && (
                                        <div className="col-span-2">
                                            <h3 className="font-semibold text-gray-700 text-sm">Landmark</h3>
                                            <p className="text-gray-900 mt-1">{selectedCustomer.landmark}</p>
                                        </div>
                                    )}

                                    {(selectedCustomer.customer_lat || selectedCustomer.customerLat || selectedCustomer.latitude) && 
                                     (selectedCustomer.customer_lng || selectedCustomer.customerLng || selectedCustomer.longitude) && (
                                        <div className="col-span-2">
                                            <h3 className="font-semibold text-gray-700 text-sm">Location</h3>
                                            <p className="text-gray-900 mt-1">
                                                <MapPin className="inline w-4 h-4 mr-1" />
                                                {selectedCustomer.customer_lat || selectedCustomer.customerLat || selectedCustomer.latitude}, {selectedCustomer.customer_lng || selectedCustomer.customerLng || selectedCustomer.longitude}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="font-semibold text-gray-700 text-sm">Registered On</h3>
                                        <p className="text-gray-900 mt-1">
                                            {(selectedCustomer.created_at || selectedCustomer.createdAt) ? new Date(selectedCustomer.created_at || selectedCustomer.createdAt).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>

                                    {(selectedCustomer.order_count !== undefined || selectedCustomer.order_count !== null) && (
                                        <div>
                                            <h3 className="font-semibold text-gray-700 text-sm">Total Orders</h3>
                                            <p className="text-gray-900 mt-1">{selectedCustomer.order_count || 0}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Customer Orders */}
                                <div className="border-t pt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Package className="w-5 h-5 text-gray-700" />
                                        <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                                    </div>
                                    
                                    {loadingOrders ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="text-gray-600 mt-2 text-sm">Loading orders...</p>
                                        </div>
                                    ) : customerOrders.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No orders found for this customer.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {customerOrders.map((order) => (
                                                        <tr key={order.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {order.orderNumber || order.order_number}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                                {(order.created_at || order.createdTime) ? new Date(order.created_at || order.createdTime).toLocaleDateString() : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {order.items.map((item, idx) => (
                                                                            <div key={idx} className="text-xs">
                                                                                {item.name} x{item.quantity} @ ₹{item.price}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400">No items</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                                ₹{order.total_amount || order.amount || '0.00'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                                    order.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-800' :
                                                                    order.status === 'PICKED_UP' ? 'bg-yellow-100 text-yellow-800' :
                                                                    order.status === 'PAYMENT_COLLECTION' ? 'bg-indigo-100 text-indigo-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {order.status ? order.status.replace(/_/g, ' ') : 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                                {order.payment_mode || order.paymentMode || 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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
