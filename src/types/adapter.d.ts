import type { FormField, FieldMapping, FillResult } from './form';
import type { Profile } from './profile';

export interface SiteAdapter {
  name: string;
  matches(url: string): boolean;
  scanFields(doc: Document): FormField[];
  mapProfileToFields(profile: Profile, fields: FormField[]): FieldMapping[];
  fillFields(mappings: FieldMapping[]): FillResult;
  handleDynamicContent?(): Promise<void>;
}
