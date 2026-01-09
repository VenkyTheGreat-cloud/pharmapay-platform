import { useState, useEffect, useRef } from 'react';
import { ordersAPI, customersAPI, deliveryBoysAPI } from '../services/api';
import { X, Search } from 'lucide-react';

export default function CreateOrderModal({ isOpen, onClose, onSuccess }) {
    const [customers, setCustomers] = useState([]);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomerName, setSelectedCustomerName] = useState('');
    const customerSearchRef = useRef(null);
    const customerDropdownRef = useRef(null);
    const [formData, setFormData] = useState({
        orderNumber: '',
        customerId: '',
        deliveryBoyId: '',
        totalAmount: '',
        paidAmount: '',
        paymentMode: '',
        transactionReference: '',
        customerComments: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            Promise.all([loadCustomers(), loadDeliveryBoys()])
                .finally(() => setLoading(false));
        } else {
            // Reset form when modal closes
            setCustomerSearchQuery('');
            setSelectedCustomerName('');
            setShowCustomerDropdown(false);
        }
    }, [isOpen]);

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

    const loadCustomers = async () => {
        try {
            const response = await customersAPI.getAll();
            // Backend format: { success, data: { customers: [...], count: ... } }
            const list = response.data?.data?.customers || response.data?.data?.data || [];
            setCustomers(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading customers:', error);
            setCustomers([]);
        }
    };

    const loadDeliveryBoys = async () => {
        try {
            const response = await deliveryBoysAPI.listApproved();
            // Backend format: { success, data: { delivery_boys: [...], count: ... } }
            const list = response.data?.data?.delivery_boys || response.data?.data || [];
            const deliveryBoysList = Array.isArray(list) ? list : [];
            setDeliveryBoys(deliveryBoysList);
        } catch (error) {
            console.error('Error loading delivery boys:', error);
            setDeliveryBoys([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
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
        if (!query) {
            setFormData(prev => ({ ...prev, customerId: '' }));
            setSelectedCustomerName('');
        }
    };

    const handleCustomerSelect = (customer) => {
        setFormData(prev => ({ ...prev, customerId: customer.id.toString() }));
        setSelectedCustomerName(`${customer.name || customer.full_name} - ${customer.mobile || customer.mobile_number}`);
        setCustomerSearchQuery('');
        setShowCustomerDropdown(false);
        if (errors.customerId) {
            setErrors(prev => ({ ...prev, customerId: '' }));
        }
    };

    const calculateRemainingAmount = () => {
        const total = parseFloat(formData.totalAmount) || 0;
        const paid = parseFloat(formData.paidAmount) || 0;
        return Math.max(0, total - paid);
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.orderNumber || !formData.orderNumber.trim()) {
            newErrors.orderNumber = 'Order Number is required';
        }

        if (!formData.customerId) {
            newErrors.customerId = 'Customer is required';
        }

        if (!formData.deliveryBoyId) {
            newErrors.deliveryBoyId = 'Delivery Boy is required';
        }

        if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
            newErrors.totalAmount = 'Total Amount must be greater than 0';
        }

        const paidAmount = parseFloat(formData.paidAmount) || 0;
        const totalAmount = parseFloat(formData.totalAmount) || 0;

        if (paidAmount < 0) {
            newErrors.paidAmount = 'Paid Amount cannot be negative';
        }

        if (paidAmount > totalAmount) {
            newErrors.paidAmount = 'Paid Amount cannot be greater than Total Amount';
        }

        // Payment mode is required if paidAmount > 0
        if (paidAmount > 0 && !formData.paymentMode) {
            newErrors.paymentMode = 'Payment Mode is required when Paid Amount is greater than 0';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = {
                orderNumber: formData.orderNumber.trim(),
                customerId: parseInt(formData.customerId),
                deliveryBoyId: parseInt(formData.deliveryBoyId),
                totalAmount: parseFloat(formData.totalAmount),
            };

            const paidAmount = parseFloat(formData.paidAmount) || 0;
            if (paidAmount > 0) {
                submitData.paidAmount = paidAmount;
                submitData.paymentMode = formData.paymentMode;
                if (formData.transactionReference && formData.transactionReference.trim()) {
                    submitData.transactionReference = formData.transactionReference.trim();
                }
            }

            if (formData.customerComments && formData.customerComments.trim()) {
                submitData.customerComments = formData.customerComments.trim();
            }

            await ordersAPI.create(submitData);
            alert('Order created successfully!');

            // Reset form
            setFormData({
                orderNumber: '',
                customerId: '',
                deliveryBoyId: '',
                totalAmount: '',
                paidAmount: '',
                paymentMode: '',
                transactionReference: '',
                customerComments: ''
            });
            setErrors({});
            setCustomerSearchQuery('');
            setSelectedCustomerName('');
            setShowCustomerDropdown(false);

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating order:', error);
            alert(error.response?.data?.error?.message || error.response?.data?.message || 'Error creating order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={isSubmitting}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading form data...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Order Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="orderNumber"
                                    value={formData.orderNumber}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.orderNumber ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="e.g., ORD-2025-001"
                                    disabled={isSubmitting}
                                />
                                {errors.orderNumber && (
                                    <p className="text-red-500 text-sm mt-1">{errors.orderNumber}</p>
                                )}
                            </div>

                            {/* Customer Selection */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        ref={customerSearchRef}
                                        type="text"
                                        value={selectedCustomerName || customerSearchQuery}
                                        onChange={handleCustomerSearch}
                                        onFocus={() => {
                                            setShowCustomerDropdown(true);
                                            if (selectedCustomerName) {
                                                setCustomerSearchQuery('');
                                                setSelectedCustomerName('');
                                                setFormData(prev => ({ ...prev, customerId: '' }));
                                            }
                                        }}
                                        placeholder="Search by customer name or mobile number"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.customerId ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        disabled={isSubmitting}
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
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">
                                                    {customer.name || customer.full_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {customer.mobile || customer.mobile_number}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showCustomerDropdown && customerSearchQuery && filteredCustomers.length === 0 && (
                                    <div
                                        ref={customerDropdownRef}
                                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
                                    >
                                        <div className="px-4 py-2 text-gray-500 text-sm">
                                            No customers found
                                        </div>
                                    </div>
                                )}
                                {errors.customerId && (
                                    <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
                                )}
                            </div>

                            {/* Delivery Boy Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Boy <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="deliveryBoyId"
                                    value={formData.deliveryBoyId}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.deliveryBoyId ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select a delivery boy</option>
                                    {deliveryBoys.length === 0 ? (
                                        <option value="" disabled>No approved delivery boys available</option>
                                    ) : (
                                        deliveryBoys.map(boy => (
                                            <option key={boy.id} value={boy.id}>
                                                {boy.name} - {boy.mobile}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {errors.deliveryBoyId && (
                                    <p className="text-red-500 text-sm mt-1">{errors.deliveryBoyId}</p>
                                )}
                                {deliveryBoys.length === 0 && !loading && (
                                    <p className="text-sm text-gray-500 mt-1">No approved and active delivery boys found</p>
                                )}
                            </div>

                            {/* Total Amount (Bill Amount) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bill Amount (Total Amount) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="totalAmount"
                                    value={formData.totalAmount}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                />
                                {errors.totalAmount && (
                                    <p className="text-red-500 text-sm mt-1">{errors.totalAmount}</p>
                                )}
                            </div>

                            {/* Paid Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Paid Amount
                                </label>
                                <input
                                    type="number"
                                    name="paidAmount"
                                    value={formData.paidAmount}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.paidAmount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                />
                                {errors.paidAmount && (
                                    <p className="text-red-500 text-sm mt-1">{errors.paidAmount}</p>
                                )}
                            </div>

                            {/* Remaining Amount (Non-editable) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remaining Amount
                                </label>
                                <input
                                    type="text"
                                    value={`₹${calculateRemainingAmount().toFixed(2)}`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Payment Mode (Required if paidAmount > 0) */}
                            {(parseFloat(formData.paidAmount) || 0) > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Mode <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="paymentMode"
                                        value={formData.paymentMode}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.paymentMode ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Select payment mode</option>
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                    </select>
                                    {errors.paymentMode && (
                                        <p className="text-red-500 text-sm mt-1">{errors.paymentMode}</p>
                                    )}
                                </div>
                            )}

                            {/* Transaction Reference (Optional, shown only if paidAmount > 0) */}
                            {(parseFloat(formData.paidAmount) || 0) > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Transaction Reference (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="transactionReference"
                                        value={formData.transactionReference}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., TXN123"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}

                            {/* Customer Comments */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Comments (Optional)
                                </label>
                                <textarea
                                    name="customerComments"
                                    value={formData.customerComments}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Any special instructions or notes"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Order'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
