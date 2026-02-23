import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../lib/storage';
import { Trophy, Calendar, Users, ArrowRight, RefreshCw, Search, Key, Star, Plus } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        upcoming: { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', label: 'UPCOMING' },
        active: { bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', label: 'ACTIVE' },
        finished: { bg: 'rgba(75, 85, 99, 0.2)', color: '#9ca3af', label: 'ENDED' },
    };
    const s = styles[status] || styles.finished;

    return (
        <span style={{
            backgroundColor: s.bg,
            color: s.color,
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            border: `1px solid ${s.color}40`
        }}>
            {s.label}
        </span>
    );
};

const Home = () => {
    const [tournaments, setTournaments] = useState([]);
    const [filteredTournaments, setFilteredTournaments] = useState([]);
    const [shareCodeInput, setShareCodeInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(storage.getCurrentUser());
    const [allUsers, setAllUsers] = useState([]); // Cache users for owner name lookup
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async (isInitial = false) => {
            if (isInitial) setLoading(true);
            try {
                const [list, users] = await Promise.all([
                    storage.getTournaments(),
                    storage.getUsers()
                ]);
                setAllUsers(users);

                // Update currentUser with latest data from DB (e.g. shareCode, role changes)
                const freshUser = users.find(u => u.id === currentUser.id);
                if (freshUser) {
                    const hasChanged =
                        freshUser.shareCode !== currentUser.shareCode ||
                        freshUser.role !== currentUser.role ||
                        JSON.stringify(freshUser.following) !== JSON.stringify(currentUser.following) ||
                        JSON.stringify(freshUser.blocked) !== JSON.stringify(currentUser.blocked);

                    if (hasChanged) {
                        const updated = { ...currentUser, ...freshUser };
                        setCurrentUser(updated);
                        // Also update sessionStorage to keep it in sync
                        sessionStorage.setItem('tm_session', JSON.stringify(updated));
                    }
                }

                // Multi-Tenant Logic: Filter tournaments based on ownership, superadmin status, or unlock code
                const accessibleList = list.filter(t => {
                    const isOwner = t.ownerId === currentUser.id;
                    const isSuperAdmin = currentUser.role === 'superadmin';
                    const isUnlocked = (freshUser?.unlockedTournaments || currentUser.unlockedTournaments || []).includes(t.id);
                    return isOwner || isSuperAdmin || isUnlocked;
                });

                // Sort: Priority (Active/Upcoming) > Date Desc
                accessibleList.sort((a, b) => {
                    const getPriority = (status) => {
                        if (status === 'upcoming' || status === 'active') return 1;
                        return 0; // finished
                    };

                    const prioA = getPriority(a.status);
                    const prioB = getPriority(b.status);

                    if (prioA !== prioB) return prioB - prioA;
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA;
                });
                setTournaments(accessibleList);
            } catch (err) {
                console.error("Home load error:", err);
            } finally {
                if (isInitial) setLoading(false);
            }
        };

        loadData(tournaments.length === 0);
    }, [currentUser.id]); // ONLY depend on ID to avoid loop from internal updates

    // Search Filtering
    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = tournaments.filter(t => {
            const nameMatch = t.name.toLowerCase().includes(lowerTerm);
            const ownerName = allUsers.find(u => u.id === t.ownerId)?.username || '';
            const ownerMatch = ownerName.toLowerCase().includes(lowerTerm);
            return nameMatch || ownerMatch;
        });
        setFilteredTournaments(filtered);
    }, [searchTerm, tournaments, allUsers]);

    const handleUnlock = async (e) => {
        e.preventDefault();
        const code = shareCodeInput.trim().toUpperCase();
        if (!code) return;

        try {
            const result = await storage.unlockTournament(code);
            if (result.success) {
                setShareCodeInput('');
                alert('大会が解放されました！');

                // Fetch fresh data
                const [list, users] = await Promise.all([
                    storage.getTournaments(),
                    storage.getUsers()
                ]);

                const freshUser = users.find(u => u.id === currentUser.id);
                if (freshUser) {
                    const updated = { ...currentUser, ...freshUser };
                    setCurrentUser(updated);
                    sessionStorage.setItem('tm_session', JSON.stringify(updated));
                }

                setAllUsers(users);
                // The accessibleList logic in useEffect will handle visibility of the new tournament 
                // when it triggers due to currentUser update.
            } else {
                alert(result.message || '無効なアクセスコードです');
            }
        } catch (e) {
            alert('エラーが発生しました: ' + e.message);
        }
    };

    const isNew = (t) => {
        if (!t.createdAt) return false;
        if (t.status === 'finished') return false;
        const Created = new Date(t.createdAt);
        const Now = new Date();
        const DiffHours = (Now - Created) / (1000 * 60 * 60);
        return DiffHours < 48; // Extended to 48 hours
    };

    return (
        <>
            {loading && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    <RefreshCw className="animate-spin" size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <p style={{ marginTop: '1rem' }}>読み込み中...</p>
                </div>
            )}

            {!loading && (
                <div className="container">
                    <style>{`
                .home-title {
                    font-size: 1.5rem; /* Balanced size */
                    margin: 0 auto;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-family: "Chakra Petch", sans-serif;
                    font-weight: 700;
                    font-style: italic;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                }
                .search-container {
                    display: grid;
                    grid-template-columns: 1fr 300px; /* Search : Follow */
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .tournament-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr); /* 3 Columns on Desktop */
                    gap: 1.5rem;
                    align-items: stretch;
                }
                @media (max-width: 1024px) {
                    .tournament-grid {
                        grid-template-columns: repeat(2, 1fr); /* 2 Columns on Tablet */
                    }
                }
                @media (max-width: 768px) {
                    .home-title { font-size: 1.25rem; }
                    .search-container {
                        grid-template-columns: 1fr; /* Stack on Mobile */
                    }
                    .tournament-grid {
                        grid-template-columns: 1fr; /* 1 Column on Mobile */
                    }
                }
            `}</style>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            <RefreshCw className="animate-spin" size={32} style={{ animation: 'spin 1s linear infinite' }} />
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            <p style={{ marginTop: '1rem' }}>読み込み中...</p>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* Header Area: Title & Actions */}
                            <div className="tournament-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                <h2 className="home-title">
                                    <Trophy className="text-yellow-500" style={{ color: '#fbbf24' }} /> TOURNAMENT BULLETIN
                                </h2>
                            </div>

                            {/* Top Bar: Search & Private Access */}
                            <div className="search-container">
                                {/* Search Bar */}
                                <div className="search-box" style={{ position: 'relative', width: '100%' }}>
                                    <Search size={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <input
                                        type="text"
                                        placeholder="大会検索..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                                            borderRadius: '8px',
                                            border: '1px solid #334155',
                                            backgroundColor: '#1e293b',
                                            color: 'white',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                <div className="access-code-box" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '0.4rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                    <form onSubmit={handleUnlock} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <div style={{ position: 'relative', height: '100%', flex: 1 }}>
                                            <Key size={14} className="key-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                            <input
                                                type="text"
                                                placeholder="コード入力"
                                                value={shareCodeInput}
                                                onChange={(e) => setShareCodeInput(e.target.value)}
                                                className="access-input"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'white',
                                                    padding: '0.4rem 0.4rem 0.4rem 2rem',
                                                    fontSize: '0.85rem',
                                                    width: '100%',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            style={{
                                                backgroundColor: '#0ea5e9',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '0.4rem 0.8rem',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                height: '100%',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            追加
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Title Bar Action: Create Button */}
                            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', padding: '0 0.5rem' }}>
                                    <Link to="/create">
                                        <button style={{
                                            background: 'transparent',
                                            color: '#f59e0b',
                                            border: 'none',
                                            padding: '0',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'color 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.target.style.color = '#fbbf24'}
                                            onMouseLeave={(e) => e.target.style.color = '#f59e0b'}
                                            title="新規大会作成"
                                        >
                                            <Plus size={28} strokeWidth={3} />
                                        </button>
                                    </Link>
                                </div>
                            )}
                            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, #334155 0%, transparent 100%)', marginBottom: '1.5rem' }}></div>

                            {/* Tournament Grid */}
                            {filteredTournaments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', borderStyle: 'dashed' }}>
                                    <Trophy size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p style={{ fontSize: '1.1rem' }}>No tournaments found.</p>
                                    {searchTerm && <p style={{ fontSize: '0.9rem' }}>Try adjusting your search terms.</p>}
                                </div>
                            ) : (
                                <div className="tournament-grid">
                                    {filteredTournaments.map(t => {
                                        const owner = allUsers.find(u => u.id === t.ownerId);
                                        const isOwner = currentUser.id === t.ownerId;

                                        return (
                                            <Link to={`/tournament/${t.id}`} key={t.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div className="card tournament-card" style={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    padding: '0',
                                                    overflow: 'hidden',
                                                    border: '1px solid #334155',
                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                    cursor: 'pointer',
                                                    position: 'relative'
                                                }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    {/* Card Header / Banner Placeholder */}
                                                    <div className="card-header" style={{
                                                        height: '40px', /* Compact height */
                                                        background: t.status === 'active'
                                                            ? 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)'
                                                            : t.status === 'upcoming'
                                                                ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
                                                                : 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                                                        position: 'relative',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '0 0.75rem'
                                                    }}>
                                                        <div style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', zIndex: 10 }}>
                                                            {isNew(t) && (
                                                                <span style={{
                                                                    backgroundColor: '#ef4444',
                                                                    color: 'white',
                                                                    fontSize: '0.6rem',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 'bold',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                                }}>NEW</span>
                                                            )}
                                                        </div>
                                                        <Trophy size={20} style={{ color: 'rgba(255,255,255,0.2)', position: 'absolute', bottom: '-2px', right: '30px', transform: 'rotate(-10deg) scale(2)' }} />
                                                    </div>

                                                    {/* Card Body */}
                                                    <div className="card-body" style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                            <StatusBadge status={t.status} />
                                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.schedule?.length > 1 ? `${t.schedule.length} Days` : '1 Day'}</span>
                                                        </div>

                                                        <h3 style={{ margin: 0, fontSize: '1rem', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.6em' }}>
                                                            {t.name}
                                                        </h3>

                                                        <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                                                                <Calendar size={12} color="#64748b" />
                                                                {t.date}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                                <Users size={12} color="#64748b" />
                                                                <span>{t.teams?.length || 0} Teams</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                                                <Star size={10} color={isOwner ? "#eab308" : "#64748b"} />
                                                                <span>{isOwner ? 'あなた' : (owner?.username || 'Unknown')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default Home;
