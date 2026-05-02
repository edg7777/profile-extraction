import { BaseAdapter } from './base';
import type { FormField, FormElementType } from '@/types/form';
import { getFieldCandidateTexts } from '@/utils/dom';

export class ByteDanceAdapter extends BaseAdapter {
  name = '字节跳动招聘';

  matches(url: string): boolean {
    return /jobs\.bytedance\.com|job\.toutiao\.com/i.test(url);
  }

  scanFields(doc: Document): FormField[] {
    const fields: FormField[] = [];
    const seen = new WeakSet<HTMLElement>();

    // 1. Standard inputs
    const standardSelectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]):not([type="image"]):not([type="checkbox"]):not([type="radio"])',
      'textarea',
    ];
    const standardElements = doc.querySelectorAll<HTMLElement>(standardSelectors.join(', '));
    for (const el of standardElements) {
      if (this.isHidden(el) || seen.has(el)) continue;
      seen.add(el);
      fields.push(this.createField(el));
    }

    // 2. Custom select-like components (ByteDance uses div-based dropdowns)
    const customSelects = doc.querySelectorAll<HTMLElement>(
      '[class*="select"]:not(select), [class*="Select"]:not(select), [class*="picker"], [class*="Picker"], [class*="dropdown"], [class*="Dropdown"]'
    );
    for (const el of customSelects) {
      if (this.isHidden(el) || seen.has(el)) continue;
      // Only process leaf-level selectors (no nested ones)
      if (el.querySelector('[class*="select"], [class*="Select"]')) continue;
      // Must have a clickable trigger
      const trigger = el.querySelector<HTMLElement>('[class*="trigger"], [class*="value"], [class*="placeholder"], input[readonly]');
      if (trigger) {
        seen.add(el);
        fields.push(this.createField(el, 'custom-select'));
      }
    }

    // 3. Select elements
    const selectElements = doc.querySelectorAll<HTMLSelectElement>('select');
    for (const el of selectElements) {
      if (this.isHidden(el) || seen.has(el)) continue;
      seen.add(el);
      fields.push(this.createField(el, 'select'));
    }

    // 4. Contenteditable
    const editableElements = doc.querySelectorAll<HTMLElement>('[contenteditable="true"]');
    for (const el of editableElements) {
      if (this.isHidden(el) || seen.has(el)) continue;
      seen.add(el);
      fields.push(this.createField(el, 'contenteditable'));
    }

    // 5. Radio groups
    const radioGroups = new Map<string, HTMLElement>();
    const radios = doc.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    for (const radio of radios) {
      const name = radio.getAttribute('name') || '';
      if (name && !radioGroups.has(name)) {
        const container = radio.closest('fieldset, [class*="radio"], [class*="Radio"]') || radio.parentElement;
        if (container) radioGroups.set(name, container as HTMLElement);
      }
    }
    for (const [name, container] of radioGroups) {
      if (seen.has(container)) continue;
      seen.add(container);
      fields.push(this.createField(container, 'radio'));
    }

    return fields;
  }

  private createField(el: HTMLElement, forceType?: FormElementType): FormField {
    const type = forceType || this.detectType(el);
    const candidates = this.getEnhancedCandidates(el);
    const section = this.detectSection(el);

    return {
      element: el,
      type,
      label: candidates[0] || '',
      name: el.getAttribute('name') || '',
      id: el.getAttribute('id') || '',
      placeholder: el.getAttribute('placeholder') || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      candidates,
      section,
    };
  }

  private getEnhancedCandidates(el: HTMLElement): string[] {
    const candidates = getFieldCandidateTexts(el);

    // ByteDance specific: look for label in their component structure
    // Their form items often have class patterns like: semi-form-field, larkui-form-item
    const formItem = el.closest(
      '[class*="form-field"], [class*="form-item"], [class*="FormField"], [class*="FormItem"], [class*="semi-form"]'
    );
    if (formItem) {
      // Look for label element within the form item
      const labelEl = formItem.querySelector(
        '[class*="label"], [class*="Label"], label'
      );
      if (labelEl && !el.contains(labelEl)) {
        const text = labelEl.textContent?.trim()?.replace(/[*：:]/g, '').trim();
        if (text && text.length < 25 && !candidates.includes(text)) {
          candidates.unshift(text);
        }
      }
    }

    // Look for text in immediate heading siblings within section
    const section = el.closest('section, [class*="section"], [class*="Section"], [class*="block"], [class*="Block"]');
    if (section) {
      const sectionTitle = section.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="Title"], [class*="header"], [class*="Header"]');
      if (sectionTitle) {
        const text = sectionTitle.textContent?.trim();
        if (text && text.length < 25 && !candidates.includes(text)) {
          candidates.push(text);
        }
      }
    }

    return [...new Set(candidates.filter(Boolean))];
  }

  protected detectSection(el: HTMLElement): string {
    // ByteDance uses section-based layout
    let parent: HTMLElement | null = el;
    while (parent) {
      const cls = parent.className || '';
      if (/section|block|module|group/i.test(cls)) {
        const heading = parent.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="header"]');
        if (heading) {
          const text = heading.textContent?.trim();
          if (text && text.length < 30) return text;
        }
      }
      parent = parent.parentElement;
    }
    return super.detectSection(el);
  }
}
