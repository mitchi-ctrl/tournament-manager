import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { User, Users, Plus, ArrowLeft, Trash2, UserPlus, Edit2, Check, X } from 'lucide-react';

const Members = () => {
    const [view, setView] = useState('list'); // 'list' | 'detail'
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);

    // Form States
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamTag, setNewTeamTag] = useState(''); // [NEW] Team Tag
    const [quickPlayerName, setQuickPlayerName] = useState('');
    const [quickPlayerTag, setQuickPlayerTag] = useState('');
    const [validationMode, setValidationMode] = useState('target'); // 'target' | 'exception'

    // Editing State
    const [isEditingTeam, setIsEditingTeam] = useState(false);
    const [editTeamName, setEditTeamName] = useState('');
    const [editTeamTag, setEditTeamTag] = useState('');
    const [editingMemberId, setEditingMemberId] = useState(null); // ID of member currently being edited
    const [editMemberName, setEditMemberName] = useState('');
    const [editMemberTag, setEditMemberTag] = useState('');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        const currentUser = storage.getCurrentUser();
        if (!currentUser) return;

        // Multi-Tenant: Only show my teams/players
        const allTeams = storage.getTeams();
        const myTeams = allTeams.filter(t => t.ownerId === currentUser.id);
        setTeams(myTeams);

        // For players, strictly speaking they belong to teams, but we load all for lookup convenience
        // or we could filter. For now, we rely on the team->memberIds relationship.
        setPlayers(storage.getPlayers());
    };

    const handleCreateTeam = (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        if (!newTeamTag.trim()) { alert('Team Tag is required.'); return; }

        const newTeam = {
            id: 't-' + Date.now(),
            name: newTeamName,
            tag: newTeamTag,
            memberIds: []
        };
        storage.saveTeam(newTeam);
        setNewTeamName('');
        setNewTeamTag('');
        refreshData();
    };

    const openTeamDetail = (team) => {
        setSelectedTeam(team);
        setValidationMode('target'); // Reset to default
        setView('detail');
    };

    const handleBack = () => {
        setSelectedTeam(null);
        setView('list');
        refreshData();
    };

    const handleAddMemberToTeam = (e) => {
        e.preventDefault();
        if (!quickPlayerName.trim()) return;

        // Tag Validation Logic
        if (selectedTeam.tag && validationMode === 'target') {
            if (!quickPlayerName.includes(selectedTeam.tag)) {
                alert(`Error: Player name must contain the team tag "${selectedTeam.tag}".\nChange status to "Exception" if this is intended.`);
                return;
            }
        }

        // 1. Create New Player
        const newPlayer = {
            id: 'p-' + Date.now(),
            name: quickPlayerName,
            tags: quickPlayerTag ? [quickPlayerTag] : []
        };
        storage.savePlayer(newPlayer);

        // 2. Add to Team
        const updatedTeam = {
            ...selectedTeam,
            memberIds: [...selectedTeam.memberIds, newPlayer.id]
        };
        storage.saveTeam(updatedTeam);

        // 3. Update State
        setQuickPlayerName('');
        setQuickPlayerTag('');
        setValidationMode('target');
        setSelectedTeam(updatedTeam);
        refreshData();
    };

    const removeMemberFromTeam = (memberId) => {
        const updatedTeam = {
            ...selectedTeam,
            memberIds: selectedTeam.memberIds.filter(id => id !== memberId)
        };
        storage.saveTeam(updatedTeam);
        setSelectedTeam(updatedTeam);
        refreshData();
    };

    // --- Team Editing ---
    const startEditingTeam = () => {
        setEditTeamName(selectedTeam.name);
        setEditTeamTag(selectedTeam.tag || '');
        setIsEditingTeam(true);
    };

    const saveTeamChanges = () => {
        if (!editTeamName.trim()) return;
        const updatedTeam = {
            ...selectedTeam,
            name: editTeamName,
            tag: editTeamTag
        };
        storage.saveTeam(updatedTeam);
        setSelectedTeam(updatedTeam);
        setIsEditingTeam(false);
        refreshData();
    };

    // --- Member Editing ---
    const startEditingMember = (player) => {
        setEditingMemberId(player.id);
        setEditMemberName(player.name);
        setEditMemberTag(player.tags[0] || ''); // Assuming single tag for now from UI
    };

    const saveMemberChanges = (playerId) => {
        if (!editMemberName.trim()) return;

        const updatedPlayer = {
            id: playerId,
            name: editMemberName,
            tags: editMemberTag ? [editMemberTag] : []
        };
        storage.savePlayer(updatedPlayer); // Update player globally
        setEditingMemberId(null);
        refreshData();
    };

    const cancelEditingMember = () => {
        setEditingMemberId(null);
    };

    // Sub-components
    const DeleteTeamButton = ({ teamId, onDelete }) => {
        const [confirming, setConfirming] = useState(false);

        useEffect(() => {
            setConfirming(false);
        }, [teamId]);

        if (confirming) {
            return (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={onDelete}
                        style={{ backgroundColor: '#dc2626', color: 'white', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        Confirm Delete?
                    </button>
                    <button
                        onClick={() => setConfirming(false)}
                        style={{ backgroundColor: '#e5e7eb', color: '#374151', fontSize: '0.9rem' }}
                    >
                        Cancel
                    </button>
                </div>
            );
        }

        return (
            <button
                onClick={() => setConfirming(true)}
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
                <Trash2 size={18} /> Delete Team
            </button>
        );
    };

    const TeamCard = ({ team }) => (
        <div
            onClick={() => openTeamDetail(team)}
            className="card"
            style={{ cursor: 'pointer', transition: 'transform 0.1s', border: '1px solid transparent' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0 }}>{team.name}</h3>
                    {team.tag && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Tag: [{team.tag}]</span>}
                </div>
                <Users size={20} color="#9ca3af" />
            </div>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                {team.memberIds.length} Members
            </p>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                {team.memberIds.slice(0, 5).map(mid => {
                    const p = players.find(player => player.id === mid);
                    return p ? (
                        <span key={mid} style={{ fontSize: '0.75rem', backgroundColor: '#333', color: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', border: '1px solid #444' }}>
                            {p.name}
                        </span>
                    ) : null;
                })}
                {team.memberIds.length > 5 && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>+{team.memberIds.length - 5} more</span>}
            </div>
        </div>
    );

    return (
        <div className="container">
            {view === 'list' && (
                <>
                    <div style={{ marginBottom: '1rem' }}>
                        <h2>Team Management</h2>
                        <p style={{ color: '#6b7280' }}>Select a team to manage members or create a new one.</p>
                    </div>

                    {/* Create Team Bar */}
                    <form onSubmit={handleCreateTeam} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, minWidth: '200px' }}>
                            <input
                                type="text"
                                placeholder="New Team Name"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                            <input
                                type="text"
                                placeholder="Tag (e.g. TSM)"
                                value={newTeamTag}
                                onChange={(e) => setNewTeamTag(e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                        <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            <Plus size={18} /> Create Team
                        </button>
                    </form>

                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {teams.map(t => <TeamCard key={t.id} team={t} />)}
                    </div>
                </>
            )}

            {view === 'detail' && selectedTeam && (
                <>
                    {/* Header: Edit or View */}
                    <button
                        onClick={handleBack}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}
                    >
                        <ArrowLeft size={18} /> Back to Team List
                    </button>
                    {isEditingTeam ? (
                        <div style={{ flex: 1, marginRight: '1rem' }}>
                            <input
                                type="text"
                                value={editTeamName}
                                onChange={(e) => setEditTeamName(e.target.value)}
                                placeholder="Team Name"
                                style={{ fontSize: '1.5rem', fontWeight: 'bold', width: '100%', marginBottom: '8px', padding: '0.25rem' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#64748b' }}>Tag:</span>
                                <input
                                    type="text"
                                    value={editTeamTag}
                                    onChange={(e) => setEditTeamTag(e.target.value)}
                                    placeholder="Tag"
                                    style={{ padding: '0.25rem' }}
                                />
                                <button onClick={saveTeamChanges} style={{ backgroundColor: '#22c55e', color: 'white', padding: '4px 12px', fontSize: '0.9rem' }}>Save</button>
                                <button onClick={() => setIsEditingTeam(false)} style={{ backgroundColor: '#e5e7eb', color: '#374151', padding: '4px 12px', fontSize: '0.9rem' }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ margin: 0, fontSize: '2rem' }}>{selectedTeam.name}</h2>
                                <button onClick={startEditingTeam} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }} title="Edit Team">
                                    <Edit2 size={18} />
                                </button>
                            </div>
                            {selectedTeam.tag && <div style={{ color: '#64748b', fontSize: '1rem', marginTop: '4px' }}>Tag: <span style={{ fontWeight: 'bold' }}>{selectedTeam.tag}</span></div>}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem', marginBottom: '1rem' }}>
                        <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold' }}>
                            {selectedTeam.memberIds.length} Players
                        </span>
                        <DeleteTeamButton teamId={selectedTeam.id} onDelete={() => {
                            storage.deleteTeam(selectedTeam.id);
                            handleBack();
                        }} />
                    </div>

                    {/* Add Member Section */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--card-border)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserPlus size={18} /> Add New Member
                        </h4>
                        <form onSubmit={handleAddMemberToTeam} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 2, minWidth: '200px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Player Name {selectedTeam.tag && `(Must include "${selectedTeam.tag}")`}</label>
                                <input
                                    type="text"
                                    placeholder={`e.g. ${selectedTeam.tag ? selectedTeam.tag + ' ' : ''}Ace`}
                                    value={quickPlayerName}
                                    onChange={(e) => setQuickPlayerName(e.target.value)}
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            {selectedTeam.tag && (
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Validation</label>
                                    <select
                                        value={validationMode}
                                        onChange={(e) => setValidationMode(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--card-border)', marginBottom: 0, height: '42px', backgroundColor: 'var(--bg-color)', color: 'white' }}
                                    >
                                        <option value="target">Tag Required</option>
                                        <option value="exception">Exception (No Tag)</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ flex: 1, minWidth: '140px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Role/Tag (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sniper"
                                    value={quickPlayerTag}
                                    onChange={(e) => setQuickPlayerTag(e.target.value)}
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            <button type="submit" style={{ height: '42px', whiteSpace: 'nowrap' }}>Add</button>
                        </form>
                    </div>

                    {/* Roster List */}
                    <h3 style={{ marginLeft: '4px' }}>Current Roster</h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {selectedTeam.memberIds.map(mid => {
                            const p = players.find(player => player.id === mid);
                            if (!p) return null;

                            const isEditing = editingMemberId === mid;

                            return (
                                <div key={mid} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '1rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px'
                                }}>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                            <input
                                                type="text"
                                                value={editMemberName}
                                                onChange={(e) => setEditMemberName(e.target.value)}
                                                placeholder="Name"
                                                style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                autoFocus
                                            />
                                            <input
                                                type="text"
                                                value={editMemberTag}
                                                onChange={(e) => setEditMemberTag(e.target.value)}
                                                placeholder="Tag"
                                                style={{ padding: '4px', width: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                            />
                                            <button onClick={() => saveMemberChanges(mid)} style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={18} /></button>
                                            <button onClick={cancelEditingMember} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', backgroundColor: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1', fontWeight: 'bold' }}>
                                                {p.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {p.name}
                                                    <button onClick={() => startEditingMember(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 0 }}>
                                                        <Edit2 size={12} />
                                                    </button>
                                                </div>
                                                {p.tags.length > 0 && (
                                                    <span style={{ fontSize: '0.75rem', color: '#e2e8f0', backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px', border: '1px solid #475569' }}>
                                                        {p.tags.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {!isEditing && (
                                        <button
                                            onClick={() => removeMemberFromTeam(mid)}
                                            style={{ backgroundColor: 'transparent', color: '#ef4444', padding: '8px' }}
                                            title="Remove from team"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {selectedTeam.memberIds.length === 0 && (
                            <p style={{ fontStyle: 'italic', color: '#94a3b8', padding: '1rem' }}>No members yet. Add someone above!</p>
                        )}
                    </div>
                </>
            )}
        </div >
    );
};

export default Members;
