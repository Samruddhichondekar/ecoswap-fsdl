import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Moon, Sun, LogOut, User, ChevronDown, Menu, X, Plus, Shield } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const { user, logout, isAuthenticated } = useAuth();
    const { addToast } = useContext(ToastContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        setMobileOpen(false);
        addToast('You have been signed out. See you soon!');
        navigate('/');
    };

    const getInitials = (name = '') =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <nav className="navbar">
            <div className="container nav-content">
                {/* Brand */}
                <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
                    <div className="nav-logo-wrap">
                        <Leaf className="nav-icon" />
                    </div>
                    <span className="nav-brand-text">
                        EcoSwap <span className="nav-brand-pro">Pro</span>
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
                        <li>
                            <Link to="/my-items" className={`nav-link ${isActive('/my-items') ? 'active' : ''}`}>
                                My Items
                            </Link>
                        </li>
                    )}
                    <li>
                        <Link to="/security" className={`nav-link ${isActive('/security') ? 'active' : ''}`}>
                            <Shield size={16} style={{ marginRight: 5, verticalAlign: 'middle', color: '#10b981' }} />
                            Security
                        </Link>
                    </li>
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
                                    <span className={`role-badge role-${user?.role || 'user'}`}>
                                        {user?.role === 'admin' ? '👑 Admin' : user?.role === 'auditor' ? '🛡️ Auditor' : '👤 User'}
                                    </span>
                                    <ChevronDown size={15} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
                                </button>
                                {dropdownOpen && (
                                    <div className="user-dropdown">
                                        <div className="dropdown-header">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <strong>{user?.name}</strong>
                                                <span className={`role-badge role-${user?.role || 'user'}`}>
                                                    {user?.role?.toUpperCase() || 'USER'}
                                                </span>
                                            </div>
                                            <span>{user?.email}</span>
                                        </div>
                                        <div className="dropdown-divider" />
                                        <Link to="/my-items" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <User size={15} /> My Items
                                        </Link>
                                        <Link to="/security" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <Shield size={15} /> Security & IAM
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
                            <Link to="/my-items" className={`mobile-link ${isActive('/my-items') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>My Items</Link>
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
    );
};

export default Navbar;
