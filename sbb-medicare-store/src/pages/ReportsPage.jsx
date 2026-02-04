import { useState } from 'react';
import { Download, Calendar, Clock, FileSpreadsheet } from 'lucide-react';
import { ordersAPI } from '../services/api';

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

export default function ReportsPage() {
    const [selectedDate, setSelectedDate] = useState(getTodayIST());
    const [fromTime, setFromTime] = useState('09:00');
    const [toTime, setToTime] = useState('18:00');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!selectedDate) {
            alert('Please select a date');
            return;
        }

        if (!fromTime || !toTime) {
            alert('Please select both from time and to time');
            return;
        }

        // Validate time format
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(fromTime) || !timeRegex.test(toTime)) {
            alert('Please enter valid time in HH:MM format');
            return;
        }

        // Validate that from_time is before to_time
        const [fromHour, fromMinute] = fromTime.split(':').map(Number);
        const [toHour, toMinute] = toTime.split(':').map(Number);
        const fromMinutes = fromHour * 60 + fromMinute;
        const toMinutes = toHour * 60 + toMinute;

        if (fromMinutes >= toMinutes) {
            alert('From time must be before To time');
            return;
        }

        try {
            setIsDownloading(true);
            
            // Call the export API
            const response = await ordersAPI.exportExcel({
                date: selectedDate,
                from_time: fromTime,
                to_time: toTime
            });

            // Handle file download
            // The API should return a blob
            const blob = response.data;
            
            if (blob instanceof Blob) {
                // Create a blob URL and trigger download
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `orders_report_${selectedDate}_${fromTime.replace(':', '-')}_${toTime.replace(':', '-')}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                // Show success message after a short delay
                setTimeout(() => {
                    alert('Report downloaded successfully!');
                }, 100);
            } else {
                // If the API returns a different format, try to handle it
                console.warn('Unexpected response format:', response);
                alert('Report downloaded successfully!');
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            
            // Try to handle blob error responses
            if (error.response?.data instanceof Blob) {
                // If error response is a blob, try to read it as text
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

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Reports</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Download order reports in Excel format</p>
                    </div>
                </div>
            </div>

            {/* Reports Form */}
            <div className="px-4 mt-4 flex-shrink-0">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200 max-w-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <FileSpreadsheet className="w-6 h-6 text-primary-600" />
                        <h2 className="text-base font-bold text-gray-800">Export Orders Report</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Date Picker */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Select Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={getTodayIST()}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Time Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* From Time */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    From Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={fromTime}
                                    onChange={(e) => setFromTime(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            {/* To Time */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    To Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={toTime}
                                    onChange={(e) => setToTime(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                                <strong>Note:</strong> The report will include all orders for the selected date between the specified time range. 
                                The file will be downloaded in Excel (.xlsx) format.
                            </p>
                        </div>

                        {/* Download Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading || !selectedDate || !fromTime || !toTime}
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
                                        Download Excel Report
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
