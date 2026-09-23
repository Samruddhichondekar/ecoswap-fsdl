import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { API_URL } from '../utils/config';
import './BrowseItems.css';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Stationery', 'Furniture', 'Daily Use', 'Others'];

const BrowseItems = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [layout, setLayout] = useState('grid');

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get(`${API_URL}/items`);
                setItems(res.data);
            } catch (err) {
                console.error('Error fetching items:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const filteredAndSortedItems = items
        .filter(item => {
            const matchText = (item.title + ' ' + item.description + ' ' + (item.tags || []).join(' ')).toLowerCase();
            const matchesSearch = matchText.includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

    return (
        <div className="browse-page container">
            <div className="page-header">
                <h1>Browse Items</h1>
                <p>Find what you need or get inspired to reuse.</p>
            </div>

            <div className="filters-section">
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search for items, brands, courses, or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-controls-group">
                    <div className="category-filter">
                        <Filter className="filter-icon" size={20} />
                        <select
                            className="form-control"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <select
                        className="form-control sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">Sort by: Newest</option>
                        <option value="views">Sort by: Most Viewed</option>
                    </select>

                    <div className="layout-toggles">
                        <button className={`btn-icon ${layout === 'grid' ? 'active' : ''}`} onClick={() => setLayout('grid')}>
                            <LayoutGrid size={20} />
                        </button>
                        <button className={`btn-icon ${layout === 'list' ? 'active' : ''}`} onClick={() => setLayout('list')}>
                            <List size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading items...</div>
            ) : (
                <>
                    <div className={`items-container ${layout}`}>
                        {filteredAndSortedItems.map(item => (
                            <ItemCard key={item._id} item={item} />
                        ))}
                    </div>
                    {filteredAndSortedItems.length === 0 && (
                        <div className="empty-state">
                            <h3>No items found</h3>
                            <p>Try adjusting your search or filter criteria.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BrowseItems;
