import { useState, useEffect } from 'react';
import { X, Package, User, Truck, MapPin, CreditCard, MessageSquare, Calendar, CheckCircle } from 'lucide-react';
import { ordersAPI } from '../services/api';

export default function OrderDetailsModal({ isOpen, onClose, orderId }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && orderId) {
            loadOrderDetails();
        } else {
            setOrder(null);
            setError('');
        }
    }, [isOpen, orderId]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await ordersAPI.getById(orderId);
            console.log('Order Details API Response:', response.data);

            let apiOrder = null;
            if (response.data?.data?.order) {
                apiOrder = response.data.data.order;
            } else if (response.data?.data && !Array.isArray(response.data.data)) {
                apiOrder = response.data.data;
            } else if (response.data?.order) {
                apiOrder = response.data.order;
            } else if (response.data && !Array.isArray(response.data) && response.data.id) {
                apiOrder = response.data;
            }

            if (apiOrder) {
                // Normalize order data
                const normalizedOrder = {
                    id: apiOrder.id,
                    orderNumber: apiOrder.order_number || apiOrder.orderNumber,
                    customerId: apiOrder.customer_id || apiOrder.customerId,
                    customerName: apiOrder.customer_name || apiOrder.customerName,
                    customerMobile: apiOrder.customer_mobile || apiOrder.customerMobile,
                    deliveryBoyId: apiOrder.delivery_boy_id || apiOrder.deliveryBoyId,
                    deliveryBoyName: apiOrder.delivery_boy_name || apiOrder.deliveryBoyName,
                    deliveryBoyMobile: apiOrder.delivery_boy_mobile || apiOrder.deliveryBoyMobile,
                    status: apiOrder.status,
                    amount: parseFloat(apiOrder.amount || apiOrder.total_amount || 0),
                    paymentMode: apiOrder.payment_mode || apiOrder.paymentMode,
                    paymentStatus: apiOrder.payment_status || apiOrder.paymentStatus,
                    customerComments: apiOrder.customer_comments || apiOrder.customerComments || apiOrder.comments,
                    address: apiOrder.address || apiOrder.delivery_address,
                    createdTime: apiOrder.created_time || apiOrder.createdTime || apiOrder.created_at || apiOrder.order_date,
                    updatedAt: apiOrder.updated_at || apiOrder.updatedAt,
                    deliveredAt: apiOrder.delivered_at || apiOrder.deliveredAt || apiOrder.delivered_time,
                    items: apiOrder.items || apiOrder.medicines || [],
                };
                setOrder(normalizedOrder);
            } else {
                setError('Order details not found');
            }
        } catch (err) {
            console.error('Error loading order details:', err);
            const errorMsg =
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                'Failed to load order details';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DELIVERED':
                return 'bg-green-100 text-green-800';
            case 'ASSIGNED':
                return 'bg-blue-100 text-blue-800';
            case 'PICKED_UP':
                return 'bg-yellow-100 text-yellow-800';
            case 'IN_TRANSIT':
                return 'bg-orange-100 text-orange-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading order details...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                                {error}
                            </div>
                        </div>
                    ) : order ? (
                        <div className="space-y-6">
                            {/* Order Header */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Order Number</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {order.orderNumber || order.id || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span
                                            className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                                                order.status
                                            )}`}
                                        >
                                            {order.status || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Customer Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Customer Information</h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="text-gray-600">Name:</span>{' '}
                                            <span className="font-medium">{order.customerName || 'N/A'}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-600">Mobile:</span>{' '}
                                            <span className="font-medium">{order.customerMobile || 'N/A'}</span>
                                        </p>
                                        {order.customerId && (
                                            <p>
                                                <span className="text-gray-600">ID:</span>{' '}
                                                <span className="font-medium">{order.customerId}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Delivery Boy Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Truck className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Delivery Boy</h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="text-gray-600">Name:</span>{' '}
                                            <span className="font-medium">
                                                {order.deliveryBoyName || 'Not assigned'}
                                            </span>
                                        </p>
                                        {order.deliveryBoyMobile && (
                                            <p>
                                                <span className="text-gray-600">Mobile:</span>{' '}
                                                <span className="font-medium">{order.deliveryBoyMobile}</span>
                                            </p>
                                        )}
                                        {order.deliveryBoyId && (
                                            <p>
                                                <span className="text-gray-600">ID:</span>{' '}
                                                <span className="font-medium">{order.deliveryBoyId}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Payment</h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="text-gray-600">Amount:</span>{' '}
                                            <span className="font-medium text-lg">
                                                ₹{order.amount.toFixed(2)}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="text-gray-600">Mode:</span>{' '}
                                            <span className="font-medium">{order.paymentMode || 'N/A'}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-600">Status:</span>{' '}
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                                                    order.paymentStatus === 'PAID' ||
                                                    order.paymentStatus === 'CONFIRMED'
                                                        ? 'bg-green-100 text-green-800'
                                                        : order.paymentStatus === 'PENDING'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {order.paymentStatus || 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Delivery Address</h3>
                                    </div>
                                    <p className="text-sm text-gray-700">{order.address || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            {order.items && order.items.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Package className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Order Items</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Item
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Quantity
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Price
                                                    </th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {order.items.map((item, index) => (
                                                    <tr key={item.id || index}>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {item.name || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {item.quantity || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            ₹{parseFloat(item.price || 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                                            ₹{parseFloat(item.total || item.price * item.quantity || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                                        Total Amount:
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                                        ₹{order.amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Customer Comments */}
                            {order.customerComments && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Customer Comments</h3>
                                    </div>
                                    <p className="text-sm text-gray-700">{order.customerComments}</p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-4 h-4 text-gray-600" />
                                            <span className="text-gray-600">Created:</span>
                                        </div>
                                        <p className="font-medium text-gray-900">
                                            {order.createdTime
                                                ? new Date(order.createdTime).toLocaleString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    {order.updatedAt && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="w-4 h-4 text-gray-600" />
                                                <span className="text-gray-600">Updated:</span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                {new Date(order.updatedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {order.deliveredAt && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-gray-600">Delivered:</span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                {new Date(order.deliveredAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}


