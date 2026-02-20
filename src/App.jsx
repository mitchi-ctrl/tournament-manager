import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { storage } from './lib/storage';
import { supabase } from './lib/supabase'; // Import supabase
import { LogOut, User, Shield, Mail, Users, Settings as SettingsIcon } from 'lucide-react';

// Pages
import Home from './pages/Home';
// import Members from './pages/Members'; // Removed
import TournamentCreate from './pages/TournamentCreate';
import TournamentDetail from './pages/TournamentDetail';
import { Contact } from './pages/Placeholders';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminUsers from './pages/AdminUsers';
import Guide from './pages/Guide';
import Settings from './pages/Settings';

// Private Route Wrapper
const PrivateRoute = ({ children, adminOnly = false }) => {
    const user = storage.getCurrentUser();
    if (!user) return <Navigate to="/login" />;

    if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Access Denied: Admin Rights Required</div>;
    }

    return children;
};

const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = storage.getCurrentUser();
    const isActive = (path) => location.pathname === path ? 'active' : '';

    const handleLogout = async () => {
        await storage.logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000, backgroundColor: '#111827', margin: 0, padding: '1rem', borderBottom: '1px solid #374151' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="desktop-only" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>GameTourney</span>
                </div>
                <Link to="/" className={isActive('/')}>ホーム</Link>
                <Link to="/guide" className={isActive('/guide')}>使い方</Link>

                {(user.role === 'admin' || user.role === 'superadmin') && (
                    <>
                        <Link to="/admin-users" className={isActive('/admin-users')}>管理</Link>
                    </>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#9ca3af' }}>
                    <User size={16} />
                    <span className="user-name-display">{user.username}</span>
                    <span className="desktop-only" style={{
                        fontSize: '0.7em', padding: '2px 4px', borderRadius: '4px',
                        background: user.role === 'superadmin' ? '#eab308' : (user.role === 'admin' ? '#ef4444' : '#3b82f6'),
                        color: user.role === 'superadmin' ? 'black' : 'white',
                        fontWeight: 'bold'
                    }}>
                        {user.role.toUpperCase()}
                    </span>
                </div>
                <Link
                    to="/settings"
                    title="設定"
                    style={{
                        color: isActive('/settings') ? 'var(--primary)' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '0.5rem'
                    }}
                >
                    <SettingsIcon size={18} />
                </Link>
                <button
                    onClick={handleLogout}
                    title="ログアウト"
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    <LogOut size={18} />
                </button>
            </div>
        </nav>
    );
}

function App() {
    const [initialized, setInitialized] = useState(false);

    // Initialize Seed Data (only once)
    useEffect(() => {
        const initStorage = async () => {
            // Check active session on load
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Restore session to storage if valid
                const user = {
                    ...session.user,
                    // Try to get role from storage or fetch it, but for now just ensure basic user exists
                    ...(storage.getCurrentUserSync() || {})
                };
                // We should ideally fetch profile here too, but storage.init isn't async in a way that blocks UI render perfectly for this. 
                // Let's trust storage.login did its job, or if we are reloading, we need to fetch profile.
                if (!user.role) {
                    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    if (profileData) {
                        // We use a manual mapping here to match storage.js mapProfile logic
                        const profile = {
                            username: profileData.username,
                            role: profileData.role,
                            shareCode: profileData.share_code,
                            following: profileData.following || [],
                            blocked: profileData.blocked || []
                        };
                        Object.assign(user, profile);
                        sessionStorage.setItem('tm_session', JSON.stringify(user));
                    }
                }
            }
            await storage.init();
            setInitialized(true);
        };
        initStorage();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                sessionStorage.removeItem('tm_session');
                // Optional: navigate to login if needed, but might cause loops
            } else if (session) {
                const currentUser = storage.getCurrentUserSync();
                if (!currentUser || currentUser.id !== session.user.id) {
                    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    const profile = profileData ? {
                        username: profileData.username,
                        role: profileData.role,
                        shareCode: profileData.share_code,
                        following: profileData.following || [],
                        blocked: profileData.blocked || []
                    } : { role: 'viewer', username: session.user.email.split('@')[0], following: [], blocked: [], shareCode: '' };

                    const user = { ...session.user, ...profile };
                    sessionStorage.setItem('tm_session', JSON.stringify(user));
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (!initialized) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#60a5fa' }}>Loading...</div>;
    }

    return (
        <Router>
            <div className="container">
                <NavBar />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                    <Route path="/contact" element={<PrivateRoute><Contact /></PrivateRoute>} />
                    <Route path="/tournament/:id" element={<PrivateRoute><TournamentDetail /></PrivateRoute>} />
                    <Route path="/guide" element={<PrivateRoute><Guide /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

                    {/* Admin Only Routes */}
                    <Route path="/create" element={<PrivateRoute adminOnly={true}><TournamentCreate /></PrivateRoute>} />
                    {/* Members page removed as per request */}
                    <Route path="/admin-users" element={<PrivateRoute adminOnly={true}><AdminUsers /></PrivateRoute>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
