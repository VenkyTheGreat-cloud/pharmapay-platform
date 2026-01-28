import { useState, useEffect, useRef } from 'react';
import { ordersAPI, customersAPI } from '../services/api';
import { X, Search } from 'lucide-react';

export default function CreateOrderModal({ isOpen, onClose, onSuccess }) {
    const [customers, setCustomers] = useState([]);
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
        customerComments: '',
        returnItems: false,
        returnAdjustAmount: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            loadCustomers()
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
            // Fetch all customers with a high limit to ensure we get all customers
            const response = await customersAPI.getAll({ page: 1, limit: 10000 });
            // Backend format: { success, data: { customers: [...], count: ... } }
            const list = response.data?.data?.customers || response.data?.data?.data || [];
            setCustomers(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading customers:', error);
            setCustomers([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // For order number, only allow digits and limit to 8 characters
        if (name === 'orderNumber') {
            const numericValue = value.replace(/\D/g, ''); // Remove non-digits
            const limitedValue = numericValue.slice(0, 8); // Limit to 8 digits
            setFormData(prev => ({ ...prev, [name]: limitedValue }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
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
        const returnAdjustAmount = formData.returnItems && formData.returnAdjustAmount 
            ? parseFloat(formData.returnAdjustAmount) || 0 
            : 0;
        
        // Calculate: Total Amount - Return Adjust Amount - Paid Amount
        const adjustedTotal = total - returnAdjustAmount;
        return Math.max(0, adjustedTotal - paid);
    };

    const calculateAdjustedTotal = () => {
        const total = parseFloat(formData.totalAmount) || 0;
        const returnAdjustAmount = formData.returnItems && formData.returnAdjustAmount 
            ? parseFloat(formData.returnAdjustAmount) || 0 
            : 0;
        return Math.max(0, total - returnAdjustAmount);
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.orderNumber || !formData.orderNumber.trim()) {
            newErrors.orderNumber = 'Order Number is required';
        } else if (!/^\d{1,8}$/.test(formData.orderNumber.trim())) {
            newErrors.orderNumber = 'Order Number must be between 1 and 8 digits';
        }

        if (!formData.customerId) {
            newErrors.customerId = 'Customer is required';
        }

        if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
            newErrors.totalAmount = 'Total Amount must be greater than 0';
        }

        const paidAmount = parseFloat(formData.paidAmount) || 0;
        const totalAmount = parseFloat(formData.totalAmount) || 0;
        const returnAdjustAmount = formData.returnItems && formData.returnAdjustAmount 
            ? parseFloat(formData.returnAdjustAmount) || 0 
            : 0;
        const adjustedTotal = Math.max(0, totalAmount - returnAdjustAmount);

        if (paidAmount < 0) {
            newErrors.paidAmount = 'Paid Amount cannot be negative';
        }

        if (paidAmount > adjustedTotal) {
            newErrors.paidAmount = `Paid Amount cannot be greater than Adjusted Total Amount (₹${adjustedTotal.toFixed(2)})`;
        }

        // Validate return adjust amount if return items is checked
        if (formData.returnItems) {
            if (!formData.returnAdjustAmount || parseFloat(formData.returnAdjustAmount) <= 0) {
                newErrors.returnAdjustAmount = 'Return Adjust Amount is required when Return Items is checked';
            } else if (parseFloat(formData.returnAdjustAmount) > totalAmount) {
                newErrors.returnAdjustAmount = 'Return Adjust Amount cannot be greater than Total Amount';
            }
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
                totalAmount: parseFloat(formData.totalAmount),
            };

            // Add deliveryBoyId only if provided (optional)
            if (formData.deliveryBoyId) {
                submitData.deliveryBoyId = parseInt(formData.deliveryBoyId);
            }

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

            // Add returnItems and returnAdjustAmount
            submitData.returnItems = formData.returnItems;
            if (formData.returnAdjustAmount && parseFloat(formData.returnAdjustAmount) > 0) {
                submitData.returnAdjustAmount = parseFloat(formData.returnAdjustAmount);
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
                customerComments: '',
                returnItems: false,
                returnAdjustAmount: ''
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
                        <h2 className="text-lg font-bold text-gray-800">Create New Order</h2>
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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading form data...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Order Number */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Order Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="orderNumber"
                                    value={formData.orderNumber}
                                    onChange={handleChange}
                                    maxLength="8"
                                    pattern="[0-9]{1,8}"
                                    inputMode="numeric"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                        errors.orderNumber ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter 1-8 digit order number"
                                    disabled={isSubmitting}
                                />
                                {errors.orderNumber && (
                                    <p className="text-red-500 text-xs mt-1">{errors.orderNumber}</p>
                                )}
                            </div>

                            {/* Customer Selection */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                            // Ensure all customers are shown when field is focused
                                            if (!customerSearchQuery && customers.length > 0) {
                                                setShowCustomerDropdown(true);
                                            }
                                        }}
                                        placeholder="Search by customer name or mobile number"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
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
                                                className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">
                                                    {customer.name || customer.full_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
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
                                        <div className="px-4 py-2 text-gray-500 text-xs">
                                            No customers found
                                        </div>
                                    </div>
                                )}
                                {errors.customerId && (
                                    <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
                                )}
                            </div>

                            {/* Total Amount (Bill Amount) */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Bill Amount (Total Amount) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="totalAmount"
                                    value={formData.totalAmount}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                        errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                />
                                {errors.totalAmount && (
                                    <p className="text-red-500 text-xs mt-1">{errors.totalAmount}</p>
                                )}
                            </div>

                            {/* Adjusted Total Amount (shown when return items is checked) */}
                            {formData.returnItems && formData.returnAdjustAmount && parseFloat(formData.returnAdjustAmount) > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Adjusted Total Amount (After Return Deduction)
                                    </label>
                                    <input
                                        type="text"
                                        value={`₹${calculateAdjustedTotal().toFixed(2)}`}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-blue-50 text-gray-700 cursor-not-allowed"
                                        readOnly
                                        disabled
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Total Amount (₹{parseFloat(formData.totalAmount || 0).toFixed(2)}) - Return Adjust Amount (₹{parseFloat(formData.returnAdjustAmount || 0).toFixed(2)})
                                    </p>
                                </div>
                            )}

                            {/* Paid Amount */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Paid Amount
                                </label>
                                <input
                                    type="number"
                                    name="paidAmount"
                                    value={formData.paidAmount}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                        errors.paidAmount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                />
                                {errors.paidAmount && (
                                    <p className="text-red-500 text-xs mt-1">{errors.paidAmount}</p>
                                )}
                            </div>

                            {/* Remaining Amount (Non-editable) */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Remaining Amount to Pay
                                </label>
                                <input
                                    type="text"
                                    value={`₹${calculateRemainingAmount().toFixed(2)}`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                                {formData.returnItems && formData.returnAdjustAmount && parseFloat(formData.returnAdjustAmount) > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Adjusted Total (₹{calculateAdjustedTotal().toFixed(2)}) - Paid Amount (₹{parseFloat(formData.paidAmount || 0).toFixed(2)})
                                    </p>
                                )}
                            </div>

                            {/* Payment Mode (Required if paidAmount > 0) */}
                            {(parseFloat(formData.paidAmount) || 0) > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Payment Mode <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="paymentMode"
                                        value={formData.paymentMode}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
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
                                        <p className="text-red-500 text-xs mt-1">{errors.paymentMode}</p>
                                    )}
                                </div>
                            )}

                            {/* Transaction Reference (Optional, shown only if paidAmount > 0) */}
                            {(parseFloat(formData.paidAmount) || 0) > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Transaction Reference (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="transactionReference"
                                        value={formData.transactionReference}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., TXN123"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}

                            {/* Customer Comments */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Customer Comments (Optional)
                                </label>
                                <textarea
                                    name="customerComments"
                                    value={formData.customerComments}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Any special instructions or notes"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Return Items */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="returnItems"
                                        checked={formData.returnItems}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-xs font-medium text-gray-600">
                                        Return Items
                                    </span>
                                </label>
                            </div>

                            {/* Return Adjust Amount */}
                            {formData.returnItems && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Return Adjust Amount <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="returnAdjustAmount"
                                        value={formData.returnAdjustAmount}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                            errors.returnAdjustAmount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                        disabled={isSubmitting}
                                    />
                                    {errors.returnAdjustAmount && (
                                        <p className="text-red-500 text-xs mt-1">{errors.returnAdjustAmount}</p>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:from-primary-300 disabled:to-primary-400 disabled:cursor-not-allowed transition-all shadow-md"
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
