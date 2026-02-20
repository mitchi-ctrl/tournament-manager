import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '../lib/storage';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');

    const generateShareCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.username || !formData.password || !formData.confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Check for duplicate username (Optional: Supabase handles unique constraints on email)
        // const users = await storage.getUsers();
        // if (users.some(u => u.username === formData.username)) {
        //     setError('すでに登録されているアカウントです');
        //     return;
        // }

        try {
            await storage.register(formData.email, formData.password, formData.username);
            alert('Registration successful! You are now logged in.');
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Registration failed: ' + (err.message || 'Unknown error'));
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
                    <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginBottom: '1rem' }}>
                        <UserPlus size={32} />
                    </div>
                    <h1>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Join the tournament manager</p>
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

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Account ID</label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
                    <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#3b82f6',
                        color: 'white',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        marginBottom: '1rem'
                    }}
                >
                    Create Account
                </button>

                <Link
                    to="/login"
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '1rem',
                        background: 'transparent',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-muted)',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        textAlign: 'center',
                        textDecoration: 'none',
                        boxSizing: 'border-box'
                    }}
                >
                    Back to Login
                </Link>
            </form>
        </div>
    );
};

export default Register;
