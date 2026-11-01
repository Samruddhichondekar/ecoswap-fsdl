import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import {
    PackageOpen, Layers, Inbox, Send, CheckCircle2, XCircle,
    ArrowLeftRight, Clock, Edit3, X, Save
} from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import { API_URL } from '../utils/config';
import './MyItems.css';

const CATEGORIES = ['Books', 'Electronics', 'Stationery', 'Furniture', 'Daily Use', 'Others'];
const CONDITIONS = ['Like New', 'Excellent', 'Good', 'Fair'];
const TRANSACTIONS = ['Donate', 'Sell', 'Barter', 'Rent'];

const MyItems = () => {
    const { user, authHeaders } = useAuth();
    const { addToast } = useContext(ToastContext);

    const [activeTab, setActiveTab] = useState('listings');
    const [items, setItems] = useState([]);
    const [receivedSwaps, setReceivedSwaps] = useState([]);
    const [sentSwaps, setSentSwaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit Item Modal State
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        category: 'Books',
        condition: 'Good',
        transactionType: 'Donate',
        price: 0,
        location: '',
        description: '',
        contact: '',
    });
    const [savingEdit, setSavingEdit] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?._id) return;
        setLoading(true);
        setError('');
        try {
            const [itemsRes, receivedRes, sentRes] = await Promise.all([
                axios.get(`${API_URL}/items`, { params: { userId: user._id }, headers: authHeaders }),
                axios.get(`${API_URL}/swaps/received`, { headers: authHeaders }),
                axios.get(`${API_URL}/swaps/sent`, { headers: authHeaders }),
            ]);
            setItems(itemsRes.data || []);
            setReceivedSwaps(receivedRes.data || []);
            setSentSwaps(sentRes.data || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.response?.data?.message || 'Could not load your dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [authHeaders, user?._id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                await axios.delete(`${API_URL}/items/${id}`, { headers: authHeaders });
                setItems(prev => prev.filter(item => item._id !== id));
                addToast('Item deleted successfully.');
            } catch (err) {
                console.error('Error deleting item', err);
                addToast(err.response?.data?.message || 'Could not delete this item.');
            }
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await axios.put(`${API_URL}/items/${id}`, { status: newStatus }, {
                headers: authHeaders
            });
            setItems(prev => prev.map(item => item._id === id ? res.data : item));
            addToast(`Listing status updated to ${newStatus}.`);
        } catch (err) {
            console.error('Error updating status', err);
            addToast(err.response?.data?.message || 'Could not update item status.');
        }
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setEditForm({
            title: item.title,
            category: item.category,
            condition: item.condition,
            transactionType: item.transactionType,
            price: item.price || 0,
            location: item.location || '',
            description: item.description,
            contact: item.contact,
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSavingEdit(true);
        try {
            const res = await axios.put(
                `${API_URL}/items/${editingItem._id}`,
                {
                    ...editForm,
                    price: ['Sell', 'Rent'].includes(editForm.transactionType) ? Number(editForm.price) : 0,
                },
                { headers: authHeaders }
            );
            setItems(prev => prev.map(i => i._id === editingItem._id ? res.data : i));
            addToast('Item updated successfully!');
            setEditingItem(null);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update item.');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleSwapAction = async (swapId, status) => {
        try {
            const res = await axios.put(
                `${API_URL}/swaps/${swapId}/status`,
                { status },
                { headers: authHeaders }
            );

            // Update in receivedSwaps
            setReceivedSwaps(prev => prev.map(s => s._id === swapId ? res.data : s));
            // Update in sentSwaps if cancelled
            setSentSwaps(prev => prev.map(s => s._id === swapId ? res.data : s));

            addToast(`Swap request ${status.toLowerCase()}!`);
            // Refresh items since item status changes to Exchanged
            fetchData();
        } catch (err) {
            addToast(err.response?.data?.message || `Failed to update swap request.`);
        }
    };

    const pendingReceivedCount = receivedSwaps.filter(s => s.status === 'Pending').length;
    const pendingSentCount = sentSwaps.filter(s => s.status === 'Pending').length;
    const completedSwapsCount = receivedSwaps.filter(s => s.status === 'Accepted').length +
        sentSwaps.filter(s => s.status === 'Accepted').length;

    return (
        <div className="my-items-page container">
            <div className="page-header">
                <h1>Exchange Activity & Listings Dashboard</h1>
                <p>Manage your listings, review incoming swap proposals, and track your sent requests.</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Dashboard Overview Stats */}
            <div className="dashboard-stats-grid">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                        <Layers size={22} />
                    </div>
                    <div className="dash-stat-info">
                        <span className="dash-stat-val">{items.length}</span>
                        <span className="dash-stat-lbl">My Listings</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                        <Inbox size={22} />
                    </div>
                    <div className="dash-stat-info">
                        <span className="dash-stat-val">{pendingReceivedCount}</span>
                        <span className="dash-stat-lbl">Pending Received</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                        <Send size={22} />
                    </div>
                    <div className="dash-stat-info">
                        <span className="dash-stat-val">{pendingSentCount}</span>
                        <span className="dash-stat-lbl">Pending Sent</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                        <ArrowLeftRight size={22} />
                    </div>
                    <div className="dash-stat-info">
                        <span className="dash-stat-val">{completedSwapsCount}</span>
                        <span className="dash-stat-lbl">Completed Swaps</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="dash-tabs">
                <button
                    className={`dash-tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('listings')}
                >
                    <Layers size={18} /> My Listings <span className="tab-badge">{items.length}</span>
                </button>
                <button
                    className={`dash-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
                    onClick={() => setActiveTab('received')}
                >
                    <Inbox size={18} /> Received Requests
                    {pendingReceivedCount > 0 && <span className="tab-badge">{pendingReceivedCount} new</span>}
                </button>
                <button
                    className={`dash-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    <Send size={18} /> Sent Requests <span className="tab-badge">{sentSwaps.length}</span>
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Loading dashboard data...</div>
            ) : (
                <>
                    {/* TAB 1: LISTINGS */}
                    {activeTab === 'listings' && (
                        <>
                            <div className="items-grid">
                                {items.map(item => (
                                    <ItemCard
                                        key={item._id}
                                        item={item}
                                        isOwner={true}
                                        onDelete={handleDelete}
                                        onStatusChange={handleStatusChange}
                                        onEdit={handleOpenEdit}
                                    />
                                ))}
                            </div>
                            {items.length === 0 && (
                                <div className="empty-state">
                                    <PackageOpen size={48} className="empty-icon" />
                                    <h3>You haven't listed any items yet</h3>
                                    <p>Start sharing unused goods to encourage reuse on campus!</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* TAB 2: RECEIVED REQUESTS */}
                    {activeTab === 'received' && (
                        <div className="swaps-list">
                            {receivedSwaps.map(swap => (
                                <div key={swap._id} className="swap-card">
                                    <div className="swap-card-header">
                                        <div>
                                            <strong>From: {swap.requester?.name || 'Fellow Student'}</strong> ({swap.requester?.email})
                                            <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: '0.85rem' }}>
                                                • {new Date(swap.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className={`swap-status-badge ${swap.status.toLowerCase()}`}>
                                            {swap.status}
                                        </span>
                                    </div>

                                    <div className="swap-exchange-preview">
                                        <div className="swap-item-thumb-box">
                                            <img
                                                src={swap.itemRequested?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                                                alt={swap.itemRequested?.title}
                                                className="swap-thumb-img"
                                            />
                                            <div className="swap-item-info">
                                                <span>Your Item Requested:</span>
                                                <h4>{swap.itemRequested?.title || 'Unknown Item'}</h4>
                                            </div>
                                        </div>

                                        <ArrowLeftRight className="swap-arrow" size={24} />

                                        <div className="swap-item-thumb-box">
                                            {swap.itemOffered ? (
                                                <>
                                                    <img
                                                        src={swap.itemOffered.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                                                        alt={swap.itemOffered.title}
                                                        className="swap-thumb-img"
                                                    />
                                                    <div className="swap-item-info">
                                                        <span>Offered in Return:</span>
                                                        <h4>{swap.itemOffered.title}</h4>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="swap-item-info">
                                                    <span>Direct Request:</span>
                                                    <h4>Direct Swap / Donation (No item offered)</h4>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {swap.message && (
                                        <div className="swap-message-box">
                                            <em>"{swap.message}"</em>
                                        </div>
                                    )}

                                    {swap.status === 'Pending' && (
                                        <div className="swap-actions">
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleSwapAction(swap._id, 'Rejected')}
                                            >
                                                <XCircle size={15} style={{ marginRight: 4 }} /> Decline
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleSwapAction(swap._id, 'Accepted')}
                                            >
                                                <CheckCircle2 size={15} style={{ marginRight: 4 }} /> Accept Swap
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {receivedSwaps.length === 0 && (
                                <div className="empty-state">
                                    <Inbox size={48} className="empty-icon" />
                                    <h3>No swap proposals received yet</h3>
                                    <p>When other students propose exchanges on your listings, they will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: SENT REQUESTS */}
                    {activeTab === 'sent' && (
                        <div className="swaps-list">
                            {sentSwaps.map(swap => (
                                <div key={swap._id} className="swap-card">
                                    <div className="swap-card-header">
                                        <div>
                                            <strong>To: {swap.owner?.name || 'Item Owner'}</strong> ({swap.owner?.email})
                                            <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: '0.85rem' }}>
                                                • {new Date(swap.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className={`swap-status-badge ${swap.status.toLowerCase()}`}>
                                            {swap.status}
                                        </span>
                                    </div>

                                    <div className="swap-exchange-preview">
                                        <div className="swap-item-thumb-box">
                                            <img
                                                src={swap.itemRequested?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                                                alt={swap.itemRequested?.title}
                                                className="swap-thumb-img"
                                            />
                                            <div className="swap-item-info">
                                                <span>Item Requested:</span>
                                                <h4>{swap.itemRequested?.title || 'Unknown Item'}</h4>
                                            </div>
                                        </div>

                                        <ArrowLeftRight className="swap-arrow" size={24} />

                                        <div className="swap-item-thumb-box">
                                            {swap.itemOffered ? (
                                                <>
                                                    <img
                                                        src={swap.itemOffered.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                                                        alt={swap.itemOffered.title}
                                                        className="swap-thumb-img"
                                                    />
                                                    <div className="swap-item-info">
                                                        <span>You Offered:</span>
                                                        <h4>{swap.itemOffered.title}</h4>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="swap-item-info">
                                                    <span>Direct Request:</span>
                                                    <h4>Direct Swap / Donation (No item offered)</h4>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {swap.message && (
                                        <div className="swap-message-box">
                                            <em>"{swap.message}"</em>
                                        </div>
                                    )}

                                    {swap.status === 'Pending' && (
                                        <div className="swap-actions">
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => handleSwapAction(swap._id, 'Cancelled')}
                                            >
                                                Cancel Request
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {sentSwaps.length === 0 && (
                                <div className="empty-state">
                                    <Clock size={48} className="empty-icon" />
                                    <h3>No swap requests sent yet</h3>
                                    <p>Browse campus items and click "Request Swap" to propose an exchange!</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Edit Item Modal */}
            {editingItem && (
                <div className="modal-overlay" onClick={() => setEditingItem(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Edit3 size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Edit Listing</h3>
                            <button className="close-btn" onClick={() => setEditingItem(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSaveEdit}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-control"
                                            value={editForm.category}
                                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Condition</label>
                                        <select
                                            className="form-control"
                                            value={editForm.condition}
                                            onChange={e => setEditForm({ ...editForm, condition: e.target.value })}
                                        >
                                            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Transaction Type</label>
                                        <select
                                            className="form-control"
                                            value={editForm.transactionType}
                                            onChange={e => setEditForm({ ...editForm, transactionType: e.target.value })}
                                        >
                                            {TRANSACTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    {['Sell', 'Rent'].includes(editForm.transactionType) && (
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Price (INR)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control"
                                                value={editForm.price}
                                                onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editForm.location}
                                        onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setEditingItem(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={savingEdit}
                                    >
                                        {savingEdit ? 'Saving...' : <><Save size={15} style={{ marginRight: 4 }} /> Save Changes</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyItems;
