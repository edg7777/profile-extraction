import type { Profile } from '@/types/profile';

const PROFILES_KEY = 'autofill_profiles';
const ACTIVE_PROFILE_KEY = 'autofill_active_profile_id';
const FIELD_MAPPINGS_KEY = 'autofill_field_mappings';

export async function getAllProfiles(): Promise<Profile[]> {
  const result = await chrome.storage.local.get(PROFILES_KEY);
  return result[PROFILES_KEY] || [];
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const profiles = await getAllProfiles();
  return profiles.find((p) => p.id === id);
}

export async function saveProfile(profile: Profile): Promise<void> {
  const profiles = await getAllProfiles();
  const index = profiles.findIndex((p) => p.id === profile.id);
  profile.updatedAt = Date.now();
  if (index >= 0) {
    profiles[index] = profile;
  } else {
    profile.createdAt = Date.now();
    profiles.push(profile);
  }
  await chrome.storage.local.set({ [PROFILES_KEY]: profiles });
}

export async function deleteProfile(id: string): Promise<void> {
  const profiles = await getAllProfiles();
  const filtered = profiles.filter((p) => p.id !== id);
  await chrome.storage.local.set({ [PROFILES_KEY]: filtered });

  const activeId = await getActiveProfileId();
  if (activeId === id && filtered.length > 0) {
    await setActiveProfileId(filtered[0].id);
  } else if (filtered.length === 0) {
    await chrome.storage.local.remove(ACTIVE_PROFILE_KEY);
  }
}

export async function getActiveProfileId(): Promise<string | null> {
  const result = await chrome.storage.local.get(ACTIVE_PROFILE_KEY);
  return result[ACTIVE_PROFILE_KEY] || null;
}

export async function setActiveProfileId(id: string): Promise<void> {
  await chrome.storage.local.set({ [ACTIVE_PROFILE_KEY]: id });
}

export async function getActiveProfile(): Promise<Profile | null> {
  const id = await getActiveProfileId();
  if (!id) return null;
  const profile = await getProfile(id);
  return profile || null;
}

export async function getSavedFieldMappings(domain: string): Promise<Record<string, string>> {
  const result = await chrome.storage.local.get(FIELD_MAPPINGS_KEY);
  const all = result[FIELD_MAPPINGS_KEY] || {};
  return all[domain] || {};
}

export async function saveFieldMapping(
  domain: string,
  fieldKey: string,
  profilePath: string
): Promise<void> {
  const result = await chrome.storage.local.get(FIELD_MAPPINGS_KEY);
  const all = result[FIELD_MAPPINGS_KEY] || {};
  if (!all[domain]) all[domain] = {};
  all[domain][fieldKey] = profilePath;
  await chrome.storage.local.set({ [FIELD_MAPPINGS_KEY]: all });
}
