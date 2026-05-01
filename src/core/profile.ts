import type { Profile } from '@/types/profile';

export function createEmptyProfile(name: string = '默认简历'): Profile {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    basic: {
      name: '',
      gender: '',
      birthday: '',
      phone: '',
      email: '',
      idCard: '',
      politicalStatus: '',
      ethnicity: '',
      hometown: '',
      currentCity: '',
      avatar: '',
    },
    education: [],
    workExperience: [],
    projectExperience: [],
    skills: [],
    awards: [],
    certificates: [],
    selfEvaluation: '',
    jobIntention: {
      position: '',
      city: [],
      salary: '',
      entryDate: '',
    },
    socialLinks: {
      github: '',
      blog: '',
      linkedin: '',
    },
  };
}

export function generateItemId(): string {
  return crypto.randomUUID();
}
