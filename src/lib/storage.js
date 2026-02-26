
import { supabase } from './supabase';

const DEFAULT_RULES = {
    killPoint: 1,
    rankPoints: [15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Rank 1 to 20
    tiebreakers: ['placementPoints', 'wins', 'killPoints', 'bonusPoints']
};

// Helper to get current profile
// Helper to get current profile with retry
const mapProfile = (p) => {
    if (!p) return null;
    return {
        id: p.id,
        username: p.username || (p.email ? p.email.split('@')[0] : 'Unknown'),
        role: p.role || 'viewer',
        shareCode: p.share_code || '',
        unlockedTournaments: p.unlocked_tournaments || [],
        pinnedTournaments: p.pinned_tournaments || [],
        following: p.following || [],
        blocked: p.blocked || [],
        email: p.email
    };
};

const fetchProfile = async (userId, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            // Add a 5s timeout to the individual fetch call
            const fetchPromise = supabase.from('profiles').select('*').eq('id', userId).single();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch Timeout')), 5000));

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (data) return mapProfile(data);
            if (error && error.code !== 'PGRST116') {
                console.warn(`Profile fetch attempt ${i + 1} failed:`, error.message);
            }
        } catch (e) {
            console.warn(`Profile fetch attempt ${i + 1} threw:`, e.message);
        }
        await new Promise(r => setTimeout(r, 500));
    }
    return null;
};

export const storage = {
    DEFAULT_RULES,
    fetchProfile, // Expose for App.jsx

    init: async () => {
        // No local seeing needed anymore
        console.log("Supabase storage initialized");
    },

    // Users (Auth)
    register: async (email, password, username) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });
        if (error) throw error;

        // If email confirmation is disabled, we might be logged in immediately.
        // If enabled, user needs to verify.
        // For this app, we assume immediate login or we handle session catch.
        if (data.user) {
            const profile = await fetchProfile(data.user.id);
            // If profile trigger hasn't run yet, profile might be null.
            // But usually triggers are fast. If null, use meta.
            const user = { ...data.user, ...profile, username };
            sessionStorage.setItem('tm_session', JSON.stringify(user));
            return user;
        }
    },
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Fetch extended profile with retry
        const profile = await fetchProfile(data.user.id);
        const user = { ...data.user, ...(profile || mapProfile({ id: data.user.id, email: data.user.email })) };
        user.email = data.user.email; // Ensure email is in the final object
        sessionStorage.setItem('tm_session', JSON.stringify(user));
        return user;
    },
    logout: async () => {
        await supabase.auth.signOut();
        sessionStorage.removeItem('tm_session');
    },
    getCurrentUser: () => {
        try {
            const data = sessionStorage.getItem('tm_session');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },
    // Sync helper for UI (kept for backward compatibility, but ideally should use context)
    getCurrentUserSync: () => {
        try {
            const data = sessionStorage.getItem('tm_session');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    getUsers: async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            console.error("Error loading users:", error);
            return [];
        }
        return (data || []).map(mapProfile);
    },
    updateUser: async (user) => {
        const payload = {
            role: user.role,
            share_code: user.shareCode,
            unlocked_tournaments: user.unlockedTournaments || [],
            pinned_tournaments: user.pinnedTournaments || [],
            following: user.following
        };
        const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
        if (error) throw error;
    },
    deleteUser: async (userId) => {
        // Use the secure RPC function to delete both Auth and Profile data
        const { error } = await supabase.rpc('delete_user', { target_user_id: userId });
        if (error) throw error;
    },
    regenerateShareCode: async (userId) => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase.from('profiles').update({ share_code: newCode }).eq('id', userId);
        if (error) throw error;
        return newCode;
    },
    pinTournament: async (tournamentId) => {
        const user = storage.getCurrentUser();
        if (!user) throw new Error('Not logged in');
        const pinned = user.pinnedTournaments || [];
        const isPinned = pinned.includes(tournamentId);
        const updatedPinned = isPinned
            ? pinned.filter(id => id !== tournamentId)
            : [...pinned, tournamentId];
        const { error } = await supabase
            .from('profiles')
            .update({ pinned_tournaments: updatedPinned })
            .eq('id', user.id);
        if (error) throw error;
        // Update session
        const updatedUser = { ...user, pinnedTournaments: updatedPinned };
        sessionStorage.setItem('tm_session', JSON.stringify(updatedUser));
        return updatedPinned;
    },
    // NEW: Tournament Share Code Handling
    unlockTournament: async (code) => {
        const { data, error } = await supabase.rpc('unlock_tournament', { input_code: code });
        if (error) throw error;
        return data; // { success: boolean, tournament_id?: string, message?: string }
    },
    regenerateTournamentShareCode: async (tournamentId) => {
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { error } = await supabase.from('tournaments').update({ share_code: newCode }).eq('id', tournamentId);
        if (error) throw error;
        return newCode;
    },
    getUserByShareCode: async (code) => {
        const { data, error } = await supabase.from('profiles').select('*').eq('share_code', code).maybeSingle();
        if (error || !data) return null;
        return mapProfile(data);
    },
    getFollowers: async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .contains('following', [userId]);
        if (error) return [];
        return data.map(p => ({
            id: p.id,
            username: p.username,
            shareCode: p.share_code
        }));
    },
    toggleBlock: async (currentUserId, targetUserId, isBlocked) => {
        const { data: profile } = await supabase.from('profiles').select('blocked').eq('id', currentUserId).single();
        let blocked = profile?.blocked || [];
        if (isBlocked) {
            if (!blocked.includes(targetUserId)) blocked.push(targetUserId);
        } else {
            blocked = blocked.filter(id => id !== targetUserId);
        }
        const { error } = await supabase.from('profiles').update({ blocked }).eq('id', currentUserId);
        if (error) throw error;
    },

    // Tournaments
    getTournaments: async () => {
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Error loading tournaments:", error);
            return [];
        }
        // Unpack "rules" JSON back to top-level properties for frontend
        return (data || []).map(t => ({
            ...t,
            scoringRules: t.rules?.scoringRules || DEFAULT_RULES,
            description: t.rules?.description || '',
            tags: t.rules?.tags || [],
            maxTeams: t.rules?.maxTeams || 20,
            maxMembers: t.rules?.maxMembers || 5, // Unpack maxMembers
            tiebreakers: t.rules?.tiebreakers || DEFAULT_RULES.tiebreakers, // Unpack tiebreakers
            defaultIcon: t.rules?.defaultIcon || null, // Unpack defaultIcon
            tagRequired: t.rules?.tagRequired ?? true, // Unpack tagRequired
            lockMembers: t.rules?.lockMembers ?? false, // Unpack lockMembers
            channels: t.rules?.channels || [], // Unpack channels
            ownerId: t.owner_id, // Map snake_case to camelCase
            shareCode: t.share_code, // Add this
            rounds: (t.schedule || []).reduce((acc, day) => acc + (parseInt(day.rounds) || 0), 0)
        }));
    },
    saveTournament: async (tourney) => {
        const user = storage.getCurrentUser();
        if (!user) throw new Error("Must be logged in");

        // Pack extra fields into "rules" JSONB column
        const packedRules = {
            scoringRules: tourney.scoringRules || DEFAULT_RULES,
            description: tourney.description,
            tags: tourney.tags,
            maxTeams: tourney.maxTeams,
            maxMembers: tourney.maxMembers || 5, // Pack maxMembers
            tiebreakers: tourney.tiebreakers || DEFAULT_RULES.tiebreakers, // Pack tiebreakers
            defaultIcon: tourney.defaultIcon, // Pack defaultIcon
            tagRequired: tourney.tagRequired ?? true, // Pack tagRequired
            lockMembers: tourney.lockMembers ?? false, // Pack lockMembers
            channels: tourney.channels // Pack channels
        };

        const payload = {
            name: tourney.name,
            rules: packedRules,
            schedule: tourney.schedule,
            status: tourney.status || 'upcoming'
        };

        if (tourney.id) {
            // Update
            const { data, error } = await supabase
                .from('tournaments')
                .update(payload)
                .eq('id', tourney.id)
                .select()
                .single();
            if (error) throw error;
            return {
                ...data,
                scoringRules: data.rules?.scoringRules,
                description: data.rules?.description,
                tags: data.rules?.tags,
                maxTeams: data.rules?.maxTeams,
                maxMembers: data.rules?.maxMembers || 5,
                tiebreakers: data.rules?.tiebreakers || DEFAULT_RULES.tiebreakers,
                defaultIcon: data.rules?.defaultIcon,
                tagRequired: data.rules?.tagRequired,
                lockMembers: data.rules?.lockMembers,
                channels: data.rules?.channels,
                ownerId: data.owner_id,
                shareCode: data.share_code,
                rounds: (data.schedule || []).reduce((acc, day) => acc + (parseInt(day.rounds) || 0), 0)
            };
        } else {
            // Insert: Add owner_id and generate initial share_code
            const share_code = Math.random().toString(36).substring(2, 10).toUpperCase();
            const { data, error } = await supabase
                .from('tournaments')
                .insert({ ...payload, owner_id: user.id, share_code })
                .select()
                .single();
            if (error) throw error;
            return {
                ...data,
                scoringRules: data.rules?.scoringRules,
                description: data.rules?.description,
                tags: data.rules?.tags,
                maxTeams: data.rules?.maxTeams,
                maxMembers: data.rules?.maxMembers || 5,
                tiebreakers: data.rules?.tiebreakers || DEFAULT_RULES.tiebreakers,
                defaultIcon: data.rules?.defaultIcon,
                tagRequired: data.rules?.tagRequired,
                lockMembers: data.rules?.lockMembers,
                channels: data.rules?.channels,
                ownerId: data.owner_id,
                rounds: (data.schedule || []).reduce((acc, day) => acc + (parseInt(day.rounds) || 0), 0)
            };
        }
    },
    deleteTournament: async (tournamentId) => {
        // Delete related data first (messages, results, teams), then the tournament
        await supabase.from('messages').delete().eq('tournament_id', tournamentId);
        await supabase.from('results').delete().eq('tournament_id', tournamentId);
        await supabase.from('teams').delete().eq('tournament_id', tournamentId);
        const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
        if (error) throw error;
    },

    // Teams
    getTeams: async (tournamentId) => {
        let query = supabase.from('teams').select('*');
        if (tournamentId) {
            query = query.eq('tournament_id', tournamentId);
        }

        const { data, error } = await query;
        if (error) {
            console.error("Error loading teams:", error);
            return [];
        }
        return data.map(t => ({
            ...t,
            tournamentId: t.tournament_id,
            memberIds: t.member_ids || [], // Supabase returns member_ids
            ownerId: t.owner_id
        }));
    },
    saveTeam: async (team) => {
        const user = storage.getCurrentUser();
        const payload = {
            name: team.name,
            tag: team.tag,
            icon: team.icon,
            tournament_id: team.tournamentId || team.tournament_id,
            owner_id: user?.id,
            member_ids: team.memberIds || []
        };

        if (team.id && !team.id.toString().startsWith('t-')) {
            const { data, error } = await supabase
                .from('teams')
                .update(payload)
                .eq('id', team.id)
                .select()
                .single();
            if (error) throw error;
            return { ...data, memberIds: data.member_ids, ownerId: data.owner_id, tournamentId: data.tournament_id };
        } else {
            // Check max teams limit before inserting
            const { count, error: countError } = await supabase
                .from('teams')
                .select('*', { count: 'exact', head: true })
                .eq('tournament_id', payload.tournament_id);
            if (countError) throw countError;

            const { data: tourney, error: tourneyError } = await supabase
                .from('tournaments')
                .select('rules')
                .eq('id', payload.tournament_id)
                .single();
            if (tourneyError) throw tourneyError;

            const maxTeams = tourney.rules?.maxTeams || 20;
            if (count >= maxTeams) {
                throw new Error(`満員です。最大チーム数（${maxTeams}）に達しています。`);
            }

            // Insert
            const { data, error } = await supabase
                .from('teams')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            return { ...data, memberIds: data.member_ids, ownerId: data.owner_id, tournamentId: data.tournament_id };
        }
    },
    deleteTeam: async (id) => {
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) throw error;
    },

    // Players
    getPlayers: async () => {
        // Fetch from players table if it exists, otherwise fall back to profiles
        const { data, error } = await supabase.from('players').select('*');
        if (error) {
            // Fallback to profiles for compatibility
            const { data: profiles } = await supabase.from('profiles').select('*');
            return (profiles || []).map(p => ({
                id: p.id,
                name: p.username,
                username: p.username,
                tags: []
            }));
        }
        return data.map(p => ({
            ...p,
            tags: p.tags || []
        }));
    },
    savePlayer: async (player) => {
        const payload = {
            name: player.name,
            tags: player.tags || []
        };

        if (player.id && !player.id.startsWith('p-')) {
            const { data, error } = await supabase
                .from('players')
                .update(payload)
                .eq('id', player.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('players')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },

    // Results
    getResults: async (tournamentId) => {
        const { data, error } = await supabase
            .from('results')
            .select('*')
            .eq('tournament_id', tournamentId);

        if (error) {
            console.error(error);
            return {};
        }

        // Convert flat DB rows back to nested object structure expected by UI:
        // { round1: { teamId: { ...data } } }
        const formatted = {};
        data.forEach(row => {
            if (!formatted[row.round]) formatted[row.round] = {};
            formatted[row.round][row.team_id] = row.data;
        });
        return formatted;
    },
    saveResult: async (tournamentId, roundId, teamId, resultData) => {
        // Check if result exists
        const { data: existing } = await supabase
            .from('results')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('round', roundId)
            .eq('team_id', teamId)
            .eq('team_id', teamId)
            .maybeSingle();

        const payload = {
            tournament_id: tournamentId,
            round: roundId,
            team_id: teamId,
            data: resultData
        };

        if (existing) {
            const { error } = await supabase.from('results').update(payload).eq('id', existing.id);
            if (error) console.error("Error updating result:", error);
        } else {
            const { error } = await supabase.from('results').insert(payload);
            if (error) console.error("Error inserting result:", error);
        }
    },

    // Settings (Global Rules)
    getSettings: async () => {
        // For simplicity, returning defaults. 
        // In real app, could store in a 'settings' table or on the admin profile.
        return DEFAULT_RULES;
    },

    // Chat
    getChats: async (tournamentId, channelId) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                user:profiles(username, role) 
            `) // Join with profiles to get username
            .eq('tournament_id', tournamentId)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true });

        if (error) return [];

        // Map to UI format
        return data.map(m => ({
            id: m.id,
            message: m.content, // Fixed: UI expects 'message', not 'text'
            image: m.image, // New column
            timestamp: m.created_at,
            senderId: m.user_id,
            senderName: m.user?.username || 'Unknown',
            role: m.user?.role || 'viewer'
        }));
    },
    saveChat: async (tournamentId, msgObject, channelId) => {
        const user = storage.getCurrentUser();
        if (!user) return;

        const { error } = await supabase.from('messages').insert({
            tournament_id: tournamentId,
            channel_id: channelId,
            user_id: user.id,
            content: msgObject.message,
            image: msgObject.image || null
        });
        if (error) console.error("Chat error", error);
    },
    updateChat: async (tournamentId, msgId, updates, channelId) => {
        const { error } = await supabase.from('messages')
            .update({ content: updates.message })
            .eq('id', msgId)
            .eq('tournament_id', tournamentId);
        if (error) console.error("Update chat error", error);
    },
    deleteChat: async (tournamentId, msgId, channelId) => {
        const { error } = await supabase.from('messages')
            .delete()
            .eq('id', msgId)
            .eq('tournament_id', tournamentId);
        if (error) console.error("Delete chat error", error);
    },
    setLastRead: async (tournamentId, userId, channelId, timestamp) => {
        // Upsert to Supabase for global read receipts
        const { error } = await supabase
            .from('channel_reads')
            .upsert({
                tournament_id: tournamentId,
                user_id: userId,
                channel_id: channelId,
                last_read_at: timestamp
            }, { onConflict: 'tournament_id, channel_id, user_id' });

        if (error) console.error("setLastRead error:", error);

        // Fallback/Local cache
        const key = `lastRead_${userId}_${tournamentId}_${channelId}`;
        localStorage.setItem(key, timestamp);
    },
    getUnreadCount: async (tournamentId, userId, channelId) => {
        // Try to get last read from DB first
        const { data, error: readError } = await supabase
            .from('channel_reads')
            .select('last_read_at')
            .eq('tournament_id', tournamentId)
            .eq('user_id', userId)
            .eq('channel_id', channelId)
            .maybeSingle();

        const lastRead = data?.last_read_at || localStorage.getItem(`lastRead_${userId}_${tournamentId}_${channelId}`);

        let query = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId)
            .eq('channel_id', channelId)
            .neq('user_id', userId);

        if (lastRead) {
            query = query.gt('created_at', lastRead);
        }

        const { count, error } = await query;
        if (error) {
            console.error('Unread count error:', error);
            return 0;
        }
        return count || 0;
    },
    getReadCount: async (tournamentId, channelId, messageTimestamp) => {
        const { count, error } = await supabase
            .from('channel_reads')
            .select('user_id', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId)
            .eq('channel_id', channelId)
            .gt('last_read_at', messageTimestamp);

        if (error) {
            console.error("getReadCount error:", error);
            return 0;
        }
        return count || 0;
    }
};
