import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Users, Shield, ShieldAlert, Trash2 } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const currentUser = storage.getCurrentUser();

    useEffect(() => {
        const loadUsers = async () => {
            const usersData = await storage.getUsers();
            setUsers(usersData);
        };
        loadUsers();
    }, []);

    const handleRoleChange = async (user, newRole) => {
        if (user.id === currentUser.id) {
            alert("You cannot change your own role!");
            return;
        }
        const updatedUser = { ...user, role: newRole };
        await storage.updateUser(updatedUser);
        const usersData = await storage.getUsers();
        setUsers(usersData);
    };

    // Note: Delete functionality not strictly requested but good for "Management"
    // Skipping delete for now to keep it simple as requested "Role Management"

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Shield size={32} color="#eab308" />
                <h1 style={{ margin: 0 }}>User Management</h1>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--card-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Username</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                    {user.username}
                                    {user.id === currentUser.id && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#eab308', background: 'rgba(234,179,8,0.1)', padding: '2px 6px', borderRadius: '4px' }}>YOU</span>}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 8px', borderRadius: '4px',
                                        backgroundColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                        color: user.role === 'admin' ? '#ef4444' : '#3b82f6',
                                        fontWeight: 'bold', fontSize: '0.9rem'
                                    }}>
                                        {user.role === 'admin' ? <ShieldAlert size={14} /> : <Users size={14} />}
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {currentUser.role === 'superadmin' ? (
                                        <>
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user, e.target.value)}
                                                disabled={user.id === currentUser.id}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--card-border)',
                                                    backgroundColor: '#1e293b',
                                                    color: 'white',
                                                    cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                <option value="viewer" style={{ backgroundColor: '#1e293b', color: 'white' }}>Viewer</option>
                                                <option value="admin" style={{ backgroundColor: '#1e293b', color: 'white' }}>Admin</option>
                                                <option value="superadmin" style={{ backgroundColor: '#1e293b', color: 'white' }}>Super Admin</option>
                                            </select>
                                            {user.id !== currentUser.id && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
                                                            await storage.deleteUser(user.id);
                                                            const usersData = await storage.getUsers();
                                                            setUsers(usersData);
                                                        }
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>Read Only</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
