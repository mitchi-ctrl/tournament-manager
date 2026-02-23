import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Save } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        killPoint: 1,
        rankPoints: Array(20).fill(0)
    });
    const [currentUser, setCurrentUser] = useState(storage.getCurrentUser());

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

    useEffect(() => {
        loadSettings();
    }, []);

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

    return (
        <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1>Settings</h1>
                <p style={{ color: '#6b7280' }}>Global Configuration</p>
            </div>

            <div className="card" style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', marginBottom: '2rem' }}>
                <p>Global scoring rules have been moved to per-tournament configuration.</p>
                <p>Please configure points when creating a new tournament.</p>
            </div>

            {/* Note: In a future update, we might add global profile settings here. */}
            <div className="card" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Profile Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentUser?.username}</div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Role: <span style={{ color: '#38bdf8', textTransform: 'uppercase' }}>{currentUser?.role}</span></div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>ID: <span style={{ fontFamily: 'monospace' }}>{currentUser?.id}</span></div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
