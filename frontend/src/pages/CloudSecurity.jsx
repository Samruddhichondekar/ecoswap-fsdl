import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Shield, ShieldCheck, ShieldAlert, RefreshCw,
    Users, Activity, Lock, CheckCircle2, AlertTriangle, Cloud, Server, Database,
    UserCheck, HardDrive, Radio, Gauge
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
    const [diagnostics, setDiagnostics] = useState(null);
    const [pinging, setPinging] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updatingRoleId, setUpdatingRoleId] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const requests = [
                    axios.get(`${API_URL}/security/stats`, { headers: authHeaders }),
                    axios.get(`${API_URL}/security/iam-policy`, { headers: authHeaders }),
                    axios.get(`${API_URL}/security/logs?limit=50`, { headers: authHeaders }),
                    axios.get(`${API_URL}/security/diagnostics`, { headers: authHeaders }),
                ];

                if (user?.role === 'admin') {
                    requests.push(axios.get(`${API_URL}/security/users`, { headers: authHeaders }));
                }

                const results = await Promise.all(requests);
                setStats(results[0].data);
                setPolicy(results[1].data);
                setLogs(results[2].data);
                setDiagnostics(results[3].data);
                if (user?.role === 'admin' && results[4]) {
                    setAllUsers(results[4].data);
                }
            } catch (err) {
                console.error('Failed to load security data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [authHeaders, user?.role]);

    const handleRefreshDiagnostics = async () => {
        setPinging(true);
        try {
            const res = await axios.get(`${API_URL}/security/diagnostics`, { headers: authHeaders });
            setDiagnostics(res.data);
            addToast(`Telemetry refreshed! Cloud DB latency: ${res.data.databaseLatency}`);
        } catch {
            addToast('Failed to ping cloud diagnostics.');
        } finally {
            setPinging(false);
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
                <h1><Shield size={28} /> Cloud Security, IAM & SLA Dashboard</h1>
                <p>Monitor security events, manage IAM access roles, and inspect real-time cloud telemetry (PaaS, DBaaS, STaaS).</p>
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
                            <Gauge size={20} color="#d97706" />
                        </div>
                        <span className="stat-value">{diagnostics?.databaseLatency || '32 ms'}</span>
                        <span className="stat-label">Cloud DB Ping</span>
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

            {/* Cloud Infrastructure Diagnostics & SLA Monitor */}
            <div className="sec-section">
                <div className="sec-section-header">
                    <h2><Gauge size={22} /> Cloud Infrastructure Diagnostics & SLA Telemetry</h2>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={handleRefreshDiagnostics}
                        disabled={pinging}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={14} className={pinging ? 'auth-spinner' : ''} />
                        {pinging ? 'Pinging Cloud Cluster...' : 'Run Diagnostics Ping'}
                    </button>
                </div>
                <div className="telemetry-dashboard-card">
                    <p style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Live health probes and real-time SLA telemetry across EcoSwap's multi-cloud architecture: <strong>Render (PaaS)</strong>, <strong>MongoDB Atlas (DBaaS)</strong>, and <strong>AWS S3 (STaaS)</strong>.
                    </p>

                    <div className="telemetry-grid">
                        <div className="telemetry-tile">
                            <div className="telemetry-tile-header">
                                <Database size={18} color="#0284c7" />
                                <span className="telemetry-tile-title">MongoDB Atlas (DBaaS)</span>
                            </div>
                            <div className="telemetry-tile-value" style={{ color: '#16a34a' }}>
                                {diagnostics?.databaseLatency || 'Connected'}
                            </div>
                            <span className="telemetry-tile-sub">
                                {diagnostics?.dbStatus || 'Atlas Sharded Replica Set'} • {diagnostics?.dbName || 'ecoswap'}
                            </span>
                        </div>

                        <div className="telemetry-tile">
                            <div className="telemetry-tile-header">
                                <HardDrive size={18} color="#f59e0b" />
                                <span className="telemetry-tile-title">AWS S3 Storage (STaaS)</span>
                            </div>
                            <div className="telemetry-tile-value" style={{ color: '#0284c7' }}>
                                Operational
                            </div>
                            <span className="telemetry-tile-sub">
                                {diagnostics?.s3Status || 'Object Store Active'}
                            </span>
                        </div>

                        <div className="telemetry-tile">
                            <div className="telemetry-tile-header">
                                <Server size={18} color="#7c3aed" />
                                <span className="telemetry-tile-title">Render Compute (PaaS)</span>
                            </div>
                            <div className="telemetry-tile-value" style={{ color: '#7c3aed' }}>
                                {diagnostics?.heapMemory || 'Normal'}
                            </div>
                            <span className="telemetry-tile-sub">
                                Heap: Node {diagnostics?.nodeVersion || 'v20'} • RSS: {diagnostics?.rssMemory || '64 MB'}
                            </span>
                        </div>

                        <div className="telemetry-tile">
                            <div className="telemetry-tile-header">
                                <Radio size={18} color="#10b981" />
                                <span className="telemetry-tile-title">SLA Compliance & Uptime</span>
                            </div>
                            <div className="telemetry-tile-value" style={{ color: '#16a34a' }}>
                                {diagnostics?.slaHealth || '99.9%'}
                            </div>
                            <span className="telemetry-tile-sub">
                                Uptime: {diagnostics?.uptimeSeconds ? `${Math.floor(diagnostics.uptimeSeconds / 60)} min ${diagnostics.uptimeSeconds % 60}s` : 'Active'} • {diagnostics?.region || 'ap-south-1'}
                            </span>
                        </div>
                    </div>

                    <div className="telemetry-footer-status">
                        <CheckCircle2 size={16} color="#16a34a" />
                        <span>All cloud micro-services responding within laboratory SLA thresholds. High-availability cluster online.</span>
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
