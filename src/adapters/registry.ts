import type { SiteAdapter } from '@/types/adapter';
import { GenericAdapter } from './generic';

const adapters: SiteAdapter[] = [];
const genericAdapter = new GenericAdapter();

export function registerAdapter(adapter: SiteAdapter): void {
  adapters.push(adapter);
}

export function getAdapter(url: string): SiteAdapter {
  for (const adapter of adapters) {
    if (adapter.matches(url)) {
      return adapter;
    }
  }
  return genericAdapter;
}

export function getAllAdapters(): SiteAdapter[] {
  return [...adapters, genericAdapter];
}
