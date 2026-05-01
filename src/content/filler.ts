import { getAdapter } from '@/adapters/registry';
import { matchFields } from '@/core/matcher';
import { executeFill } from '@/core/events';
import { getSavedFieldMappings } from '@/utils/storage';
import type { Profile } from '@/types/profile';
import type { FillResult } from '@/types/form';

export async function fillPage(profile: Profile): Promise<FillResult> {
  const url = window.location.href;
  const domain = window.location.hostname;

  const adapter = getAdapter(url);
  const fields = adapter.scanFields(document);

  if (fields.length === 0) {
    return { total: 0, filled: 0, skipped: 0, failed: 0, details: [] };
  }

  const savedMappings = await getSavedFieldMappings(domain);
  const mappings = matchFields(fields, profile, savedMappings);
  const result = await executeFill(mappings);

  return result;
}
