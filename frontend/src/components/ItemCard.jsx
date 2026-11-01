import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Book, Cpu, Coffee, Package, MapPin, Tag, X, Mail, Share2,
    Eye, AlertCircle, Coins, HeartHandshake, ArrowLeftRight, Edit3, Send
} from 'lucide-react';
import { ToastContext } from '../App';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../utils/config';
import './ItemCard.css';

const getCategoryIcon = (category) => {
    switch (category) {
        case 'Books': return <Book size={16} />;
        case 'Electronics': return <Cpu size={16} />;
        case 'Daily Use': return <Coffee size={16} />;
        default: return <Package size={16} />;
    }
};

const getTransactionIcon = (type) => {
    switch (type) {
        case 'Donate': return <HeartHandshake size={14} />;
        case 'Sell': return <Coins size={14} />;
        default: return <Tag size={14} />;
    }
};

const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Added recently';
    if (days === 0) return 'Added today';
    if (days === 1) return 'Added 1 day ago';
    return `${days} days ago`;
};

const ItemCard = ({ item, isOwner = false, onDelete, onStatusChange, onEdit }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, authHeaders } = useAuth();
    const { addToast } = useContext(ToastContext);

    const [showContactModal, setShowContactModal] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [views, setViews] = useState(item.views || 0);

    // Swap request form state
    const [myItems, setMyItems] = useState([]);
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [swapMessage, setSwapMessage] = useState(`Hi! I'm interested in swapping for your "${item.title}".`);
    const [submittingSwap, setSubmittingSwap] = useState(false);
    const [swapError, setSwapError] = useState('');

    const handleContactClick = async () => {
        setShowContactModal(true);
        try {
            const res = await axios.post(`${API_URL}/items/${item._id}/views`);
            setViews(res.data.views);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenSwapModal = async () => {
        if (!isAuthenticated) {
            addToast('Please log in to propose a swap.');
            navigate('/login');
            return;
        }

        setShowSwapModal(true);
        setSwapError('');
        try {
            const res = await axios.get(`${API_URL}/items`, {
                params: { userId: user?._id },
                headers: authHeaders,
            });
            // Only offer items that are available and not this item
            const availableItems = (res.data || []).filter(
                i => i._id !== item._id && i.status === 'Available'
            );
            setMyItems(availableItems);
        } catch (err) {
            console.error('Failed to load user items for swap offer:', err);
        }
    };

    const handleSendSwapRequest = async (e) => {
        e.preventDefault();
        setSubmittingSwap(true);
        setSwapError('');
        try {
            await axios.post(
                `${API_URL}/swaps`,
                {
                    itemId: item._id,
                    itemOfferedId: selectedOfferId || null,
                    message: swapMessage.trim(),
                },
                { headers: authHeaders }
            );
            addToast('Swap request sent successfully! Owner notified.');
            setShowSwapModal(false);
        } catch (err) {
            setSwapError(err.response?.data?.message || 'Failed to send swap request.');
        } finally {
            setSubmittingSwap(false);
        }
    };

    const handleShare = () => {
        const shareText = `${item.title} on EcoSwap - ${window.location.origin}/browse`;
        navigator.clipboard.writeText(shareText);
        addToast('Listing link copied to clipboard!');
    };

    const isAvailable = item.status === 'Available';

    return (
        <>
            <div className="card item-card">
                <div className="item-img-container">
                    <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'}
                        alt={item.title}
                        className="item-img"
                        loading="lazy"
                        onError={(event) => {
                            event.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
                        }}
                    />

                    <div className="badges-container top-left">
                        <div className="status-badge transaction-badge">
                            {getTransactionIcon(item.transactionType)}
                            <span style={{ marginLeft: '4px' }}>{item.transactionType}</span>
                            {['Sell', 'Rent'].includes(item.transactionType) && ` (INR ${item.price})`}
                        </div>
                    </div>

                    <div className="badges-container top-right">
                        <div className={`status-badge ${isAvailable ? 'badge-available' : 'badge-exchanged'}`}>
                            {item.status}
                        </div>
                        {item.urgent && <div className="status-badge urgent-badge"><AlertCircle size={12} /> Urgent</div>}
                    </div>
                </div>

                <div className="item-content">
                    <div className="item-header-meta">
                        <div className="item-category">
                            {getCategoryIcon(item.category)}
                            <span>{item.category}</span>
                        </div>
                        <div className="meta-right-group">
                            <span className="view-count" title="Views"><Eye size={13} /> {views}</span>
                            <span className="item-time">{getRelativeTime(item.createdAt)}</span>
                        </div>
                    </div>

                    <h3 className="item-title">{item.title}</h3>

                    <div className="item-meta-badges">
                        <span className="meta-badge"><Tag size={13} /> {item.condition || 'Good'}</span>
                        <span className="meta-badge"><MapPin size={13} /> {item.location || 'Campus'}</span>
                    </div>

                    <p className="item-desc">{item.description}</p>

                    {item.tags && item.tags.length > 0 && (
                        <div className="item-tags">
                            {item.tags.map(tag => <span key={tag} className="tag-pill">#{tag}</span>)}
                        </div>
                    )}

                    {isOwner ? (
                        <div className="owner-actions">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(item)}
                                    className="btn btn-outline btn-sm"
                                    title="Edit Listing"
                                >
                                    <Edit3 size={14} style={{ marginRight: 4 }} /> Edit
                                </button>
                            )}
                            {isAvailable ? (
                                <button
                                    onClick={() => onStatusChange(item._id, 'Exchanged')}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Mark Exchanged
                                </button>
                            ) : (
                                <button
                                    onClick={() => onStatusChange(item._id, 'Available')}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Mark Available
                                </button>
                            )}
                            <button onClick={() => onDelete(item._id)} className="btn btn-danger btn-sm">Delete</button>
                        </div>
                    ) : (
                        <div className="item-footer">
                            <button onClick={handleShare} className="btn-icon" aria-label="Share" title="Share">
                                <Share2 size={18} />
                            </button>
                            <button onClick={handleContactClick} className="btn btn-outline" style={{ flex: 1 }}>
                                Contact
                            </button>
                            {isAvailable ? (
                                <button onClick={handleOpenSwapModal} className="btn btn-primary" style={{ flex: 1.2 }}>
                                    <ArrowLeftRight size={15} style={{ marginRight: 4 }} /> Request Swap
                                </button>
                            ) : (
                                <button disabled className="btn btn-secondary" style={{ flex: 1.2, opacity: 0.6, cursor: 'not-allowed' }}>
                                    Exchanged
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Details Modal */}
            {showContactModal && (
                <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Contact Details</h3>
                            <button className="close-btn" onClick={() => setShowContactModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-intro">Reach out to the owner to arrange a pickup for <strong>{item.title}</strong>.</p>

                            <div className="contact-info-box">
                                <Mail className="contact-icon" size={24} />
                                <div className="contact-details">
                                    <span className="contact-label">Owner's Email</span>
                                    <a href={`mailto:${item.contact}`} className="contact-email">{item.contact}</a>
                                </div>
                            </div>

                            <div className="location-info-box">
                                <MapPin className="contact-icon" size={24} />
                                <div className="contact-details">
                                    <span className="contact-label">Item Location</span>
                                    <span className="contact-location">{item.location || 'Campus'}</span>
                                </div>
                            </div>

                            <a href={`mailto:${item.contact}?subject=Interested in ${item.title}`} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                Open Default Email App
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Swap Request Modal */}
            {showSwapModal && (
                <div className="modal-overlay" onClick={() => setShowSwapModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><ArrowLeftRight size={20} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Propose an EcoSwap</h3>
                            <button className="close-btn" onClick={() => setShowSwapModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-intro">
                                Send a swap proposal for <strong>{item.title}</strong> ({item.category} • {item.condition}).
                            </p>

                            {swapError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{swapError}</div>}

                            <form onSubmit={handleSendSwapRequest}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label" style={{ fontWeight: 600 }}>Offer an item from your listings (Optional):</label>
                                    <select
                                        className="form-control"
                                        value={selectedOfferId}
                                        onChange={(e) => setSelectedOfferId(e.target.value)}
                                    >
                                        <option value="">None (Request direct exchange / donation)</option>
                                        {myItems.map(myItem => (
                                            <option key={myItem._id} value={myItem._id}>
                                                {myItem.title} ({myItem.category} - {myItem.condition})
                                            </option>
                                        ))}
                                    </select>
                                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>
                                        Offering an item increases your chance of an accepted barter!
                                    </small>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label className="form-label" style={{ fontWeight: 600 }}>Note to owner:</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={swapMessage}
                                        onChange={(e) => setSwapMessage(e.target.value)}
                                        placeholder="Add a polite pickup note or item description..."
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowSwapModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submittingSwap}
                                    >
                                        {submittingSwap ? 'Sending...' : <><Send size={15} style={{ marginRight: 4 }} /> Submit Swap Request</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ItemCard;
