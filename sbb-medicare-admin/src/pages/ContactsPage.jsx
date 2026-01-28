import { useState, useEffect } from 'react';
import { contactsAPI } from '../services/api';
import { Search, Eye, Edit, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ContactsPage() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [contactToEdit, setContactToEdit] = useState(null);
    const [contactToDelete, setContactToDelete] = useState(null);

    // Check if user is admin (based on dashboardType or role)
    const isAdmin = user?.dashboardType === 'admin' || user?.role === 'admin' || user?.user_type === 'admin';
    
    // Check if user is super admin
    const isSuperAdmin = user?.role === 'super_admin' || 
                        user?.role === 'superadmin' || 
                        user?.user_type === 'super_admin' || 
                        user?.user_type === 'superadmin' ||
                        user?.dashboardType === 'super_admin';

    useEffect(() => {
        loadContacts();
    }, []);

    const normalizeContact = (apiContact) => ({
        id: apiContact.id,
        name: apiContact.name || 'N/A',
        mobile: apiContact.mobile || 'N/A',
        email: apiContact.email || null,
        designation: apiContact.designation || null,
        organization: apiContact.organization || null,
        address: apiContact.address || 'N/A',
        notes: apiContact.notes || null,
        createdAt: apiContact.created_at || apiContact.createdAt,
    });

    const loadContacts = async (params = {}) => {
        try {
            setLoading(true);
            const response = await contactsAPI.getAll(params);
            console.log('Contacts API Response:', response.data);
            
            // Handle different possible response structures
            let list = [];
            if (response.data?.data?.contacts) {
                list = response.data.data.contacts;
            } else if (response.data?.data?.data) {
                list = response.data.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                list = response.data.data;
            } else if (Array.isArray(response.data)) {
                list = response.data;
            }
            
            console.log('Parsed contacts list:', list);
            setContacts(list.map(normalizeContact));
        } catch (error) {
            console.error('Error loading contacts:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to load contacts';
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (searchQuery.trim().length < 2) {
            loadContacts();
            return;
        }

        try {
            await loadContacts({ search: searchQuery });
        } catch (error) {
            console.error('Error searching contacts:', error);
        }
    };

    const handleDelete = async () => {
        if (!contactToDelete) return;
        
        if (!window.confirm(`Are you sure you want to delete contact "${contactToDelete.name}"? This action cannot be undone.`)) {
            setContactToDelete(null);
            return;
        }

        try {
            await contactsAPI.delete(contactToDelete.id);
            alert('Contact deleted successfully!');
            setContactToDelete(null);
            loadContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to delete contact';
            alert(`Error: ${errorMsg}`);
        }
    };

    const viewContactDetails = async (contactId) => {
        try {
            setLoading(true);
            const response = await contactsAPI.getById(contactId);

            console.log('Contact Details Response:', response.data);

            // Handle different possible response structures
            let apiContact = null;
            if (response.data?.data?.contact) {
                apiContact = response.data.data.contact;
            } else if (response.data?.data && !Array.isArray(response.data.data)) {
                apiContact = response.data.data;
            } else if (response.data?.contact) {
                apiContact = response.data.contact;
            } else if (response.data && !Array.isArray(response.data) && response.data.id) {
                apiContact = response.data;
            }

            if (apiContact) {
                const normalizedContact = normalizeContact(apiContact);
                setSelectedContact(normalizedContact);
                setShowModal(true);
            } else {
                // Fallback: Try to find contact from the current list
                const contactFromList = contacts.find(c => c.id === contactId || c.id === String(contactId));
                if (contactFromList) {
                    setSelectedContact(contactFromList);
                    setShowModal(true);
                } else {
                    console.error('Contact not found in response or list:', response.data);
                    alert('Contact details not found');
                }
            }
        } catch (error) {
            console.error('Error loading contact details:', error);
            const errorMsg = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to load contact details';
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Fixed Header Section - Compact */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 -mx-4 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Contacts</h1>
                        <p className="text-xs text-gray-600">Manage business contacts</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 bg-white rounded-lg shadow-sm p-3 flex-shrink-0">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by name, mobile, organization..."
                            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 shadow-sm"
                    >
                        Search
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                    <div>
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
                        <p className="text-gray-600 mt-3 text-sm">Loading contacts...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto flex-1 min-h-0">
                        <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Sl.No
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Mobile
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Organization
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Designation
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {contacts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="text-gray-400 text-sm">
                                            <p>No contacts found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact, index) => (
                                    <tr key={contact.id} className="hover:bg-primary-50 transition-colors border-b border-gray-100">
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs font-medium text-gray-900">{contact.name}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs text-gray-900">{contact.mobile}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs text-gray-700">{contact.email || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs text-gray-700">{contact.organization || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs text-gray-700">{contact.designation || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                            {contact.createdAt
                                                ? new Date(contact.createdAt).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => viewContactDetails(contact.id)}
                                                    className="text-primary-600 hover:text-primary-700"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setContactToEdit(contact);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-primary-600 hover:text-primary-700"
                                                    title="Edit Contact"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setContactToDelete(contact)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Delete Contact"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Contact Details Modal */}
            {showModal && selectedContact && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    ID: {selectedContact.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-64px)] space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Full Name
                                        </h3>
                                        <p className="text-base text-gray-900 font-medium">{selectedContact.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Mobile Number
                                        </h3>
                                        <p className="text-base text-gray-900">{selectedContact.mobile || 'N/A'}</p>
                                    </div>
                                    {selectedContact.email && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Email
                                            </h3>
                                            <p className="text-base text-gray-900">{selectedContact.email}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Contact ID
                                        </h3>
                                        <p className="text-sm text-gray-600 font-mono">{selectedContact.id || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {selectedContact.organization && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Organization
                                            </h3>
                                            <p className="text-base text-gray-900">{selectedContact.organization}</p>
                                        </div>
                                    )}
                                    {selectedContact.designation && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Designation
                                            </h3>
                                            <p className="text-base text-gray-900">{selectedContact.designation}</p>
                                        </div>
                                    )}
                                    {selectedContact.address && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                Address
                                            </h3>
                                            <p className="text-base text-gray-900 whitespace-pre-line">
                                                {selectedContact.address}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Created On
                                        </h3>
                                        <p className="text-base text-gray-900">
                                            {selectedContact.createdAt
                                                ? new Date(selectedContact.createdAt).toLocaleString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedContact.notes && (
                                <div className="pt-6 border-t">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        Notes
                                    </h3>
                                    <p className="text-base text-gray-900 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                                        {selectedContact.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Contact Modal */}
            <EditContactModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setContactToEdit(null);
                }}
                onSuccess={() => {
                    loadContacts();
                }}
                contact={contactToEdit}
            />

            {/* Delete Confirmation Modal */}
            {contactToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Contact</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete contact <strong>"{contactToDelete.name}"</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setContactToDelete(null)}
                                className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add Contact Modal Component
function AddContactModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        designation: '',
        organization: '',
        address: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await contactsAPI.create(formData);
            alert('Contact created successfully!');
            onSuccess();
            onClose();
            setFormData({
                name: '',
                mobile: '',
                email: '',
                designation: '',
                organization: '',
                address: '',
                notes: '',
            });
        } catch (err) {
            const errorMsg = err.response?.data?.error?.message || 
                           err.response?.data?.message || 
                           'Failed to create contact';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Add New Contact</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Mobile Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Organization
                            </label>
                            <input
                                type="text"
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Designation
                            </label>
                            <input
                                type="text"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Address
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                rows="3"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {loading ? 'Creating...' : 'Create Contact'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Edit Contact Modal Component
function EditContactModal({ isOpen, onClose, onSuccess, contact }) {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        designation: '',
        organization: '',
        address: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || '',
                mobile: contact.mobile || '',
                email: contact.email || '',
                designation: contact.designation || '',
                organization: contact.organization || '',
                address: contact.address || '',
                notes: contact.notes || '',
            });
        }
    }, [contact]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!contact) return;
        
        setError('');
        setLoading(true);

        try {
            await contactsAPI.update(contact.id, formData);
            alert('Contact updated successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.error?.message || 
                           err.response?.data?.message || 
                           'Failed to update contact';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !contact) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Edit Contact</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Mobile Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Organization
                            </label>
                            <input
                                type="text"
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Designation
                            </label>
                            <input
                                type="text"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Address
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                rows="3"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {loading ? 'Updating...' : 'Update Contact'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
