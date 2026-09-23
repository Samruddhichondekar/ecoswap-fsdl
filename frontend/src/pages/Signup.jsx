import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import './Auth.css';

const ROLES = [
    { value: 'user', label: 'User', desc: 'Standard campus user' },
    { value: 'admin', label: 'Cloud Admin', desc: 'Full platform management' },
    { value: 'auditor', label: 'Security Auditor', desc: 'Read-only audit access' },
];

const Signup = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { addToast } = useContext(ToastContext);

    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const validate = () => {
        if (formData.name.trim().length < 2) return 'Enter your full name.';
        if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Enter a valid email address.';
        if (formData.password.length < 6) return 'Password must be at least 6 characters.';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const user = await register(formData.name, formData.email, formData.password, formData.role);
            addToast(`Welcome to EcoSwap, ${user.name}!`);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const strengthScore = () => {
        const p = formData.password;
        let s = 0;
        if (p.length >= 6) s++;
        if (p.length >= 10) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    };

    const score = strengthScore();
    const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][score];
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][score];

    return (
        <div className="auth-page">
            <section className="auth-left auth-left-signup">
                <div className="auth-left-content">
                    <div className="auth-brand">
                        <Leaf size={36} />
                        <span>EcoSwap</span>
                    </div>
                    <h2 className="auth-left-title">Start sharing in minutes.</h2>
                    <p className="auth-left-sub">Create a free account and post reusable books, electronics, furniture, and daily-use items.</p>
                    <ul className="auth-perks">
                        <li><CheckCircle2 size={18} /> Free to join, always</li>
                        <li><CheckCircle2 size={18} /> Post unlimited items</li>
                        <li><CheckCircle2 size={18} /> Donate, sell, barter, or rent</li>
                        <li><CheckCircle2 size={18} /> Cloud IAM role-based access</li>
                    </ul>
                </div>
            </section>

            <section className="auth-right">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <div className="auth-kicker"><CheckCircle2 size={16} /> Free account</div>
                        <h1>Create Account</h1>
                        <p>Join the EcoSwap community.</p>
                    </div>

                    {error && <div className="auth-error" role="alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        <div className="auth-field">
                            <label htmlFor="signup-name">Full Name</label>
                            <div className="auth-input-wrap">
                                <User size={18} className="auth-input-icon" />
                                <input
                                    id="signup-name"
                                    type="text"
                                    name="name"
                                    placeholder="Your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="signup-email">Email Address</label>
                            <div className="auth-input-wrap">
                                <Mail size={18} className="auth-input-icon" />
                                <input
                                    id="signup-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@student.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* IAM Role Selection */}
                        <div className="auth-field">
                            <label htmlFor="signup-role"><ShieldCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />IAM Role</label>
                            <div className="auth-input-wrap">
                                <ShieldCheck size={18} className="auth-input-icon" />
                                <select
                                    id="signup-role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontSize: '0.95rem',
                                        color: 'inherit',
                                        padding: '0.55rem 0',
                                    }}
                                >
                                    {ROLES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label} – {r.desc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="signup-password">Password</label>
                            <div className="auth-input-wrap">
                                <Lock size={18} className="auth-input-icon" />
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Min. 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="password-strength">
                                    <div className="strength-bars" aria-hidden="true">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className="strength-bar"
                                                style={{ background: i <= score ? strengthColor : 'var(--border-light)' }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: strengthColor, fontSize: '0.75rem', fontWeight: 700 }}>
                                        {strengthLabel}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="signup-confirm">Confirm Password</label>
                            <div className="auth-input-wrap">
                                <Lock size={18} className="auth-input-icon" />
                                <input
                                    id="signup-confirm"
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="Repeat your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button id="signup-submit" type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <><span className="auth-spinner"></span> Creating account...</> : <>Create Account <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Signup;
