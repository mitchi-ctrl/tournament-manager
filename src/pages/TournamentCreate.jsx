import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { Calendar, Users, Trophy, Plus, Trash2, BookOpen } from 'lucide-react';

const TournamentCreate = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [status, setStatus] = useState('upcoming');
    const [maxTeams, setMaxTeams] = useState(20);
    const [schedule, setSchedule] = useState([]);
    const [description, setDescription] = useState('');
    const [tagRequired, setTagRequired] = useState(true);
    const [maxMembers, setMaxMembers] = useState(5);
    const [lockMembers, setLockMembers] = useState(false);
    const [scoringRules, setScoringRules] = useState(storage.DEFAULT_RULES);
    const [showAdvancedScoring, setShowAdvancedScoring] = useState(false);

    // Tags (Prohibited Actions / Rules)
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            // Load global settings as default
            const settings = await storage.getSettings();
            setScoringRules(settings);

            // Default schedule with Day 1
            const today = new Date().toISOString().split('T')[0];
            setSchedule([{ name: 'Day 1', date: today, rounds: 4 }]);
        };
        loadSettings();
    }, []);



    const handleAddDay = () => {
        const nextDayNum = schedule.length + 1;
        // Default next date to last date + 1 day
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
        if (schedule.length === 1) return; // Prevent deleting last day
        const newSched = schedule.filter((_, i) => i !== idx);
        setSchedule(newSched);
    };

    const handleDayChange = (idx, field, val) => {
        const newSched = [...schedule];
        newSched[idx] = { ...newSched[idx], [field]: val };
        setSchedule(newSched);
    };

    const handleRankPointChange = (index, value) => {
        const newRankPoints = [...scoringRules.rankPoints];
        newRankPoints[index] = parseInt(value) || 0;
        setScoringRules({ ...scoringRules, rankPoints: newRankPoints });
    };

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        if (tags.includes(tagInput.trim())) return;
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) { alert('Please enter a tournament name'); return; }
        // Teams are now optional at creation
        // if (selectedTeamIds.length < 2) { alert('Please select at least 2 teams'); return; }

        const totalRounds = schedule.reduce((sum, day) => sum + parseInt(day.rounds || 0), 0);

        const newTournament = {
            // id: 'tourney-' + Date.now(), // REMOVE: Let backend generate UUID
            name: name,
            date: schedule[0].date, // Using the first day's date as the main date
            status: status,
            rounds: totalRounds,
            teams: [], // Teams managed in Entry tab
            maxTeams: maxTeams, // Save max teams limit
            schedule: schedule, // Save the full schedule
            scoringRules: scoringRules, // Save custom rules
            tagRequired: tagRequired, // Save tag requirement
            lockMembers: lockMembers, // Save member lock setting
            ownerId: storage.getCurrentUser().id, // Owner
            tags: tags, // Save tags
            maxMembers: maxMembers,
            description: description, // Save description / rules
            createdAt: new Date().toISOString()
        };

        await storage.saveTournament(newTournament);
        navigate('/'); // Go back to Home/Bulletin
    };

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Trophy size={48} color="#eab308" />
                <h1 style={{ marginBottom: '0.5rem' }}>Create Tournament</h1>
                <p style={{ color: '#6b7280' }}>Setup a new casual cup!</p>
            </div>

            <form onSubmit={handleCreate} className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase' }}>大会名</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例: 第1回 チキチキ大会"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase' }}>初期ステータス</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white' }}
                    >
                        <option value="upcoming">Upcoming (準備中)</option>
                        <option value="active">Active (開催中)</option>
                        <option value="finished">Finished (終了)</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase' }}>最大チーム数</label>
                        <input
                            type="number"
                            min="2"
                            value={maxTeams}
                            onChange={(e) => setMaxTeams(parseInt(e.target.value) || 20)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase' }}>各種設定</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: '#0b0b0e', borderRadius: '6px', border: '1px solid #4b5563' }}>
                                <span className="toggle-label-text" style={{ fontSize: '0.8rem' }}>チームタグ必須</span>
                                <label className="tactical-toggle">
                                    <input
                                        type="checkbox"
                                        checked={tagRequired}
                                        onChange={(e) => setTagRequired(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: '#0b0b0e', borderRadius: '6px', border: '1px solid #4b5563' }}>
                                <span className="toggle-label-text" style={{ fontSize: '0.8rem' }}>メンバー追加ロック</span>
                                <label className="tactical-toggle">
                                    <input
                                        type="checkbox"
                                        checked={lockMembers}
                                        onChange={(e) => setLockMembers(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: '#0b0b0e', borderRadius: '6px', border: '1px solid #4b5563' }}>
                                <span className="toggle-label-text" style={{ fontSize: '0.8rem' }}>1チームの上限人数</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={maxMembers}
                                    onChange={(e) => setMaxMembers(parseInt(e.target.value) || 5)}
                                    style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#111827', color: '#eab308', textAlign: 'center', fontWeight: 'bold' }}
                                />
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '-0.5rem', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={14} /> 上限に達すると自動的に参加登録が締め切られます。
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} /> スケジュール
                    </label>
                    <style>{`
                        @media (max-width: 480px) {
                            .schedule-item {
                                flex-direction: column !important;
                                align-items: stretch !important;
                            }
                            .schedule-item > div {
                                width: 100% !important;
                            }
                        }
                    `}</style>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {schedule.map((day, idx) => (
                            <div key={idx} className="schedule-item" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', backgroundColor: '#111827', padding: '0.75rem', borderRadius: '8px', border: '1px solid #374151' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Day Name</label>
                                    <input
                                        type="text"
                                        value={day.name}
                                        onChange={(e) => handleDayChange(idx, 'name', e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Date</label>
                                    <input
                                        type="date"
                                        value={day.date}
                                        onChange={(e) => handleDayChange(idx, 'date', e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white' }}
                                    />
                                </div>
                                <div style={{ width: '80px' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Rounds</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={day.rounds}
                                        onChange={(e) => handleDayChange(idx, 'rounds', parseInt(e.target.value) || 1)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white', textAlign: 'center' }}
                                    />
                                </div>
                                {schedule.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDay(idx)}
                                        style={{ padding: '0.6rem', color: '#ef4444', backgroundColor: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', marginBottom: '2px' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddDay}
                        style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', clipPath: 'none' }}
                    >
                        <Plus size={16} /> 日程を追加
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', border: '1px solid #374151', borderRadius: '8px', padding: '1rem', backgroundColor: '#111827' }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setShowAdvancedScoring(!showAdvancedScoring)}
                    >
                        <label style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <Trophy size={18} /> スコアリング設定
                        </label>
                        <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>
                            {showAdvancedScoring ? '閉じる' : 'カスタマイズ'}
                        </span>
                    </div>

                    {showAdvancedScoring && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem', color: '#d1d5db' }}>Kill Points:</label>
                                <input
                                    type="number"
                                    value={scoringRules.killPoint}
                                    onChange={(e) => setScoringRules({ ...scoringRules, killPoint: parseInt(e.target.value) || 0 })}
                                    style={{ marginLeft: '1rem', padding: '0.4rem', width: '60px', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white', textAlign: 'center' }}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '8px' }}>pts / Kill</span>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '0.8rem', display: 'block' }}>順位ポイント (1位〜10位+)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                    {scoringRules.rankPoints.slice(0, 10).map((pts, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>#{idx + 1}</span>
                                            <input
                                                type="number"
                                                value={pts}
                                                onChange={(e) => handleRankPointChange(idx, e.target.value)}
                                                style={{ width: '100%', padding: '0.4rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        (Configure lower ranks in Global Settings if needed, showing top 10 here)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} /> 大会説明・ルール
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="詳細なルールを入力してください..."
                        rows={5}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white', resize: 'vertical', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={18} color="#ef4444" /> 禁止事項・タグ
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="例: グレネード禁止, スナイパー限定"
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#0b0b0e', color: 'white' }}
                        />
                        <button
                            type="button"
                            onClick={handleAddTag}
                            style={{ padding: '0 1rem', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Add
                        </button>
                    </div>
                    {tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {tags.map((tag, idx) => (
                                <span key={idx} style={{
                                    backgroundColor: '#fee2e2',
                                    color: '#ef4444',
                                    padding: '4px 12px',
                                    borderRadius: '16px',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    border: '1px solid #fca5a5'
                                }}>
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>



                <button
                    type="submit"
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                    Create & Start
                </button>
            </form>
        </div>
    );
};

export default TournamentCreate;
