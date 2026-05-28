// Менеджер профилей ClickFlow

const DEFAULT_PROFILES = [
  {
    id: "default",
    name: "Основной",
    description: "Сценарии по умолчанию",
    scenarioIds: ["basic-clicker"],
    meta: { createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z", isDefault: true }
  },
  {
    id: "work",
    name: "Работа",
    description: "Рабочие сценарии",
    scenarioIds: [],
    meta: { createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z", isDefault: false }
  },
  {
    id: "testing",
    name: "Тестирование",
    description: "Сценарии для тестирования",
    scenarioIds: [],
    meta: { createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z", isDefault: false }
  },
  {
    id: "personal",
    name: "Личное",
    description: "Личные сценарии",
    scenarioIds: [],
    meta: { createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z", isDefault: false }
  }
];

let profiles = [];
let activeProfileId = "default";
let profilesCorrupted = false; // Step 15: track JSON corruption fallback

async function initProfiles() {
  try {
    const result = await window.clickflow.profiles.load();
    profilesCorrupted = !!(result && result.corrupted);
    if (result.success && result.data && Array.isArray(result.data.profiles)) {
      profiles = result.data.profiles;
      activeProfileId = result.data.activeProfileId || "default";
      // Ensure default profile exists
      if (!profiles.find(p => p.id === "default")) {
        profiles.unshift(DEFAULT_PROFILES[0]);
      }
    } else {
      profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
      activeProfileId = "default";
    }
  } catch (e) {
    profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
    activeProfileId = "default";
    profilesCorrupted = true;
  }
}

function getProfilesCorrupted() { return profilesCorrupted; }

function getProfiles() { return [...profiles]; }

function getProfileById(id) { return profiles.find(p => p.id === id) || null; }

function getDefaultProfile() { return profiles.find(p => p.id === "default") || DEFAULT_PROFILES[0]; }

function getActiveProfile() { return getProfileById(activeProfileId) || getDefaultProfile(); }

function setActiveProfile(id) {
  if (profiles.find(p => p.id === id)) {
    activeProfileId = id;
  }
}

function getActiveProfileId() { return activeProfileId; }

function createProfileId() {
  return 'profile-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
}

function createProfile(input) {
  if (!input.name || !input.name.trim()) return { success: false, error: 'Name required' };
  const now = new Date().toISOString();
  const profile = {
    id: createProfileId(),
    name: input.name.trim(),
    description: (input.description || '').trim(),
    scenarioIds: [],
    meta: { createdAt: now, updatedAt: now, isDefault: false }
  };
  profiles.push(profile);
  return { success: true, profile };
}

function updateProfile(id, updates) {
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) return { success: false, error: 'Profile not found' };
  if (updates.name) profiles[idx].name = updates.name.trim();
  if (updates.description !== undefined) profiles[idx].description = (updates.description || '').trim();
  profiles[idx].meta.updatedAt = new Date().toISOString();
  return { success: true, profile: profiles[idx] };
}

function deleteProfile(id) {
  const profile = profiles.find(p => p.id === id);
  if (!profile) return { success: false, error: 'Profile not found' };
  if (profile.meta && profile.meta.isDefault) return { success: false, error: 'Cannot delete default profile' };
  profiles = profiles.filter(p => p.id !== id);
  if (activeProfileId === id) activeProfileId = "default";
  return { success: true };
}

function addScenarioToProfile(profileId, scenarioId) {
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return false;
  if (!profile.scenarioIds.includes(scenarioId)) {
    profile.scenarioIds.push(scenarioId);
    profile.meta.updatedAt = new Date().toISOString();
  }
  return true;
}

function removeScenarioFromProfile(profileId, scenarioId) {
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return false;
  profile.scenarioIds = profile.scenarioIds.filter(id => id !== scenarioId);
  profile.meta.updatedAt = new Date().toISOString();
  return true;
}

function getScenariosForProfile(profileId) {
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return [];
  return profile.scenarioIds;
}

async function saveProfiles() {
  return await window.clickflow.profiles.save({ profiles, activeProfileId });
}

function getProfileCount() { return profiles.length; }
