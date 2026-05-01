import { create } from 'zustand';
import type { Profile } from '@/types/profile';
import { createEmptyProfile, generateItemId } from '@/core/profile';
import {
  getAllProfiles,
  saveProfile as storageSave,
  deleteProfile as storageDelete,
  getActiveProfileId,
  setActiveProfileId,
  getActiveProfile,
} from '@/utils/storage';

interface ProfileStore {
  profiles: Profile[];
  activeProfileId: string | null;
  currentProfile: Profile | null;
  loading: boolean;

  init: () => Promise<void>;
  loadProfiles: () => Promise<void>;
  createProfile: (name?: string) => Promise<Profile>;
  saveProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string) => Promise<void>;
  updateCurrentProfile: (updater: (p: Profile) => Profile) => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  currentProfile: null,
  loading: true,

  init: async () => {
    set({ loading: true });
    const profiles = await getAllProfiles();
    let activeId = await getActiveProfileId();

    if (profiles.length === 0) {
      const defaultProfile = createEmptyProfile('默认简历');
      await storageSave(defaultProfile);
      profiles.push(defaultProfile);
      activeId = defaultProfile.id;
      await setActiveProfileId(activeId);
    } else if (!activeId || !profiles.find((p) => p.id === activeId)) {
      activeId = profiles[0].id;
      await setActiveProfileId(activeId);
    }

    const current = profiles.find((p) => p.id === activeId) || profiles[0];
    set({ profiles, activeProfileId: activeId, currentProfile: current, loading: false });
  },

  loadProfiles: async () => {
    const profiles = await getAllProfiles();
    const activeId = await getActiveProfileId();
    const current = profiles.find((p) => p.id === activeId) || profiles[0] || null;
    set({ profiles, activeProfileId: activeId, currentProfile: current });
  },

  createProfile: async (name?: string) => {
    const profile = createEmptyProfile(name || `简历 ${get().profiles.length + 1}`);
    await storageSave(profile);
    await setActiveProfileId(profile.id);
    const profiles = await getAllProfiles();
    set({ profiles, activeProfileId: profile.id, currentProfile: profile });
    return profile;
  },

  saveProfile: async (profile: Profile) => {
    await storageSave(profile);
    const profiles = await getAllProfiles();
    set({ profiles, currentProfile: profile });
  },

  deleteProfile: async (id: string) => {
    await storageDelete(id);
    const profiles = await getAllProfiles();
    const activeId = await getActiveProfileId();
    const current = profiles.find((p) => p.id === activeId) || profiles[0] || null;
    set({ profiles, activeProfileId: activeId, currentProfile: current });
  },

  setActiveProfile: async (id: string) => {
    await setActiveProfileId(id);
    const profiles = get().profiles;
    const current = profiles.find((p) => p.id === id) || null;
    set({ activeProfileId: id, currentProfile: current });
  },

  updateCurrentProfile: (updater) => {
    const current = get().currentProfile;
    if (!current) return;
    const updated = updater({ ...current });
    updated.updatedAt = Date.now();
    set({ currentProfile: updated });
  },
}));
