import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Leaf, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { addToast } = useContext(ToastContext);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const validate = () => {
        if (!formData.email.trim() || !formData.password) return 'Enter your email and password.';
        if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Enter a valid email address.';
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
            const user = await login(formData.email, formData.password);
            addToast(`Welcome back, ${user.name}!`);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <section className="auth-left">
                <div className="auth-left-content">
                    <div className="auth-brand">
                        <Leaf size={36} />
                        <span>EcoSwap</span>
                    </div>
                    <h2 className="auth-left-title">Share more. Waste less.</h2>
                    <p className="auth-left-sub">Sign in to manage listings, contact owners, and keep campus resources moving.</p>
                    <div className="auth-stats" aria-label="EcoSwap community highlights">
                    </div>
                </div>
            </section>

            <section className="auth-right">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <div className="auth-kicker"><ShieldCheck size={16} /> Secure access</div>
                        <h1>Welcome Back</h1>
                        <p>Sign in to your EcoSwap account.</p>
                    </div>

                    {error && <div className="auth-error" role="alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        <div className="auth-field">
                            <label htmlFor="login-email">Email Address</label>
                            <div className="auth-input-wrap">
                                <Mail size={18} className="auth-input-icon" />
                                <input
                                    id="login-email"
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

                        <div className="auth-field">
                            <label htmlFor="login-password">Password</label>
                            <div className="auth-input-wrap">
                                <Lock size={18} className="auth-input-icon" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="current-password"
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
                        </div>

                        <button id="login-submit" type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <><span className="auth-spinner"></span> Signing in...</> : <>Sign In <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Don't have an account? <Link to="/signup" className="auth-link">Create one free</Link></p>
                    </div>

                    <div className="auth-divider"><span>or</span></div>
                    <button className="auth-guest-btn" onClick={() => navigate('/browse')}>
                        Browse without signing in
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Login;
