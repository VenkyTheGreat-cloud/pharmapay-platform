import { useState, useEffect } from 'react';
import { Download, Calendar, Clock, FileSpreadsheet, User, Users, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { reportsAPI, deliveryBoysAPI, customersAPI } from '../services/api';

// Helper function to get today's date in IST (Indian Standard Time, UTC+5:30)
const getTodayIST = () => {
    const now = new Date();
    const istDateString = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
    return istDateString;
};

// Helper function to format date-time for API
const formatDateTime = (date, time) => {
    if (!date || !time) return null;
    // Ensure time has seconds
    const timeWithSeconds = time.split(':').length === 2 ? `${time}:00` : time;
    return `${date} ${timeWithSeconds}`;
};

const REPORT_TYPES = [
    { id: 'delivery-boy', name: 'Delivery Boy Report', icon: User, description: 'Delivery boy performance with deliveries and collected amounts' },
    { id: 'customer', name: 'Customer Report', icon: Users, description: 'Customer orders and total bill amounts' },
    { id: 'return-items', name: 'Return Item Report', icon: Package, description: 'Returned items with adjusted amounts' },
    { id: 'orders', name: 'Orders Report', icon: ShoppingCart, description: 'Detailed orders export' },
    { id: 'sales', name: 'Sale Report', icon: TrendingUp, description: 'Sales summary with payment mode breakdown' },
];

export default function ReportsPage() {
    const [reportType, setReportType] = useState('');
    const [fromDate, setFromDate] = useState(getTodayIST());
    const [fromTime, setFromTime] = useState('00:00:00');
    const [toDate, setToDate] = useState(getTodayIST());
    const [toTime, setToTime] = useState('23:59:59');
    
    // Filters
    const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('all');
    const [selectedCustomer, setSelectedCustomer] = useState('all');
    
    // Dropdown data
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loadingDeliveryBoys, setLoadingDeliveryBoys] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    
    const [isDownloading, setIsDownloading] = useState(false);

    // Load delivery boys when Delivery Boy Report is selected
    useEffect(() => {
        if (reportType === 'delivery-boy') {
            loadDeliveryBoys();
        }
    }, [reportType]);

    // Load customers when Customer Report is selected
    useEffect(() => {
        if (reportType === 'customer') {
            loadCustomers();
        }
    }, [reportType]);

    const loadDeliveryBoys = async () => {
        try {
            setLoadingDeliveryBoys(true);
            const response = await deliveryBoysAPI.list({ status: 'approved' });
            const data = response.data?.data?.delivery_boys || response.data?.data || [];
            setDeliveryBoys(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading delivery boys:', error);
            setDeliveryBoys([]);
        } finally {
            setLoadingDeliveryBoys(false);
        }
    };

    const loadCustomers = async () => {
        try {
            setLoadingCustomers(true);
            const response = await customersAPI.getAll({ page: 1, limit: 10000 });
            const data = response.data?.data?.customers || response.data?.data || [];
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading customers:', error);
            setCustomers([]);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const validateInputs = () => {
        if (!reportType) {
            alert('Please select a report type');
            return false;
        }

        if (!fromDate || !toDate) {
            alert('Please select both From Date and To Date');
            return false;
        }

        if (!fromTime || !toTime) {
            alert('Please enter both From Time and To Time');
            return false;
        }

        // Validate time format (supports HH:MM:SS)
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(fromTime) || !timeRegex.test(toTime)) {
            alert('Please enter valid time in HH:MM:SS format');
            return false;
        }

        // Validate date range
        const fromDateTime = new Date(formatDateTime(fromDate, fromTime));
        const toDateTime = new Date(formatDateTime(toDate, toTime));

        if (fromDateTime >= toDateTime) {
            alert('From Date & Time must be before To Date & Time');
            return false;
        }

        // Validate filters based on report type
        if (reportType === 'delivery-boy' && !selectedDeliveryBoy) {
            alert('Please select a delivery boy or choose "All"');
            return false;
        }

        if (reportType === 'customer' && !selectedCustomer) {
            alert('Please select a customer or choose "All"');
            return false;
        }

        return true;
    };

    const getFileName = () => {
        const fromStr = `${fromDate}_${fromTime.replace(/:/g, '-')}`;
        const toStr = `${toDate}_${toTime.replace(/:/g, '-')}`;
        const reportName = REPORT_TYPES.find(r => r.id === reportType)?.name.replace(/\s+/g, '_') || 'report';
        return `${reportName}_${fromStr}_to_${toStr}.xlsx`;
    };

    const handleDownload = async () => {
        if (!validateInputs()) {
            return;
        }

        try {
            setIsDownloading(true);

            // Prepare common params
            const fromDateTime = formatDateTime(fromDate, fromTime);
            const toDateTime = formatDateTime(toDate, toTime);
            
            const baseParams = {
                from_date: fromDate,
                from_time: fromTime,
                to_date: toDate,
                to_time: toTime,
            };

            let response;
            let fileName = getFileName();

            switch (reportType) {
                case 'delivery-boy':
                    const deliveryBoyParams = { ...baseParams };
                    if (selectedDeliveryBoy !== 'all') {
                        deliveryBoyParams.delivery_boy_id = selectedDeliveryBoy;
                    }
                    response = await reportsAPI.exportDeliveryBoyReport(deliveryBoyParams);
                    break;

                case 'customer':
                    const customerParams = { ...baseParams };
                    if (selectedCustomer !== 'all') {
                        customerParams.customer_id = selectedCustomer;
                    }
                    response = await reportsAPI.exportCustomerReport(customerParams);
                    break;

                case 'return-items':
                    response = await reportsAPI.exportReturnItemsReport(baseParams);
                    break;

                case 'orders':
                    // Orders report API supports two formats:
                    // Option 1: Single date with time range: date=YYYY-MM-DD&from_time=HH:MM&to_time=HH:MM
                    // Option 2: Date range: date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
                    if (fromDate === toDate) {
                        // Same date - use Option 1 with time range
                        response = await reportsAPI.exportOrdersReport({
                            date: fromDate,
                            from_time: fromTime.substring(0, 5), // HH:MM format
                            to_time: toTime.substring(0, 5), // HH:MM format
                        });
                    } else {
                        // Different dates - use Option 2 with date range
                        response = await reportsAPI.exportOrdersReport({
                            date_from: fromDate,
                            date_to: toDate,
                        });
                    }
                    break;

                case 'sales':
                    response = await reportsAPI.exportSalesReport(baseParams);
                    break;

                default:
                    alert('Invalid report type selected');
                    return;
            }

            // Handle file download
            let blob = response.data;
            
            // Check response headers for content type
            const contentType = response.headers?.['content-type'] || 
                              response.headers?.['Content-Type'] || 
                              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            
            // Ensure we have a proper Blob with correct MIME type
            if (blob instanceof Blob) {
                // If blob type is incorrect or missing, create a new blob with correct type
                const correctType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                if (!blob.type || blob.type === 'application/octet-stream' || blob.type !== correctType) {
                    blob = new Blob([blob], { type: correctType });
                }
            } else {
                // If response.data is not a Blob, try to create one
                console.warn('Response data is not a Blob, attempting to create one:', typeof response.data);
                blob = new Blob([response.data], { 
                    type: contentType.includes('excel') || contentType.includes('spreadsheet') 
                        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        : contentType
                });
            }
            
            // Verify blob is valid before downloading
            if (!(blob instanceof Blob)) {
                throw new Error('Invalid blob data received from server');
            }
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setTimeout(() => {
                alert('Report downloaded successfully!');
            }, 100);
        } catch (error) {
            console.error('Error downloading report:', error);
            
            if (error.response?.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        alert(errorData.error?.message || errorData.message || 'Error downloading report. Please try again.');
                    } catch (e) {
                        alert('Error downloading report. Please try again.');
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                alert(error.response?.data?.error?.message || error.response?.data?.message || 'Error downloading report. Please try again.');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    const selectedReport = REPORT_TYPES.find(r => r.id === reportType);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Reports</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Download various reports in Excel format</p>
                    </div>
                </div>
            </div>

            {/* Reports Form */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <FileSpreadsheet className="w-6 h-6 text-primary-600" />
                        <h2 className="text-base font-bold text-gray-800">Export Reports</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Report Type Selection */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-3">
                                Select Report Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {REPORT_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setReportType(type.id)}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                                                reportType === type.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon className={`w-5 h-5 ${reportType === type.id ? 'text-primary-600' : 'text-gray-500'}`} />
                                                <span className={`text-xs font-semibold ${reportType === type.id ? 'text-primary-700' : 'text-gray-700'}`}>
                                                    {type.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date-Time Range */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-xs font-semibold text-gray-700 mb-4">Date & Time Range</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* From Date & Time */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            <Calendar className="w-4 h-4 inline mr-2" />
                                            From Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            max={getTodayIST()}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            <Clock className="w-4 h-4 inline mr-2" />
                                            From Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={fromTime}
                                            onChange={(e) => setFromTime(e.target.value)}
                                            placeholder="00:00:00"
                                            pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                {/* To Date & Time */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            <Calendar className="w-4 h-4 inline mr-2" />
                                            To Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            max={getTodayIST()}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            <Clock className="w-4 h-4 inline mr-2" />
                                            To Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={toTime}
                                            onChange={(e) => setToTime(e.target.value)}
                                            placeholder="23:59:59"
                                            pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conditional Filters */}
                        {(reportType === 'delivery-boy' || reportType === 'customer') && (
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-xs font-semibold text-gray-700 mb-4">Filters</h3>
                                
                                {reportType === 'delivery-boy' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            <User className="w-4 h-4 inline mr-2" />
                                            Delivery Boy <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={selectedDeliveryBoy}
                                            onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
                                            disabled={loadingDeliveryBoys}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="all">All Delivery Boys</option>
                                            {deliveryBoys.map((boy) => (
                                                <option key={boy.id} value={boy.id}>
                                                    {boy.name} ({boy.mobile})
                                                </option>
                                            ))}
                                        </select>
                                        {loadingDeliveryBoys && (
                                            <p className="text-xs text-gray-500 mt-1">Loading delivery boys...</p>
                                        )}
                                    </div>
                                )}

                                {reportType === 'customer' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            <Users className="w-4 h-4 inline mr-2" />
                                            Customer <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={selectedCustomer}
                                            onChange={(e) => setSelectedCustomer(e.target.value)}
                                            disabled={loadingCustomers}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="all">All Customers</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name || 'N/A'} ({customer.mobile})
                                                </option>
                                            ))}
                                        </select>
                                        {loadingCustomers && (
                                            <p className="text-xs text-gray-500 mt-1">Loading customers...</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                                <strong>Note:</strong> {selectedReport?.description || 'The report will be generated for the selected date-time range.'} 
                                The file will be downloaded in Excel (.xlsx) format.
                            </p>
                        </div>

                        {/* Download Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading || !reportType || !fromDate || !toDate || !fromTime || !toTime}
                                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center gap-2 disabled:from-primary-300 disabled:to-primary-400 disabled:cursor-not-allowed"
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download {selectedReport?.name || 'Report'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
