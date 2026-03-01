import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { UploadCloud, Loader2, AlertTriangle, CheckCircle, Search, Save, Settings, Plus, Info, Play, RefreshCw, HelpCircle, X, Shield } from 'lucide-react';
import Tesseract from 'tesseract.js';
import * as levenshtein from 'fast-levenshtein'; // Import fast-levenshtein for fuzzy matching

export default function OcrTest() {
    const [images, setImages] = useState([]);
    const [debugImgUrls, setDebugImgUrls] = useState([]);
    const [showDebug, setShowDebug] = useState(false);
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState('');
    const [players, setPlayers] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [results, setResults] = useState([]);
    const [rawText, setRawText] = useState([]);
    const [processedPlayerIds, setProcessedPlayerIds] = useState(new Set()); // For duplicate check

    // New State Variables for the advanced requirements
    const [schedule, setSchedule] = useState([]);
    const [selectedRound, setSelectedRound] = useState('');
    const [teams, setTeams] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [teamPoints, setTeamPoints] = useState({}); // {rank: {bonus: "", penalty: ""}}

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (selectedTournament) {
            fetchPlayers(selectedTournament);
            setResults([]); // Clear previous results when tournament changes
            setRawText([]);
            setProcessedPlayerIds(new Set());
            setTeamPoints({});
        } else {
            setPlayers([]);
        }
    }, [selectedTournament]);

    const fetchTournaments = async () => {
        setIsInitializing(true);
        try {
            const { data, error } = await supabase
                .from('tournaments')
                .select('id, name, schedule, scoringRules')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTournaments(data || []);
            if (data && data.length > 0) {
                // Default to most recent
                setSelectedTournament(data[0].id);
                updateSchedule(data[0].schedule);
            }
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            alert('Failed to load tournaments.');
        } finally {
            setIsInitializing(false);
        }
    };

    const updateSchedule = (tourneySchedule) => {
        if (!tourneySchedule) {
            setSchedule([]);
            setSelectedRound('');
            return;
        }

        const generatedRounds = [];
        let globalRound = 1;
        tourneySchedule.forEach((day, dayIndex) => {
            const numRounds = parseInt(day.rounds) || 0;
            for (let i = 1; i <= numRounds; i++) {
                generatedRounds.push({
                    id: `round${globalRound}`,
                    label: `${day.name || `Day ${dayIndex + 1}`} - Round ${i}`,
                    dayIndex,
                    roundIndex: i,
                    globalRound
                });
                globalRound++;
            }
        });
        setSchedule(generatedRounds);
        if (generatedRounds.length > 0) {
            setSelectedRound(generatedRounds[0].id);
        } else {
            setSelectedRound('');
        }
    };

    const fetchPlayers = async (tournamentId) => {
        setIsInitializing(true);
        try {
            // Fetch teams using storage helper
            const teamsData = await storage.getTeams(tournamentId);
            setTeams(teamsData || []);

            // Fetch generic players utilizing fallback profiles in storage.js
            const allPlayers = await storage.getPlayers();

            // Map players to tournament teams
            const mappedPlayers = [];

            allPlayers.forEach(p => {
                let foundTeam = null;
                for (const t of teamsData) {
                    // some tables use memberIds, others member_ids. Fallbacks apply.
                    const idsToMatch = t.memberIds || t.member_ids || [];
                    if (idsToMatch.includes(p.id)) {
                        foundTeam = t;
                        break;
                    }
                }

                if (foundTeam) {
                    mappedPlayers.push({
                        ...p,
                        team_id: foundTeam.id,
                        teams: { name: foundTeam.name }
                    });
                }
            });

            setPlayers(mappedPlayers);
        } catch (error) {
            console.error('Error fetching players:', error);
            alert('Failed to load players and teams. Check console.');
        } finally {
            setIsInitializing(false);
        }
    };

    const handleImageUpload = (e) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const findClosestPlayer = (ocrName) => {
        if (!ocrName || ocrName.length < 2) return { name: ocrName, isUnknown: true, originalOcrText: ocrName };

        // 1. Prepare OCR name for comparison (Strip symbols and extra spaces)
        const cleanOcr = ocrName.toLowerCase()
            .replace(/[*|!‡_@#%&§=\-\[\](){}+.~«]/g, '')
            .replace(/\s+/g, '')
            .replace(/ooharamen/g, 'oharamen') // Handle duplicate 'o'
            .replace(/^raf[こ]/, 'raf')        // RAF normalization
            .replace(/^lnd[遂]/, 'lnd')        // LND normalization
            .trim();

        if (cleanOcr.length < 1) return { name: ocrName, isUnknown: true, originalOcrText: ocrName };

        let bestDistance = Infinity;
        let matchedPlayer = null;
        let bestType = 'none'; // 'exact', 'contain', 'fuzzy'

        for (const player of players) {
            if (!player.name) continue;
            let cleanDbName = player.name.toLowerCase()
                .replace(/[*|!‡_@#%&§=\-\[\](){}+.~«]/g, '')
                .replace(/[ッっ]/g, 'つ') // Normalize Japanese Sokuon
                .replace(/\s+/g, '')
                .trim();

            const cleanOcrNorm = cleanOcr.replace(/[ッっ]/g, 'つ');

            // Stage 1: Exact Match (Cleaned)
            if (cleanDbName === cleanOcr || cleanDbName === cleanOcrNorm) {
                return { ...player, distance: 0, isUnknown: false, matchType: 'exact' };
            }

            // Stage 2: Normalization (Tag errors common in PUBG OCR)
            const normalizedOcr = cleanOcrNorm
                .replace(/^drx/, 'crx')
                .replace(/^cry/, 'crx')
                .replace(/^erx/, 'crx')
                .replace(/^gz4/, 'bz4')
                .replace(/bib/, 'big')
                .replace(/8ig/, 'big')     // CRY 8IG misread
                .replace(/ilsmn/, 'jisos') // BZ4_Ejisos
                .replace(/nqe/, 'nqg')     // BZ4_NqG1
                .replace(/phv/, 'crx')     // CRY_Routebb
                .replace(/dante/, 'route') // CRY_Routebb
                .replace(/[\-.]/, '');
            const normalizedDb = cleanDbName.replace(/[\-.]/, '');

            if (normalizedDb === normalizedOcr) {
                return { ...player, distance: 0, isUnknown: false, matchType: 'normalized' };
            }

            // Stage 3: Containment Match
            if (cleanOcrNorm.length >= 3 && (cleanDbName.includes(cleanOcrNorm) || cleanOcrNorm.includes(cleanDbName))) {
                return { ...player, distance: 0, isUnknown: false, matchType: 'contain' };
            }

            // Stage 4: Fuzzy Levenshtein
            const distance = levenshtein.get(cleanOcrNorm, cleanDbName);
            if (distance < bestDistance) {
                bestDistance = distance;
                matchedPlayer = player;
                bestType = 'fuzzy';
            }
        }

        const maxAllowedDistance = Math.round(cleanOcr.length * 0.45);
        if (matchedPlayer && bestDistance <= maxAllowedDistance) {
            return { ...matchedPlayer, distance: bestDistance, isUnknown: false, matchType: bestType };
        }

        return { name: ocrName, isUnknown: true, originalOcrText: ocrName };
    };

    // Improved parsing with dynamic rank detection and neighboring line kill detection
    const parseText = (text, imageIndex, slicePos) => {
        const rawLines = text.split('\n').filter(line => line.trim().length > 0);
        const parsedData = [];
        let r_text = `--- Image ${imageIndex + 1} Pos ${slicePos} ---\n${text}\n\n`;

        // 1. Dynamic Rank Detection
        let detectedRank = 0;

        // Strategy: First look for a standalone number at the top of the slice
        const rankMatchLine = rawLines.find(l => /^[\s*]*([0-9ab]{1,2})[\s*]*$/.test(l.trim().toLowerCase()));
        if (rankMatchLine) {
            let rawRank = rankMatchLine.trim().toLowerCase().replace(/[^\da-b]/g, '');
            if (rawRank === 'b') detectedRank = 6;
            else if (rawRank === 'a') detectedRank = 4;
            else detectedRank = parseInt(rawRank);
        } else {
            // Fallback: look for a number at the start of a line
            for (const line of rawLines) {
                const startMatch = line.trim().match(/^([0-9ab]{1,2})\s+/i);
                if (startMatch) {
                    let rawRank = startMatch[1].toLowerCase();
                    if (rawRank === 'b') detectedRank = 6;
                    else detectedRank = parseInt(rawRank);
                    if (detectedRank > 0) break;
                }
            }
        }

        // 2. Position-based Fallback (If not found in text)
        // Note: LT/LB are R1/R2.
        if (detectedRank === 0 || isNaN(detectedRank)) {
            if (slicePos === 'LT') detectedRank = 1;
            else if (slicePos === 'LB') detectedRank = 2;
        }

        // Noise and hallucination exclusion
        const hallucinationPatterns = [
            'on', 'hx', 'DL', 'cé', 'み', 'cw', 'シン ノン', 'AZ', 'PRY',
            '後藤 マン', 'シン ', 'X17', 'ミイ ', 'オデ', 'シ シン',
            'NF', 'hisrcs', 'OK'
        ];

        for (let i = 0; i < rawLines.length; i++) {
            const line = rawLines[i].trim();
            const lineUpper = line.toUpperCase();

            // Filter system labels
            if (['PUBG', 'MOBILE', 'RESULT', 'NAME', 'TIME', 'OK', 'RANK'].some(term => lineUpper.includes(term))) continue;

            // Handle lonely digits (usually kill counts on separate lines)
            if (/^\d{1,2}$/.test(line)) {
                const num = parseInt(line);
                if (num === detectedRank && i < 3) continue; // Likely just the rank header
                if (num >= 0 && num <= 30 && parsedData.length > 0) {
                    const last = parsedData[parsedData.length - 1];
                    if (last.kills === 0 || last.kills === "") {
                        last.kills = num;
                        continue;
                    }
                }
                continue;
            }

            // Kill Detection Regex
            let mappingLine = line.replace(/ロ/g, '5').replace(/ワ/g, '2').replace(/IL/g, '3').replace(/B/g, '8').replace(/Bx/g, 'キル');
            const killPattern = /(\d+)\s*(キル|キ[ ]*ル|ロキ[ ]*ル|ワキ[ ]*ル|ル|k|\||:|!|\*|DL|IL|\[\s*キル|[$」]|Bx|[.,_s])/i;
            const killMatch = mappingLine.match(killPattern);

            let kills = "";
            let name = line;

            if (killMatch && killMatch[1]) {
                kills = parseInt(killMatch[1]);
                name = mappingLine.replace(killMatch[0], '').trim();
            } else {
                const suffixMatch = line.match(/(キル|キ[ ]*ル|ル|k|\||:|!|\*|DL|IL|\[\s*キル|[$」]|Bx|[.,_s])$/i);
                if (suffixMatch) {
                    name = line.replace(suffixMatch[0], '').trim();
                }
            }

            // Cleanup name
            name = name.replace(/^[a-z]{1,2}\s+/i, '').replace(/^\d+\s+/, '').trim();
            name = name.replace(/^[*|!‡_@#%&§=~«\-\[\](){}.:とにて]+\s*/, '').trim();
            name = name.replace(/\s*[*|!‡_@#%&§=~«\-\[\](){}.:|:DL!s]+$/, '').trim();
            name = name.replace(/シン[ ]*ノン/g, '').replace(/因[ ]*全[ ]*生/g, '').replace(/吉[ ]*本[ ]*本/g, '').trim();

            if (name.length > 1 && /^[^a-zA-Z0-9\u3040-\u30ff\u4e00-\u9faf]/.test(name)) {
                name = name.substring(1).trim();
            }

            if (hallucinationPatterns.some(h => name.includes(h)) || name.length < 2) {
                if (!['Dzl', 'BZ4', 'GUM', 'CRX', 'NS', 'GZ4', 'DRX', 'ERX', 'CRY', 'RAF', 'LND', 'FN', 'BIG'].some(tag => name.startsWith(tag))) {
                    if (hallucinationPatterns.some(h => name === h) || name.length < 3) continue;
                }
            }

            if (name) {
                const match = findClosestPlayer(name);
                parsedData.push({
                    id: `ocr_${Math.random().toString(36).substr(2, 9)}`,
                    ocrName: name,
                    editedText: name,
                    matchedPlayer: match,
                    kills: kills,
                    rank: detectedRank || "?", // Use placeholder if undetermined
                    team: match.teams ? match.teams.name : 'Unknown',
                    teamId: match.team_id || null,
                    isDuplicate: false,
                    isManual: false
                });
            }
        }

        return { parsedData, raw: r_text };
    };

    const preprocessImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // REFINED: 2-Column Geometry (Boundary adjustment for Slot 4/5)
                const slices = [
                    // LEFT COLUMN (X: 0.04 to 0.50)
                    { pos: 'LT', x: 0.04, y: 0.15, w: 0.46, h: 0.38 }, // Left Top (Slot 1)
                    { pos: 'LB', x: 0.04, y: 0.53, w: 0.46, h: 0.39 }, // Left Bottom (Slot 2)

                    // RIGHT COLUMN (X: 0.50 to 0.96)
                    // Adjusted boundaries to avoid rank bleeding (R4/R7 into R5/R8)
                    { pos: 'RT', x: 0.50, y: 0.18, w: 0.46, h: 0.23 }, // Right Top (Slot 3) - Lowered h slightly
                    { pos: 'RM', x: 0.50, y: 0.41, w: 0.46, h: 0.24 }, // Right Mid (Slot 4) - Shifted Up
                    { pos: 'RB', x: 0.50, y: 0.65, w: 0.46, h: 0.30 }  // Right Bottom (Slot 5) - Shifted Up, wider cover
                ];

                const processSlice = (s) => {
                    const scale = 2;
                    const canvas = document.createElement('canvas');
                    const sw = img.width * s.w;
                    const sh = img.height * s.h;
                    canvas.width = sw * scale;
                    canvas.height = sh * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, img.width * s.x, img.height * s.y, sw, sh, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const threshold = 140;
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        const val = avg > threshold ? 0 : 255;
                        data[i] = data[i + 1] = data[i + 2] = val;
                    }
                    ctx.putImageData(imageData, 0, 0);

                    return new Promise(res => {
                        canvas.toBlob((blob) => {
                            const url = URL.createObjectURL(blob);
                            setDebugImgUrls(prev => [...prev, { url, pos: s.pos }]);
                            res({ url, pos: s.pos });
                        }, 'image/png');
                    });
                };

                Promise.all(slices.map(processSlice)).then(resolve).catch(reject);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const processImages = async () => {
        if (images.length === 0 || !selectedTournament) return;
        setIsProcessing(true);
        setStatus('Engine Initialising...');
        setProgress(0);
        setResults([]);
        setRawText([]);
        setSaveSuccess(false);
        setDebugImgUrls([]);
        setTeamPoints({});

        const rankMap = {};
        const unassignedList = []; // For items where rank couldn't be detected
        let allRawText = '';

        try {
            const worker = await Tesseract.createWorker('jpn+eng', 1, {
                logger: m => {
                    if (m && m.status === 'recognizing text') {
                        setProgress(Math.floor(m.progress * 100));
                        setStatus(`Analysing... ${Math.floor(m.progress * 100)}%`);
                    }
                }
            });

            for (let i = 0; i < images.length; i++) {
                setStatus(`Slicing image ${i + 1}...`);
                const slices = await preprocessImage(images[i]);

                for (let j = 0; j < slices.length; j++) {
                    const slice = slices[j];
                    setStatus(`OCR Image ${i + 1} (${slice.pos})...`);
                    const { data: { text } } = await worker.recognize(slice.url);
                    URL.revokeObjectURL(slice.url);

                    const { parsedData, raw } = parseText(text, i, slice.pos);
                    allRawText += raw;

                    parsedData.forEach(item => {
                        if (item.rank === "?") {
                            unassignedList.push(item);
                            return;
                        }
                        const r = item.rank;
                        if (!rankMap[r]) rankMap[r] = [];

                        const exists = rankMap[r].find(p =>
                            (!p.matchedPlayer.isUnknown && !item.matchedPlayer.isUnknown && p.matchedPlayer.id === item.matchedPlayer.id) ||
                            (p.editedText.toLowerCase().replace(/\s/g, '') === item.editedText.toLowerCase().replace(/\s/g, ''))
                        );

                        if (!exists && rankMap[r].length < 4) {
                            rankMap[r].push(item);
                        }
                    });
                }
            }
            await worker.terminate();

            const sortedRanks = Object.keys(rankMap).sort((a, b) => parseInt(a) - parseInt(b));
            const finalResults = [];
            const globalProcessedIds = new Set();

            sortedRanks.forEach(r => {
                rankMap[r].forEach(player => {
                    if (!player.matchedPlayer.isUnknown) {
                        if (globalProcessedIds.has(player.matchedPlayer.id)) {
                            player.isDuplicate = true;
                        } else {
                            globalProcessedIds.add(player.matchedPlayer.id);
                        }
                    }
                    finalResults.push(player);
                });
            });

            unassignedList.forEach(p => finalResults.push(p));

            setResults(finalResults);
            setRawText(allRawText);
            setProcessedPlayerIds(globalProcessedIds);
            setStatus('Ready!');
        } catch (error) {
            console.error('OCR Error:', error);
            setStatus('Execution failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualMap = (idx, dbPlayerId) => {
        const selectedPlayer = players.find(p => p.id === dbPlayerId);
        setResults(prev => {
            const next = [...prev];
            const item = next[idx];
            if (selectedPlayer) {
                item.matchedPlayer = { ...selectedPlayer, isUnknown: false };
                item.team = selectedPlayer.teams?.name || 'Unknown';
                item.teamId = selectedPlayer.team_id;
                setProcessedPlayerIds(ids => new Set(ids).add(selectedPlayer.id));
            } else if (dbPlayerId.startsWith('team_')) {
                const teamId = dbPlayerId.replace('team_', '');
                const t = teams.find(x => x.id === teamId);
                item.team = t ? t.name : 'Unknown';
                item.teamId = teamId;
                item.matchedPlayer = { ...item.matchedPlayer, isGuest: true, team_id: teamId, teams: { name: item.team } };
            }
            return next;
        });
    };

    const saveEdit = (idx, newText) => {
        setResults(prev => {
            const next = [...prev];
            next[idx].editedText = newText;
            return next;
        });
    };

    const handleRematch = (idx) => {
        setResults(prev => {
            const next = [...prev];
            const item = next[idx];
            const match = findClosestPlayer(item.editedText);
            item.ocrName = item.editedText;
            item.matchedPlayer = match;
            item.team = match.teams ? match.teams.name : 'Unknown';
            item.teamId = match.team_id || null;
            if (match && !match.isUnknown) {
                setProcessedPlayerIds(ids => new Set(ids).add(match.id));
            }
            return next;
        });
    };

    const addEmptyMember = (rank) => {
        setResults(prev => [
            ...prev,
            {
                id: `manual_${Math.random().toString(36).substr(2, 9)}`,
                ocrName: '',
                editedText: '',
                matchedPlayer: { isUnknown: true, name: '' },
                kills: "",
                rank: rank,
                team: 'Unknown',
                teamId: null,
                isDuplicate: false,
                isManual: true
            }
        ]);
    };

    const updateTeamPoints = (rank, type, val) => {
        setTeamPoints(prev => ({
            ...prev,
            [rank]: {
                ...(prev[rank] || { bonus: "", penalty: "" }),
                [type]: val
            }
        }));
    };

    const handleSaveToDB = async () => {
        if (!selectedTournament || !selectedRound) {
            alert('Please select a tournament and round.');
            return;
        }
        if (!confirm('COMMIT aggregated results to DB?')) return;
        setIsSaving(true);
        setStatus('Committing...');
        try {
            const existingResults = await storage.getResults(selectedTournament);
            const roundData = existingResults[selectedRound] || {};
            const aggregatedTeams = { ...roundData };
            const ocrUpdates = {};

            results.forEach(item => {
                if (item.rank === "?" || !item.teamId || item.isDuplicate) return;
                const tid = item.teamId;
                if (!ocrUpdates[tid]) {
                    const points = teamPoints[item.rank] || { bonus: "", penalty: "" };
                    ocrUpdates[tid] = {
                        rank: item.rank,
                        memberKills: {},
                        bonus: Number(points.bonus) || 0,
                        penalty: Number(points.penalty) || 0
                    };
                }
                const mid = item.matchedPlayer?.id || `guest_${Math.random().toString(36).substr(2, 9)}`;
                ocrUpdates[tid].memberKills[mid] = Number(item.kills) || 0;
            });

            for (const [tid, update] of Object.entries(ocrUpdates)) {
                if (!aggregatedTeams[tid]) {
                    aggregatedTeams[tid] = { kills: 0, rank: 0, placementPoints: 0, killPoints: 0, bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, isDead: false, memberKills: {} };
                }
                if (!aggregatedTeams[tid].memberKills) aggregatedTeams[tid].memberKills = {};
                for (const [mid, mkills] of Object.entries(update.memberKills)) {
                    aggregatedTeams[tid].memberKills[mid] = mkills;
                }
                let totalK = 0;
                for (const k of Object.values(aggregatedTeams[tid].memberKills)) totalK += (Number(k) || 0);
                aggregatedTeams[tid].kills = totalK;
                aggregatedTeams[tid].rank = update.rank;
                aggregatedTeams[tid].bonusPoints = (aggregatedTeams[tid].bonusPoints || 0) + update.bonus;
                aggregatedTeams[tid].penaltyPoints = (aggregatedTeams[tid].penaltyPoints || 0) + update.penalty;
            }

            const tourney = tournaments.find(t => t.id === selectedTournament);
            const killPointM = tourney?.scoringRules?.killPoint ?? 1;
            const rankPointsList = tourney?.scoringRules?.rankPoints || storage.DEFAULT_RULES.rankPoints;

            for (const [tid, data] of Object.entries(aggregatedTeams)) {
                data.killPoints = data.kills * killPointM;
                const rIdx = (parseInt(data.rank) || 0) - 1;
                data.placementPoints = (rIdx >= 0 && rIdx < rankPointsList.length) ? rankPointsList[rIdx] : 0;
                data.totalPoints = data.killPoints + data.placementPoints + (parseInt(data.bonusPoints) || 0) - (parseInt(data.penaltyPoints) || 0);
                await storage.saveResult(selectedTournament, selectedRound, tid, data);
            }
            alert('Saved successfully!');
            setSaveSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Save failed.');
        } finally {
            setIsSaving(false);
            setStatus('');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }} className="ocr-container">
            <style>{`
                .ocr-container select, .ocr-container input {
                    max-width: 100%;
                }
                .rank-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }
                .member-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.2rem;
                }
                .metrics-header {
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    padding: 1rem;
                }
                .player-card {
                    padding: 0.8rem;
                    padding-bottom: 2.8rem; /* Added room for absolute button */
                    border-radius: 8px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    position: relative;
                }
                .player-row {
                    display: flex;
                    gap: 0.8rem;
                    align-items: center;
                }
                .kill-badge {
                    background: #1e293b;
                    border: 1px solid #475569;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    padding: 0 8px;
                    height: 32px;
                    min-width: 65px;
                }
                .kill-badge label {
                    font-size: 0.6rem;
                    color: #94a3b8;
                    margin-right: 8px;
                    font-weight: 900;
                }
                .kill-badge input {
                    width: 30px;
                    background: transparent;
                    border: none;
                    color: #facc15;
                    font-weight: 900;
                    text-align: right;
                    font-size: 0.95rem;
                    padding: 0;
                }
                .rematch-btn {
                    position: absolute;
                    bottom: 0.6rem;
                    right: 0.6rem;
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: #94a3b8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .rematch-btn:hover {
                    background: #334155;
                    color: white;
                    border-color: #475569;
                }
                .point-inputs {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.2rem;
                    padding-top: 1.2rem;
                    border-top: 1px solid #334155;
                }
                .point-field {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .point-field label {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    font-weight: 800;
                }
                .point-field input {
                    background: #0f172a;
                    border: 1px solid #334155;
                    color: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                }
                .debug-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #94a3b8;
                    font-size: 0.75rem;
                }
                @media (max-width: 1024px) {
                    .rank-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 600px) {
                    .member-grid {
                        grid-template-columns: 1fr;
                        gap: 1.2rem;
                    }
                    .metrics-header {
                        flex-direction: column;
                        gap: 0.8rem;
                    }
                    .metrics-header div[style*="width: 1px"] {
                        display: none;
                    }
                    .context-selectors {
                        flex-direction: column;
                    }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.8rem)' }}>OCR Score Processor</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', color: '#94a3b8' }}>
                        <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />
                        Debug View
                    </label>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.2rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: '800' }}>1. Set Context</h3>
                <div style={{ display: 'flex', gap: '1.2rem' }} className="context-selectors">
                    <select
                        value={selectedTournament}
                        onChange={(e) => setSelectedTournament(e.target.value)}
                        style={{ flex: 1.5, padding: '0.75rem', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.9rem' }}
                    >
                        <option value="">Select Tournament...</option>
                        {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    <select
                        value={selectedRound}
                        onChange={(e) => setSelectedRound(e.target.value)}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.9rem' }}
                    >
                        <option value="">Select Round...</option>
                        {schedule.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '1rem', fontWeight: '800' }}>2. Import Images</h3>
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ flex: 1, fontSize: '0.85rem' }} />
                </div>

                {images.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {images.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', border: '1px solid #334155', borderRadius: '6px', overflow: 'hidden' }}>
                                <img src={URL.createObjectURL(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={processImages}
                    disabled={isProcessing || images.length === 0 || !selectedTournament}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.8rem', padding: '1rem', fontSize: '1rem', fontWeight: '800' }}
                >
                    {isProcessing ? <Loader2 className="spin" size={22} /> : <Play size={22} />}
                    {isProcessing ? `Analysing Images... (${progress}%)` : 'Run Image Recognition'}
                </button>
            </div>

            {showDebug && debugImgUrls.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Analyzed Fragments (Refined Slots)</h3>
                        <div className="debug-info">
                            <Info size={16} />
                            <span>Boundary check: Slots 4/5 split height adjusted.</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                        {debugImgUrls.map((item, i) => (
                            <div key={i} style={{ border: '1px solid #334155', padding: '6px', borderRadius: '6px', background: '#0a0f1e' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', textAlign: 'center', fontWeight: '900' }}>{item.pos}</div>
                                <img src={item.url} alt="" style={{ width: '100%', display: 'block', height: 'auto' }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="metrics-header">
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '900', letterSpacing: '0.05em' }}>Success Rate</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: (results.filter(r => !r.matchedPlayer.isUnknown).length / results.length > 0.9 ? '#10b981' : (results.filter(r => !r.matchedPlayer.isUnknown).length / results.length > 0.7 ? '#f59e0b' : '#ef4444')) }}>
                                {Math.round((results.filter(r => !r.matchedPlayer.isUnknown).length / results.length) * 100)}%
                            </div>
                        </div>
                        <div style={{ height: '32px', width: '1px', background: '#334155' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '900', letterSpacing: '0.05em' }}>Members Mapped</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>{results.filter(r => !r.matchedPlayer.isUnknown).length} / {results.length}</div>
                        </div>
                    </div>

                    <div className="card" style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '900' }}>
                                <Shield size={24} />
                                AGGREGATED STANDINGS
                            </h3>
                            <button className="btn btn-primary" onClick={handleSaveToDB} disabled={isSaving} style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem', fontWeight: '800' }}>
                                <Save size={20} /> {isSaving ? 'Saving...' : 'COMMIT TO DB'}
                            </button>
                        </div>

                        <div className="rank-grid">
                            {Array.from(new Set(results.map(r => r.rank))).sort((a, b) => (a === "?" ? 999 : (b === "?" ? -999 : a - b))).map(rank => {
                                const rankRes = results.filter(r => r.rank === rank);
                                const identifiedTeam = rankRes.find(r => !r.matchedPlayer.isUnknown)?.teamId;

                                return (
                                    <div key={rank} style={{
                                        padding: '1.2rem',
                                        background: '#1e293b',
                                        borderRadius: '12px',
                                        border: `1px solid ${rank === 1 ? '#eab308' : (rank === "?" ? '#ef4444' : '#334155')}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
                                            <h4 style={{ margin: 0, color: rank === 1 ? '#eab308' : (rank === "?" ? '#ef4444' : 'white'), fontSize: '0.9rem', fontWeight: '900', letterSpacing: '0.1em' }}>
                                                {rank === "?" ? "UNASSIGNED DETECTIONS" : `RANK ${rank}`}
                                            </h4>
                                            {rank !== "?" && <button onClick={() => addEmptyMember(rank)} className="btn btn-outline sm" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>+ Member</button>}
                                        </div>

                                        <div className="member-grid">
                                            {rankRes.map((res) => {
                                                const idx = results.findIndex(r => r.id === res.id);
                                                const currentOptions = identifiedTeam
                                                    ? players.filter(p => p.team_id === identifiedTeam)
                                                    : players;

                                                return (
                                                    <div key={res.id} className="player-card" style={{
                                                        border: `1px solid ${res.matchedPlayer.isUnknown ? '#ef4444' : (res.isDuplicate ? '#f59e0b' : '#334155')}`
                                                    }}>
                                                        <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '4px', fontStyle: 'italic', fontWeight: '600' }}>
                                                            {res.isManual ? 'MANUAL' : `OCR: "${res.ocrName}"`}
                                                        </div>

                                                        <div className="player-row">
                                                            <input
                                                                value={res.editedText}
                                                                onChange={(e) => saveEdit(idx, e.target.value)}
                                                                placeholder="Name"
                                                                style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: '0.85rem' }}
                                                            />
                                                            <div className="kill-badge">
                                                                <label>K</label>
                                                                <input
                                                                    type="text"
                                                                    value={res.kills}
                                                                    placeholder="0"
                                                                    onChange={(e) => {
                                                                        const next = [...results];
                                                                        const val = e.target.value;
                                                                        if (val === "" || /^\d+$/.test(val)) {
                                                                            next[idx].kills = val;
                                                                            setResults(next);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {res.matchedPlayer.isUnknown ? (
                                                            <select
                                                                value={res.matchedPlayer?.isGuest ? `team_${res.teamId}` : ""}
                                                                onChange={(e) => handleManualMap(idx, e.target.value)}
                                                                style={{ padding: '0.4rem', background: '#0a0f1e', border: '1px solid #ef4444', color: '#ef4444', width: '100%', fontSize: '0.7rem', borderRadius: '6px', fontWeight: '700' }}
                                                            >
                                                                <option value="">Choose Player...</option>
                                                                {currentOptions.length > 0 && identifiedTeam && (
                                                                    <optgroup label="Likely Team Members">
                                                                        {currentOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                    </optgroup>
                                                                )}
                                                                <optgroup label="All Tournament Players">
                                                                    {players.filter(p => !identifiedTeam || p.team_id !== identifiedTeam).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                </optgroup>
                                                                <optgroup label="Standalone Team Member">
                                                                    {teams.map(t => <option key={t.id} value={`team_${t.id}`}>{t.name}</option>)}
                                                                </optgroup>
                                                            </select>
                                                        ) : (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
                                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                                    <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#0ea5e9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.matchedPlayer.name}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.matchedPlayer.teams?.name}</div>
                                                                </div>
                                                                {res.isDuplicate && <AlertTriangle size={16} color="#f59e0b" />}
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => handleRematch(idx)}
                                                            className="rematch-btn"
                                                            title="Apply Manual Correction"
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {rank !== "?" && (
                                            <div className="point-inputs">
                                                <div className="point-field">
                                                    <label>Bonus Points</label>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={teamPoints[rank]?.bonus || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === "" || /^\d+$/.test(val)) updateTeamPoints(rank, 'bonus', val);
                                                        }}
                                                    />
                                                </div>
                                                <div className="point-field">
                                                    <label>Penalty Points</label>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        style={{ color: '#ef4444' }}
                                                        value={teamPoints[rank]?.penalty || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === "" || /^\d+$/.test(val)) updateTeamPoints(rank, 'penalty', val);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card" style={{ background: '#0a0f1e', border: '1px solid #1e293b', padding: '1.2rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#475569', fontWeight: '900' }}>INTERNAL PIPELINE LOGS</h3>
                        <textarea
                            value={rawText}
                            readOnly
                            style={{ width: '100%', height: '120px', background: '#070a14', color: '#475569', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.7rem', marginTop: '1rem' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
