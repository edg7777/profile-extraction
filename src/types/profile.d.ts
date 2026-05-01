export interface BasicInfo {
  name: string;
  gender: string;
  birthday: string;
  phone: string;
  email: string;
  idCard: string;
  politicalStatus: string;
  ethnicity: string;
  hometown: string;
  currentCity: string;
  avatar: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  gpa: string;
  rank: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectExperience {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  techStack: string;
  description: string;
}

export interface Award {
  id: string;
  name: string;
  date: string;
  level: string;
}

export interface Certificate {
  id: string;
  name: string;
  date: string;
  score: string;
}

export interface JobIntention {
  position: string;
  city: string[];
  salary: string;
  entryDate: string;
}

export interface SocialLinks {
  github: string;
  blog: string;
  linkedin: string;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  basic: BasicInfo;
  education: Education[];
  workExperience: WorkExperience[];
  projectExperience: ProjectExperience[];
  awards: Award[];
  certificates: Certificate[];
  selfEvaluation: string;
  jobIntention: JobIntention;
  socialLinks: SocialLinks;
}
