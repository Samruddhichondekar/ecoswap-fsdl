import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackageOpen } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../utils/config';
import './MyItems.css';

const MyItems = () => {
    const { user, authHeaders } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get(`${API_URL}/items`, {
                    params: { userId: user?._id },
                    headers: authHeaders
                });
                setItems(res.data);
            } catch (err) {
                console.error('Error fetching items:', err);
                setError(err.response?.data?.message || 'Could not load your items.');
            } finally {
                setLoading(false);
            }
        };
        if (user?._id) fetchItems();
    }, [authHeaders, user?._id]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await axios.delete(`${API_URL}/items/${id}`, {
                    headers: authHeaders
                });
                setItems(items.filter(item => item._id !== id));
            } catch (err) {
                console.error('Error deleting item', err);
                setError(err.response?.data?.message || 'Could not delete this item.');
            }
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await axios.put(`${API_URL}/items/${id}`, { status: newStatus }, {
                headers: authHeaders
            });
            setItems(items.map(item => item._id === id ? res.data : item));
        } catch (err) {
            console.error('Error updating status', err);
            setError(err.response?.data?.message || 'Could not update item status.');
        }
    };

    return (
        <div className="my-items-page container">
            <div className="page-header">
                <h1>My Items</h1>
                <p>Manage the items you've shared with the community.</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="loading-state">Loading your items...</div>
            ) : (
                <>
                    <div className="items-grid">
                        {items.map(item => (
                            <ItemCard
                                key={item._id}
                                item={item}
                                isOwner={true}
                                onDelete={handleDelete}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                    {items.length === 0 && (
                        <div className="empty-state">
                            <PackageOpen size={48} className="empty-icon" />
                            <h3>You haven't added any items yet</h3>
                            <p>Start sharing and help build a greener campus!</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyItems;
