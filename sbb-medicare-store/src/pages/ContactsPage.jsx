import { useState, useEffect, useRef } from 'react';
import { Phone, Calendar, RefreshCw, Plus, CheckCircle, XCircle, Search } from 'lucide-react';
import { customerRegistryAPI, customersAPI } from '../services/api';

// Helper function to get today's date in IST (Indian Standard Time, UTC+5:30)
const getTodayIST = () => {
    const now = new Date();
    // Use Intl.DateTimeFormat to get date in IST timezone
    const istDateString = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
    
    // Return in YYYY-MM-DD format (en-CA locale already returns this format)
    return istDateString;
};

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getTodayIST());
    const [customerName, setCustomerName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Customer dropdown states
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const customerSearchRef = useRef(null);
    const customerDropdownRef = useRef(null);

    useEffect(() => {
        loadContacts();
        loadCustomers();
    }, [selectedDate]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                customerDropdownRef.current &&
                !customerDropdownRef.current.contains(event.target) &&
                customerSearchRef.current &&
                !customerSearchRef.current.contains(event.target)
            ) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadContacts = async () => {
        try {
            setLoading(true);
            const res = await customerRegistryAPI.getWithOrders(selectedDate);
            const list = res.data?.data?.customers || [];
            setContacts(list);
        } catch (error) {
            console.error('Error loading contacts:', error);
            alert(error.response?.data?.error?.message || error.response?.data?.message || 'Error loading contacts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadCustomers = async () => {
        try {
            setLoadingCustomers(true);
            const response = await customersAPI.getAll({ page: 1, limit: 10000 });
            const list = response.data?.data?.customers || response.data?.data?.data || [];
            setCustomers(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading customers:', error);
            setCustomers([]);
        } finally {
            setLoadingCustomers(false);
        }
    };

    // Filter customers based on search query (name or mobile)
    const filteredCustomers = customers.filter(customer => {
        if (!customerSearchQuery.trim()) return true;
        const query = customerSearchQuery.toLowerCase();
        const name = (customer.name || customer.full_name || '').toLowerCase();
        const mobile = (customer.mobile || customer.mobile_number || '').toLowerCase();
        return name.includes(query) || mobile.includes(query);
    });

    const handleCustomerSearch = (e) => {
        const query = e.target.value;
        setCustomerSearchQuery(query);
        setShowCustomerDropdown(true);
        setIsNewCustomer(false);
        setSelectedCustomer(null);
        
        if (!query) {
            setCustomerName('');
            setMobileNumber('');
        }
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setCustomerName(customer.name || customer.full_name || '');
        setMobileNumber(customer.mobile || customer.mobile_number || '');
        setCustomerSearchQuery(`${customer.name || customer.full_name || ''} - ${customer.mobile || customer.mobile_number || ''}`);
        setShowCustomerDropdown(false);
        setIsNewCustomer(false);
    };

    const handleAddNewCustomer = () => {
        setIsNewCustomer(true);
        setSelectedCustomer(null);
        setCustomerSearchQuery('');
        setShowCustomerDropdown(false);
        // Keep mobile number if user typed it, otherwise clear
        if (!mobileNumber.trim()) {
            setCustomerName('');
        }
    };

    // Helper function to get current date and time in IST as ISO string
    const getCurrentISTDateTime = () => {
        const now = new Date();
        // Format current date/time in IST timezone
        const istString = now.toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Parse the IST string (format: MM/DD/YYYY, HH:mm:ss)
        const [datePart, timePart] = istString.split(', ');
        const [month, day, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');
        
        // Format as ISO string: YYYY-MM-DDTHH:mm:ssZ
        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        
        if (!mobileNumber.trim()) {
            alert('Please enter a mobile number');
            return;
        }

        // Validate mobile number (10 digits)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobileNumber.trim())) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Get current date and time in IST
            const registryDate = getCurrentISTDateTime();
            
            // If it's a new customer (not selected from dropdown), create customer first
            if (isNewCustomer || !selectedCustomer) {
                try {
                    await customersAPI.create({
                        mobile: mobileNumber.trim(),
                        name: customerName.trim() || null // Name is optional
                    });
                } catch (customerError) {
                    // If customer already exists, that's okay - continue
                    if (customerError.response?.status !== 400 && customerError.response?.status !== 409) {
                        console.warn('Error creating customer entry:', customerError);
                    }
                }
            }
            
            // Create customer registry entry
            await customerRegistryAPI.create({
                mobile: mobileNumber.trim(),
                name: customerName.trim() || null, // Name is optional
                registry_date: registryDate
            });
            
            // Clear the inputs
            setCustomerName('');
            setMobileNumber('');
            setCustomerSearchQuery('');
            setSelectedCustomer(null);
            setIsNewCustomer(false);
            setShowCustomerDropdown(false);
            
            // Reload contacts
            await loadContacts();
            
            alert('Contact added successfully');
        } catch (error) {
            console.error('Error adding contact:', error);
            alert(error.response?.data?.error?.message || error.response?.data?.message || 'Error adding contact. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDateSubmit = () => {
        loadContacts();
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Contacts</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Manage contact numbers</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={getTodayIST()}
                                className="border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleDateSubmit}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center gap-1.5"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Submit
                        </button>
                        <button
                            type="button"
                            onClick={loadContacts}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center gap-1.5"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Contact Form */}
            <div className="px-4 mt-4 flex-shrink-0">
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <form onSubmit={handleAddContact} className="space-y-3">
                        {/* Customer Search/Select Dropdown */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Select Customer <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    ref={customerSearchRef}
                                    type="text"
                                    value={customerSearchQuery}
                                    onChange={handleCustomerSearch}
                                    onFocus={() => {
                                        setShowCustomerDropdown(true);
                                        if (selectedCustomer) {
                                            setCustomerSearchQuery('');
                                            setSelectedCustomer(null);
                                            setCustomerName('');
                                            setMobileNumber('');
                                            setIsNewCustomer(false);
                                        }
                                        if (!customerSearchQuery && customers.length > 0) {
                                            setShowCustomerDropdown(true);
                                        }
                                    }}
                                    placeholder="Search by customer name or mobile number"
                                    disabled={isSubmitting || loadingCustomers}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                                />
                            </div>
                            {showCustomerDropdown && filteredCustomers.length > 0 && (
                                <div
                                    ref={customerDropdownRef}
                                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                                >
                                    {filteredCustomers.map(customer => (
                                        <div
                                            key={customer.id}
                                            onClick={() => handleCustomerSelect(customer)}
                                            className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="font-medium text-gray-900 text-xs">
                                                {customer.name || customer.full_name || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {customer.mobile || customer.mobile_number || 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                    <div
                                        onClick={handleAddNewCustomer}
                                        className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-t border-gray-200 bg-gray-50"
                                    >
                                        <div className="font-medium text-primary-600 text-xs flex items-center gap-2">
                                            <Plus className="w-3.5 h-3.5" />
                                            Add New Number
                                        </div>
                                    </div>
                                </div>
                            )}
                            {showCustomerDropdown && customerSearchQuery && filteredCustomers.length === 0 && (
                                <div
                                    ref={customerDropdownRef}
                                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
                                >
                                    <div className="px-4 py-2 text-gray-500 text-xs">
                                        No customers found
                                    </div>
                                    <div
                                        onClick={handleAddNewCustomer}
                                        className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-t border-gray-200 bg-gray-50"
                                    >
                                        <div className="font-medium text-primary-600 text-xs flex items-center gap-2">
                                            <Plus className="w-3.5 h-3.5" />
                                            Add New Number
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Customer Name and Mobile (shown when customer selected or new customer) */}
                        {(selectedCustomer || isNewCustomer || customerName || mobileNumber) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Customer Name <span className="text-gray-400 text-xs">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Enter customer name (optional)"
                                        disabled={isSubmitting || (selectedCustomer && !isNewCustomer)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={mobileNumber}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, ''); // Only numbers
                                            if (value.length <= 10) {
                                                setMobileNumber(value);
                                            }
                                        }}
                                        placeholder="Enter 10-digit mobile number"
                                        maxLength="10"
                                        disabled={isSubmitting || (selectedCustomer && !isNewCustomer)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || !mobileNumber.trim() || loadingCustomers}
                                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center gap-1.5 disabled:from-primary-300 disabled:to-primary-400 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Contacts List */}
            <div className="px-4 pb-4 mt-4 flex flex-col flex-1 min-h-0">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
                    <div className="px-4 py-2 border-b bg-gradient-to-r from-gray-50 to-primary-50 flex-shrink-0">
                        <h3 className="text-xs font-medium text-gray-800">Contacts List</h3>
                    </div>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-600 text-xs">No contacts found for the selected date.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[80px]">
                                            Sl.No
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Customer Mobile Number
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Customer Name
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Order Created
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Order Created Date Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contacts.map((customer, index) => {
                                        const hasOrder = customer.has_order || false;
                                        const order = customer.order || null;
                                        const orderCreatedDate = order?.order_created_at || order?.order_created_date_time || null;
                                        const orderDateObj = orderCreatedDate ? new Date(orderCreatedDate) : null;
                                        
                                        return (
                                            <tr 
                                                key={customer.registry_id || index} 
                                                className={`transition-colors border-b border-gray-100 ${
                                                    hasOrder 
                                                        ? 'bg-green-50 hover:bg-green-100' 
                                                        : 'bg-white hover:bg-primary-50'
                                                }`}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 text-center">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-primary-600" />
                                                        {customer.customer_mobile || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {customer.customer_name || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        {hasOrder ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                <span className="text-green-600 font-semibold">Yes</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 text-red-600" />
                                                                <span className="text-red-600 font-semibold">No</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {hasOrder && orderDateObj ? (
                                                        orderDateObj.toLocaleString('en-GB', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            hour12: false
                                                        })
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
