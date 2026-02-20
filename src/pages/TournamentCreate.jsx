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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tournament Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Saturday Night Showdown"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Initial Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    >
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="finished">Finished (Ended)</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Max Teams</label>
                        <input
                            type="number"
                            min="2"
                            value={maxTeams}
                            onChange={(e) => setMaxTeams(parseInt(e.target.value) || 20)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Settings</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={tagRequired}
                                    onChange={(e) => setTagRequired(e.target.checked)}
                                />
                                チームタグ必須
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={lockMembers}
                                    onChange={(e) => setLockMembers(e.target.checked)}
                                />
                                メンバー追加ロック
                            </label>
                        </div>
                    </div>
                    <p style={{ colSpan: 2, fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', gridColumn: 'span 2' }}>
                        Registration will automatically close when the limit is reached.
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} /> Schedule
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {schedule.map((day, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Day Name</label>
                                    <input
                                        type="text"
                                        value={day.name}
                                        onChange={(e) => handleDayChange(idx, 'name', e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Date</label>
                                    <input
                                        type="date"
                                        value={day.date}
                                        onChange={(e) => handleDayChange(idx, 'date', e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ width: '80px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Rounds</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={day.rounds}
                                        onChange={(e) => handleDayChange(idx, 'rounds', parseInt(e.target.value) || 1)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                {schedule.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDay(idx)}
                                        style={{ padding: '0.6rem', color: '#ef4444', backgroundColor: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer' }}
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
                        style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        <Plus size={16} /> Add Day
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setShowAdvancedScoring(!showAdvancedScoring)}
                    >
                        <label style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <Trophy size={18} /> Scoring Rules
                        </label>
                        <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
                            {showAdvancedScoring ? 'Hide' : 'Customize'}
                        </span>
                    </div>

                    {showAdvancedScoring && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', color: '#374151' }}>Kill Points</label>
                                <input
                                    type="number"
                                    value={scoringRules.killPoint}
                                    onChange={(e) => setScoringRules({ ...scoringRules, killPoint: parseInt(e.target.value) || 0 })}
                                    style={{ marginLeft: '1rem', padding: '0.4rem', width: '60px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '4px' }}>pts</span>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem', display: 'block' }}>Rank Points (1st - 10th+)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                    {scoringRules.rankPoints.slice(0, 10).map((pts, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>#{idx + 1}</span>
                                            <input
                                                type="number"
                                                value={pts}
                                                onChange={(e) => handleRankPointChange(idx, e.target.value)}
                                                style={{ width: '100%', padding: '0.3rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} /> Tournament Rules (Description)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter detailed tournament rules here..."
                        rows={5}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={18} color="#ef4444" /> Prohibited Actions / Tags
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="e.g. No Grenades, Sniper Only"
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
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
