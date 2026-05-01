export function highlightField(element: HTMLElement, status: 'filled' | 'needs_confirm' | 'failed'): void {
  const colors: Record<string, string> = {
    filled: '0 0 0 2px rgba(34, 197, 94, 0.5)',
    needs_confirm: '0 0 0 2px rgba(249, 115, 22, 0.5)',
    failed: '0 0 0 2px rgba(239, 68, 68, 0.5)',
  };

  element.style.boxShadow = colors[status] || '';
}

export function clearHighlights(): void {
  const elements = document.querySelectorAll<HTMLElement>('[style*="box-shadow"]');
  for (const el of elements) {
    el.style.boxShadow = '';
  }
}
