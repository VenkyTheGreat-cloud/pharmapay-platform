import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { X } from 'lucide-react';

export default function EditOrderModal({ isOpen, onClose, onSuccess, order }) {
    const [formData, setFormData] = useState({
        totalAmount: '',
        paidAmount: '',
        remainingAmount: '',
        paymentMode: '',
        transactionReference: '',
        customerComments: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [returnItemsPhoto, setReturnItemsPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        if (isOpen && order) {
            // Initialize form with order data
            const totalAmount = order.totalAmount || order.total_amount || order.amount || '';
            const paidAmount = order.paidAmount || order.paid_amount || 0;
            const remainingAmount = totalAmount ? (parseFloat(totalAmount) - parseFloat(paidAmount)).toFixed(2) : '';

            setFormData({
                totalAmount: totalAmount.toString(),
                paidAmount: paidAmount.toString(),
                remainingAmount: remainingAmount,
                paymentMode: order.paymentMode || order.payment_mode || '',
                transactionReference: order.transactionReference || order.transaction_reference || '',
                customerComments: order.customerComments || order.customer_comments || order.note || ''
            });
            setErrors({});

            // Set existing photo preview
            const existingPhoto = order.return_items_photo_url || order.returnItemsPhotoUrl || null;
            if (existingPhoto) {
                const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sbb-medicare-api.onrender.com/api';
                const baseUrl = API_BASE_URL.replace('/api', '');
                setPhotoPreview(existingPhoto.startsWith('http') || existingPhoto.startsWith('data:') ? existingPhoto : `${baseUrl}${existingPhoto}`);
            } else {
                setPhotoPreview(null);
            }
            setReturnItemsPhoto(null);
        } else {
            // Reset form when modal closes
            setFormData({
                totalAmount: '',
                paidAmount: '',
                remainingAmount: '',
                paymentMode: '',
                transactionReference: '',
                customerComments: ''
            });
            setErrors({});
        }
    }, [isOpen, order]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, isSubmitting, onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Calculate remaining amount when totalAmount or paidAmount changes
        if (name === 'totalAmount' || name === 'paidAmount') {
            const newFormData = { ...formData, [name]: value };
            const total = parseFloat(newFormData.totalAmount) || 0;
            const paid = parseFloat(newFormData.paidAmount) || 0;
            const remaining = total - paid;
            newFormData.remainingAmount = remaining >= 0 ? remaining.toFixed(2) : '0.00';
            setFormData(newFormData);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReturnItemsPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.totalAmount || formData.totalAmount.trim() === '') {
            newErrors.totalAmount = 'Bill Amount is required';
        } else {
            const amount = parseFloat(formData.totalAmount);
            if (isNaN(amount) || amount <= 0) {
                newErrors.totalAmount = 'Bill Amount must be a positive number';
            }
        }

        const paidAmount = parseFloat(formData.paidAmount) || 0;
        if (paidAmount > 0) {
            if (!formData.paymentMode || formData.paymentMode.trim() === '') {
                newErrors.paymentMode = 'Payment Mode is required when paid amount is greater than 0';
            }
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
            // Use same fields as create order
            const submitData = {
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

            // Include return items photo if newly selected
            if (returnItemsPhoto) {
                submitData.returnItemsPhoto = returnItemsPhoto;
            }

            await ordersAPI.update(order.id, submitData);
            alert('Order updated successfully!');

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating order:', error);
            alert(error.response?.data?.error?.message || error.response?.data?.message || 'Error updating order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Edit Order</h2>
                            <p className="text-xs text-gray-600 mt-1">
                                Order #: {order.orderNumber || order.order_number || order.id}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={isSubmitting}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Non-editable Order Details */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
                            <h3 className="text-xs font-medium text-gray-800 mb-3">Order Details (Read Only)</h3>

                            {/* Customer Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    value={order.customerName || order.customer_name || 'N/A'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Customer Mobile */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Customer Mobile
                                </label>
                                <input
                                    type="text"
                                    value={order.customerMobile || order.customer_phone || order.customer_mobile || 'N/A'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Order Number */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Order Number
                                </label>
                                <input
                                    type="text"
                                    value={order.orderNumber || order.order_number || order.id || 'N/A'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Order Date */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Order Date
                                </label>
                                <input
                                    type="text"
                                    value={(order.createdTime || order.created_at) ? new Date(order.createdTime || order.created_at).toLocaleString() : 'N/A'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Status
                                </label>
                                <input
                                    type="text"
                                    value={order.status ? order.status.replace(/_/g, ' ') : 'N/A'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Delivery Boy (if assigned) */}
                            {(order.deliveryBoyName || order.delivery_boy_name) && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Delivery Boy
                                    </label>
                                    <input
                                        type="text"
                                        value={`${order.deliveryBoyName || order.delivery_boy_name}${order.deliveryBoyMobile || order.delivery_boy_mobile ? ` (${order.deliveryBoyMobile || order.delivery_boy_mobile})` : ''}`}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                        readOnly
                                        disabled
                                    />
                                </div>
                            )}

                            {/* Area */}
                            {(order.customer_area || order.customerArea) && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Area
                                    </label>
                                    <input
                                        type="text"
                                        value={order.customer_area || order.customerArea || 'N/A'}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                        readOnly
                                        disabled
                                    />
                                </div>
                            )}

                            {/* Return Items */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Return Items
                                </label>
                                <input
                                    type="text"
                                    value={order.returnItems || order.return_items ? 'Yes' : 'No'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* Return Adjust Amount */}
                            {(order.returnAdjustAmount || order.return_adjust_amount) && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Return Adjust Amount
                                    </label>
                                    <input
                                        type="text"
                                        value={`₹${(Number(order.returnAdjustAmount || order.return_adjust_amount) || 0).toFixed(2)}`}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
                                        readOnly
                                        disabled
                                    />
                                </div>
                            )}
                        </div>

                        {/* Editable Fields Section */}
                        <div className="border-t pt-4">
                            <h3 className="text-xs font-medium text-gray-800 mb-4">Editable Fields</h3>
                        </div>

                        {/* Bill Amount */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Bill Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="totalAmount"
                                value={formData.totalAmount}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter bill amount"
                                disabled={isSubmitting}
                            />
                            {errors.totalAmount && (
                                <p className="text-red-500 text-xs mt-1">{errors.totalAmount}</p>
                            )}
                        </div>

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
                                step="0.01"
                                min="0"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.paidAmount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="0.00"
                                disabled={isSubmitting}
                            />
                            {errors.paidAmount && (
                                <p className="text-red-500 text-xs mt-1">{errors.paidAmount}</p>
                            )}
                        </div>

                        {/* Remaining Amount (Non-editable, calculated) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Remaining Amount
                            </label>
                            <input
                                type="text"
                                value={`₹${formData.remainingAmount || '0.00'}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                                readOnly
                                disabled
                            />
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
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.paymentMode ? 'border-red-500' : 'border-gray-300'
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

                        {/* Customer Comments (Note) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Note (Customer Comments)
                            </label>
                            <textarea
                                name="customerComments"
                                value={formData.customerComments}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Enter any notes or comments"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:from-primary-300 disabled:to-primary-400 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                {isSubmitting ? 'Updating...' : 'Update Order'}
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
                </div>
            </div>
        </div>
    );
}
