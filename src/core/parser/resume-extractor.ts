import type { Profile } from '@/types/profile';
import type { PdfTextLine } from './pdf-parser';
import { createEmptyProfile, generateItemId } from '@/core/profile';

// Section header keywords
const SECTION_KEYWORDS: Record<string, string[]> = {
  basic: ['个人信息', '基本信息', '基本资料', 'Personal Info', 'Basic Info', 'Contact'],
  education: ['教育背景', '教育经历', '学历', 'Education', 'Academic'],
  work: ['工作经历', '实习经历', '工作经验', 'Work Experience', 'Internship', 'Professional Experience'],
  project: ['项目经历', '项目经验', '项目', 'Projects', 'Project Experience'],
  awards: ['获奖情况', '荣誉奖励', '获奖', 'Awards', 'Honors', 'Achievements'],
  certificates: ['证书', '资格证书', 'Certificates', 'Certifications'],
  selfEvaluation: ['自我评价', '个人总结', '个人简介', '自我介绍', 'About Me', 'Summary', 'Profile'],
  jobIntention: ['求职意向', '期望职位', 'Job Intention', 'Career Objective'],
};

// Regex patterns for extracting basic info
const PATTERNS = {
  phone: /(?:1[3-9]\d{9})/,
  email: /[\w.-]+@[\w.-]+\.\w{2,}/,
  name: /^[\u4e00-\u9fa5]{2,4}$/,
  date: /(\d{4})[.\-/年](\d{1,2})[.\-/月]?/g,
  dateRange: /(\d{4})[.\-/年](\d{1,2})[.\-/月]?\s*[-–—~至到]\s*(\d{4})[.\-/年](\d{1,2})[.\-/月]?/,
  gender: /(?:男|女|Male|Female)/,
  gpa: /(?:GPA|绩点)[：:\s]*([0-9.]+\s*[/／]\s*[0-9.]+)/i,
  degree: /(博士|硕士|本科|大专|Bachelor|Master|PhD|MBA)/,
  idCard: /\d{17}[\dXx]/,
  politicalStatus: /(中共党员|中共预备党员|共青团员|群众|民主党派|无党派人士)/,
  ethnicity: /(汉族|满族|蒙古族|回族|藏族|维吾尔族|苗族|彝族|壮族|布依族|朝鲜族|侗族|瑶族|白族|土家族|哈尼族|哈萨克族|傣族|黎族|傈僳族|佤族|畲族|高山族|拉祜族|水族|东乡族|纳西族|景颇族|柯尔克孜族|土族|达斡尔族|仫佬族|羌族|布朗族|撒拉族|毛南族|仡佬族|锡伯族|阿昌族|普米族|塔吉克族|怒族|乌孜别克族|俄罗斯族|鄂温克族|德昂族|保安族|裕固族|京族|塔塔尔族|独龙族|鄂伦春族|赫哲族|门巴族|珞巴族|基诺族)/,
};

interface TextSection {
  type: string;
  lines: string[];
}

function detectSectionType(line: string): { type: string; strength: number } | null {
  const cleaned = line.replace(/[：:·\-—|#*\s]/g, '').toLowerCase();
  if (!cleaned) return null;
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    for (const kw of keywords) {
      const normalizedKw = kw.toLowerCase().replace(/\s/g, '');
      if (cleaned.includes(normalizedKw)) {
        // strength = how much of the line is the keyword (higher = more likely a header)
        const strength = normalizedKw.length / cleaned.length;
        return { type: section, strength };
      }
    }
  }
  return null;
}

function splitIntoSections(lines: PdfTextLine[]): TextSection[] {
  const sections: TextSection[] = [];
  let currentSection: TextSection = { type: 'header', lines: [] };

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    const match = detectSectionType(text);

    // Treat as section header if:
    // - keyword match is strong (keyword covers >= 40% of the line), OR
    // - line is short (< 30 chars) with a keyword, OR
    // - line is bold or has larger font with a keyword
    const isHeader = match && (
      match.strength >= 0.4 ||
      text.length < 30 ||
      line.isBold ||
      line.fontSize > 8
    );

    if (isHeader && match) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { type: match.type, lines: [] };
    } else {
      currentSection.lines.push(text);
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

function extractBasicInfo(lines: string[], profile: Profile): void {
  const fullText = lines.join(' ');

  // Phone
  const phoneMatch = fullText.match(PATTERNS.phone);
  if (phoneMatch) profile.basic.phone = phoneMatch[0];

  // Email
  const emailMatch = fullText.match(PATTERNS.email);
  if (emailMatch) profile.basic.email = emailMatch[0];

  // Gender
  const genderMatch = fullText.match(PATTERNS.gender);
  if (genderMatch) profile.basic.gender = genderMatch[0];

  // ID Card
  const idMatch = fullText.match(PATTERNS.idCard);
  if (idMatch) profile.basic.idCard = idMatch[0];

  // Political status
  const politicalMatch = fullText.match(PATTERNS.politicalStatus);
  if (politicalMatch) profile.basic.politicalStatus = politicalMatch[0];

  // Ethnicity
  const ethnicMatch = fullText.match(PATTERNS.ethnicity);
  if (ethnicMatch) profile.basic.ethnicity = ethnicMatch[0];

  // Name: try to find a short Chinese name in the first few lines
  for (const line of lines.slice(0, 5)) {
    const parts = line.split(/[\s|·：:,，]+/).filter(Boolean);
    for (const part of parts) {
      if (PATTERNS.name.test(part.trim()) && !profile.basic.name) {
        profile.basic.name = part.trim();
        break;
      }
    }
    if (profile.basic.name) break;
  }

  // Try extracting labeled fields
  for (const line of lines) {
    const kv = line.match(/(?:姓名|名字)[：:\s]+(.+?)(?:\s{2,}|$)/);
    if (kv) profile.basic.name = kv[1].trim();

    const cityKv = line.match(/(?:现居|居住地|所在城市|现居城市)[：:\s]+(.+?)(?:\s{2,}|$)/);
    if (cityKv) profile.basic.currentCity = cityKv[1].trim();

    const hometownKv = line.match(/(?:籍贯|户籍)[：:\s]+(.+?)(?:\s{2,}|$)/);
    if (hometownKv) profile.basic.hometown = hometownKv[1].trim();

    const birthdayKv = line.match(/(?:出生日期|出生年月|生日)[：:\s]+(\d{4}[.\-/年]\d{1,2}[.\-/月]?\d{0,2}[日]?)/);
    if (birthdayKv) profile.basic.birthday = birthdayKv[1].replace(/[年月]/g, '-').replace(/[日]/g, '');
  }
}

function extractEducation(lines: string[], profile: Profile): void {
  const fullText = lines.join('\n');
  const dateRangeRegex = /(\d{4})[.\-/年](\d{1,2})[.\-/月]?\s*[-–—~至到]\s*(\d{4})[.\-/年](\d{1,2})[.\-/月]?/g;

  // Try to find education entries by date ranges
  const entries: string[][] = [];
  let currentEntry: string[] = [];

  for (const line of lines) {
    if (PATTERNS.dateRange.test(line) && currentEntry.length > 0) {
      entries.push(currentEntry);
      currentEntry = [line];
    } else {
      currentEntry.push(line);
    }
  }
  if (currentEntry.length > 0) entries.push(currentEntry);

  for (const entry of entries) {
    const entryText = entry.join(' ');
    const edu = {
      id: generateItemId(),
      school: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
      gpa: '',
      rank: '',
    };

    // Date range
    const dateMatch = entryText.match(PATTERNS.dateRange);
    if (dateMatch) {
      edu.startDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`;
      edu.endDate = `${dateMatch[3]}-${dateMatch[4].padStart(2, '0')}`;
    }

    // Degree
    const degreeMatch = entryText.match(PATTERNS.degree);
    if (degreeMatch) edu.degree = degreeMatch[1];

    // GPA
    const gpaMatch = entryText.match(PATTERNS.gpa);
    if (gpaMatch) edu.gpa = gpaMatch[1].replace(/\s/g, '');

    // School: usually the most prominent text, or follows the date
    const parts = entry[0]?.split(/\s{2,}/).filter(Boolean) || [];
    for (const part of parts) {
      const cleaned = part.replace(PATTERNS.dateRange, '').trim();
      if (cleaned && cleaned.length > 1 && !PATTERNS.degree.test(cleaned) && !PATTERNS.gpa.test(cleaned)) {
        if (!edu.school) edu.school = cleaned;
        else if (!edu.major) edu.major = cleaned;
      }
    }

    // Try labeled patterns
    for (const line of entry) {
      const majorMatch = line.match(/(?:专业|所学专业)[：:\s]+(.+?)(?:\s{2,}|$)/);
      if (majorMatch) edu.major = majorMatch[1].trim();

      const schoolMatch = line.match(/(?:学校|院校)[：:\s]+(.+?)(?:\s{2,}|$)/);
      if (schoolMatch) edu.school = schoolMatch[1].trim();
    }

    // Validate: must have at least a school or degree to be considered education
    // Skip entries that look like work (have company-like content but no degree/school indicators)
    const hasEducationSignal = edu.degree || edu.gpa ||
      /大学|学院|University|College|Institute|School/i.test(entryText);
    if ((edu.school || edu.major) && hasEducationSignal) {
      profile.education.push(edu);
    }
  }
}

function extractWorkExperience(lines: string[], profile: Profile): void {
  const entries: string[][] = [];
  let currentEntry: string[] = [];

  for (const line of lines) {
    if (PATTERNS.dateRange.test(line) && currentEntry.length > 0) {
      entries.push(currentEntry);
      currentEntry = [line];
    } else {
      currentEntry.push(line);
    }
  }
  if (currentEntry.length > 0) entries.push(currentEntry);

  for (const entry of entries) {
    const entryText = entry.join(' ');
    const work = {
      id: generateItemId(),
      company: '',
      position: '',
      department: '',
      startDate: '',
      endDate: '',
      description: '',
    };

    const dateMatch = entryText.match(PATTERNS.dateRange);
    if (dateMatch) {
      work.startDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`;
      work.endDate = `${dateMatch[3]}-${dateMatch[4].padStart(2, '0')}`;
    }

    // First line usually has company + position
    const firstLine = entry[0] || '';
    const parts = firstLine.replace(PATTERNS.dateRange, '').split(/\s{2,}|[|｜]/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      work.company = parts[0];
      work.position = parts[1];
      if (parts[2]) work.department = parts[2];
    } else if (parts.length === 1) {
      work.company = parts[0];
    }

    // Remaining lines are description
    const descLines = entry.slice(1).filter(l => !PATTERNS.dateRange.test(l));
    work.description = descLines.join('\n').trim();

    if (work.company || work.position) {
      profile.workExperience.push(work);
    }
  }
}

function extractProjectExperience(lines: string[], profile: Profile): void {
  const entries: string[][] = [];
  let currentEntry: string[] = [];

  for (const line of lines) {
    if (PATTERNS.dateRange.test(line) && currentEntry.length > 0) {
      entries.push(currentEntry);
      currentEntry = [line];
    } else {
      currentEntry.push(line);
    }
  }
  if (currentEntry.length > 0) entries.push(currentEntry);

  for (const entry of entries) {
    const entryText = entry.join(' ');
    const proj = {
      id: generateItemId(),
      name: '',
      role: '',
      startDate: '',
      endDate: '',
      techStack: '',
      description: '',
    };

    const dateMatch = entryText.match(PATTERNS.dateRange);
    if (dateMatch) {
      proj.startDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`;
      proj.endDate = `${dateMatch[3]}-${dateMatch[4].padStart(2, '0')}`;
    }

    const firstLine = entry[0] || '';
    const parts = firstLine.replace(PATTERNS.dateRange, '').split(/\s{2,}|[|｜]/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 1) proj.name = parts[0];
    if (parts.length >= 2) proj.role = parts[1];

    // Look for tech stack
    for (const line of entry) {
      const techMatch = line.match(/(?:技术栈|技术|技术工具|Tech)[：:\s]+(.+)/i);
      if (techMatch) proj.techStack = techMatch[1].trim();
    }

    const descLines = entry.slice(1).filter(l => !PATTERNS.dateRange.test(l) && !/技术栈|Tech Stack/i.test(l));
    proj.description = descLines.join('\n').trim();

    if (proj.name) {
      profile.projectExperience.push(proj);
    }
  }
}

function extractAwards(lines: string[], profile: Profile): void {
  for (const line of lines) {
    if (!line.trim()) continue;
    const award = {
      id: generateItemId(),
      name: line.trim(),
      date: '',
      level: '',
    };

    // Try to extract date
    const dateMatch = line.match(/(\d{4})[.\-/年](\d{1,2})/);
    if (dateMatch) {
      award.date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`;
      award.name = line.replace(dateMatch[0], '').replace(/[月\s]+/g, ' ').trim();
    }

    // Try to extract level
    const levelMatch = line.match(/(国家级|省级|市级|校级|一等奖|二等奖|三等奖|特等奖|金奖|银奖|铜奖)/);
    if (levelMatch) award.level = levelMatch[1];

    if (award.name) {
      profile.awards.push(award);
    }
  }
}

function extractSelfEvaluation(lines: string[], profile: Profile): void {
  profile.selfEvaluation = lines.join('\n').trim();
}

function extractJobIntention(lines: string[], profile: Profile): void {
  const fullText = lines.join(' ');

  for (const line of lines) {
    const posMatch = line.match(/(?:期望职位|意向岗位|目标职位|求职意向)[：:\s]+(.+?)(?:\s{2,}|$)/);
    if (posMatch) profile.jobIntention.position = posMatch[1].trim();

    const cityMatch = line.match(/(?:期望城市|意向城市|工作地点|期望工作地)[：:\s]+(.+?)(?:\s{2,}|$)/);
    if (cityMatch) {
      profile.jobIntention.city = cityMatch[1].split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    }

    const salaryMatch = line.match(/(?:期望薪资|薪资要求|期望薪酬)[：:\s]+(.+?)(?:\s{2,}|$)/);
    if (salaryMatch) profile.jobIntention.salary = salaryMatch[1].trim();

    const dateMatch = line.match(/(?:到岗时间|可到岗时间|入职时间)[：:\s]+(.+?)(?:\s{2,}|$)/);
    if (dateMatch) profile.jobIntention.entryDate = dateMatch[1].trim();
  }
}

export function extractProfileFromText(lines: PdfTextLine[], profileName: string): Profile {
  const profile = createEmptyProfile(profileName);
  const sections = splitIntoSections(lines);

  // The header section (before any identified section) often contains basic info
  const headerSection = sections.find(s => s.type === 'header');
  if (headerSection) {
    extractBasicInfo(headerSection.lines, profile);
  }

  for (const section of sections) {
    switch (section.type) {
      case 'basic':
        extractBasicInfo(section.lines, profile);
        break;
      case 'education':
        extractEducation(section.lines, profile);
        break;
      case 'work':
        extractWorkExperience(section.lines, profile);
        break;
      case 'project':
        extractProjectExperience(section.lines, profile);
        break;
      case 'awards':
        extractAwards(section.lines, profile);
        break;
      case 'certificates':
        // Treat similar to awards for now
        extractAwards(section.lines, profile);
        break;
      case 'selfEvaluation':
        extractSelfEvaluation(section.lines, profile);
        break;
      case 'jobIntention':
        extractJobIntention(section.lines, profile);
        break;
    }
  }

  return profile;
}
