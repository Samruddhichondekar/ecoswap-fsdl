import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Moon, Sun, LogOut, User, ChevronDown, Menu, X, Plus, Shield, Edit3, Save } from 'lucide-react';
import axios from 'axios';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import { API_URL } from '../utils/config';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const { user, logout, isAuthenticated, authHeaders } = useAuth();
    const { addToast } = useContext(ToastContext);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Profile Modal State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [profileBio, setProfileBio] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        setMobileOpen(false);
        addToast('You have been signed out. See you soon!');
        navigate('/');
    };

    const handleOpenProfile = () => {
        setProfileName(user?.name || '');
        setProfileBio(user?.bio || '');
        setShowProfileModal(true);
        setDropdownOpen(false);
        setMobileOpen(false);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await axios.put(
                `${API_URL}/auth/profile`,
                { name: profileName.trim(), bio: profileBio.trim() },
                { headers: authHeaders }
            );
            // Update local storage so user updates across the app
            if (res.data?.user) {
                localStorage.setItem('ecoswap_user', JSON.stringify(res.data.user));
            }
            addToast('Profile updated successfully!');
            setShowProfileModal(false);
            // Trigger slight reload or state update
            window.location.reload();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const getInitials = (name = '') =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <>
            <nav className="navbar">
                <div className="container nav-content">
                    {/* Brand */}
                    <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
                        <div className="nav-logo-wrap">
                            <Leaf className="nav-icon" />
                        </div>
                        <span className="nav-brand-text">
                            EcoSwap <span className="nav-brand-pro">Cloud</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <ul className="nav-links">
                        <li>
                            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link to="/browse" className={`nav-link ${isActive('/browse') ? 'active' : ''}`}>
                                Browse
                            </Link>
                        </li>
                        {isAuthenticated && (
                            <>
                                <li>
                                    <Link to="/my-items" className={`nav-link ${isActive('/my-items') ? 'active' : ''}`}>
                                        Dashboard & Swaps
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/security" className={`nav-link ${isActive('/security') ? 'active' : ''}`}>
                                        <Shield size={15} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                                        Security
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>

                    {/* Right Actions */}
                    <div className="nav-actions">
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                            {isDark ? <Sun size={19} /> : <Moon size={19} />}
                        </button>

                        {isAuthenticated ? (
                            <>
                                <Link to="/add" className="btn btn-primary nav-add-btn">
                                    <Plus size={17} /> Add Item
                                </Link>
                                <div className="user-menu" onMouseLeave={() => setDropdownOpen(false)}>
                                    <button
                                        className="user-avatar-btn"
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        aria-label="User menu"
                                    >
                                        <div className="user-avatar">{getInitials(user?.name)}</div>
                                        <span className="user-name-label">{user?.name?.split(' ')[0]}</span>
                                        <ChevronDown size={15} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
                                    </button>
                                    {dropdownOpen && (
                                        <div className="user-dropdown">
                                            <div className="dropdown-header">
                                                <strong>{user?.name}</strong>
                                                <span>{user?.email}</span>
                                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--eco-primary)', fontWeight: 700, marginTop: 2 }}>
                                                    {user?.role || 'user'}
                                                </span>
                                            </div>
                                            <div className="dropdown-divider" />
                                            <button className="dropdown-item" onClick={handleOpenProfile}>
                                                <User size={15} /> My Profile
                                            </button>
                                            <Link to="/my-items" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                                <Edit3 size={15} /> Dashboard & Swaps
                                            </Link>
                                            <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                                                <LogOut size={15} /> Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="auth-nav-btns">
                                <Link to="/login" className="btn btn-outline nav-login-btn">Sign In</Link>
                                <Link to="/signup" className="btn btn-primary nav-signup-btn">Sign Up</Link>
                            </div>
                        )}

                        {/* Mobile toggle */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="mobile-menu">
                        <Link to="/" className={`mobile-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Home</Link>
                        <Link to="/browse" className={`mobile-link ${isActive('/browse') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Browse</Link>
                        {isAuthenticated ? (
                            <>
                                <button className="mobile-link" onClick={handleOpenProfile} style={{ textAlign: 'left', background: 'none', border: 'none', width: '100%', font: 'inherit', padding: '0.75rem 0' }}>
                                    <User size={16} /> My Profile
                                </button>
                                <Link to="/my-items" className={`mobile-link ${isActive('/my-items') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Dashboard & Swaps</Link>
                                <Link to="/security" className={`mobile-link ${isActive('/security') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}><Shield size={15} /> Security</Link>
                                <Link to="/add" className={`mobile-link ${isActive('/add') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>+ Add Item</Link>
                                <button className="mobile-link mobile-logout" onClick={handleLogout}>
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>Sign In</Link>
                                <Link to="/signup" className="mobile-link mobile-signup" onClick={() => setMobileOpen(false)}>Sign Up Free</Link>
                            </>
                        )}
                    </div>
                )}
            </nav>

            {/* Profile Edit Modal */}
            {showProfileModal && (
                <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><User size={20} style={{ marginRight: 6, verticalAlign: 'middle' }} /> User Profile</h3>
                            <button className="close-btn" onClick={() => setShowProfileModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSaveProfile}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={profileName}
                                        onChange={e => setProfileName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Email Address (Registered)</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={user?.email || ''}
                                        disabled
                                        style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">IAM Role</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={user?.role?.toUpperCase() || 'USER'}
                                        disabled
                                        style={{ opacity: 0.7, cursor: 'not-allowed', fontWeight: 600 }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label className="form-label">Bio / Campus Department</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={profileBio}
                                        onChange={e => setProfileBio(e.target.value)}
                                        placeholder="E.g., Third Year IT student, interested in books and tech."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowProfileModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={savingProfile}
                                    >
                                        {savingProfile ? 'Saving...' : <><Save size={15} style={{ marginRight: 4 }} /> Save Profile</>}
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

export default Navbar;
