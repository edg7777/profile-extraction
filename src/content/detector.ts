const FORM_SELECTORS = [
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
  'select',
  'textarea',
  '[contenteditable="true"]',
];

export function hasFormFields(): boolean {
  const elements = document.querySelectorAll(FORM_SELECTORS.join(', '));
  let visibleCount = 0;

  for (const el of elements) {
    const htmlEl = el as HTMLElement;
    if (htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0) {
      visibleCount++;
    }
    if (visibleCount >= 3) return true;
  }

  return false;
}
