import { getAdapter } from '@/adapters/registry';
import { matchFields, matchFieldsForEntry } from '@/core/matcher';
import { executeFill } from '@/core/events';
import { getSavedFieldMappings } from '@/utils/storage';
import { analyzeSections, expandSections, getEntryContainers } from './section-expander';
import type { Profile } from '@/types/profile';
import type { FillResult, FieldMapping } from '@/types/form';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fillPage(profile: Profile): Promise<FillResult> {
  const url = window.location.href;
  const domain = window.location.hostname;

  const adapter = getAdapter(url);
  console.log('[AutoFill] 使用适配器:', adapter.name, '| URL:', url);

  // Phase 1: Analyze repeatable sections and expand them
  console.log('[AutoFill] Phase 1: 分析可重复段落...');
  const sections = analyzeSections(document, profile);
  if (sections.length > 0) {
    console.log('[AutoFill] 开始展开段落...');
    await expandSections(sections);
    // Wait for DOM to stabilize after expansion
    await delay(1000);
  }

  // Phase 2: Scan all fields
  console.log('[AutoFill] Phase 2: 扫描表单字段...');
  const fields = adapter.scanFields(document);
  console.log('[AutoFill] 检测到字段数:', fields.length);
  fields.forEach((f, i) => {
    console.log(`[AutoFill]  字段${i}: type=${f.type}, label="${f.label}", name="${f.name}", section="${f.section}", candidates=`, f.candidates);
  });

  if (fields.length === 0) {
    console.warn('[AutoFill] 未检测到任何表单字段');
    return { total: 0, filled: 0, skipped: 0, failed: 0, details: [] };
  }

  const savedMappings = await getSavedFieldMappings(domain);
  const allMappings: FieldMapping[] = [];

  // Phase 3: For each expanded section, match fields per entry with indexed profile data
  console.log('[AutoFill] Phase 3: 按段落匹配字段...');
  const handledElements = new WeakSet<HTMLElement>();

  for (const section of sections) {
    const entries = getEntryContainers(section.container);
    const profileArray = profile[section.profileKey] as any[];

    console.log(`[AutoFill] 段落 "${section.sectionType}": ${entries.length} 个条目容器, ${profileArray.length} 条数据`);

    for (let i = 0; i < Math.min(entries.length, profileArray.length); i++) {
      const entryContainer = entries[i];
      const entryData = profileArray[i];

      // Get fields within this entry container
      const entryFields = fields.filter((f) => entryContainer.contains(f.element));
      console.log(`[AutoFill]  条目${i}: ${entryFields.length} 个字段`);

      // Match these fields against this specific entry's data
      const entryMappings = matchFieldsForEntry(
        entryFields,
        entryData,
        section.profileKey === 'education' ? 'education' :
        section.profileKey === 'workExperience' ? 'workExperience' :
        section.profileKey === 'projectExperience' ? 'projectExperience' :
        section.profileKey === 'awards' ? 'awards' :
        'certificates',
      );

      for (const m of entryMappings) {
        handledElements.add(m.field.element);
        allMappings.push(m);
        console.log(`[AutoFill]    映射: "${m.field.label}" -> ${m.profilePath} = "${m.value}" (${m.confidence})`);
      }
    }
  }

  // Phase 4: Match remaining fields (basic info, self-evaluation, etc.)
  const remainingFields = fields.filter((f) => !handledElements.has(f.element));
  console.log(`[AutoFill] Phase 4: 匹配剩余 ${remainingFields.length} 个字段 (基本信息等)...`);
  const remainingMappings = matchFields(remainingFields, profile, savedMappings);
  allMappings.push(...remainingMappings);

  console.log('[AutoFill] 总匹配映射数:', allMappings.length);
  allMappings.forEach((m) => {
    console.log(`[AutoFill]  总映射: "${m.field.label}" -> ${m.profilePath} = "${m.value}" (${m.confidence})`);
  });

  // Phase 5: Execute fill
  console.log('[AutoFill] Phase 5: 执行填充...');
  const result = await executeFill(allMappings);
  return result;
}
