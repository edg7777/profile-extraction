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

export { getValueFromProfile };
