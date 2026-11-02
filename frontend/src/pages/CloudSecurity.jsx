import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Shield, ShieldCheck, ShieldAlert,
    Users, Activity, Lock, CheckCircle2, AlertTriangle, Cloud,
    UserCheck, Package, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import './CloudSecurity.css';

import { API_URL } from '../utils/config';

const CloudSecurity = () => {
    const { authHeaders, user } = useAuth();
    const { addToast } = useContext(ToastContext);

    const [stats, setStats] = useState(null);
    const [policy, setPolicy] = useState(null);
    const [logs, setLogs] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [itemSearch, setItemSearch] = useState('');
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingRoleId, setUpdatingRoleId] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const requests = [
                    axios.get(`${API_URL}/security/stats`, { headers: authHeaders }),
                    axios.get(`${API_URL}/security/iam-policy`, { headers: authHeaders }),
                    axios.get(`${API_URL}/security/logs?limit=50`, { headers: authHeaders }),
                ];

                if (user?.role === 'admin') {
                    requests.push(axios.get(`${API_URL}/security/users`, { headers: authHeaders }));
                    requests.push(axios.get(`${API_URL}/items`));
                }

                const results = await Promise.all(requests);
                setStats(results[0].data);
                setPolicy(results[1].data);
                setLogs(results[2].data);
                if (user?.role === 'admin') {
                    if (results[3]) setAllUsers(results[3].data);
                    if (results[4]) setAllItems(results[4].data);
                }
            } catch (err) {
                console.error('Failed to load security data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [authHeaders, user?.role]);

    const handleRoleChange = async (targetUserId, newRole) => {
        setUpdatingRoleId(targetUserId);
        try {
            const res = await axios.put(
                `${API_URL}/security/users/${targetUserId}/role`,
                { role: newRole },
                { headers: authHeaders }
            );
            setAllUsers(prev => prev.map(u => u._id === targetUserId ? res.data.user : u));
            addToast(`Updated user role to ${newRole.toUpperCase()}!`);
            // Refresh logs and stats
            const [logsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/security/logs?limit=50`, { headers: authHeaders }),
                axios.get(`${API_URL}/security/stats`, { headers: authHeaders }),
            ]);
            setLogs(logsRes.data);
            setStats(statsRes.data);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update user role.');
        } finally {
            setUpdatingRoleId(null);
        }
    };

    const handleAdminDeleteItem = async (itemId, itemTitle) => {
        if (!window.confirm(`[Admin Action] Permanently remove "${itemTitle}" from campus?\nThis purges all associated cloud assets from AWS S3 and MongoDB Atlas.`)) {
            return;
        }
        setDeletingItemId(itemId);
        try {
            await axios.delete(`${API_URL}/items/${itemId}`, { headers: authHeaders });
            setAllItems(prev => prev.filter(i => i._id !== itemId));
            addToast(`[Admin] Successfully removed "${itemTitle}".`);
            // Refresh audit logs and stats to reflect ADMIN_ITEM_DELETED
            const [logsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/security/logs?limit=50`, { headers: authHeaders }),
                axios.get(`${API_URL}/security/stats`, { headers: authHeaders }),
            ]);
            setLogs(logsRes.data);
            setStats(statsRes.data);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to delete listing.');
        } finally {
            setDeletingItemId(null);
        }
    };

    const handleAdminToggleItemStatus = async (itemId, currentStatus) => {
        const nextStatus = currentStatus === 'Available' ? 'Exchanged' : 'Available';
        try {
            const res = await axios.put(
                `${API_URL}/items/${itemId}`,
                { status: nextStatus },
                { headers: authHeaders }
            );
            setAllItems(prev => prev.map(i => i._id === itemId ? res.data : i));
            addToast(`Item status changed to "${nextStatus}".`);
            const [logsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/security/logs?limit=50`, { headers: authHeaders }),
                axios.get(`${API_URL}/security/stats`, { headers: authHeaders }),
            ]);
            setLogs(logsRes.data);
            setStats(statsRes.data);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update item status.');
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="security-page container">
                <div className="loading-state">Loading Cloud Security Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="security-page container">
            <div className="page-header">
                <h1><Shield size={28} /> Cloud Security & Governance Dashboard</h1>
                <p>Monitor security events, manage IAM access roles, and moderate campus listings.</p>
            </div>

            {/* Cloud Concepts Bar */}
            {policy && (
                <div className="cloud-concepts-bar">
                    {policy.cloudConcepts.map(c => (
                        <span key={c} className="cloud-concept-tag">
                            <Cloud size={13} />
                            {c}
                        </span>
                    ))}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="security-stats-grid">
                    <div className="sec-stat-card">
                        <div className="stat-icon" style={{ background: '#dbeafe' }}>
                            <Activity size={20} color="#2563eb" />
                        </div>
                        <span className="stat-value">{stats.totalLogs}</span>
                        <span className="stat-label">Audit Events</span>
                    </div>
                    <div className="sec-stat-card">
                        <div className="stat-icon" style={{ background: '#dcfce7' }}>
                            <CheckCircle2 size={20} color="#16a34a" />
                        </div>
                        <span className="stat-value">{stats.loginSuccesses}</span>
                        <span className="stat-label">Successful Logins</span>
                    </div>
                    <div className="sec-stat-card">
                        <div className="stat-icon" style={{ background: '#fee2e2' }}>
                            <AlertTriangle size={20} color="#dc2626" />
                        </div>
                        <span className="stat-value">{stats.loginFailures}</span>
                        <span className="stat-label">Failed Logins</span>
                    </div>
                    <div className="sec-stat-card">
                        <div className="stat-icon" style={{ background: '#fef3c7' }}>
                            <ShieldCheck size={20} color="#d97706" />
                        </div>
                        <span className="stat-value">{stats.adminActions ?? 0}</span>
                        <span className="stat-label">Admin Actions</span>
                    </div>
                    <div className="sec-stat-card">
                        <div className="stat-icon" style={{ background: '#ede9fe' }}>
                            <Users size={20} color="#7c3aed" />
                        </div>
                        <span className="stat-value">{stats.totalUsers}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <div className="sec-stat-card">
                        <div className="stat-icon" style={{ background: '#e0f2fe' }}>
                            <Package size={20} color="#0284c7" />
                        </div>
                        <span className="stat-value">{stats.totalItems ?? allItems.length}</span>
                        <span className="stat-label">Campus Listings</span>
                    </div>
                </div>
            )}

            {/* IAM Roles & Permissions Matrix */}
            {policy && (
                <div className="sec-section">
                    <div className="sec-section-header">
                        <h2><ShieldCheck size={22} /> IAM Role-Permission Matrix</h2>
                        <span className={`role-badge ${user?.role}`}>{user?.role?.toUpperCase()} (You)</span>
                    </div>
                    <div className="iam-roles-grid">
                        {policy.roles.map(r => (
                            <div
                                key={r.role}
                                className={`iam-role-card ${r.role === user?.role ? 'active' : ''}`}
                                style={r.role === user?.role ? { borderColor: 'var(--eco-primary, #16a34a)', borderWidth: 2 } : {}}
                            >
                                <div className="role-title">
                                    <span className={`role-badge ${r.role}`}>{r.role}</span>
                                    {r.role === user?.role && <CheckCircle2 size={16} color="var(--eco-primary, #16a34a)" />}
                                </div>
                                <p className="role-desc">{r.description}</p>
                                <ul className="perm-list">
                                    {r.permissions.map(p => (
                                        <li key={p}>
                                            <Lock size={11} />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin-Only User Management Section */}
            {user?.role === 'admin' && (
                <div className="sec-section">
                    <div className="sec-section-header">
                        <h2><UserCheck size={22} /> IAM User Administration (Cloud Admin Only)</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--eco-primary)', fontWeight: 600 }}>
                            {allUsers.length} Active Accounts
                        </span>
                    </div>
                    <div className="audit-table-wrap">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Joined</th>
                                    <th>Assigned Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(u => (
                                    <tr key={u._id}>
                                        <td><strong>{u.name}</strong> {u._id === user?._id && <span style={{ fontSize: '0.75rem', color: 'var(--eco-primary)' }}>(You)</span>}</td>
                                        <td>{u.email}</td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`role-badge ${u.role}`}>
                                                {u.role?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                className="form-control"
                                                style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto' }}
                                                value={u.role}
                                                disabled={updatingRoleId === u._id}
                                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                                <option value="auditor">Auditor</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Admin-Only Campus Listings Moderation Section */}
            {user?.role === 'admin' && (
                <div className="sec-section">
                    <div className="sec-section-header">
                        <h2><Package size={22} /> Campus Listings Moderation (Cloud Admin Only)</h2>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filter items by title/category..."
                                value={itemSearch}
                                onChange={e => setItemSearch(e.target.value)}
                                style={{ padding: '5px 12px', fontSize: '0.85rem', width: '220px' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: 'var(--eco-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {allItems.length} Total Listings
                            </span>
                        </div>
                    </div>
                    <div className="audit-table-wrap">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>Listing Item</th>
                                    <th>Category</th>
                                    <th>Owner / Contact</th>
                                    <th>Transaction</th>
                                    <th>Status</th>
                                    <th>Administrative Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allItems
                                    .filter(item => {
                                        const query = itemSearch.toLowerCase();
                                        return (
                                            item.title?.toLowerCase().includes(query) ||
                                            item.category?.toLowerCase().includes(query) ||
                                            item.contact?.toLowerCase().includes(query)
                                        );
                                    })
                                    .map(item => (
                                        <tr key={item._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <img
                                                        src={item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'}
                                                        alt={item.title}
                                                        style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <strong>{item.title}</strong>
                                                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                                            {item.condition} • {new Date(item.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.category}</td>
                                            <td>
                                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                    {item.contact || item.postedBy?.email || 'Campus Student'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                    {item.transactionType} {item.price > 0 && `(₹${item.price})`}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${item.status === 'Available' ? 'badge-available' : 'badge-exchanged'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => handleAdminToggleItemStatus(item._id, item.status)}
                                                        style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                                                        title="Force status toggle"
                                                    >
                                                        Toggle
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleAdminDeleteItem(item._id, item.title)}
                                                        disabled={deletingItemId === item._id}
                                                        style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                                                        title="Permanently delete listing as Cloud Admin"
                                                    >
                                                        <Trash2 size={12} style={{ marginRight: 3 }} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Audit Trail */}
            <div className="sec-section">
                <div className="sec-section-header">
                    <h2><Activity size={22} /> Security Audit Trail</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {user?.role === 'user' ? 'Showing your events' : 'Showing all events'}
                    </span>
                </div>
                {logs.length === 0 ? (
                    <div className="empty-logs">
                        <ShieldAlert size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p>No security events recorded yet. Login, register, or generate an API key to see audit entries.</p>
                    </div>
                ) : (
                    <div className="audit-table-wrap">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Event</th>
                                    <th>Status</th>
                                    <th>Email</th>
                                    <th>Details</th>
                                    <th>IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log._id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                                        <td><code style={{ fontSize: '0.78rem' }}>{log.eventType}</code></td>
                                        <td>
                                            <span className={`event-badge ${log.status?.toLowerCase()}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td>{log.userEmail || '—'}</td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '—'}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{log.ipAddress || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CloudSecurity;
