import { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import { Users, Search, Eye, MapPin } from 'lucide-react';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await customersAPI.getAll();
            setCustomers(response.data.customers || []);
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
            const response = await customersAPI.search(searchQuery);
            setCustomers(response.data.customers || []);
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    };

    const viewCustomerDetails = async (customerId) => {
        try {
            const response = await customersAPI.getById(customerId);
            setSelectedCustomer(response.data.customer);
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
                                                {customer.full_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{customer.mobile_number}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {customer.address}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(customer.created_at).toLocaleDateString()}
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
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-700">Full Name</h3>
                                    <p className="text-gray-900">{selectedCustomer.full_name}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Mobile Number</h3>
                                    <p className="text-gray-900">{selectedCustomer.mobile_number}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Address</h3>
                                    <p className="text-gray-900">{selectedCustomer.address}</p>
                                </div>

                                {selectedCustomer.landmark && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Landmark</h3>
                                        <p className="text-gray-900">{selectedCustomer.landmark}</p>
                                    </div>
                                )}

                                {selectedCustomer.latitude && selectedCustomer.longitude && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Location</h3>
                                        <p className="text-gray-900">
                                            <MapPin className="inline w-4 h-4 mr-1" />
                                            {selectedCustomer.latitude}, {selectedCustomer.longitude}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-semibold text-gray-700">Registered On</h3>
                                    <p className="text-gray-900">
                                        {new Date(selectedCustomer.created_at).toLocaleString()}
                                    </p>
                                </div>

                                {selectedCustomer.order_count !== undefined && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Total Orders</h3>
                                        <p className="text-gray-900">{selectedCustomer.order_count}</p>
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
