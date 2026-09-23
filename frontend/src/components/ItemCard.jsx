import React, { useState, useContext } from 'react';
import { Book, Cpu, Coffee, Package, MapPin, Tag, X, Mail, Share2, Eye, AlertCircle, Coins, HeartHandshake } from 'lucide-react';
import { ToastContext } from '../App';
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

const ItemCard = ({ item, isOwner = false, onDelete, onStatusChange }) => {
    const [showModal, setShowModal] = useState(false);
    const [views, setViews] = useState(item.views || 0);
    const { addToast } = useContext(ToastContext);

    const handleContactClick = async () => {
        setShowModal(true);
        try {
            const res = await axios.post(`${API_URL}/items/${item._id}/views`);
            setViews(res.data.views);
        } catch (err) { console.error(err); }
    };

    const closeModal = () => setShowModal(false);

    const handleShare = () => {
        const shareText = `${item.title} on EcoSwap - ${window.location.origin}/browse`;
        navigator.clipboard.writeText(shareText);
        addToast('Listing link copied to clipboard!');
    };

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
                        <div className={`status-badge ${item.status === 'Available' ? 'badge-available' : 'badge-exchanged'}`}>
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
                            {item.status === 'Available' && (
                                <button
                                    onClick={() => onStatusChange(item._id, 'Exchanged')}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Mark Exchanged
                                </button>
                            )}
                            {item.status === 'Exchanged' && (
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
                            <button onClick={handleShare} className="btn-icon" aria-label="Share" title="Share"><Share2 size={18} /></button>
                            <button onClick={handleContactClick} className="btn btn-primary" style={{ flex: 1 }}>Contact Owner</button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Contact Details</h3>
                            <button className="close-btn" onClick={closeModal}><X size={20} /></button>
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
        </>
    );
};

export default ItemCard;
