import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Shield, ShieldCheck, ShieldAlert, Key, Copy, RefreshCw,
    Users, Activity, Lock, CheckCircle2, AlertTriangle, Cloud, Server, Database, UserCheck
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
    const [apiKey, setApiKey] = useState('');
    const [loadingKey, setLoadingKey] = useState(false);
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
                }

                const results = await Promise.all(requests);
                setStats(results[0].data);
                setPolicy(results[1].data);
                setLogs(results[2].data);
                if (user?.role === 'admin' && results[3]) {
                    setAllUsers(results[3].data);
                }
            } catch (err) {
                console.error('Failed to load security data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [authHeaders, user?.role]);

    const handleGenerateKey = async () => {
        setLoadingKey(true);
        try {
            const res = await axios.post(`${API_URL}/security/api-key`, {}, { headers: authHeaders });
            setApiKey(res.data.apiKey);
            addToast('New API key generated successfully!');
            // Refresh logs
            const logsRes = await axios.get(`${API_URL}/security/logs?limit=50`, { headers: authHeaders });
            setLogs(logsRes.data);
        } catch {
            addToast('Failed to generate API key.');
        } finally {
            setLoadingKey(false);
        }
    };

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

    const copyKey = () => {
        navigator.clipboard.writeText(apiKey);
        addToast('API key copied to clipboard!');
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
                <h1><Shield size={28} /> Cloud Security & IAM Dashboard</h1>
                <p>Monitor authentication events, manage IAM roles, and generate SaaS API keys.</p>
            </div>

            {/* Cloud Concepts Bar */}
            {policy && (
                <div className="cloud-concepts-bar">
                    {policy.cloudConcepts.map(c => (
                        <span key={c} className="cloud-concept-tag">
                            {c === 'IAM' && <ShieldCheck size={13} />}
                            {c === 'SaaS' && <Cloud size={13} />}
                            {c === 'PaaS' && <Server size={13} />}
                            {c === 'Audit Trail' && <Activity size={13} />}
                            {c === 'API Key Auth' && <Key size={13} />}
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
                            <Key size={20} color="#d97706" />
                        </div>
                        <span className="stat-value">{stats.apiKeyEvents}</span>
                        <span className="stat-label">API Key Events</span>
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
                            <Database size={20} color="#0284c7" />
                        </div>
                        <span className="stat-value">90d</span>
                        <span className="stat-label">Log Retention</span>
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

            {/* SaaS API Key Generator */}
            <div className="sec-section">
                <div className="sec-section-header">
                    <h2><Key size={22} /> SaaS API Key Manager</h2>
                </div>
                <div className="api-key-section">
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Generate an API key for programmatic access. Use the <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>X-API-KEY</code> header to authenticate API requests.
                    </p>
                    <div className="api-key-display">
                        {apiKey ? (
                            <>
                                <div className="api-key-value">{apiKey}</div>
                                <button className="btn btn-outline" onClick={copyKey} style={{ whiteSpace: 'nowrap' }}>
                                    <Copy size={15} /> Copy
                                </button>
                            </>
                        ) : (
                            <div className="api-key-value" style={{ color: 'var(--text-secondary)' }}>No API key generated yet</div>
                        )}
                        <button className="btn btn-primary" onClick={handleGenerateKey} disabled={loadingKey} style={{ whiteSpace: 'nowrap' }}>
                            {loadingKey ? <><RefreshCw size={15} className="auth-spinner" /> Generating...</> : <><Key size={15} /> Generate New Key</>}
                        </button>
                    </div>
                    <div className="api-key-info">
                        <ShieldAlert size={14} />
                        <span>Keep your API key secret. Generating a new key invalidates the previous one.</span>
                    </div>
                </div>
            </div>

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
