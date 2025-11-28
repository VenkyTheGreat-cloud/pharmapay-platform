import { useState, useEffect } from 'react';
import { ordersAPI, customersAPI, deliveryBoysAPI } from '../services/api';
import { X, Plus, Trash2 } from 'lucide-react';

export default function CreateOrderModal({ isOpen, onClose, onSuccess }) {
    const [customers, setCustomers] = useState([]);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerId: '',
        deliveryBoyId: '',
        items: [{ name: '', quantity: 1, price: 0 }],
        customerComments: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            Promise.all([loadCustomers(), loadDeliveryBoys()])
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

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
            // Backend format: { success, data: [...] }
            const list = response.data?.data || [];
            setDeliveryBoys(Array.isArray(list) ? list : []);
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

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', quantity: 1, price: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) {
            alert('At least one item is required');
            return;
        }
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        }, 0);
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.customerId) {
            newErrors.customerId = 'Customer is required';
        }

        // Check if at least one item has values
        const hasValidItem = formData.items.some(item =>
            item.name.trim() && item.quantity > 0 && item.price > 0
        );

        if (!hasValidItem) {
            newErrors.items = 'At least one valid item is required';
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
            // Filter out invalid items
            const validItems = formData.items.filter(item =>
                item.name.trim() && item.quantity > 0 && item.price > 0
            );

            const submitData = {
                customerId: formData.customerId,
                items: validItems,
                customerComments: formData.customerComments.trim() || undefined,
            };

            // If delivery boy is selected, assign it
            if (formData.deliveryBoyId) {
                submitData.deliveryBoyId = formData.deliveryBoyId;
            }

            await ordersAPI.create(submitData);
            alert('Order created successfully!');

            // Reset form
            setFormData({
                customerId: '',
                deliveryBoyId: '',
                items: [{ name: '', quantity: 1, price: 0 }],
                customerComments: ''
            });
            setErrors({});

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating order:', error);
            alert(error.response?.data?.message || 'Error creating order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                            {/* Customer Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="customerId"
                                    value={formData.customerId}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.customerId ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select a customer</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name} - {customer.mobile}
                                        </option>
                                    ))}
                                </select>
                            {errors.customerId && (
                                <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
                            )}
                        </div>

                        {/* Delivery Boy Selection (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign Delivery Boy (Optional)
                            </label>
                            <select
                                name="deliveryBoyId"
                                value={formData.deliveryBoyId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isSubmitting}
                            >
                                <option value="">Assign later</option>
                                {deliveryBoys.map(boy => (
                                    <option key={boy.id} value={boy.id}>
                                        {boy.name} - {boy.mobile}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Order Items */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Order Items <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                                    disabled={isSubmitting}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item
                                </button>
                            </div>

                            {errors.items && (
                                <p className="text-red-500 text-sm mb-2">{errors.items}</p>
                            )}

                            <div className="space-y-3">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                            placeholder="Item name"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            placeholder="Qty"
                                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                            placeholder="Price"
                                            className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="text-red-600 hover:text-red-700 p-2"
                                            disabled={isSubmitting || formData.items.length === 1}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                                <span className="text-2xl font-bold text-gray-900">
                                    ₹{calculateTotal().toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
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
