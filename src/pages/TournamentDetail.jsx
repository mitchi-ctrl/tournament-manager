import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { Trophy, ArrowLeft, Target, Medal, Edit, Trash2, MessageCircle, Image as ImageIcon, Send, X, UserPlus, Check, Search, Plus, Ban, BookOpen, Crown, Key, Copy, RefreshCw } from 'lucide-react';


const EditScheduleModal = ({ tournament, onClose, onSave }) => {
    const [schedule, setSchedule] = useState(tournament.schedule || []);

    const handleAddDay = () => {
        const nextDayNum = schedule.length + 1;
        let nextDate = '';
        if (schedule.length > 0) {
            const lastDate = new Date(schedule[schedule.length - 1].date);
            lastDate.setDate(lastDate.getDate() + 1);
            nextDate = lastDate.toISOString().split('T')[0];
        } else {
            nextDate = new Date().toISOString().split('T')[0];
        }
        setSchedule([...schedule, { name: `Day ${nextDayNum}`, date: nextDate, rounds: 4 }]);
    };

    const handleRemoveDay = (idx) => {
        if (schedule.length === 1) return;
        setSchedule(schedule.filter((_, i) => i !== idx));
    };

    const handleChange = (idx, field, val) => {
        const newSched = [...schedule];
        newSched[idx] = { ...newSched[idx], [field]: val };
        setSchedule(newSched);
    };

    const handleSave = () => {
        onSave(schedule);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ marginTop: 0 }}>スケジュール編集</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {schedule.map((day, idx) => (
                        <div key={idx} style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={day.name}
                                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}
                                />
                                {schedule.length > 1 && (
                                    <button onClick={() => handleRemoveDay(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>日付</label>
                                    <input
                                        type="date"
                                        value={day.date}
                                        onChange={(e) => handleChange(idx, 'date', e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem', backgroundColor: '#111827', border: '1px solid #4b5563', color: 'white', borderRadius: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>ラウンド数</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={day.rounds}
                                        onChange={(e) => handleChange(idx, 'rounds', parseInt(e.target.value) || 1)}
                                        style={{ width: '100%', padding: '0.4rem', backgroundColor: '#111827', border: '1px solid #4b5563', color: 'white', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={handleAddDay} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '0.5rem' }}>
                        <Plus size={16} /> 日程を追加
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #d1d5db', background: 'transparent', cursor: 'pointer' }}>キャンセル</button>
                    <button onClick={handleSave} style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: '#eab308', border: 'none', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>変更を保存</button>
                </div>
            </div>
        </div>
    );
};



const TournamentSettingsModal = ({ tournament, onClose, onSave, canEdit }) => {
    const [description, setDescription] = useState(tournament.description || '');
    const [killPoint, setKillPoint] = useState(tournament.scoringRules?.killPoint ?? 1);
    const [rankPoints, setRankPoints] = useState(tournament.scoringRules?.rankPoints || storage.DEFAULT_RULES.rankPoints);
    const [tagRequired, setTagRequired] = useState(tournament.tagRequired ?? true);
    const [lockMembers, setLockMembers] = useState(tournament.lockMembers ?? false);
    const [maxTeams, setMaxTeams] = useState(tournament.maxTeams || '');
    const [maxMembers, setMaxMembers] = useState(tournament.maxMembers || '');
    const [tiebreakers, setTiebreakers] = useState(tournament.tiebreakers || ['placementPoints', 'wins', 'killPoints', 'bonusPoints']);

    const handleRankPointChange = (idx, val) => {
        const newPoints = [...rankPoints];
        newPoints[idx] = val === '' ? '' : (parseInt(val) || 0);
        setRankPoints(newPoints);
    };

    const handleSave = () => {
        onSave({
            ...tournament,
            description,
            maxTeams: parseInt(maxTeams) || 20,
            maxMembers: parseInt(maxMembers) || 5,
            tiebreakers,
            tagRequired,
            lockMembers,
            scoringRules: {
                ...tournament.scoringRules,
                killPoint: parseInt(killPoint) || 0,
                rankPoints: rankPoints.map(p => parseInt(p) || 0)
            }
        });
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '95%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={24} color="#eab308" /> {canEdit ? '大会設定・ルール編集' : '大会ルール確認'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Description Section */}
                    <section>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.25rem' }}>大会説明・基本ルール</h3>
                        {canEdit ? (
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111827', border: '1px solid #4b5563', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }}
                            />
                        ) : (
                            <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                {description || '説明はありません。'}
                            </div>
                        )}
                    </section>

                    {/* Registration Rules Section */}
                    <section>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.25rem' }}>登録・参加設定</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>最大メンバー数 / チーム</label>
                                {canEdit ? (
                                    <input
                                        type="number"
                                        min="1"
                                        value={maxMembers}
                                        placeholder="5"
                                        onChange={(e) => setMaxMembers(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', backgroundColor: '#111827', border: '1px solid #4b5563', color: 'white', borderRadius: '4px' }}
                                    />
                                ) : (
                                    <div style={{ fontWeight: 'bold' }}>{maxMembers} 人</div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: 'span 1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: '#111827', borderRadius: '6px', border: '1px solid #374151' }}>
                                    <span className="toggle-label-text" style={{ fontSize: '0.85rem' }}>チームタグ必須</span>
                                    <label className="tactical-toggle">
                                        <input
                                            type="checkbox"
                                            checked={tagRequired}
                                            disabled={!canEdit}
                                            onChange={(e) => setTagRequired(e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: '#111827', borderRadius: '6px', border: '1px solid #374151' }}>
                                    <span className="toggle-label-text" style={{ fontSize: '0.85rem' }}>メンバー登録ロック</span>
                                    <label className="tactical-toggle">
                                        <input
                                            type="checkbox"
                                            checked={lockMembers}
                                            disabled={!canEdit}
                                            onChange={(e) => setLockMembers(e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tiebreaker Settings Section */}
                    <section>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.25rem' }}>同率時の順位決定優先度 (1位〜4位)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                            {tiebreakers.map((tb, idx) => (
                                <div key={idx} style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>第{idx + 1}優先</label>
                                    {canEdit ? (
                                        <select
                                            value={tb}
                                            onChange={(e) => {
                                                const newTb = [...tiebreakers];
                                                newTb[idx] = e.target.value;
                                                setTiebreakers(newTb);
                                            }}
                                            style={{ width: '100%', padding: '0.5rem', backgroundColor: '#111827', border: '1px solid #4b5563', color: 'white', borderRadius: '4px', fontSize: '0.85rem' }}
                                        >
                                            <option value="placementPoints">順位ポイント</option>
                                            <option value="wins">勝利数</option>
                                            <option value="killPoints">キルポイント</option>
                                            <option value="bonusPoints">ボーナス</option>
                                        </select>
                                    ) : (
                                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                            {tb === 'placementPoints' ? '順位ポイント' :
                                                tb === 'wins' ? '勝利数' :
                                                    tb === 'killPoints' ? 'キルポイント' : 'ボーナス'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.8rem' }}>
                            ※トータルポイントが同じ場合に参照される順番です。
                        </p>
                    </section>

                    {/* Scoring Rules Section */}
                    <section>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.25rem' }}>スコアリング</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.9rem', color: '#9ca3af' }}>キルポイント: </label>
                            {canEdit ? (
                                <input
                                    type="number"
                                    value={killPoint}
                                    placeholder="1"
                                    onChange={(e) => setKillPoint(e.target.value)}
                                    style={{ width: '60px', padding: '0.4rem', backgroundColor: '#111827', border: '1px solid #4b5563', color: 'white', borderRadius: '4px', textAlign: 'center' }}
                                />
                            ) : (
                                <span style={{ fontWeight: 'bold', color: '#ef4444' }}> {killPoint} pts / Kill</span>
                            )}
                        </div>
                        <div>
                            <label style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.5rem', display: 'block' }}>順位ポイント (1位〜)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                {rankPoints.slice(0, 15).map((pts, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>#{idx + 1}</span>
                                        {canEdit ? (
                                            <input
                                                type="number"
                                                value={pts}
                                                onChange={(e) => handleRankPointChange(idx, e.target.value)}
                                                style={{ width: '100%', padding: '0.3rem', backgroundColor: '#111827', border: '1px solid #4b5563', color: 'white', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem' }}
                                            />
                                        ) : (
                                            <div style={{ fontWeight: 'bold', color: '#eab308', fontSize: '0.9rem' }}>{pts}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button onClick={onClose} style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #4b5563', background: 'transparent', cursor: 'pointer', color: '#d1d5db' }}>
                        {canEdit ? 'キャンセル' : '閉じる'}
                    </button>
                    {canEdit && (
                        <button
                            onClick={handleSave}
                            style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', backgroundColor: '#eab308', border: 'none', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            設定を保存
                        </button>
                    )}
                </div>
            </div >
        </div >
    );
};

// --- ChatTab Component ---
const ChatTab = ({ tournament, currentUser, onTournamentUpdate }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [newChannelName, setNewChannelName] = useState('');
    const [isAddingChannel, setIsAddingChannel] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [readCounts, setReadCounts] = useState({}); // { msgId: count }

    // Auto-scroll to latest message
    const messagesEndRef = React.useRef(null);

    // Mobile View State: false = Channel List, true = Chat View
    const [showMobileChat, setShowMobileChat] = useState(false);

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.id === tournament.ownerId;
    // Fix infinite loop: tournament.channels might be undefined, causing [] to be new ref every render
    const channels = React.useMemo(() => tournament.channels || [], [tournament.channels]);

    // Initialize with NULL to show channel list first (on both mobile and desktop)
    const [activeChannelId, setActiveChannelId] = useState(null);

    const calcCounts = async () => {
        if (!tournament?.id || !currentUser?.id) return;
        const counts = {};
        for (const channel of channels) {
            counts[channel.id] = await storage.getUnreadCount(tournament.id, currentUser.id, channel.id);
        }
        setUnreadCounts(counts);
    };

    // Calculate unread counts for all channels
    useEffect(() => {
        calcCounts();
    }, [channels, tournament?.id, currentUser?.id]);

    // Auto-scroll when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Fetch read counts for messages
    useEffect(() => {
        if (!activeChannelId || messages.length === 0) return;

        const fetchReadCounts = async () => {
            const counts = {};
            await Promise.all(messages.map(async (msg) => {
                const count = await storage.getReadCount(tournament.id, activeChannelId, msg.timestamp);
                counts[msg.id] = count;
            }));
            setReadCounts(counts);
        };

        fetchReadCounts();

        // Refresh every 15 seconds while active
        const interval = setInterval(fetchReadCounts, 15000);
        return () => clearInterval(interval);
    }, [activeChannelId, messages]);

    useEffect(() => {
        // Only reset active channel if the currently selected one is deleted
        if (activeChannelId && channels.length > 0 && !channels.find(c => c.id === activeChannelId)) {
            setActiveChannelId(null); // Go back to list
        }
    }, [channels, activeChannelId]);

    const loadMessages = async () => {
        if (!activeChannelId) return;
        const chats = await storage.getChats(tournament.id, activeChannelId);
        setMessages(chats);

        // Mark as read after loading if messages exist
        if (chats.length > 0) {
            const latestMsg = chats[chats.length - 1];
            await storage.setLastRead(tournament.id, currentUser.id, activeChannelId, latestMsg.timestamp);
            calcCounts(); // Refresh unread badges count
        } else {
            // Even if no messages, mark the channel as entered
            await storage.setLastRead(tournament.id, currentUser.id, activeChannelId, new Date().toISOString());
            calcCounts();
        }
    };

    useEffect(() => {
        if (activeChannelId) {
            loadMessages();

            // On mobile, switch to chat view
            if (window.innerWidth <= 768) {
                setShowMobileChat(true);
            }
        }
    }, [tournament.id, activeChannelId]);

    // Supabase Realtime: subscribe to new messages
    useEffect(() => {
        if (!activeChannelId) return;

        const channel = supabase
            .channel(`messages:${tournament.id}:${activeChannelId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `tournament_id=eq.${tournament.id}`
                },
                (payload) => {
                    // Reload messages when any change happens
                    loadMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tournament.id, activeChannelId]);

    const handleAddChannel = () => {
        if (!newChannelName.trim()) return;
        const newChannelId = 'ch-' + Date.now();
        const updatedChannels = [...channels, { id: newChannelId, name: newChannelName }];
        onTournamentUpdate({ ...tournament, channels: updatedChannels });
        setNewChannelName('');
        setIsAddingChannel(false);
        // Set the newly created channel as active
        setActiveChannelId(newChannelId);
    };

    const handleDeleteChannel = (e, channelId) => {
        e.stopPropagation();
        if (!confirm('このチャンネルを削除しますか？メッセージも消える可能性があります。')) return;

        const updatedChannels = channels.filter(c => c.id !== channelId);
        onTournamentUpdate({ ...tournament, channels: updatedChannels });

        // If deleting the active channel, switch to the first available channel or null
        if (activeChannelId === channelId) {
            setActiveChannelId(updatedChannels.length > 0 ? updatedChannels[0].id : null);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageFile(reader.result);
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() && !imageFile) return;

        const chat = {
            id: 'chat-' + Date.now(),
            userId: currentUser.id,
            userName: currentUser.username,
            message: newMessage, // Ensure property name matches storage.js expectation (though storage.js was fixed to expect 'message' in msgObject, locally we use 'message')
            image: imageFile,
            timestamp: new Date().toISOString()
        };

        await storage.saveChat(tournament.id, chat, activeChannelId);
        // Update last read when sending a message
        await storage.setLastRead(tournament.id, currentUser.id, activeChannelId, new Date().toISOString());
        setNewMessage('');
        setImageFile(null);
        setImagePreview(null);
        loadMessages();
    };

    const handleEdit = (msg) => {
        setEditingId(msg.id);
        setEditText(msg.message);
    };

    const handleSaveEdit = async (msgId) => {
        await storage.updateChat(tournament.id, msgId, { message: editText }, activeChannelId);
        setEditingId(null);
        setEditText('');
        loadMessages();
    };

    const handleDelete = async (msgId) => {
        if (confirm('このメッセージを削除しますか？')) {
            await storage.deleteChat(tournament.id, msgId, activeChannelId);
            loadMessages();
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 250px) 1fr', height: '600px', border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }} className="chat-container">
            <style>{`
                @media (max-width: 768px) {
                    .chat-container {
                        position: fixed !important;
                        top: 60px !important; /* Below Navbar */
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 60px !important; /* Above Bottom Tabs (approx 50-60px) */
                        width: 100vw !important;
                        height: auto !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                        z-index: 50 !important;
                        background-color: #111827 !important;
                        border: none !important;
                        grid-template-columns: 1fr !important;
                    }
                    /* Master-Detail Logic for Mobile */
                    .chat-sidebar {
                        display: ${showMobileChat ? 'none' : 'flex'} !important;
                        width: 100%;
                        border-right: none !important;
                        height: 100% !important;
                    }
                    .chat-main {
                        display: ${showMobileChat ? 'flex' : 'none'} !important;
                        width: 100%;
                        height: 100% !important;
                    }
                }
            `}</style>
            {/* Sidebar: Channels */}
            <div className="chat-sidebar" style={{ backgroundColor: '#111827', borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>チャンネル</h3>
                    {isAdmin && (
                        <button
                            onClick={() => setIsAddingChannel(!isAddingChannel)}
                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}
                            title="チャンネル追加"
                        >
                            <Plus size={20} />
                        </button>
                    )}
                </div>

                {isAdmin && isAddingChannel && (
                    <div style={{ padding: '0.5rem', backgroundColor: '#374151' }}>
                        <input
                            type="text"
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            placeholder="チャンネル名"
                            style={{ width: '100%', padding: '0.25rem', marginBottom: '0.5rem', borderRadius: '4px', border: 'none' }}
                        />
                        <button
                            onClick={handleAddChannel}
                            style={{ width: '100%', padding: '0.25rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            作成
                        </button>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {channels.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                            {isAdmin ? (
                                <>
                                    <MessageCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                    <div>チャンネルがありません</div>
                                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>上の + ボタンから作成</div>
                                </>
                            ) : (
                                <>
                                    <MessageCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                    <div>チャンネルがありません</div>
                                </>
                            )}
                        </div>
                    ) : (
                        channels.map(channel => {
                            const unreadCount = unreadCounts[channel.id] || 0;
                            return (
                                <div
                                    key={channel.id}
                                    onClick={() => setActiveChannelId(channel.id)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        cursor: 'pointer',
                                        backgroundColor: activeChannelId === channel.id ? '#374151' : 'transparent',
                                        color: activeChannelId === channel.id ? 'white' : '#9ca3af',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span># {channel.name}</span>
                                        {unreadCount > 0 && activeChannelId !== channel.id && (
                                            <span style={{
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                minWidth: '20px',
                                                textAlign: 'center'
                                            }}>
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={(e) => handleDeleteChannel(e, channel.id)}
                                            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, display: 'flex' }}
                                            title="削除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Area: Messages */}
            <div className="chat-main" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: 0 }}>
                {activeChannelId ? (
                    <>
                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--card-border)', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Mobile Back Button */}
                            <button
                                className="mobile-back-btn"
                                onClick={() => setShowMobileChat(false)}
                                style={{
                                    display: 'none', // Hidden on desktop via CSS 
                                    background: 'none',
                                    border: 'none',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    marginRight: '4px'
                                }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <style>{`
                                @media (max-width: 768px) {
                                    .mobile-back-btn { display: flex !important; }
                                }
                            `}</style>
                            <span style={{ fontWeight: 'bold' }}># {channels.find(c => c.id === activeChannelId)?.name || 'Unknown'}</span>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#1f2937', minHeight: 0 }}>
                            {messages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                                    このチャンネルにはまだメッセージがありません
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isOwn = msg.senderId === currentUser.id;
                                    const isEditing = editingId === msg.id;

                                    return (
                                        <div key={msg.id} style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ maxWidth: '70%', backgroundColor: isOwn ? '#3b82f6' : '#374151', padding: '0.75rem', borderRadius: '8px', color: 'white' }}>
                                                <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.8, display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                    <span>{msg.senderName} • {new Date(msg.timestamp).toLocaleString('ja-JP')}</span>
                                                    {readCounts[msg.id] > 0 && (
                                                        <span style={{ fontSize: '0.7rem', color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>既読 {readCounts[msg.id]}</span>
                                                    )}
                                                </div>
                                                {isEditing ? (
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: 'none', marginBottom: '0.5rem' }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button onClick={() => handleSaveEdit(msg.id)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#22c55e', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>保存</button>
                                                            <button onClick={() => setEditingId(null)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#6b7280', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>キャンセル</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ wordBreak: 'break-word' }}>{msg.message}</div>
                                                        {msg.image && <img src={msg.image} alt="attachment" style={{ maxWidth: '100%', marginTop: '0.5rem', borderRadius: '4px' }} />}
                                                        {isOwn && (
                                                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                                <button onClick={() => handleEdit(msg)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>編集</button>
                                                                <button onClick={() => handleDelete(msg.id)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>削除</button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: '#111827', borderTop: '1px solid var(--card-border)', flexShrink: 0 }}>
                            {imagePreview && (
                                <div style={{ marginBottom: '0.5rem', position: 'relative', display: 'inline-block' }}>
                                    <img src={imagePreview} alt="preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }} />
                                    <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={`#${channels.find(c => c.id === activeChannelId)?.name || ''} にメッセージ送信...`}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#1f2937', color: 'white' }}
                                />
                                <label style={{ padding: '0.75rem', backgroundColor: '#374151', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <ImageIcon size={20} color="#9ca3af" />
                                    <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                                </label>
                                <button onClick={handleSend} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Send size={18} /> 送信
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937', color: '#6b7280' }}>
                        <MessageCircle size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>チャンネルを選択してください</div>
                        {isAdmin && (
                            <div style={{ fontSize: '0.9rem' }}>左側の + ボタンからチャンネルを作成できます</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- EntryTab Component ---
const EntryTab = ({ tournament, teams, onRegister, onUnregister, onUpdate, onTournamentUpdate }) => {
    const [teamName, setTeamName] = useState('');
    const [teamTag, setTeamTag] = useState('');
    const [teamIcon, setTeamIcon] = useState(null);
    const [members, setMembers] = useState([
        { name: '', tag: '', checkTag: true },
        { name: '', tag: '', checkTag: true }
    ]);
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [showRoster, setShowRoster] = useState(false);
    const [allPlayers, setAllPlayers] = useState([]);

    // Load players for roster
    useEffect(() => {
        const load = async () => {
            const players = await storage.getPlayers();
            setAllPlayers(players);
        };
        load();
    }, [teams]);

    const currentUser = storage.getCurrentUser();
    const isFull = teams.length >= (tournament.maxTeams || 20);
    const isAdmin = currentUser.id === tournament.ownerId || currentUser.role === 'superadmin';
    const isLocked = !!tournament.lockMembers;
    const tagRequired = tournament.tagRequired ?? true;
    const maxMembersLimit = tournament.maxMembers || 5;

    const resetForm = () => {
        setTeamName('');
        setTeamTag('');
        setTeamIcon(null);
        setMembers([{ name: '', tag: '', checkTag: true }, { name: '', tag: '', checkTag: true }]);
        setEditingTeamId(null);
    };

    const handleEdit = async (team) => {
        setEditingTeamId(team.id);
        setTeamName(team.name);
        setTeamTag(team.tag || '');
        setTeamIcon(team.icon || null);

        const allPlayers = await storage.getPlayers();
        const teamMembers = team.memberIds.map(mid => allPlayers.find(p => p.id === mid)).filter(Boolean);

        if (teamMembers.length > 0) {
            setMembers(teamMembers.map(p => ({
                name: p.name,
                tag: p.tags[0] || '',
                checkTag: true,
                isExisting: true
            })));
        } else {
            setMembers([{ name: '', tag: '', checkTag: true }, { name: '', tag: '', checkTag: true }]);
        }
    };

    const handleAddMemberSlot = () => {
        if (members.length >= maxMembersLimit) {
            alert(`1チームの最大人数（${maxMembersLimit}名）に達しています。`);
            return;
        }
        setMembers([...members, { name: '', tag: '', checkTag: true }]);
    };

    const handleMemberChange = (idx, field, value) => {
        const newMembers = [...members];
        newMembers[idx][field] = value;
        setMembers(newMembers);
    };

    const handleIconUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTeamIcon(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDefaultIconUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updated = { ...tournament, defaultIcon: reader.result };
                onTournamentUpdate(updated);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveDefaultIcon = () => {
        const updated = { ...tournament, defaultIcon: null };
        onTournamentUpdate(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Tag is only mandatory if tagRequired is true
        if (!teamName.trim() || (tagRequired && !teamTag.trim())) {
            alert(tagRequired ? 'チーム名とタグは必須です。' : 'チーム名を入力してください。');
            return;
        }

        const validMembers = members.filter(m => m.name.trim());
        if (validMembers.length === 0) {
            alert('少なくとも1人のメンバーを追加してください。');
            return;
        }

        for (const m of validMembers) {
            if (tagRequired && m.checkTag && teamTag && !m.name.includes(teamTag)) {
                alert(`エラー: プレイヤー "${m.name}" はチームタグ "${teamTag}" を含んでいません。\nタグを含めるか、"制限なし" を選択してください。`);
                return;
            }
        }

        if (validMembers.length > maxMembersLimit) {
            alert(`1チームの最大人数（${maxMembersLimit}名）を超えています。`);
            return;
        }

        const playerIds = [];
        for (const m of validMembers) {
            const savedPlayer = await storage.savePlayer({
                name: m.name,
                tags: m.tag ? [m.tag] : []
            });
            playerIds.push(savedPlayer.id);
        }

        const teamData = {
            id: editingTeamId,
            name: teamName,
            tag: teamTag,
            icon: teamIcon,
            memberIds: playerIds,
            tournamentId: tournament.id,
            ownerId: editingTeamId ? teams.find(t => t.id === editingTeamId).ownerId : currentUser.id
        };

        if (editingTeamId) {
            onUpdate(teamData);
        } else {
            onRegister(teamData);
        }

        resetForm();
    };

    return (
        <div className="entry-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Registration Form - Now at the Top */}
            <div className="card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editingTeamId ? <Edit size={20} /> : <UserPlus size={20} />}
                    {editingTeamId ? 'チーム編集' : 'チーム登録'}
                </h3>

                {(!editingTeamId && tournament.status !== 'upcoming' && tournament.status !== 'active') ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                        エントリー受付終了 ({tournament.status})
                    </div>
                ) : (!editingTeamId && isFull) ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px' }}>
                        満員
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }} className="form-grid">
                            {/* Icon & Basic Info */}
                            {/* Icon & Basic Info - Stacked on Mobile, Row on Desktop */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }} className="icon-name-row">
                                <style>{`
                                    @media (max-width: 600px) {
                                        .icon-name-row {
                                            flex-direction: column;
                                            align-items: center !important;
                                        }
                                        .input-row {
                                            flex-direction: row !important; /* Keep Name/Tag side-by-side even on mobile */
                                        }
                                    }
                                `}</style>
                                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#9ca3af' }}>アイコン</label>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        {(teamIcon || tournament.defaultIcon) ? (
                                            <div style={{ position: 'relative' }}>
                                                <img src={teamIcon || tournament.defaultIcon} alt="Icon Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }} />
                                                {teamIcon && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTeamIcon(null)}
                                                        style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <label style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                width: '60px', height: '60px', borderRadius: '50%',
                                                border: '2px dashed #4b5563', color: '#9ca3af', cursor: 'pointer',
                                                backgroundColor: '#1f2937'
                                            }}>
                                                <ImageIcon size={20} />
                                                <span style={{ fontSize: '0.5rem', marginTop: '2px' }}>UP</span>
                                                <input type="file" accept="image/*" onChange={handleIconUpload} style={{ display: 'none' }} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Team Name & Tag - Side by Side */}
                                <div style={{ flex: 1, width: '100%', display: 'flex', gap: '1rem' }} className="input-row">
                                    <div style={{ flex: 7 }}>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>チーム名</label>
                                        <input
                                            type="text"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            placeholder="例: Team Liquid"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--card-border)' }}
                                        />
                                    </div>
                                    <div style={{ flex: 3 }}>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>タグ</label>
                                        <input
                                            type="text"
                                            value={teamTag}
                                            onChange={(e) => setTeamTag(e.target.value)}
                                            placeholder="TL"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--card-border)' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Members */}
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        メンバー ({members.length}/{maxMembersLimit}) {isLocked && <span style={{ fontSize: '0.7rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>ロック中</span>}
                                    </label>
                                    {!isLocked && (
                                        <button
                                            type="button"
                                            onClick={handleAddMemberSlot}
                                            disabled={members.length >= maxMembersLimit}
                                            style={{
                                                fontSize: '0.8rem',
                                                color: members.length >= maxMembersLimit ? '#6b7280' : '#3b82f6',
                                                background: 'none',
                                                border: 'none',
                                                cursor: members.length >= maxMembersLimit ? 'not-allowed' : 'pointer',
                                                padding: 0,
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {members.length >= maxMembersLimit ? '上限到達' : '+ 追加'}
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                    {members.map((m, idx) => {
                                        const isActive = tournament.status === 'active';
                                        const isMemberLocked = (isActive && m.isExisting) || (isLocked && m.isExisting);
                                        const isValid = (tagRequired && m.checkTag && teamTag) ? m.name.includes(teamTag) : true;

                                        return (
                                            <div key={idx} style={{
                                                backgroundColor: 'rgba(255,255,255,0.03)',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid ' + (isValid ? 'var(--card-border)' : '#ef4444'),
                                                position: 'relative'
                                            }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                                    <div style={{ flex: 1, position: 'relative' }}>
                                                        <input
                                                            type="text"
                                                            value={m.name}
                                                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                                            placeholder={`名前 ${idx + 1}`}
                                                            disabled={isMemberLocked}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.4rem',
                                                                borderRadius: '4px',
                                                                border: '1px solid #374151',
                                                                fontSize: '0.85rem',
                                                                backgroundColor: isMemberLocked ? '#1f2937' : 'transparent',
                                                                color: isMemberLocked ? '#9ca3af' : 'inherit'
                                                            }}
                                                        />
                                                        {m.name && tagRequired && m.checkTag && (
                                                            <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                                                                {isValid ? <Check size={14} color="#22c55e" /> : <Ban size={14} color="#ef4444" title="タグが含まれていません" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!isMemberLocked && members.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setMembers(members.filter((_, i) => i !== idx))}
                                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>タグチェック</span>
                                                    <select
                                                        value={m.checkTag}
                                                        onChange={(e) => handleMemberChange(idx, 'checkTag', e.target.value === 'true')}
                                                        disabled={isMemberLocked || !tagRequired}
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            padding: '2px 4px',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#1f2937',
                                                            color: m.checkTag && tagRequired ? '#eab308' : '#6b7280',
                                                            border: '1px solid #374151'
                                                        }}
                                                    >
                                                        <option value="true">有効</option>
                                                        <option value="false">無効</option>
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                            {editingTeamId && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('このチームを削除しますか？')) {
                                                onUnregister(editingTeamId);
                                                resetForm();
                                            }
                                        }}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        削除
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#e5e7eb',
                                            color: '#374151',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        キャンセル
                                    </button>
                                </>
                            )}
                            <button
                                type="submit"
                                style={{
                                    padding: '0.5rem 2rem',
                                    backgroundColor: editingTeamId ? '#eab308' : '#8b5cf6',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                {editingTeamId ? 'チーム更新' : '登録する'}
                            </button>
                        </div>
                    </form>
                )
                }
            </div >

            {/* Team List - Now at the Bottom */}
            < div >
                <style>{`
                    .team-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1rem;
                    }
                    @media (max-width: 900px) {
                        .team-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                    @media (max-width: 600px) {
                        .team-grid {
                            grid-template-columns: repeat(3, 1fr); /* Force 3 cols on mobile as requested, or at least minmax */
                            gap: 0.5rem; /* Smaller gap on mobile */
                        }
                        .team-grid .card {
                             padding: 0.5rem !important; /* Smaller padding */
                        }
                        .team-grid h4 {
                            font-size: 0.8rem !important; /* Smaller text */
                        }
                         .form-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0 }}>参加チーム一覧 ({teams.length} / {tournament.maxTeams || 20}){(isFull && !editingTeamId) ? ' - 満員' : ''}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setShowRoster(!showRoster)}
                            style={{
                                padding: '6px 14px',
                                backgroundColor: showRoster ? '#8b5cf6' : '#1f2937',
                                color: showRoster ? 'white' : '#d1d5db',
                                border: '1px solid ' + (showRoster ? '#8b5cf6' : '#374151'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <BookOpen size={16} />
                            ロースター表
                        </button>

                        {isAdmin && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', backgroundColor: '#1f2937', padding: '4px 8px', borderRadius: '4px', border: '1px solid #374151' }}>
                                <span style={{ color: '#9ca3af' }}>デフォルトアイコン:</span>
                                {tournament.defaultIcon ? (
                                    <div style={{ position: 'relative' }}>
                                        <img src={tournament.defaultIcon} alt="Default" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <button
                                            onClick={handleRemoveDefaultIcon}
                                            title="削除"
                                            style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '8px' }}>
                                            X
                                        </button>
                                    </div>
                                ) : (
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
                                        <ImageIcon size={16} />
                                        <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>設定</span>
                                        <input type="file" accept="image/*" onChange={handleDefaultIconUpload} style={{ display: 'none' }} />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Roster Table */}
                {showRoster && (
                    <div style={{ marginBottom: '1.5rem', border: '1px solid #374151', borderRadius: '8px', backgroundColor: '#111827' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookOpen size={18} color="#8b5cf6" />
                                <span style={{ fontWeight: 'bold', color: '#e5e7eb' }}>ロースター表</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                {teams.length} チーム登録済
                            </span>
                        </div>
                        {teams.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>登録チームがありません</div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '1rem',
                                padding: '1rem',
                                maxHeight: '600px',
                                overflowY: 'auto'
                            }} className="no-scrollbar">
                                {teams.map((team, idx) => (
                                    <div key={team.id} style={{
                                        backgroundColor: '#1f293750',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <div style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#111827',
                                            borderBottom: '1px solid #374151',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {(team.icon || tournament.defaultIcon) ? (
                                                <img src={team.icon || tournament.defaultIcon} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #374151' }} />
                                            ) : (
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Target size={12} color="#9ca3af" />
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#eab308' }}>
                                                    {team.name}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>[{team.tag}]</div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {team.memberIds.map((mid, mIdx) => {
                                                const p = allPlayers.find(pl => pl.id === mid);
                                                return (
                                                    <div key={mid} style={{
                                                        fontSize: '0.85rem',
                                                        color: '#e5e7eb',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '4px 8px',
                                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                                        borderRadius: '4px'
                                                    }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#4b5563', width: '12px' }}>{mIdx + 1}</span>
                                                        <span style={{ flex: 1 }}>{p ? p.name : mid}</span>
                                                    </div>
                                                );
                                            })}
                                            {team.memberIds.length === 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#4b5563', textAlign: 'center', fontStyle: 'italic' }}>
                                                    メンバー未登録
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="team-grid">
                    {teams.map(team => {
                        const isTournamentOwner = currentUser.id === tournament.ownerId;
                        const isTeamCreator = team.ownerId === currentUser.id;
                        const canEdit = isTournamentOwner || isTeamCreator;
                        const canDelete = isTournamentOwner || isTeamCreator;
                        const displayIcon = team.icon || tournament.defaultIcon;

                        return (
                            <div
                                key={team.id}
                                className="card"
                                onClick={() => canEdit && handleEdit(team)}
                                style={{
                                    padding: '0.75rem',
                                    position: 'relative',
                                    border: editingTeamId === team.id ? '2px solid #8b5cf6' : isTeamCreator ? '2px solid #3b82f6' : '1px solid var(--card-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    cursor: canEdit ? 'pointer' : 'default',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (canEdit) {
                                        e.currentTarget.style.borderColor = '#8b5cf6';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (canEdit) {
                                        e.currentTarget.style.borderColor = editingTeamId === team.id ? '#8b5cf6' : isTeamCreator ? '#3b82f6' : 'var(--card-border)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                                        {displayIcon ? (
                                            <img
                                                src={displayIcon}
                                                alt={team.name}
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--card-border)' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Target size={16} color="#9ca3af" />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ overflow: 'hidden', flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</h4>
                                        <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>[{team.tag}]</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', paddingLeft: '42px' }}>
                                    {team.memberIds.length} members
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div >
        </div >
    );
};

// --- Sub Component: Result Input ---
const ResultInput = ({ tournament, teams, initialResults, onSave }) => {
    const [selectedRound, setSelectedRound] = useState(1);
    const [teamRank, setTeamRank] = useState({});
    const [teamPenalty, setTeamPenalty] = useState({});
    const [teamBonus, setTeamBonus] = useState({});
    const [memberKills, setMemberKills] = useState({});
    const [allPlayers, setAllPlayers] = useState([]);
    const [rules, setRules] = useState(storage.DEFAULT_RULES);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            const players = await storage.getPlayers();
            setAllPlayers(players);
            // Prioritize tournament-specific rules
            const tournamentRules = tournament.scoringRules || await storage.getSettings() || storage.DEFAULT_RULES;

            // Normalize rules to ensure all properties exist
            const normalized = {
                killPoint: tournamentRules.killPoint ?? tournamentRules.killPoints ?? 1,
                rankPoints: tournamentRules.rankPoints || (tournamentRules.placement ? Object.values(tournamentRules.placement) : storage.DEFAULT_RULES.rankPoints)
            };
            setRules(normalized);
        };
        loadInitialData();
    }, [tournament]);

    // Load data when round changes
    useEffect(() => {
        const roundKey = 'round' + selectedRound;
        const currentRoundData = initialResults[roundKey] || {};

        const initRank = {};
        const initPenalty = {};
        const initBonus = {};
        const initMemberKills = {};

        teams.forEach(team => {
            // Team Rank
            if (currentRoundData[team.id]) {
                initRank[team.id] = currentRoundData[team.id].rank;
                initPenalty[team.id] = currentRoundData[team.id].penalty || '';
                initBonus[team.id] = currentRoundData[team.id].bonus || '';
                // Load member kills if exist
                if (currentRoundData[team.id].memberKills) {
                    initMemberKills[team.id] = currentRoundData[team.id].memberKills;
                } else {
                    // Initialize empty for each member
                    initMemberKills[team.id] = {};
                    team.memberIds.forEach(mid => {
                        initMemberKills[team.id][mid] = ''; // Default to empty
                    });
                }
            } else {
                initRank[team.id] = '';
                initPenalty[team.id] = ''; // Default to empty
                initBonus[team.id] = '';
                initMemberKills[team.id] = {};
                team.memberIds.forEach(mid => {
                    initMemberKills[team.id][mid] = ''; // Default to empty
                });
            }
        });
        setTeamRank(initRank);
        setTeamPenalty(initPenalty);
        setTeamBonus(initBonus);
        setMemberKills(initMemberKills);
    }, [selectedRound, teams, initialResults]);

    const handleRankChange = (teamId, val) => {
        setTeamRank(prev => ({ ...prev, [teamId]: val }));
    };

    const handleKillChange = (teamId, memberId, val) => {
        setMemberKills(prev => ({
            ...prev,
            [teamId]: {
                ...prev[teamId],
                // If val is empty string, keep it as empty string. Otherwise parse int.
                [memberId]: val === '' ? '' : (parseInt(val) || 0)
            }
        }));
    };

    const handleSave = async () => {
        const roundKey = 'round' + selectedRound;

        // Reload latest results from DB before saving to avoid overwriting
        const latestResults = await storage.getResults(tournament.id);

        let savedCount = 0;
        for (const team of teams) {
            const rank = parseInt(teamRank[team.id]) || 0;

            // Skip teams with no data entered (rank is 0/empty)
            // This prevents overwriting data entered by other admins
            if (rank === 0 && !teamRank[team.id]) continue;

            // Calculate total team kills
            const teamMemberKills = memberKills[team.id] || {};
            let totalTeamKills = 0;
            // Treat empty string/undefined as 0 for calculation
            Object.values(teamMemberKills).forEach(k => totalTeamKills += (Number(k) || 0));

            const penalty = parseInt(teamPenalty[team.id]) || 0;
            const bonus = parseInt(teamBonus[team.id]) || 0;

            // Calculate Points
            // rank points (rank is 1-indexed, array is 0-indexed)
            const placementPoints = (rules.rankPoints && rules.rankPoints[rank - 1] !== undefined)
                ? rules.rankPoints[rank - 1]
                : 0;

            const killPoints = totalTeamKills * (rules.killPoint ?? 1);
            const totalPoints = placementPoints + killPoints - penalty + bonus;

            // Save only this team's result
            await storage.saveResult(tournament.id, roundKey, team.id, {
                rank: rank,
                kills: totalTeamKills,
                penalty: penalty,
                bonus: bonus,
                memberKills: teamMemberKills,
                totalPoints: totalPoints
            });
            savedCount++;
        }
        alert('ラウンド ' + selectedRound + ' を保存しました（' + savedCount + 'チーム）');
        onSave();
    };

    const getPlayerName = (id) => {
        const p = allPlayers.find(p => p.id === id);
        return p ? p.name : id;
    };

    // Filter Logic
    const filteredTeams = teams.filter(team => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;

        // Check Team Name
        if (team.name.toLowerCase().includes(term) || (team.tag && team.tag.toLowerCase().includes(term))) return true;

        // Check Member Names
        const hasMemberMatch = team.memberIds.some(mid => {
            const name = getPlayerName(mid);
            return name.toLowerCase().includes(term);
        });

        return hasMemberMatch;
    });

    // Helper to highlight text
    const HighlightText = ({ text, highlight }) => {
        if (!highlight) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? <span key={i} style={{ backgroundColor: '#eab308', color: '#000' }}>{part}</span> : part
                )}
            </span>
        );
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            {/* Header: Round Select & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px', border: '1px solid #374151', position: 'sticky', top: '10px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: 'bold', color: '#e5e7eb' }}>ラウンド:</label>
                    <select
                        value={selectedRound}
                        onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#111827', color: 'white', fontWeight: 'bold' }}
                    >
                        {(() => {
                            if (tournament.schedule && tournament.schedule.length > 0) {
                                let globalRound = 1;
                                return tournament.schedule.map((day, dIdx) => {
                                    const dayOptions = [...Array(day.rounds)].map((_, i) => (
                                        <option key={globalRound + i} value={globalRound + i}>
                                            {day.name} - ラウンド {i + 1}
                                        </option>
                                    ));
                                    globalRound += day.rounds;
                                    return <optgroup key={dIdx} label={day.name}>{dayOptions}</optgroup>;
                                });
                            } else {
                                return [...Array(tournament.rounds)].map((_, i) => (
                                    <option key={i} value={i + 1}>ラウンド {i + 1}</option>
                                ));
                            }
                        })()}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', width: '220px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                                backgroundColor: '#111827',
                                border: '1px solid #4b5563',
                                borderRadius: '6px',
                                color: 'white',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '0.6rem 1.2rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.5)',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        保存
                    </button>
                </div>
            </div>

            <div className="input-grid" style={{ paddingBottom: '80px' }}>
                {filteredTeams.map(team => (
                    <div key={team.id} className="mobile-input-card" style={{ backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #374151' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#f3f4f6' }}>
                                    <HighlightText text={team.name} highlight={searchTerm} />
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{team.tag || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase' }}>ボーナス</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={teamBonus[team.id] !== undefined ? teamBonus[team.id] : ''}
                                        onChange={(e) => setTeamBonus(prev => ({ ...prev, [team.id]: e.target.value }))}
                                        style={{ width: '40px', padding: '0.3rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #3b82f6', color: '#3b82f6', backgroundColor: '#111827', fontWeight: 'bold' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>ペナルティ</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={teamPenalty[team.id] !== undefined ? teamPenalty[team.id] : ''}
                                        onChange={(e) => setTeamPenalty(prev => ({ ...prev, [team.id]: e.target.value }))}
                                        style={{ width: '40px', padding: '0.3rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #ef4444', color: '#ef4444', backgroundColor: '#111827', fontWeight: 'bold' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.65rem', color: '#eab308', fontWeight: 'bold', textTransform: 'uppercase' }}>順位</label>
                                    <input
                                        type="number"
                                        min="1" max="20"
                                        value={teamRank[team.id] !== undefined ? teamRank[team.id] : ''}
                                        onChange={(e) => handleRankChange(team.id, e.target.value)}
                                        style={{ width: '50px', padding: '0.3rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #eab308', color: '#eab308', backgroundColor: '#111827', fontWeight: 'bold', fontSize: '1.1rem' }}
                                        placeholder="-"
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                            {team.memberIds.map(mid => (
                                <div key={mid} className="member-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', padding: '0.5rem', borderRadius: '4px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>
                                        <HighlightText text={getPlayerName(mid)} highlight={searchTerm} />
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={memberKills[team.id]?.[mid] !== undefined ? memberKills[team.id]?.[mid] : ''}
                                            onChange={(e) => handleKillChange(team.id, mid, e.target.value)}
                                            style={{ width: '40px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#1f2937', color: 'white', textAlign: 'center' }}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>K</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>


        </div>
    );
};

const PlayerRankingTable = ({ tournament, teams, results, dayFilter, standings }) => {
    const [players, setPlayers] = useState([]);

    // Helper to get round range
    const getRoundRange = () => {
        if (dayFilter === 'total') return [1, tournament.rounds];

        let start = 1;
        for (let i = 0; i < dayFilter; i++) {
            start += (tournament.schedule[i].rounds || 0);
        }
        const end = start + (tournament.schedule[dayFilter].rounds || 0) - 1;
        return [start, end];
    };

    useEffect(() => {
        const loadStats = async () => {
            const allPlayers = await storage.getPlayers();
            const playerStats = [];
            const [startRound, endRound] = getRoundRange();

            // Map teamId to teamName for easy lookup
            const teamMap = {};
            teams.forEach(t => teamMap[t.id] = t.name);

            teams.forEach(team => {
                team.memberIds.forEach(mid => {
                    const player = allPlayers.find(p => p.id === mid);
                    if (!player) return;

                    let totalKills = 0;
                    for (let r = startRound; r <= endRound; r++) {
                        const roundKey = 'round' + r;
                        if (results[roundKey] && results[roundKey][team.id] && results[roundKey][team.id].memberKills) {
                            totalKills += (results[roundKey][team.id].memberKills[mid] || 0);
                        }
                    }

                    if (totalKills > 0) { // Optional: Hide players with 0 kills? Or show all? User usually wants top.
                        playerStats.push({
                            id: mid,
                            name: player.name,
                            teamName: teamMap[team.id],
                            totalKills
                        });
                    }
                });
            });
            // Use the standings prop for team context
            const teamContextMap = {};
            standings.forEach((s, sIdx) => {
                teamContextMap[s.id] = {
                    rank: s.rank,
                    totalPoints: s.totalPoints,
                    sortOrder: sIdx // Use the sorted index as a definitive tiebreaker
                };
            });

            // Enhance player stats with team context for sorting
            const enhancedStats = playerStats.map(p => {
                const teamId = teams.find(t => teamMap[t.id] === p.teamName)?.id;
                const teamCtx = teamContextMap[teamId];
                return {
                    ...p,
                    teamRank: teamCtx?.rank || 99,
                    teamTotalPoints: teamCtx?.totalPoints || 0,
                    teamSortOrder: teamCtx?.sortOrder ?? 999
                };
            });

            enhancedStats.sort((a, b) => {
                if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
                // If kills are tied, use team's standings sort order
                return a.teamSortOrder - b.teamSortOrder;
            });

            // Apply Olympic rank for players
            let currentRank = 1;
            const rankedPlayers = enhancedStats.map((p, idx) => {
                if (idx > 0 && p.totalKills < enhancedStats[idx - 1].totalKills) {
                    currentRank = idx + 1;
                }
                return { ...p, rank: currentRank };
            });

            setPlayers(rankedPlayers);
        };
        loadStats();
    }, [tournament, teams, results, dayFilter]);

    return (
        <div style={{ marginTop: '1.5rem', overflowX: 'auto' }} className="no-scrollbar">
            <table className="mobile-compact-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--card-border)', backgroundColor: 'transparent' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'center', width: '60px' }}>順位</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>プレイヤー</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>チーム</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>総キル数</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: p.rank < 4 ? '#eab308' : '#374151' }}>
                                {p.rank}
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: '600' }}>{p.name}</td>
                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{p.teamName}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#dc2626' }}>
                                {p.totalKills}
                            </td>
                        </tr>
                    ))}
                    {players.length === 0 && (
                        <tr>
                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                キルデータはまだありません。
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};



const DeleteTournamentButton = ({ onDelete }) => {
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: 'bold' }}>本当に？</span>
                {(storage.getCurrentUser()?.role === 'admin' || storage.getCurrentUser()?.role === 'superadmin') && (
                    <button
                        onClick={onDelete}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 'bold'
                        }}
                    >
                        <Trash2 size={18} /> 大会を削除
                    </button>
                )}
                <button
                    onClick={() => setConfirming(false)}
                    style={{
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    キャンセル
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            title="大会を削除"
            style={{
                backgroundColor: 'transparent',
                color: '#ef4444',
                padding: '8px',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
            <Trash2 size={20} />
        </button>
    );
};

const TournamentDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [tournament, setTournament] = useState(null);
    const [teams, setTeams] = useState([]);
    const [results, setResults] = useState({});
    const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'input' | 'players'
    const [dayFilter, setDayFilter] = useState('total'); // 'total' | 0 | 1 ...
    const [showScheduleEdit, setShowScheduleEdit] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [showTotalDetails, setShowTotalDetails] = useState(false); // Toggle for Total View details
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);

    const currentUser = storage.getCurrentUser();
    const canManage = currentUser?.id === tournament?.ownerId || currentUser?.role === 'superadmin';

    // Add padding to body/container to prevent content being hidden by fixed footer
    useEffect(() => {
        const originalPadding = document.body.style.paddingBottom;
        document.body.style.paddingBottom = '80px'; // Height of the footer + spacing
        return () => {
            document.body.style.paddingBottom = originalPadding;
        };
    }, []);

    useEffect(() => {
        const loadData = async () => {
            const tournaments = await storage.getTournaments();
            const t = tournaments.find(t => t.id === id);
            if (t) {
                setTournament(t);
                const [tTeams, resultsData] = await Promise.all([
                    storage.getTeams(id), // Fetch by tournament ID
                    storage.getResults(id)
                ]);
                setTeams(tTeams);
                setResults(resultsData);
            }
        };
        loadData();
    }, [id]);

    // Realtime: subscribe to tournament changes (for channel sync)
    useEffect(() => {
        if (!id) return;
        const channel = supabase
            .channel(`tournament:${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tournaments',
                    filter: `id=eq.${id}`
                },
                async (payload) => {
                    // Reload tournament data when it's updated
                    const tournaments = await storage.getTournaments();
                    const updated = tournaments.find(t => t.id === id);
                    if (updated) setTournament(updated);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    // Calculate total unread count
    useEffect(() => {
        const calcUnread = async () => {
            if (!tournament || !currentUser) return;
            let total = 0;
            const channels = tournament.channels || [];
            for (const c of channels) {
                const count = await storage.getUnreadCount(tournament.id, currentUser.id, c.id);
                total += count;
            }
            setTotalUnreadCount(total);
        };

        // Initial calc
        calcUnread();

        // Poll every few seconds to keep badge updated
        const interval = setInterval(calcUnread, 3000);
        return () => clearInterval(interval);
    }, [tournament, currentUser?.id, activeTab]); // Re-calc when tab or tournament changes

    const handleStatusChange = async (newStatus) => {
        const updated = { ...tournament, status: newStatus };
        await storage.saveTournament(updated);
        setTournament(updated);
    };

    const handleDelete = async () => {
        // No window.confirm needed, handled by button UI
        await storage.deleteTournament(id);
        navigate('/');
    };

    const handleScheduleSave = async (newSchedule) => {
        const totalRounds = newSchedule.reduce((sum, day) => sum + parseInt(day.rounds || 0), 0);

        const updated = {
            ...tournament,
            schedule: newSchedule,
            rounds: totalRounds,
            date: newSchedule[0].date // Sync main date
        };
        await storage.saveTournament(updated);
        setTournament(updated);
        setShowScheduleEdit(false);
    };

    const handleTournamentUpdate = async (updatedTournament) => {
        await storage.saveTournament(updatedTournament);
        setTournament(updatedTournament);
    };

    if (!tournament) return <div className="container">Loading...</div>;

    // --- Calculation Helper ---
    // --- Calculation Helper ---
    const calculateStandings = () => {
        // Determine round range based on dayFilter
        let startRound = 1;
        let endRound = tournament.rounds;

        if (dayFilter !== 'total') {
            let start = 1;
            for (let i = 0; i < dayFilter; i++) {
                start += (tournament.schedule[i].rounds || 0);
            }
            startRound = start;
            endRound = start + (tournament.schedule[dayFilter].rounds || 0) - 1;
        }

        const standingsData = teams.map(team => {
            let totalPoints = 0;
            let placementPointsTotal = 0;
            let totalKills = 0;
            let bonusPointsTotal = 0;
            let playedRounds = 0;
            let wins = 0;

            for (let r = startRound; r <= endRound; r++) {
                const roundKey = 'round' + r;
                if (results[roundKey] && results[roundKey][team.id]) {
                    const res = results[roundKey][team.id];

                    const rank = res.rank || 0;
                    const pPoints = (tournament.scoringRules?.rankPoints && rank > 0)
                        ? (tournament.scoringRules.rankPoints[rank - 1] || 0)
                        : 0;
                    const kp = tournament.scoringRules?.killPoint ?? 1;
                    const kPoints = (res.kills || 0) * kp;
                    const bPoints = res.bonus || 0;
                    const penalty = res.penalty || 0;

                    placementPointsTotal += pPoints;
                    totalKills += (res.kills || 0);
                    bonusPointsTotal += bPoints;
                    totalPoints += (pPoints + kPoints + bPoints - penalty);

                    if (res.rank === 1) wins++;
                    playedRounds++;
                }
            }

            return {
                ...team,
                totalPoints,
                placementPoints: placementPointsTotal,
                killPoints: totalKills * (tournament.scoringRules?.killPoint ?? 1),
                totalKills,
                wins,
                bonusPoints: bonusPointsTotal,
                playedRounds
            };
        });

        const tiebreakerPriorities = tournament.tiebreakers || ['placementPoints', 'wins', 'killPoints', 'bonusPoints'];

        // Multi-level sorting
        const sorted = standingsData.sort((a, b) => {
            // First Priority: Total Points
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;

            // Tiebreakers
            for (const priority of tiebreakerPriorities) {
                if (b[priority] !== a[priority]) {
                    return b[priority] - a[priority];
                }
            }
            return 0;
        });

        // Assign Olympic Rank
        let currentRank = 1;
        const rankedResults = sorted.map((team, idx) => {
            if (idx > 0) {
                const prev = sorted[idx - 1];
                let isTied = prev.totalPoints === team.totalPoints;
                if (!isTied) {
                    currentRank = idx + 1;
                }
            }
            return { ...team, rank: currentRank };
        });

        return rankedResults;
    };

    const standings = calculateStandings();

    return (
        <div className="container">
            {showScheduleEdit && (
                <EditScheduleModal
                    tournament={tournament}
                    onClose={() => setShowScheduleEdit(false)}
                    onSave={handleScheduleSave}
                />

            )}
            {showRulesModal && (
                <TournamentSettingsModal
                    tournament={tournament}
                    onClose={() => setShowRulesModal(false)}
                    canEdit={canManage}
                    onSave={async (updated) => {
                        await handleTournamentUpdate(updated);
                        setShowRulesModal(false);
                    }}
                />
            )}

            {/* Sticky Header Wrapper */}
            <div style={{ position: 'sticky', top: '64px', zIndex: 900, backgroundColor: '#111827', paddingBottom: '1rem', marginTop: '-1rem', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', textDecoration: 'none' }}>
                        <ArrowLeft size={18} /> 掲示板に戻る
                    </Link>

                    {/* Status Dropdown - Moved to Top Right - Manage Perms Only */}
                    {canManage ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                                value={tournament.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                style={{
                                    padding: '4px 8px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    border: '1px solid #4b5563',
                                    backgroundColor: tournament.status === 'active' ? '#166534' : tournament.status === 'upcoming' ? '#1e40af' : '#4b5563',
                                    color: 'white',
                                    cursor: 'pointer',
                                    minWidth: '100px'
                                }}
                            >
                                <option value="upcoming">開催前</option>
                                <option value="active">開催中</option>
                                <option value="finished">終了</option>
                            </select>
                        </div>
                    ) : (
                        <span style={{
                            padding: '4px 8px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            backgroundColor: tournament.status === 'active' ? '#166534' : tournament.status === 'upcoming' ? '#1e40af' : '#4b5563',
                            color: 'white'
                        }}>
                            {tournament.status.toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="card" style={{ borderTop: '4px solid #eab308' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap', width: '100%' }}>

                                {/* Delete Button - Left of Title */}
                                {canManage && (
                                    <DeleteTournamentButton onDelete={handleDelete} />
                                )}

                                <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: '1' }}>{tournament.name}</h1>

                                {/* Edit Button - Right of Title */}
                                {canManage && (
                                    <button
                                        onClick={() => setShowScheduleEdit(true)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: '4px' }}
                                        title="スケジュール編集"
                                    >
                                        <Edit size={20} />
                                    </button>
                                )}
                            </div>
                            <p style={{ color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {tournament.date} • {teams.length} チーム • {tournament.rounds} ラウンド

                                <button
                                    onClick={() => setShowRulesModal(true)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#eab308',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: 0,
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    <BookOpen size={16} /> ルール・設定 {canManage ? '修正' : '確認'}
                                </button>
                            </p>
                            {tournament.tags && tournament.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {tournament.tags.map((tag, idx) => (
                                        <span key={idx} style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            padding: '4px 10px',
                                            borderRadius: '16px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Ban size={12} /> {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {/* Share Code Section - Admin Only */}
                            {canManage && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(234, 179, 8, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ backgroundColor: '#eab308', color: 'black', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Key size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>アクセスコード</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'white' }}>{tournament.shareCode}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(tournament.shareCode);
                                                alert('コードをコピーしました');
                                            }}
                                            style={{
                                                background: '#374151',
                                                border: 'none',
                                                color: 'white',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Copy size={14} /> コピー
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm('重要: アクセスコードを再生成しますか？\n現在のコードを知っている一般ユーザーは、次回からこの大会を見られなくなります。')) {
                                                    try {
                                                        const newCode = await storage.regenerateTournamentShareCode(tournament.id);
                                                        setTournament({ ...tournament, shareCode: newCode });
                                                    } catch (e) {
                                                        alert('エラーが発生しました: ' + e.message);
                                                    }
                                                }
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #4b5563',
                                                color: '#9ca3af',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <RefreshCw size={14} /> 再生成
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>



                </div>

                {/* Bottom Tab Bar (Fixed) */}
                <div className="mobile-tabs-container no-scrollbar" style={{
                    display: 'flex',
                    gap: '0',
                    // borderBottom: '1px solid var(--card-border)', 
                    // marginBottom: '1.5rem', 
                    // overflowX: 'auto', 
                    // whiteSpace: 'nowrap', 
                    // paddingBottom: '0.5rem',

                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#1f2937',
                    borderTop: '1px solid #374151',
                    zIndex: 1000,
                    justifyContent: 'space-around',
                    padding: '0.5rem 0'
                }}>
                    <button
                        onClick={() => setActiveTab('standings')}
                        style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            borderTop: activeTab === 'standings' ? '2px solid #eab308' : '2px solid transparent',
                            color: activeTab === 'standings' ? '#eab308' : '#6b7280',
                            fontWeight: activeTab === 'standings' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            fontSize: '0.7rem',
                            flex: 1
                        }}
                    >
                        <Trophy size={20} style={{ marginBottom: '4px' }} />
                        順位表
                    </button>
                    <button
                        onClick={() => setActiveTab('players')}
                        style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            borderTop: activeTab === 'players' ? '2px solid #ef4444' : '2px solid transparent',
                            color: activeTab === 'players' ? '#ef4444' : '#6b7280',
                            fontWeight: activeTab === 'players' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            fontSize: '0.7rem',
                            flex: 1
                        }}
                    >
                        <Target size={20} style={{ marginBottom: '4px' }} />
                        キル
                    </button>

                    {/* Entry / Registration Tab */}
                    <button
                        onClick={() => setActiveTab('entry')}
                        style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            borderTop: activeTab === 'entry' ? '2px solid #8b5cf6' : '2px solid transparent',
                            color: activeTab === 'entry' ? '#8b5cf6' : '#6b7280',
                            fontWeight: activeTab === 'entry' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            fontSize: '0.7rem',
                            flex: 1
                        }}
                    >
                        <UserPlus size={20} style={{ marginBottom: '4px' }} />
                        参加
                    </button>

                    {/* Result Entry - Only Tournament Creator (Owner) */}
                    {(storage.getCurrentUser()?.id === tournament.ownerId) && (
                        <button
                            onClick={() => setActiveTab('input')}
                            style={{
                                padding: '0.5rem',
                                background: 'none',
                                border: 'none',
                                borderTop: activeTab === 'input' ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === 'input' ? '#3b82f6' : '#6b7280',
                                fontWeight: activeTab === 'input' ? 'bold' : 'normal',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                fontSize: '0.7rem',
                                flex: 1
                            }}
                        >
                            <Edit size={20} style={{ marginBottom: '4px' }} />
                            入力
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('chat')}
                        style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            borderTop: activeTab === 'chat' ? '2px solid #10b981' : '2px solid transparent',
                            color: activeTab === 'chat' ? '#10b981' : '#6b7280',
                            fontWeight: activeTab === 'chat' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            fontSize: '0.7rem',
                            flex: 1,
                            position: 'relative'
                        }}
                    >
                        <MessageCircle size={20} style={{ marginBottom: '4px' }} />
                        {totalUnreadCount > 0 && activeTab !== 'chat' && (
                            <span style={{
                                position: 'absolute',
                                top: '4px',
                                right: '20%',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                fontSize: '0.6rem',
                                fontWeight: 'bold',
                                padding: '2px 5px',
                                borderRadius: '10px',
                                minWidth: '16px',
                                textAlign: 'center',
                                border: '1px solid #1f2937'
                            }}>
                                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                            </span>
                        )}
                        チャット
                    </button>
                </div>

                {activeTab === 'standings' && (
                    <div style={{ marginTop: '1.5rem', overflowX: 'auto' }} className="no-scrollbar">
                        {/* Day Filter UI for Standings */}
                        {tournament.schedule && tournament.schedule.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                    onClick={() => setDayFilter('total')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        border: '1px solid',
                                        borderColor: dayFilter === 'total' ? '#eab308' : '#374151',
                                        backgroundColor: dayFilter === 'total' ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                                        color: dayFilter === 'total' ? '#eab308' : '#9ca3af',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    合計
                                </button>
                                {tournament.schedule.map((day, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setDayFilter(idx)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            border: '1px solid',
                                            borderColor: dayFilter === idx ? '#eab308' : '#374151',
                                            backgroundColor: dayFilter === idx ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                                            color: dayFilter === idx ? '#eab308' : '#9ca3af',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {day.name}
                                    </button>
                                ))}

                                {/* Toggle Button for Total View */}
                                {dayFilter === 'total' && (
                                    <button
                                        onClick={() => setShowTotalDetails(!showTotalDetails)}
                                        style={{
                                            marginLeft: 'auto',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid #4b5563',
                                            backgroundColor: '#374151',
                                            color: '#e5e7eb',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        {showTotalDetails ? '詳細を隠す' : '全体を見る'}
                                    </button>
                                )}
                            </div>
                        )}

                        <table className="mobile-compact-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--card-border)' }}>
                                    <th rowSpan="2" style={{ padding: '0.75rem', textAlign: 'center', width: '30px', borderRight: '1px solid var(--card-border)' }}>#</th>
                                    <th rowSpan="2" style={{ padding: '0.75rem', textAlign: 'left', minWidth: '80px', borderRight: '1px solid var(--card-border)' }}>チーム</th>
                                    <th rowSpan="2" style={{ padding: '0.75rem', textAlign: 'center', width: '30px', borderRight: '1px solid var(--card-border)' }}>勝</th>

                                    <th colSpan="2" style={{ padding: '0.5rem', textAlign: 'center', backgroundColor: '#374151' }}>TOTAL</th>

                                    {/* Header Logic: Total vs Day Filter */}
                                    {dayFilter === 'total' ? (
                                        // Total View: Show Day Headers ONLY if showTotalDetails is true
                                        showTotalDetails ? (
                                            tournament.schedule && tournament.schedule.map((day, idx) => (
                                                <th key={idx} colSpan="3" style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid var(--card-border)', backgroundColor: '#1f2937' }}>
                                                    {day.name} <br /><span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>Total</span>
                                                </th>
                                            ))
                                        ) : null // Hide Day headers in simplified view
                                    ) : (
                                        // Single Day View: Show Rounds
                                        (() => {
                                            const day = tournament.schedule[dayFilter];
                                            return (
                                                <>
                                                    <th colSpan={(day.rounds * 4) + 1} style={{ padding: '0.5rem', textAlign: 'center', borderRight: '2px solid var(--card-border)', backgroundColor: '#1f2937' }}>
                                                        {day.name} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({day.date})</span>
                                                    </th>
                                                </>
                                            );
                                        })()
                                    )}
                                </tr>
                                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.8rem' }}>
                                    <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)', backgroundColor: '#374151', minWidth: '60px' }}>Pts</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'center', backgroundColor: '#374151', minWidth: '60px' }}>Kills</th>

                                    {/* Sub-header Loop */}
                                    {dayFilter === 'total' ? (
                                        // Total View Sub-headers
                                        showTotalDetails ? (
                                            tournament.schedule && tournament.schedule.map((_, idx) => (
                                                <React.Fragment key={idx}>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '40px', color: '#eab308' }}>Pts</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '40px' }}>Kills</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '50px', borderRight: '1px solid var(--card-border)', fontWeight: 'bold' }}>Total</th>
                                                </React.Fragment>
                                            ))
                                        ) : null
                                    ) : (
                                        // Single Day View Sub-headers
                                        (() => {
                                            const day = tournament.schedule[dayFilter];
                                            return (
                                                <>
                                                    {[...Array(day.rounds)].map((_, rIdx) => (
                                                        <React.Fragment key={rIdx}>
                                                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '35px' }}>R{rIdx + 1}</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '35px' }}>K</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '35px', color: '#ef4444' }}>P</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'center', width: '40px', borderRight: '1px solid var(--card-border)', fontWeight: 'bold' }}>Pt</th>
                                                        </React.Fragment>
                                                    ))}
                                                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '50px', borderRight: '2px solid var(--card-border)', fontWeight: 'bold', color: 'var(--text-main)', backgroundColor: 'rgba(255,255,255,0.05)' }}>Day Total</th>
                                                </>
                                            );
                                        })()
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((team, idx) => (
                                    <tr key={team.id} style={{
                                        borderBottom: '1px solid var(--card-border)',
                                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: team.rank < 4 ? '#eab308' : 'var(--text-muted)', borderRight: '1px solid var(--card-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.05)' }}>
                                            {team.rank}
                                        </td>
                                        <td style={{ padding: '0.75rem', borderRight: '1px solid var(--card-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {(team.icon || tournament.defaultIcon) ? (
                                                    <img
                                                        src={team.icon || tournament.defaultIcon}
                                                        alt={team.name}
                                                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--card-border)' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Target size={14} color="#9ca3af" />
                                                    </div>
                                                )}
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{team.name}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--card-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2px' }}>
                                                {[...Array(team.wins || 0)].map((_, i) => (
                                                    <Crown key={i} size={14} color="#f2a900" fill="#f2a900" />
                                                ))}
                                                {(team.wins || 0) === 0 && <span style={{ color: '#4b5563' }}>-</span>}
                                            </div>
                                        </td>

                                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#f2a900', backgroundColor: 'rgba(242, 169, 0, 0.1)' }}>
                                            {team.totalPoints}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'rgba(242, 169, 0, 0.05)' }}>
                                            {team.totalKills}
                                        </td>

                                        {/* Body Cells */}
                                        {dayFilter === 'total' ? (
                                            // Total View: Show Day Summaries ONLY if showTotalDetails is true
                                            showTotalDetails ? (
                                                tournament.schedule && tournament.schedule.map((day, dIdx) => {
                                                    let dayKillPoints = 0;
                                                    let dayTotalPoints = 0;
                                                    let dayPenalty = 0;

                                                    // Identify rounds for this day
                                                    let startR = 1;
                                                    for (let i = 0; i < dIdx; i++) startR += tournament.schedule[i].rounds;

                                                    for (let r = 0; r < day.rounds; r++) {
                                                        const rKey = 'round' + (startR + r);
                                                        const rData = results[rKey]?.[team.id] || {};
                                                        const rKills = rData.kills || 0;
                                                        const rRank = rData.rank || 0;
                                                        const rPenalty = rData.penalty || 0;

                                                        const rPlacementPoints = (tournament.scoringRules?.rankPoints && rRank > 0)
                                                            ? (tournament.scoringRules.rankPoints[rRank - 1] || 0)
                                                            : 0;
                                                        const rKp = tournament.scoringRules?.killPoint ?? 1;
                                                        const rTotal = rPlacementPoints + (rKills * rKp) - rPenalty;

                                                        dayKillPoints += rKills;
                                                        dayTotalPoints += rTotal;
                                                        dayPenalty += rPenalty;
                                                    }

                                                    const dayRankPoints = dayTotalPoints - dayKillPoints + dayPenalty;

                                                    return (
                                                        <React.Fragment key={dIdx}>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#eab308', fontSize: '0.9rem' }}>
                                                                {dayRankPoints}
                                                            </td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                                                {dayKillPoints}
                                                            </td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid var(--card-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                                                {dayTotalPoints}
                                                            </td>
                                                        </React.Fragment>
                                                    );
                                                })
                                            ) : null
                                        ) : (
                                            // Single Day View: Show Round Details
                                            (() => {
                                                const day = tournament.schedule[dayFilter];
                                                // Calculate start round
                                                let startR = 1;
                                                for (let i = 0; i < dayFilter; i++) startR += tournament.schedule[i].rounds;

                                                let dayTotal = 0;

                                                const roundCells = [...Array(day.rounds)].map((_, rIdx) => {
                                                    const rKey = 'round' + (startR + rIdx);
                                                    const rData = results[rKey]?.[team.id] || {};
                                                    const rRank = rData.rank || 0;
                                                    const rKills = rData.kills || 0;
                                                    const rPenalty = rData.penalty || 0;

                                                    const rPlacementPoints = (tournament.scoringRules?.rankPoints && rRank > 0)
                                                        ? (tournament.scoringRules.rankPoints[rRank - 1] || 0)
                                                        : 0;
                                                    const rKp = tournament.scoringRules?.killPoint ?? 1;
                                                    const rTotal = (rKills || rRank) ? (rPlacementPoints + (rKills * rKp) - rPenalty) : undefined;

                                                    if (rTotal !== undefined) dayTotal += rTotal;

                                                    return (
                                                        <React.Fragment key={rIdx}>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>{rData.rank || '-'}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>{rData.kills !== undefined ? rData.kills : '-'}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#ef4444' }}>{rData.penalty ? `-${rData.penalty}` : '-'}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', borderRight: '1px solid var(--card-border)' }}>
                                                                {rTotal !== undefined ? rTotal : '-'}
                                                            </td>
                                                        </React.Fragment>
                                                    );
                                                });

                                                return (
                                                    <>
                                                        {roundCells}
                                                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)', borderRight: '2px solid var(--card-border)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                                            {dayTotal}
                                                        </td>
                                                    </>
                                                );
                                            })()
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {
                    activeTab === 'players' && (
                        <>
                            {/* Sub-Tabs for Kill Leaders */}
                            {tournament.schedule && tournament.schedule.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => setDayFilter('total')}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            border: '1px solid',
                                            borderColor: dayFilter === 'total' ? '#eab308' : '#374151',
                                            backgroundColor: dayFilter === 'total' ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                                            color: dayFilter === 'total' ? '#eab308' : '#9ca3af',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        TOTAL
                                    </button>
                                    {tournament.schedule.map((day, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setDayFilter(idx)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                border: '1px solid',
                                                borderColor: dayFilter === idx ? '#eab308' : '#374151',
                                                backgroundColor: dayFilter === idx ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                                                color: dayFilter === idx ? '#eab308' : '#9ca3af',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {day.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <PlayerRankingTable tournament={tournament} teams={teams} results={results} dayFilter={dayFilter} standings={standings} />
                        </>
                    )
                }

                {
                    activeTab === 'entry' && (
                        <EntryTab
                            tournament={tournament}
                            teams={teams}
                            onRegister={async (newTeam) => {
                                // 1. Save new team
                                await storage.saveTeam(newTeam);
                                // 2. Refresh local teams list for this tournament
                                const tTeams = await storage.getTeams(id);
                                setTeams(tTeams);
                            }}
                            onUnregister={async (teamId) => {
                                if (!confirm('Remove this team from the tournament?')) return;
                                // In Supabase, we might want to delete the team or just unset tournament_id.
                                // But the schema says foreign key. So let's delete the team entry for this tournament.
                                await storage.deleteTeam(teamId); // Need to implement this
                                setTeams(teams.filter(t => t.id !== teamId));
                            }}
                            onUpdate={async (updatedTeam) => {
                                await storage.saveTeam(updatedTeam);
                                // Refresh local list
                                const tTeams = await storage.getTeams(id);
                                setTeams(tTeams);
                            }}
                            onTournamentUpdate={handleTournamentUpdate}
                        />
                    )
                }

                {
                    activeTab === 'input' && (
                        <ResultInput
                            tournament={tournament}
                            teams={teams}
                            initialResults={results}
                            onSave={async () => {
                                setResults(await storage.getResults(id)); // Refresh local state
                                setActiveTab('standings'); // Go back to view
                            }}
                        />
                    )
                }
                {
                    activeTab === 'chat' && (
                        <ChatTab
                            tournament={tournament}
                            currentUser={storage.getCurrentUser()}
                            onTournamentUpdate={handleTournamentUpdate}
                        />
                    )
                }
            </div>
        </div>
    );
};

export default TournamentDetail;
