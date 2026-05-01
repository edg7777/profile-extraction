export function triggerInputEvents(element: HTMLElement, value: string): void {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
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
  const id = input.getAttribute('id');
  if (id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || null;
  }

  const parent = input.closest('label');
  if (parent) return parent.textContent?.trim() || null;

  const prev = input.previousElementSibling;
  if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN')) {
    return prev.textContent?.trim() || null;
  }

  return null;
}

export function getFieldCandidateTexts(element: HTMLElement): string[] {
  const candidates: string[] = [];

  const label = findLabelForInput(element);
  if (label) candidates.push(label);

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

  return candidates.filter(Boolean);
}
