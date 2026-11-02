import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Book, Cpu, Coffee, Package, MapPin, Tag, X, Mail, Share2,
    Eye, AlertCircle, Coins, HeartHandshake, ArrowLeftRight, Edit3, Send, Heart,
    Trash2, ShieldAlert, ShieldCheck, CheckCircle2, Clock
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

const ItemCard = ({ item, isOwner = false, onDelete, onStatusChange, onEdit, isWishlisted, onWishlistToggle }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, authHeaders, updateWishlist } = useAuth();
    const { addToast } = useContext(ToastContext);

    const [showContactModal, setShowContactModal] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [views, setViews] = useState(item.views || 0);

    // Administrative & status state
    const [isDeleted, setIsDeleted] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(item.status);
    const actualIsOwner = isOwner || (user && item.postedBy && (item.postedBy._id || item.postedBy).toString() === user._id);
    const isAdmin = user?.role === 'admin';

    // Wishlist state
    const [isSaved, setIsSaved] = useState(() => {
        if (typeof isWishlisted === 'boolean') return isWishlisted;
        if (user?.wishlist && Array.isArray(user.wishlist)) {
            return user.wishlist.some(id => (typeof id === 'string' ? id : id?._id || id) === item._id);
        }
        return false;
    });
    const [togglingWishlist, setTogglingWishlist] = useState(false);

    useEffect(() => {
        if (typeof isWishlisted === 'boolean') {
            setIsSaved(isWishlisted);
        } else if (user?.wishlist && Array.isArray(user.wishlist)) {
            setIsSaved(user.wishlist.some(id => (typeof id === 'string' ? id : id?._id || id) === item._id));
        }
    }, [isWishlisted, user?.wishlist, item._id]);

    const handleToggleWishlist = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            addToast('Please log in to save items to your wishlist.');
            navigate('/login');
            return;
        }
        if (togglingWishlist) return;
        setTogglingWishlist(true);
        try {
            const res = await axios.post(`${API_URL}/items/${item._id}/wishlist`, {}, { headers: authHeaders });
            const nextSaved = res.data.saved;
            setIsSaved(nextSaved);
            if (updateWishlist && res.data.wishlist) {
                updateWishlist(res.data.wishlist);
            }
            if (onWishlistToggle) {
                onWishlistToggle(item._id, nextSaved);
            }
            addToast(res.data.message || (nextSaved ? 'Added to Wishlist!' : 'Removed from Wishlist.'));
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update wishlist.');
        } finally {
            setTogglingWishlist(false);
        }
    };

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

    const handleAdminDelete = async (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const ok = window.confirm(
            `[Cloud Admin Action]\n\nAre you sure you want to delete "${item.title}"?\nThis will remove the listing campus-wide and purge its cloud assets from AWS S3 and MongoDB Atlas.`
        );
        if (!ok) return;

        try {
            await axios.delete(`${API_URL}/items/${item._id}`, { headers: authHeaders });
            addToast(`[Admin Action] Listing "${item.title}" deleted.`);
            setIsDeleted(true);
            if (onDelete) onDelete(item._id);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to delete listing.');
        }
    };

    const handleAdminToggleStatus = async (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const nextStatus = currentStatus === 'Available' ? 'Exchanged' : 'Available';
        try {
            await axios.put(
                `${API_URL}/items/${item._id}`,
                { status: nextStatus },
                { headers: authHeaders }
            );
            setCurrentStatus(nextStatus);
            addToast(`[Admin Action] Status changed to "${nextStatus}".`);
            if (onStatusChange) onStatusChange(item._id, nextStatus);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update item status.');
        }
    };

    const handleAdminAcceptItem = async () => {
        try {
            await axios.put(
                `${API_URL}/items/${item._id}`,
                { status: 'Available' },
                { headers: authHeaders }
            );
            setCurrentStatus('Available');
            if (onStatusChange) onStatusChange(item._id, 'Available');
            addToast(`[Admin] Successfully accepted "${item.title}" for campus exchange!`);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to accept item.');
        }
    };

    if (isDeleted) return null;

    const isAvailable = currentStatus === 'Available';
    const isPendingApproval = currentStatus === 'Pending Approval';

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
                        <div className={`status-badge ${isAvailable ? 'badge-available' : (isPendingApproval ? 'badge-pending' : 'badge-exchanged')}`}>
                            {isPendingApproval ? 'Pending Approval' : currentStatus}
                        </div>
                        {item.urgent && <div className="status-badge urgent-badge"><AlertCircle size={12} /> Urgent</div>}
                        {isAdmin && !actualIsOwner && (
                            <div className="status-badge admin-badge-tag" title="Cloud Admin Moderation Active">
                                <ShieldCheck size={11} /> Admin Active
                            </div>
                        )}
                    </div>

                    {!actualIsOwner && (
                        <button
                            type="button"
                            className={`wishlist-heart-btn ${isSaved ? 'active' : ''}`}
                            onClick={handleToggleWishlist}
                            title={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
                            aria-label="Wishlist"
                            disabled={togglingWishlist}
                        >
                            <Heart size={18} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : 'currentColor'} />
                        </button>
                    )}
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

                    {actualIsOwner ? (
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
                                    onClick={() => {
                                        setCurrentStatus('Exchanged');
                                        if (onStatusChange) onStatusChange(item._id, 'Exchanged');
                                    }}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Mark Exchanged
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setCurrentStatus('Available');
                                        if (onStatusChange) onStatusChange(item._id, 'Available');
                                    }}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Mark Available
                                </button>
                            )}
                            <button onClick={() => onDelete ? onDelete(item._id) : handleAdminDelete()} className="btn btn-danger btn-sm">Delete</button>
                        </div>
                    ) : (
                        <>
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
                                ) : isPendingApproval ? (
                                    <button disabled className="btn btn-secondary" style={{ flex: 1.2, opacity: 0.75, cursor: 'not-allowed', background: '#d97706', color: '#fff', border: 'none' }} title="This item is awaiting Admin approval before students can exchange it.">
                                        <Clock size={14} style={{ marginRight: 4 }} /> Awaiting Admin
                                    </button>
                                ) : (
                                    <button disabled className="btn btn-secondary" style={{ flex: 1.2, opacity: 0.6, cursor: 'not-allowed' }}>
                                        Exchanged
                                    </button>
                                )}
                            </div>

                            {/* Cloud Admin Moderation Strip */}
                            {isAdmin && (
                                <div className="admin-moderation-strip">
                                    <div className="admin-strip-label">
                                        <ShieldAlert size={12} />
                                        <span>Cloud Admin Moderation</span>
                                    </div>
                                    <div className="admin-strip-btns">
                                        {isPendingApproval ? (
                                            <button
                                                type="button"
                                                className="btn btn-success btn-sm admin-btn"
                                                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: 'white', fontWeight: 600 }}
                                                onClick={handleAdminAcceptItem}
                                                title="Accept and approve this listing for campus exchange"
                                            >
                                                <CheckCircle2 size={13} style={{ marginRight: 3 }} /> Accept Item (Admin)
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm admin-btn"
                                                onClick={handleAdminToggleStatus}
                                                title="Override listing status as Admin"
                                            >
                                                {isAvailable ? 'Mark Exchanged' : 'Mark Available'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm admin-btn"
                                            onClick={handleAdminDelete}
                                            title="Permanently remove listing from campus as Admin"
                                        >
                                            <Trash2 size={13} style={{ marginRight: 3 }} /> Remove (Admin)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
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
