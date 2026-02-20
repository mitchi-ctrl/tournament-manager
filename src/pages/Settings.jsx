import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Save, UserMinus, ShieldAlert, ShieldCheck, Users } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        killPoint: 1,
        rankPoints: Array(20).fill(0)
    });
    const [currentUser, setCurrentUser] = useState(storage.getCurrentUser());
    const [followingUsers, setFollowingUsers] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [loadingRelations, setLoadingRelations] = useState(true);

    const loadSettings = async () => {
        try {
            const saved = await storage.getSettings() || {};
            const currentRanks = Array.isArray(saved.rankPoints) ? saved.rankPoints : [];
            const filledRanks = [...currentRanks];
            while (filledRanks.length < 20) filledRanks.push(0);
            setSettings({
                killPoint: saved.killPoint || 1,
                rankPoints: filledRanks.slice(0, 20)
            });
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    };

    const loadRelations = async () => {
        if (!currentUser) return;
        setLoadingRelations(true);
        try {
            const [users, myFollowers] = await Promise.all([
                storage.getUsers(),
                storage.getFollowers(currentUser.id)
            ]);

            // Get detailed info for following
            const followingIds = currentUser.following || [];
            const followingList = users.filter(u => followingIds.includes(u.id));

            setFollowingUsers(followingList);
            setFollowers(myFollowers);
        } catch (error) {
            console.error("Error loading relations:", error);
        } finally {
            setLoadingRelations(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        loadRelations();
    }, [currentUser]);

    const handleRankPointChange = (index, value) => {
        const newRankPoints = [...settings.rankPoints];
        newRankPoints[index] = parseInt(value) || 0;
        setSettings({ ...settings, rankPoints: newRankPoints });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await storage.saveSettings(settings);
            alert('Settings saved!');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Failed to save settings.');
        }
    };

    const handleUnfollow = async (targetUserId, username) => {
        if (!confirm(`${username} のフォローを解除しますか？`)) return;
        try {
            const updatedFollowing = (currentUser.following || []).filter(id => id !== targetUserId);
            const updatedUser = { ...currentUser, following: updatedFollowing };
            await storage.updateUser(updatedUser);
            setCurrentUser(updatedUser);
            storage.saveSession(updatedUser);
        } catch (error) {
            console.error("Unfollow error:", error);
            alert("解除に失敗しました");
        }
    };

    const handleToggleBlock = async (targetUserId, username, currentlyBlocked) => {
        const action = currentlyBlocked ? 'ブロック解除' : 'ブロック';
        if (!confirm(`${username} を${action}しますか？\n（ブロックすると、このユーザーはあなたの大会を閲覧できなくなります）`)) return;
        try {
            await storage.toggleBlock(currentUser.id, targetUserId, !currentlyBlocked);
            const updatedUser = {
                ...currentUser,
                blocked: currentlyBlocked
                    ? (currentUser.blocked || []).filter(id => id !== targetUserId)
                    : [...(currentUser.blocked || []), targetUserId]
            };
            setCurrentUser(updatedUser);
            storage.saveSession(updatedUser);
        } catch (error) {
            console.error("Block error:", error);
            alert("処理に失敗しました");
        }
    };

    return (
        <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1>Settings</h1>
                <p style={{ color: '#6b7280' }}>Global Configuration</p>
            </div>

            {/* Access Code Display */}
            <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.5rem' }}>🎫</span> My Access Code
                        </h3>
                        <p style={{ color: '#4b5563', margin: 0 }}>
                            Share with viewers.
                        </p>
                    </div>
                    <div style={{
                        backgroundColor: '#0f172a',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '6px',
                        border: '1px solid #1e293b',
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        color: '#38bdf8',
                        letterSpacing: '2px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {currentUser?.shareCode || 'N/A'}
                    </div>
                </div>
            </div>

            <div className="card" style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', marginBottom: '2rem' }}>
                <p>Global scoring rules have been moved to per-tournament configuration.</p>
                <p>Please configure points when creating a new tournament.</p>
            </div>

            {/* Follow Management Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }} className="management-grid">
                <style>{`
                    @media (max-width: 768px) {
                        .management-grid { grid-template-columns: 1fr !important; }
                    }
                    .relation-item {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0.75rem;
                        border-bottom: 1px solid #1e293b;
                    }
                    .relation-item:last-child { border-bottom: none; }
                `}</style>

                {/* Following */}
                <div className="card">
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                        <Users size={20} color="#3b82f6" />
                        フォロー中 ({followingUsers.length})
                    </h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        {loadingRelations ? (
                            <p style={{ padding: '1rem', color: '#64748b' }}>読み込み中...</p>
                        ) : followingUsers.length === 0 ? (
                            <p style={{ padding: '1rem', color: '#64748b' }}>フォローしているユーザーはいません</p>
                        ) : followingUsers.map(user => (
                            <div key={user.id} className="relation-item">
                                <span style={{ fontWeight: 500 }}>{user.username}</span>
                                <button
                                    onClick={() => handleUnfollow(user.id, user.username)}
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: '#ef4444',
                                        border: '1px solid #ef4444',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <UserMinus size={14} />
                                    解除
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Followers */}
                <div className="card">
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                        <Users size={20} color="#10b981" />
                        フォロワー ({followers.length})
                    </h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        {loadingRelations ? (
                            <p style={{ padding: '1rem', color: '#64748b' }}>読み込み中...</p>
                        ) : followers.length === 0 ? (
                            <p style={{ padding: '1rem', color: '#64748b' }}>フォロワーはいません</p>
                        ) : followers.map(user => {
                            const isBlocked = (currentUser.blocked || []).includes(user.id);
                            return (
                                <div key={user.id} className="relation-item" style={{ opacity: isBlocked ? 0.6 : 1 }}>
                                    <span style={{ fontWeight: 500 }}>
                                        {user.username}
                                        {isBlocked && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#ef4444' }}>(ブロック中)</span>}
                                    </span>
                                    <button
                                        onClick={() => handleToggleBlock(user.id, user.username, isBlocked)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: isBlocked ? '#10b981' : '#ef4444',
                                            border: `1px solid ${isBlocked ? '#10b981' : '#ef4444'}`,
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        {isBlocked ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                        {isBlocked ? 'ブロック解除' : 'ブロック'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
