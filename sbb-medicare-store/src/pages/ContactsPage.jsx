import { useState, useEffect } from 'react';
import { Phone, Calendar, RefreshCw, Plus } from 'lucide-react';
import { contactsAPI } from '../services/api';

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
    const [mobileNumber, setMobileNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadContacts();
    }, [selectedDate]);

    const loadContacts = async () => {
        try {
            setLoading(true);
            const res = await contactsAPI.getByDate(selectedDate);
            const list = res.data?.data?.contacts || res.data?.data || [];
            setContacts(list);
        } catch (error) {
            console.error('Error loading contacts:', error);
            alert('Error loading contacts. Please try again.');
        } finally {
            setLoading(false);
        }
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
            await contactsAPI.create({
                mobile: mobileNumber.trim(),
                date: selectedDate
            });
            
            // Clear the input
            setMobileNumber('');
            
            // Reload contacts
            await loadContacts();
            
            alert('Contact added successfully');
        } catch (error) {
            console.error('Error adding contact:', error);
            alert('Error adding contact. Please try again.');
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
                    <form onSubmit={handleAddContact} className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Add New Mobile Number
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
                                disabled={isSubmitting}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div className="pt-5">
                            <button
                                type="submit"
                                disabled={isSubmitting || !mobileNumber.trim()}
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
                                            Date
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Mobile Number
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contacts.map((contact, index) => {
                                        const contactDate = contact.date || contact.created_at || contact.createdAt;
                                        const dateObj = contactDate ? new Date(contactDate) : null;
                                        
                                        return (
                                            <tr key={contact.id || index} className="hover:bg-primary-50 transition-colors border-b border-gray-100">
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 text-center">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {dateObj 
                                                        ? dateObj.toLocaleDateString('en-GB', { 
                                                            day: '2-digit', 
                                                            month: '2-digit', 
                                                            year: 'numeric' 
                                                        })
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {dateObj 
                                                        ? dateObj.toLocaleTimeString('en-GB', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit', 
                                                            second: '2-digit',
                                                            hour12: false
                                                        })
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-primary-600" />
                                                        {contact.mobile || contact.mobileNumber || '-'}
                                                    </div>
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
