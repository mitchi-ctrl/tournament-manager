import React from 'react';

export const TournamentCreate = () => (
    <div className="card">
        <h2>Create Tournament</h2>
        <p>Coming Soon...</p>
    </div>
);

export const Members = () => (
    <div className="card">
        <h2>Member Management</h2>
        <p>Coming Soon...</p>
    </div>
);

export const Contact = () => (
    <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Contact Support</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                Have questions or feedback? Reach out to the administration team.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent (demo)!'); }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name</label>
                    <input type="text" placeholder="Your Name" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
                    <input type="email" placeholder="your@email.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Message</label>
                    <textarea rows="4" placeholder="How can we help?" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}></textarea>
                </div>
                <button type="submit" style={{ width: '100%', padding: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Send Message
                </button>
            </form>
        </div>
    </div>
);
