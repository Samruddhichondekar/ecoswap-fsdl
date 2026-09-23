import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContext } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../utils/config';
import './AddItem.css';

const CATEGORIES = ['Books', 'Electronics', 'Stationery', 'Furniture', 'Daily Use', 'Others'];
const CONDITIONS = ['Like New', 'Excellent', 'Good', 'Fair'];
const TRANSACTIONS = ['Donate', 'Sell', 'Barter', 'Rent'];

const AddItem = () => {
    const navigate = useNavigate();
    const { addToast } = useContext(ToastContext);
    const { user, authHeaders } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        category: 'Books',
        condition: 'Good',
        transactionType: 'Donate',
        price: 0,
        urgent: false,
        tagsInput: '',
        location: '',
        description: '',
        contact: user?.email || '',
        imageUrl: ''
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const processedData = {
            ...formData,
            title: formData.title.trim(),
            location: formData.location.trim(),
            description: formData.description.trim(),
            contact: formData.contact.trim().toLowerCase(),
            imageUrl: formData.imageUrl.trim(),
            price: formData.transactionType === 'Sell' || formData.transactionType === 'Rent' ? Number(formData.price) : 0,
            tags: formData.tagsInput ? formData.tagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(t => t) : []
        };

        if (!processedData.title || !processedData.location || !processedData.description || !processedData.contact || !processedData.imageUrl) {
            setError('Please complete all required fields before submitting.');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(processedData.contact)) {
            setError('Please enter a valid contact email.');
            return;
        }

        if ((processedData.transactionType === 'Sell' || processedData.transactionType === 'Rent') && processedData.price <= 0) {
            setError('Please enter a valid price for sell or rent listings.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/items`, processedData, {
                headers: authHeaders
            });
            addToast('Item added successfully!');
            navigate('/my-items');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while adding the item.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-item-page container">
            <div className="form-wrapper">
                <div className="form-header">
                    <h1>Add a New Item</h1>
                    <p>Share, sell or rent something you no longer need and help build a sustainable campus.</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit} className="add-item-form">
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input type="text" name="title" className="form-control" placeholder="E.g., Engineering Drawing Drafter" value={formData.title} onChange={handleChange} required />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Category</label>
                            <select name="category" className="form-control" value={formData.category} onChange={handleChange}>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Condition</label>
                            <select name="condition" className="form-control" value={formData.condition} onChange={handleChange}>
                                {CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Transaction Type</label>
                            <select name="transactionType" className="form-control" value={formData.transactionType} onChange={handleChange}>
                                {TRANSACTIONS.map(tr => <option key={tr} value={tr}>{tr}</option>)}
                            </select>
                        </div>

                        {(formData.transactionType === 'Sell' || formData.transactionType === 'Rent') && (
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Price (INR)</label>
                                <input type="number" name="price" className="form-control" min="0" value={formData.price} onChange={handleChange} required />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags (comma separated)</label>
                        <input type="text" name="tagsInput" className="form-control" placeholder="E.g., JEE, Study, Electronics" value={formData.tagsInput} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Pickup Location</label>
                        <input type="text" name="location" className="form-control" placeholder="E.g., Main Gate, Library" value={formData.location} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea name="description" className="form-control" rows="4" placeholder="Describe features, edition, etc." value={formData.description} onChange={handleChange} required></textarea>
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Contact Email</label>
                            <input type="email" name="contact" className="form-control" placeholder="your.email@student.college.edu" value={formData.contact} onChange={handleChange} required />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Image URL</label>
                            <input type="url" name="imageUrl" className="form-control" placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" name="urgent" id="urgent" checked={formData.urgent} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--danger)' }} />
                        <label htmlFor="urgent" className="form-label" style={{ marginBottom: 0 }}>Mark as Urgent (Need to leave campus fast etc)</label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
                            {loading ? 'Adding Item...' : 'Submit Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItem;
