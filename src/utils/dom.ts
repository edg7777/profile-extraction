export function triggerInputEvents(element: HTMLElement, value: string): void {
  // Focus the element first
  element.focus();
  element.dispatchEvent(new Event('focus', { bubbles: true }));

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const proto = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

    // Reset React's internal value tracker so React sees the change
    const tracker = (element as any)._valueTracker;
    if (tracker) {
      tracker.setValue('');
    }

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }
  }

  // Use InputEvent for better React compatibility
  element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

export function selectOption(selectElement: HTMLSelectElement, value: string): boolean {
  const options = Array.from(selectElement.options);

  let match = options.find((opt) => opt.value === value);
  if (!match) {
    match = options.find((opt) => opt.textContent?.trim() === value);
  }
  if (!match) {
    const lower = value.toLowerCase();
    match = options.find((opt) => opt.textContent?.trim().toLowerCase().includes(lower));
  }

  if (match) {
    selectElement.value = match.value;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

export function clickRadio(container: HTMLElement, value: string): boolean {
  const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
  for (const radio of radios) {
    const label = findLabelForInput(radio);
    if (
      radio.value === value ||
      label?.toLowerCase().includes(value.toLowerCase())
    ) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  return false;
}

export function setCheckbox(checkbox: HTMLInputElement, checked: boolean): void {
  if (checkbox.checked !== checked) {
    checkbox.checked = checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export function fillContentEditable(element: HTMLElement, value: string): void {
  element.focus();
  element.innerHTML = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

export function findLabelForInput(input: HTMLElement): string | null {
  // 1. Standard <label for="id">
  const id = input.getAttribute('id');
  if (id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || null;
  }

  // 2. Wrapped in <label>
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent?.trim() || null;

  // 3. Previous sibling label/span
  const prev = input.previousElementSibling;
  if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN')) {
    return prev.textContent?.trim() || null;
  }

  // 4. Modern React UI: look for label in parent container (form-item, form-group, etc.)
  const formItem = input.closest(
    '[class*="form-item"], [class*="form-group"], [class*="FormItem"], [class*="field"], [class*="Field"], [class*="input-wrapper"], [class*="InputWrapper"]'
  );
  if (formItem) {
    const labelEl = formItem.querySelector(
      'label, [class*="label"], [class*="Label"], [class*="title"], [class*="Title"]'
    );
    if (labelEl && labelEl !== input) {
      const text = labelEl.textContent?.trim();
      if (text && text.length < 30) return text;
    }
  }

  // 5. Walk up max 3 levels to find nearby short text
  let container: HTMLElement | null = input.parentElement;
  for (let depth = 0; depth < 3 && container; depth++) {
    for (const child of Array.from(container.children)) {
      if (child === input || child.contains(input)) continue;
      const tag = child.tagName.toLowerCase();
      if (tag === 'label' || tag === 'span' || tag === 'div' || tag === 'p') {
        const text = child.textContent?.trim();
        if (text && text.length > 0 && text.length < 20 && !child.querySelector('input, select, textarea')) {
          return text;
        }
      }
    }
    container = container.parentElement;
  }

  return null;
}

export function findAllLabelsForInput(input: HTMLElement): string[] {
  const labels: string[] = [];

  // data-label / data-name attributes
  const dataLabel = input.getAttribute('data-label') || input.getAttribute('data-name');
  if (dataLabel) labels.push(dataLabel);

  // Standard label detection
  const mainLabel = findLabelForInput(input);
  if (mainLabel) labels.push(mainLabel);

  // Section heading context
  let parent: HTMLElement | null = input;
  for (let i = 0; i < 8 && parent; i++) {
    parent = parent.parentElement;
    if (!parent) break;
    const heading = parent.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5');
    if (heading) {
      const headingText = heading.textContent?.trim();
      if (headingText && headingText.length < 30) {
        labels.push(headingText);
        break;
      }
    }
  }

  return labels;
}

export function getFieldCandidateTexts(element: HTMLElement): string[] {
  const candidates: string[] = [];

  // Enhanced label detection (covers React component trees)
  const labels = findAllLabelsForInput(element);
  candidates.push(...labels);

  const placeholder = element.getAttribute('placeholder');
  if (placeholder) candidates.push(placeholder);

  const name = element.getAttribute('name');
  if (name) candidates.push(name);

  const id = element.getAttribute('id');
  if (id) candidates.push(id);

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) candidates.push(ariaLabel);

  const title = element.getAttribute('title');
  if (title) candidates.push(title);

  // data-* attributes commonly used in React apps
  const dataTestId = element.getAttribute('data-testid') || element.getAttribute('data-test-id');
  if (dataTestId) candidates.push(dataTestId);

  // Deduplicate
  return [...new Set(candidates.filter(Boolean))];
}
