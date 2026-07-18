window.PT_PROFILE_KEY = 'pt-local-profiles-v1';
window.PT_PROFILE_SESSION_KEY = 'pt-local-profile-session-v1';
window.PT_AUTH_KEY = 'pt-auth-v1';
window.PT_AUTH_SESSION_KEY = 'pt-auth-session';

window.PT_AUTH = (function() {

function safeParse(raw, fallback) {
    try {
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function getDefaultSettings() {
    return typeof window.PT_GET_DEFAULT_SETTINGS === 'function' ? window.PT_GET_DEFAULT_SETTINGS() : {};
}

function normalizeProfile(profile) {
    if (!profile) return null;
    var id = parseInt(profile.id !== undefined ? profile.id : profile.uid, 10);
    if (!isFinite(id)) return null;
    var name = String(profile.name || profile.username || '').trim();
    if (!name) name = '档案 ' + id;
    return {
        id: id,
        name: name,
        createdAt: profile.createdAt || Date.now(),
        updatedAt: profile.updatedAt || Date.now(),
        settings: profile.settings || getDefaultSettings()
    };
}

function readStoredProfiles() {
    var raw = localStorage.getItem(window.PT_PROFILE_KEY);
    var profiles = safeParse(raw, []);
    if (Array.isArray(profiles) && profiles.length) {
        return profiles.map(normalizeProfile).filter(Boolean);
    }
    return migrateOldAccounts();
}

function migrateOldAccounts() {
    var oldAccounts = safeParse(localStorage.getItem(window.PT_AUTH_KEY), []);
    if (!Array.isArray(oldAccounts) || !oldAccounts.length) return [];
    var profiles = oldAccounts.map(normalizeProfile).filter(Boolean);
    if (profiles.length) {
        saveProfiles(profiles);
        var oldSession = safeParse(localStorage.getItem(window.PT_AUTH_SESSION_KEY), null);
        var oldActive = oldSession ? findProfile(profiles, oldSession.uid) : null;
        if (oldActive) setActiveProfile(oldActive);
    }
    return profiles;
}

function saveProfiles(profiles) {
    localStorage.setItem(window.PT_PROFILE_KEY, JSON.stringify(profiles));
}

function findProfile(profiles, idOrName) {
    var id = parseInt(idOrName, 10);
    if (isFinite(id)) {
        return profiles.find(function(profile) { return profile.id === id; }) || null;
    }
    var name = String(idOrName || '').trim();
    return profiles.find(function(profile) { return profile.name === name; }) || null;
}

function getNextId(profiles) {
    var maxId = 0;
    profiles.forEach(function(profile) {
        if (profile.id > maxId) maxId = profile.id;
    });
    return maxId + 1;
}

function setActiveProfile(profile) {
    localStorage.setItem(window.PT_PROFILE_SESSION_KEY, JSON.stringify({
        id: profile.id,
        name: profile.name
    }));
}

function getActiveProfileSnapshot() {
    return safeParse(localStorage.getItem(window.PT_PROFILE_SESSION_KEY), null);
}

function getActiveProfile() {
    var profiles = readStoredProfiles();
    var session = getActiveProfileSnapshot();
    if (!session) return null;
    return findProfile(profiles, session.id);
}

return {
    createProfile: function(name) {
        var profileName = String(name || '').trim();
        if (!profileName) {
            return { ok: false, reason: '请输入档案名称' };
        }
        var profiles = readStoredProfiles();
        var exists = profiles.some(function(profile) {
            return profile.name.toLowerCase() === profileName.toLowerCase();
        });
        if (exists) {
            return { ok: false, reason: '档案名称已存在' };
        }
        var now = Date.now();
        var profile = {
            id: getNextId(profiles),
            name: profileName,
            createdAt: now,
            updatedAt: now,
            settings: getDefaultSettings()
        };
        profiles.push(profile);
        saveProfiles(profiles);
        setActiveProfile(profile);
        return { ok: true, id: profile.id, name: profile.name };
    },

    switchProfile: function(idOrName) {
        var profile = findProfile(readStoredProfiles(), idOrName);
        if (!profile) {
            return { ok: false, reason: '没有找到这个档案' };
        }
        setActiveProfile(profile);
        return { ok: true, id: profile.id, name: profile.name };
    },

    logout: function() {
        localStorage.removeItem(window.PT_PROFILE_SESSION_KEY);
        localStorage.removeItem(window.PT_AUTH_SESSION_KEY);
    },

    isLoggedIn: function() {
        return !!getActiveProfile();
    },

    listProfiles: function() {
        return readStoredProfiles().map(function(profile) {
            return {
                id: profile.id,
                name: profile.name
            };
        });
    },

    getProfileID: function() {
        var profile = getActiveProfile();
        return profile ? profile.id : null;
    },

    getProfileName: function() {
        var profile = getActiveProfile();
        return profile ? profile.name : null;
    },

    getUID: function() {
        return this.getProfileID();
    },

    getUsername: function() {
        return this.getProfileName();
    },

    readSettings: function() {
        var profile = getActiveProfile();
        return profile ? profile.settings : getDefaultSettings();
    },

    writeSettings: function(settings) {
        var active = getActiveProfile();
        if (!active) return;
        var profiles = readStoredProfiles();
        var profile = findProfile(profiles, active.id);
        if (!profile) return;
        profile.settings = settings || getDefaultSettings();
        profile.updatedAt = Date.now();
        saveProfiles(profiles);
    }
};
})();
