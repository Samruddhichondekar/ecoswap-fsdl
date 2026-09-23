import React from 'react';
import { Heart, Leaf } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{ backgroundColor: 'var(--eco-bg)', borderTop: '1px solid var(--border-light)', padding: '3rem 0', textAlign: 'center', marginTop: 'auto' }}>
            <div className="container">
                <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', color: 'var(--eco-primary)' }}>
                    <Leaf size={28} /> <Heart size={28} />
                </div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '1.125rem' }}>Together, we can reduce waste and build a greener campus 🌿</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>&copy; {new Date().getFullYear()} EcoSwap Pro. Promoting sustainability through reuse.</p>
            </div>
        </footer>
    );
};

export default Footer;
