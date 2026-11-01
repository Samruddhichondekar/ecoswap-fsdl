import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
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
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');
    const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

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
        imageUrl: '',
        s3Key: '',
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    // AWS S3 Direct Upload Handler
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Client-side validations
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type.toLowerCase())) {
            setError('Please upload a valid image (JPG, PNG, or WEBP).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image file size must be less than 5 MB.');
            return;
        }

        setError('');
        setUploadingImage(true);
        setUploadSuccessMsg('');

        try {
            const uploadData = new FormData();
            uploadData.append('image', file);

            const res = await axios.post(`${API_URL}/items/upload`, uploadData, {
                headers: {
                    ...authHeaders,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setFormData(prev => ({
                ...prev,
                imageUrl: res.data.imageUrl,
                s3Key: res.data.s3Key || '',
            }));

            setUploadSuccessMsg('Image securely uploaded to AWS S3 cloud storage!');
            addToast('Image uploaded to AWS S3 successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload image to AWS S3.');
        } finally {
            setUploadingImage(false);
        }
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
            s3Key: formData.s3Key.trim(),
            price: formData.transactionType === 'Sell' || formData.transactionType === 'Rent' ? Number(formData.price) : 0,
            tags: formData.tagsInput ? formData.tagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(t => t) : []
        };

        if (!processedData.title || !processedData.location || !processedData.description || !processedData.contact || !processedData.imageUrl) {
            setError('Please complete all required fields and upload an item image.');
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
            addToast('Listing created successfully!');
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
                        <input
                            type="text"
                            name="title"
                            className="form-control"
                            placeholder="E.g., Engineering Drawing Drafter"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
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
                        <input
                            type="text"
                            name="tagsInput"
                            className="form-control"
                            placeholder="E.g., JEE, Study, Electronics"
                            value={formData.tagsInput}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Pickup Location</label>
                        <input
                            type="text"
                            name="location"
                            className="form-control"
                            placeholder="E.g., Main Gate, Library"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            className="form-control"
                            rows="4"
                            placeholder="Describe features, edition, condition, etc."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* AWS S3 Cloud Storage Upload Box */}
                    <div className="form-group" style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 8, border: '1px dashed var(--border-color)' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                            <UploadCloud size={20} color="var(--eco-primary)" />
                            Upload Product Image to AWS S3 Cloud Storage (STaaS)
                        </label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleFileUpload}
                            className="form-control"
                            style={{ background: 'var(--bg-primary)' }}
                        />
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>
                            Supported formats: JPG, PNG, WEBP (Max: 5 MB). Uploaded directly to Amazon S3.
                        </small>

                        {uploadingImage && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '0.75rem', color: 'var(--eco-primary)' }}>
                                <Loader2 size={16} className="auth-spinner" /> Uploading image to AWS S3...
                            </div>
                        )}

                        {uploadSuccessMsg && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.75rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
                                <CheckCircle2 size={18} /> {uploadSuccessMsg}
                            </div>
                        )}

                        {formData.imageUrl && (
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img
                                    src={formData.imageUrl}
                                    alt="Uploaded Preview"
                                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)' }}
                                />
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Image Cloud URI:</span>
                                    <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{formData.imageUrl}</code>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Contact Email</label>
                            <input
                                type="email"
                                name="contact"
                                className="form-control"
                                placeholder="your.email@student.college.edu"
                                value={formData.contact}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Or Direct Image URL (Fallback)</label>
                            <input
                                type="url"
                                name="imageUrl"
                                className="form-control"
                                placeholder="https://example.com/image.jpg"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            name="urgent"
                            id="urgent"
                            checked={formData.urgent}
                            onChange={handleChange}
                            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--danger)' }}
                        />
                        <label htmlFor="urgent" className="form-label" style={{ marginBottom: 0 }}>
                            Mark as Urgent (Leaving campus soon, urgent pickup)
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-submit" disabled={loading || uploadingImage}>
                            {loading ? 'Creating Listing...' : 'Submit Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItem;
