import type { FormField, FieldMapping, FillResult, FormElementType } from '@/types/form';
import type { Profile } from '@/types/profile';
import type { SiteAdapter } from '@/types/adapter';
import { matchFields } from '@/core/matcher';
import { executeFill } from '@/core/events';
import { getFieldCandidateTexts } from '@/utils/dom';

export abstract class BaseAdapter implements SiteAdapter {
  abstract name: string;
  abstract matches(url: string): boolean;

  scanFields(doc: Document): FormField[] {
    const fields: FormField[] = [];
    const selectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]):not([type="image"])',
      'select',
      'textarea',
      '[contenteditable="true"]',
    ];

    const elements = doc.querySelectorAll<HTMLElement>(selectors.join(', '));

    for (const el of elements) {
      if (this.isHidden(el)) continue;

      const type = this.detectType(el);
      const candidates = getFieldCandidateTexts(el);
      const section = this.detectSection(el);

      fields.push({
        element: el,
        type,
        label: candidates[0] || '',
        name: el.getAttribute('name') || '',
        id: el.getAttribute('id') || '',
        placeholder: el.getAttribute('placeholder') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        candidates,
        section,
      });
    }

    return fields;
  }

  mapProfileToFields(profile: Profile, fields: FormField[]): FieldMapping[] {
    return matchFields(fields, profile);
  }

  fillFields(mappings: FieldMapping[]): FillResult {
    // executeFill is async but interface expects sync - we adapt
    let result: FillResult = { total: 0, filled: 0, skipped: 0, failed: 0, details: [] };
    executeFill(mappings).then((r) => { result = r; });
    return result;
  }

  protected detectType(el: HTMLElement): FormElementType {
    const tag = el.tagName.toLowerCase();
    if (tag === 'select') return 'select';
    if (tag === 'textarea') return 'textarea';
    if (el.getAttribute('contenteditable') === 'true') return 'contenteditable';

    if (tag === 'input') {
      const inputType = (el as HTMLInputElement).type?.toLowerCase() || 'text';
      switch (inputType) {
        case 'email': return 'email';
        case 'tel': return 'tel';
        case 'date': return 'date';
        case 'radio': return 'radio';
        case 'checkbox': return 'checkbox';
        default: return 'text';
      }
    }

    return 'unknown';
  }

  protected detectSection(el: HTMLElement): string {
    let parent: HTMLElement | null = el;
    while (parent) {
      const tag = parent.tagName?.toLowerCase();
      if (tag === 'fieldset') {
        const legend = parent.querySelector('legend');
        if (legend) return legend.textContent?.trim() || '';
      }
      if (tag === 'section' || tag === 'div') {
        const heading = parent.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) return heading.textContent?.trim() || '';
      }
      parent = parent.parentElement;
    }
    return '';
  }

  protected isHidden(el: HTMLElement): boolean {
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return true;
    const style = window.getComputedStyle(el);
    return style.display === 'none' || style.visibility === 'hidden';
  }
}
