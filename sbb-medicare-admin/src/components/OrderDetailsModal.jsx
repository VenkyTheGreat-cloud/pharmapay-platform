import { useState, useEffect } from 'react';
import { X, Package, User, Truck, MapPin, CreditCard, MessageSquare, Calendar, CheckCircle, Image, Clock } from 'lucide-react';
import { ordersAPI } from '../services/api';

/**
 * Helper function to format image URL, handling base64 strings
 * @param {string} url - The image URL or base64 string
 * @returns {string|null} - Formatted URL or null if invalid
 */
const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Trim whitespace
    const trimmed = url.trim();
    
    // Filter out invalid URLs (null, empty, or just a comma)
    if (!trimmed || trimmed === ',' || trimmed === 'null' || trimmed === 'undefined') {
        return null;
    }
    
    // If it's already a data URI, use it as-is
    if (trimmed.startsWith('data:')) {
        return trimmed;
    }
    
    // If it's a full URL (http:// or https://), use it as-is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    
    // If it starts with /, check if it's a base64 string (like /9j/ for JPEG)
    // Base64 strings starting with / are usually long (>100 chars), relative paths are usually short
    if (trimmed.startsWith('/')) {
        // If it's a long string starting with /, it's likely base64 (e.g., /9j/4AAQ...)
        if (trimmed.length > 100) {
            return `data:image/jpeg;base64,${trimmed}`;
        }
        // Short strings starting with / are relative paths
        return trimmed;
    }
    
    // Simplified: Any string longer than 20 characters that doesn't start with data:, http://, https://, or / 
    // is treated as base64 and formatted as a data URI
    if (trimmed.length > 20) {
        return `data:image/jpeg;base64,${trimmed}`;
    }
    
    // Return as-is for short strings (might be relative paths or invalid)
    return trimmed;
};

/**
 * Extract receipt photos from order data
 * @param {object} apiOrder - The order object from API
 * @returns {string[]} - Array of valid receipt photo URLs
 */
const extractReceiptPhotos = (apiOrder) => {
    const receiptPhotos = [];
    
    // Helper function to ensure URL is properly formatted (double-check)
    const ensureFormatted = (url) => {
        if (!url) return null;
        
        // If it's already a data URI or full URL, use it as-is
        if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // Double-check: If it's longer than 20 characters and not a data URI or full URL, format as base64
        if (url.length > 20) {
            return `data:image/jpeg;base64,${url}`;
        }
        
        return url;
    };
    
    // Extract from payments array
    if (apiOrder.payments && Array.isArray(apiOrder.payments)) {
        apiOrder.payments.forEach((payment) => {
            const receiptUrl = payment.receipt_photo_url || payment.receiptPhotoUrl;
            if (receiptUrl) {
                let formatted = formatImageUrl(receiptUrl);
                // Double-check: ensure it's formatted as base64 if needed
                if (formatted) {
                    formatted = ensureFormatted(formatted);
                    if (formatted) {
                        receiptPhotos.push(formatted);
                    }
                }
            }
        });
    }
    
    // Fallback to order level receipt photo
    if (receiptPhotos.length === 0) {
        const orderReceiptUrl = apiOrder.receipt_photo_url || apiOrder.receiptPhotoUrl || 
                               apiOrder.payment?.receipt_photo_url || apiOrder.payment?.receiptPhotoUrl;
        if (orderReceiptUrl) {
            let formatted = formatImageUrl(orderReceiptUrl);
            // Double-check: ensure it's formatted as base64 if needed
            if (formatted) {
                formatted = ensureFormatted(formatted);
                if (formatted) {
                    receiptPhotos.push(formatted);
                }
            }
        }
    }
    
    return receiptPhotos;
};

export default function OrderDetailsModal({ isOpen, onClose, orderId }) {
    const [order, setOrder] = useState(null);
    const [receiptPhotos, setReceiptPhotos] = useState([]);
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
                    assignedAt: apiOrder.assigned_at || apiOrder.assignedAt || apiOrder.assigned_time,
                    pickedUpAt: apiOrder.picked_up_at || apiOrder.pickedUpAt || apiOrder.picked_up_time,
                    inTransitAt: apiOrder.in_transit_at || apiOrder.inTransitAt || apiOrder.in_transit_time,
                    cancelledAt: apiOrder.cancelled_at || apiOrder.cancelledAt || apiOrder.cancelled_time,
                    items: apiOrder.items || apiOrder.medicines || [],
                };
                setOrder(normalizedOrder);
                
                // Extract receipt photos from payments array or order level
                const photos = extractReceiptPhotos(apiOrder);
                setReceiptPhotos(photos);
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

                            {/* Order Status with Timestamps */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-900">Order Status Timeline</h3>
                                </div>
                                <div className="space-y-3">
                                    {/* Current Status */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status || 'N/A'}
                                            </span>
                                            <span className="text-sm text-gray-600">Current Status</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {order.updatedAt
                                                    ? new Date(order.updatedAt).toLocaleString()
                                                    : order.createdTime
                                                    ? new Date(order.createdTime).toLocaleString()
                                                    : 'N/A'}
                                            </p>
                                            <p className="text-xs text-gray-500">Last Updated</p>
                                        </div>
                                    </div>

                                    {/* Status Timeline */}
                                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                        {/* Created */}
                                        {order.createdTime && (
                                            <div className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span className="text-sm text-gray-700">Order Created</span>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(order.createdTime).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Assigned */}
                                        {order.assignedAt && (
                                            <div className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span className="text-sm text-gray-700">Assigned</span>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(order.assignedAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Picked Up */}
                                        {order.pickedUpAt && (
                                            <div className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                    <span className="text-sm text-gray-700">Picked Up</span>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(order.pickedUpAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* In Transit */}
                                        {order.inTransitAt && (
                                            <div className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                    <span className="text-sm text-gray-700">In Transit</span>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(order.inTransitAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Delivered */}
                                        {order.deliveredAt && (
                                            <div className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span className="text-sm text-gray-700">Delivered</span>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(order.deliveredAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Cancelled */}
                                        {order.cancelledAt && (
                                            <div className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <span className="text-sm text-gray-700">Cancelled</span>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(order.cancelledAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
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

                            {/* Receipt Photos - Show if receipt URL is not empty */}
                            {receiptPhotos.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Image className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">
                                            Receipt Photo{receiptPhotos.length > 1 ? 's' : ''}
                                        </h3>
                                    </div>
                                    <div className="mt-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {receiptPhotos.map((photoUrl, index) => (
                                                <ReceiptPhotoItem
                                                    key={index}
                                                    photoUrl={photoUrl}
                                                    index={index}
                                                />
                                            ))}
                                        </div>
                                        {receiptPhotos.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-3 text-center">
                                                Click on any image to view in full size
                                            </p>
                                        )}
                                    </div>
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

/**
 * Component to display a single receipt photo with error handling
 */
function ReceiptPhotoItem({ photoUrl, index }) {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
    };

    const handleImageLoad = () => {
        setImageLoading(false);
    };

    const handleImageClick = () => {
        // For base64 images, create a new window with the image
        if (photoUrl.startsWith('data:')) {
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                        <head><title>Receipt Photo ${index + 1}</title></head>
                        <body style="margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                            <img src="${photoUrl}" alt="Receipt Photo ${index + 1}" style="max-width:100%;max-height:90vh;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);" />
                        </body>
                    </html>
                `);
            }
        } else {
            window.open(photoUrl, '_blank');
        }
    };

    if (imageError) {
        return (
            <div className="flex items-center justify-center p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="text-center">
                    <p className="text-sm text-red-600">Failed to load receipt image</p>
                    <p className="text-xs text-red-500 mt-1">Image {index + 1}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
            <img
                src={photoUrl}
                alt={`Receipt ${index + 1}`}
                className={`w-full max-w-md max-h-64 object-contain rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={handleImageClick}
                onError={handleImageError}
                onLoad={handleImageLoad}
            />
        </div>
    );
}


