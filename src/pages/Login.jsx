import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '../lib/storage';
import { LogIn } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await storage.login(formData.email, formData.password);
            if (user) {
                navigate('/');
                window.location.reload(); // Refresh to update Navbar state
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)'
        }}>
            <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', marginBottom: '1rem' }}>
                        <LogIn size={32} />
                    </div>
                    <h1>Welcome Back</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Sign in to continue</p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1.5rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        color: '#ef4444',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                        required
                        placeholder="example@mail.com"
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#eab308',
                        color: 'black',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Sign In
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#eab308', textDecoration: 'none' }}>Create one</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;
