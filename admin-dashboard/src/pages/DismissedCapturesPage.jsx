import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Search, Filter, Calendar, Clock } from 'lucide-react';
import { capturesAPI } from '../services/api';

export default function DismissedCapturesPage() {
    const [captures, setCaptures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [filters, setFilters] = useState({
        channel: '',
        date_from: '',
        date_to: '',
    });

    useEffect(() => {
        loadCaptures();
    }, []);

    const loadCaptures = async () => {
        setLoading(true);
        try {
            const params = { limit: 100 };
            if (filters.channel) params.channel = filters.channel;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;

            const res = await capturesAPI.getDismissed(params);
            const data = res.data?.data || res.data;
            setCaptures(data.captures || []);
            setCount(data.dismissed_count || 0);
        } catch (err) {
            console.error('Failed to load dismissed captures:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e) => {
        e.preventDefault();
        loadCaptures();
    };

    const resetFilters = () => {
        setFilters({ channel: '', date_from: '', date_to: '' });
        setTimeout(loadCaptures, 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dismissed Captures Log</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Voice calls and WhatsApp messages that were dismissed by clerks.
                    Total: <span className="font-semibold text-gray-700">{count}</span>
                </p>
            </div>

            {/* Filters */}
            <form onSubmit={handleFilter} className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
                        <select
                            value={filters.channel}
                            onChange={(e) => setFilters(f => ({ ...f, channel: e.target.value }))}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">All Channels</option>
                            <option value="voice">Voice Calls</option>
                            <option value="whatsapp">WhatsApp</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                        <Filter className="w-4 h-4" /> Apply
                    </button>
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm"
                    >
                        Reset
                    </button>
                </div>
            </form>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : captures.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No dismissed captures found</p>
                        <p className="text-sm mt-1">Try adjusting the filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date/Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Channel</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Caller / Sender</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer Match</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Transcript / Message</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicines</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {captures.map((cap) => {
                                    const ext = cap.extracted_data || {};
                                    const medicines = ext.medicines || [];
                                    const reason = ext.dismiss_reason || '-';
                                    return (
                                        <tr key={cap.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    {formatDate(cap.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    cap.channel === 'voice'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-green-50 text-green-700'
                                                }`}>
                                                    {cap.channel === 'voice'
                                                        ? <><Phone className="w-3 h-3" /> Voice</>
                                                        : <><MessageSquare className="w-3 h-3" /> WhatsApp</>
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium text-gray-800">{cap.caller_number || '-'}</div>
                                                {cap.sender_name && (
                                                    <div className="text-xs text-gray-500">{cap.sender_name}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {cap.matched_customer_name
                                                    ? <span className="text-green-600">{cap.matched_customer_name}</span>
                                                    : <span className="text-gray-400">No match</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                {cap.transcript || cap.message_text || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {medicines.length > 0
                                                    ? medicines.map(m => m.name).join(', ')
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                                                    {reason}
                                                </span>
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
    );
}
