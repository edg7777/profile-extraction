import { SYNONYM_MAP, getAllProfilePaths } from './synonyms';
import type { FormField, FieldMapping } from '@/types/form';
import type { Profile } from '@/types/profile';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s_\-\.]/g, '')
    .replace(/[：:]/g, '')
    .trim();
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function matchCandidates(candidates: string[]): { profilePath: string; confidence: number } | null {
  let bestMatch: { profilePath: string; confidence: number } | null = null;

  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    if (!normalizedCandidate) continue;

    for (const [profilePath, synonyms] of Object.entries(SYNONYM_MAP)) {
      for (const synonym of synonyms) {
        const normalizedSynonym = normalize(synonym);

        // 精确匹配
        if (normalizedCandidate === normalizedSynonym) {
          return { profilePath, confidence: 1.0 };
        }

        // 包含匹配
        if (normalizedCandidate.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedCandidate)) {
          const len = Math.max(normalizedCandidate.length, normalizedSynonym.length);
          const overlap = Math.min(normalizedCandidate.length, normalizedSynonym.length);
          const confidence = overlap / len * 0.9;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { profilePath, confidence };
          }
        }

        // 编辑距离模糊匹配
        const maxLen = Math.max(normalizedCandidate.length, normalizedSynonym.length);
        if (maxLen > 0) {
          const dist = editDistance(normalizedCandidate, normalizedSynonym);
          const similarity = 1 - dist / maxLen;
          if (similarity > 0.7 && (!bestMatch || similarity * 0.8 > bestMatch.confidence)) {
            bestMatch = { profilePath, confidence: similarity * 0.8 };
          }
        }
      }
    }
  }

  return bestMatch;
}

function getValueFromProfile(profile: Profile, path: string): string {
  const parts = path.split('.');
  let current: any = profile;

  for (const part of parts) {
    if (current === undefined || current === null) return '';

    if (Array.isArray(current)) {
      // 取第一个元素
      if (current.length === 0) return '';
      current = current[0][part];
    } else {
      current = current[part];
    }
  }

  if (Array.isArray(current)) {
    return current.join(', ');
  }

  return current?.toString() || '';
}

export function matchFields(
  fields: FormField[],
  profile: Profile,
  savedMappings?: Record<string, string>
): FieldMapping[] {
  const mappings: FieldMapping[] = [];

  for (const field of fields) {
    const fieldKey = field.name || field.id || field.label;

    // 优先使用已保存的映射
    if (savedMappings && fieldKey && savedMappings[fieldKey]) {
      const profilePath = savedMappings[fieldKey];
      mappings.push({
        field,
        profilePath,
        value: getValueFromProfile(profile, profilePath),
        confidence: 1.0,
      });
      continue;
    }

    // 使用候选文本进行匹配
    const result = matchCandidates(field.candidates);
    if (result) {
      mappings.push({
        field,
        profilePath: result.profilePath,
        value: getValueFromProfile(profile, result.profilePath),
        confidence: result.confidence,
      });
    }
  }

  return mappings;
}

// Per-field synonyms for matching within a specific entry (no section prefix needed)
const ENTRY_FIELD_SYNONYMS: Record<string, Record<string, string[]>> = {
  education: {
    school: ['学校', '毕业院校', '院校名称', '学校名称', 'School', 'University', 'College', 'school', 'university'],
    degree: ['学历', '学位', '学历层次', 'Degree', 'Education Level', 'degree', 'education_level'],
    major: ['专业', '所学专业', '专业名称', 'Major', 'Field of Study', 'major', 'field_of_study'],
    startDate: ['入学时间', '入学日期', '开始时间', 'Start Date', 'start_date', 'enrollment_date', '开始'],
    endDate: ['毕业时间', '毕业日期', '结束时间', 'End Date', 'end_date', 'graduation_date', '结束'],
    gpa: ['GPA', '绩点', '平均绩点', '成绩', 'gpa', 'grade_point'],
    rank: ['排名', '年级排名', '专业排名', 'Rank', 'Ranking', 'rank'],
  },
  workExperience: {
    company: ['公司', '公司名称', '企业名称', '单位名称', 'Company', 'Organization', 'company', 'employer'],
    position: ['职位', '岗位', '职务', '岗位名称', 'Position', 'Job Title', 'Title', 'position', 'job_title'],
    department: ['部门', '所在部门', 'Department', 'department'],
    startDate: ['入职时间', '开始时间', 'Start Date', 'start_date', '开始'],
    endDate: ['离职时间', '结束时间', 'End Date', 'end_date', '结束'],
    description: ['工作描述', '工作内容', '职责描述', 'Description', 'Responsibilities', 'description'],
  },
  projectExperience: {
    name: ['项目名称', '项目名', 'Project Name', 'project_name', '名称'],
    role: ['担任角色', '项目角色', '职责', 'Role', 'role'],
    startDate: ['开始时间', 'Start Date', 'start_date', '开始'],
    endDate: ['结束时间', 'End Date', 'end_date', '结束'],
    techStack: ['技术栈', '使用技术', '技术工具', 'Tech Stack', 'Technologies', 'tech_stack'],
    description: ['项目描述', '项目详情', 'Project Description', 'project_description', '描述', '详情'],
  },
  awards: {
    name: ['获奖名称', '奖项', '荣誉', 'Award', 'Honor', 'award_name', '名称'],
    date: ['获奖时间', 'Award Date', 'award_date', '时间'],
    level: ['奖项级别', '级别', 'Award Level', 'award_level'],
  },
  certificates: {
    name: ['证书名称', '资格证书', 'Certificate', 'certificate_name', '名称'],
    date: ['获证时间', 'Certificate Date', 'cert_date', '时间'],
    score: ['成绩', '分数', 'Score', 'score'],
  },
};

/**
 * Match form fields against a single entry object (e.g., one education record).
 * Used for filling entries within repeatable sections.
 */
export function matchFieldsForEntry(
  fields: FormField[],
  entryData: Record<string, any>,
  sectionType: string,
): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const fieldSynonyms = ENTRY_FIELD_SYNONYMS[sectionType];
  if (!fieldSynonyms) return mappings;

  for (const field of fields) {
    let bestMatch: { fieldName: string; confidence: number } | null = null;

    for (const candidate of field.candidates) {
      const normalizedCandidate = normalize(candidate);
      if (!normalizedCandidate) continue;

      for (const [fieldName, synonyms] of Object.entries(fieldSynonyms)) {
        for (const synonym of synonyms) {
          const normalizedSynonym = normalize(synonym);

          // 精确匹配
          if (normalizedCandidate === normalizedSynonym) {
            bestMatch = { fieldName, confidence: 1.0 };
            break;
          }

          // 包含匹配
          if (normalizedCandidate.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedCandidate)) {
            const len = Math.max(normalizedCandidate.length, normalizedSynonym.length);
            const overlap = Math.min(normalizedCandidate.length, normalizedSynonym.length);
            const confidence = overlap / len * 0.9;
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = { fieldName, confidence };
            }
          }

          // 编辑距离模糊匹配
          const maxLen = Math.max(normalizedCandidate.length, normalizedSynonym.length);
          if (maxLen > 0) {
            const dist = editDistance(normalizedCandidate, normalizedSynonym);
            const similarity = 1 - dist / maxLen;
            if (similarity > 0.7 && (!bestMatch || similarity * 0.8 > bestMatch.confidence)) {
              bestMatch = { fieldName, confidence: similarity * 0.8 };
            }
          }
        }
        if (bestMatch?.confidence === 1.0) break;
      }
      if (bestMatch?.confidence === 1.0) break;
    }

    if (bestMatch) {
      const value = entryData[bestMatch.fieldName];
      const valueStr = Array.isArray(value) ? value.join(', ') : (value?.toString() || '');
      mappings.push({
        field,
        profilePath: `${sectionType}.${bestMatch.fieldName}`,
        value: valueStr,
        confidence: bestMatch.confidence,
      });
    }
  }

  return mappings;
}

export { getValueFromProfile };
