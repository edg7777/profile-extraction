import type { Profile } from '@/types/profile';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Keywords that identify repeatable sections on the page
const SECTION_IDENTIFIERS: Record<string, { keywords: string[]; profileKey: keyof Profile }> = {
  education: {
    keywords: ['教育经历', '教育背景', '学历', 'Education'],
    profileKey: 'education',
  },
  work: {
    keywords: ['工作经历', '工作经验', '实习经历', 'Work Experience', 'Internship', 'Professional'],
    profileKey: 'workExperience',
  },
  project: {
    keywords: ['项目经历', '项目经验', 'Project'],
    profileKey: 'projectExperience',
  },
  award: {
    keywords: ['获奖', '荣誉', 'Award', 'Honor'],
    profileKey: 'awards',
  },
  certificate: {
    keywords: ['证书', '资格', 'Certificate'],
    profileKey: 'certificates',
  },
};

// Add-button text must match one of these (after normalization)
const ADD_BUTTON_PATTERNS = [
  /^[+＋]\s*添加/, /^添加/, /^新增/, /^增加/,
  /^[+＋]\s*add/i, /^add\s*(more)?$/i,
  /再增加/, /继续添加/,
];

export interface SectionInfo {
  container: HTMLElement;
  heading: HTMLElement;
  sectionType: string;
  profileKey: keyof Profile;
  addButton: HTMLElement | null;
  existingEntryCount: number;
  neededEntryCount: number;
}

/**
 * Find the heading element whose text matches a section keyword.
 */
function findSectionHeading(doc: Document, keywords: string[]): HTMLElement | null {
  // Broad search: any element that looks like a heading
  const candidates = doc.querySelectorAll<HTMLElement>(
    'h1, h2, h3, h4, h5, h6, label, ' +
    '[class*="title"], [class*="Title"], [class*="header"], [class*="Header"], ' +
    '[class*="heading"], [class*="Heading"], [class*="section-name"], [class*="SectionName"], ' +
    '[class*="module-title"], [class*="ModuleTitle"]'
  );

  for (const el of candidates) {
    const text = el.textContent?.trim() || '';
    if (text.length > 50) continue; // Skip elements with too much content
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        console.log(`[AutoFill] 找到段落标题: "${text}" (keyword: "${keyword}")`);
        return el;
      }
    }
  }

  // Broader fallback: any short-text element containing keyword
  const allEls = doc.querySelectorAll<HTMLElement>('div, span, p');
  for (const el of allEls) {
    // Only check leaf elements (no child elements with much text)
    if (el.children.length > 3) continue;
    const text = el.textContent?.trim() || '';
    if (text.length > 30 || text.length < 2) continue;
    for (const keyword of keywords) {
      if (text === keyword || text.startsWith(keyword)) {
        console.log(`[AutoFill] 找到段落标题 (fallback): "${text}" (keyword: "${keyword}")`);
        return el;
      }
    }
  }

  return null;
}

/**
 * From a heading element, walk up to find the section container
 * that wraps both the heading and its form content.
 */
function findSectionContainer(heading: HTMLElement): HTMLElement {
  let best: HTMLElement = heading.parentElement || heading;
  let container: HTMLElement | null = heading.parentElement;

  for (let i = 0; i < 8 && container; i++) {
    const tag = container.tagName.toLowerCase();
    if (tag === 'body' || tag === 'html' || tag === 'main') break;

    const hasFormFields = container.querySelectorAll(
      'input:not([type="hidden"]), select, textarea, [contenteditable="true"]'
    ).length;

    if (hasFormFields >= 2) {
      best = container;
      // Keep going up to find a more specific section wrapper
      const cls = container.className || '';
      if (
        tag === 'section' || tag === 'fieldset' ||
        /section|module|block|card|panel/i.test(cls)
      ) {
        return container;
      }
    }

    container = container.parentElement;
  }

  return best;
}

/**
 * Check if an element looks like a clickable add button.
 */
function isAddButton(el: HTMLElement): boolean {
  const text = (el.textContent?.trim() || '').replace(/\s+/g, '');
  if (!text || text.length > 30) return false;

  for (const pattern of ADD_BUTTON_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * Find the "Add" button within, near, or after a section.
 */
function findAddButton(container: HTMLElement, heading: HTMLElement): HTMLElement | null {
  // Strategy 1: Within container — look for buttons/links with add text
  const clickables = container.querySelectorAll<HTMLElement>(
    'button, a, [role="button"], [class*="add"], [class*="Add"]'
  );
  for (const el of clickables) {
    if (isAddButton(el)) {
      console.log(`[AutoFill]   找到添加按钮 (container内): "${el.textContent?.trim()}"`);
      return el;
    }
  }

  // Strategy 2: Within container — any clickable short element with + or 添加
  const allInContainer = container.querySelectorAll<HTMLElement>('*');
  for (const el of allInContainer) {
    const text = el.textContent?.trim() || '';
    if (text.length > 20) continue;
    const hasAddHint = text.includes('+') || text.includes('＋') || text.includes('添加') || text.includes('新增');
    if (!hasAddHint) continue;
    const style = window.getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    if (tag === 'button' || tag === 'a' || el.getAttribute('role') === 'button' ||
        style.cursor === 'pointer' || el.onclick !== null) {
      // Make sure this is the most specific (leaf) element
      const innerClickable = el.querySelector('button, a, [role="button"]');
      if (!innerClickable) {
        console.log(`[AutoFill]   找到添加按钮 (点击元素): "${text}"`);
        return el;
      }
    }
  }

  // Strategy 3: Look for siblings after the container
  let sibling = container.nextElementSibling;
  for (let i = 0; i < 5 && sibling; i++) {
    if (isAddButton(sibling as HTMLElement)) {
      console.log(`[AutoFill]   找到添加按钮 (sibling): "${sibling.textContent?.trim()}"`);
      return sibling as HTMLElement;
    }
    // Also check children of sibling
    const childBtn = sibling.querySelector<HTMLElement>('button, a, [role="button"]');
    if (childBtn && isAddButton(childBtn)) {
      console.log(`[AutoFill]   找到添加按钮 (sibling child): "${childBtn.textContent?.trim()}"`);
      return childBtn;
    }
    sibling = sibling.nextElementSibling;
  }

  // Strategy 4: Look in the parent of the container (button may be outside)
  const parent = container.parentElement;
  if (parent) {
    const parentClickables = parent.querySelectorAll<HTMLElement>(
      ':scope > button, :scope > a, :scope > [role="button"], :scope > div > button, :scope > div > a'
    );
    for (const el of parentClickables) {
      if (isAddButton(el)) {
        console.log(`[AutoFill]   找到添加按钮 (parent): "${el.textContent?.trim()}"`);
        return el;
      }
    }
  }

  return null;
}

/**
 * Count visible form entry blocks within a section by finding
 * repeating sibling elements that each contain input fields.
 */
function countEntries(container: HTMLElement): { count: number; entryElements: HTMLElement[] } {
  // Find all direct/near-direct children that contain form fields
  // We look for repeated structures at the same DOM level
  const formInputSelector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea, [contenteditable="true"]';

  // Try to find entry wrappers: look for siblings that share similar structure
  const children = Array.from(container.children) as HTMLElement[];

  // Filter children that contain form inputs
  const entryLike = children.filter((child) => {
    const inputs = child.querySelectorAll(formInputSelector);
    return inputs.length >= 2;
  });

  if (entryLike.length > 0) {
    // Check if they share similar class names (repeating pattern)
    return { count: entryLike.length, entryElements: entryLike };
  }

  // Try one level deeper — common pattern: container > wrapper > entries
  for (const child of children) {
    const grandChildren = Array.from(child.children) as HTMLElement[];
    const deepEntries = grandChildren.filter((gc) => {
      const inputs = gc.querySelectorAll(formInputSelector);
      return inputs.length >= 2;
    });
    if (deepEntries.length > 0) {
      return { count: deepEntries.length, entryElements: deepEntries };
    }
  }

  // Fallback: count total inputs and estimate
  const totalInputs = container.querySelectorAll(formInputSelector).length;
  if (totalInputs >= 2) {
    return { count: 1, entryElements: [container] };
  }
  return { count: 0, entryElements: [] };
}

/**
 * Analyze all repeatable sections on the page.
 */
export function analyzeSections(doc: Document, profile: Profile): SectionInfo[] {
  const sections: SectionInfo[] = [];

  for (const [sectionType, config] of Object.entries(SECTION_IDENTIFIERS)) {
    const profileData = profile[config.profileKey];
    if (!Array.isArray(profileData) || profileData.length === 0) continue;

    const heading = findSectionHeading(doc, config.keywords);
    if (!heading) {
      console.log(`[AutoFill] 未找到段落标题: ${sectionType}`);
      continue;
    }

    const container = findSectionContainer(heading);
    const addButton = findAddButton(container, heading);
    const { count: existingEntryCount } = countEntries(container);
    const neededEntryCount = profileData.length;

    console.log(
      `[AutoFill] 段落 "${sectionType}": 容器=`, container,
      `已有=${existingEntryCount}, 需要=${neededEntryCount}, 添加按钮=${addButton ? `"${addButton.textContent?.trim()}"` : '未找到'}`
    );

    sections.push({
      container,
      heading,
      sectionType,
      profileKey: config.profileKey,
      addButton,
      existingEntryCount,
      neededEntryCount,
    });
  }

  return sections;
}

/**
 * Expand sections by clicking "Add" buttons.
 * Uses verify-after-click to avoid over-adding.
 */
export async function expandSections(sections: SectionInfo[]): Promise<void> {
  for (const section of sections) {
    const { container, addButton, existingEntryCount, neededEntryCount, sectionType } = section;
    let currentCount = existingEntryCount;
    const target = neededEntryCount;

    if (currentCount >= target) {
      console.log(`[AutoFill] 段落 "${sectionType}": 已有 ${currentCount} 条 >= 需要 ${target} 条，跳过`);
      continue;
    }

    if (!addButton) {
      console.warn(`[AutoFill] 段落 "${sectionType}": 需要新增 ${target - currentCount} 条，但未找到添加按钮`);
      continue;
    }

    console.log(`[AutoFill] 段落 "${sectionType}": 需要从 ${currentCount} 条增加到 ${target} 条`);

    let attempts = 0;
    const maxAttempts = (target - currentCount) + 3; // Safety limit

    while (currentCount < target && attempts < maxAttempts) {
      attempts++;

      // Scroll the button into view
      addButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(300);

      // Click only once (fix: was clicking twice before)
      addButton.click();
      console.log(`[AutoFill] 段落 "${sectionType}": 点击添加 (attempt ${attempts})`);

      // Wait for DOM to update
      await delay(1000);

      // Re-count entries to verify
      const newCount = countEntries(container).count;
      console.log(`[AutoFill] 段落 "${sectionType}": 点击后条目数 ${currentCount} -> ${newCount}`);

      if (newCount > currentCount) {
        currentCount = newCount;
      } else {
        // Click didn't work, try dispatching mouse events manually
        console.log(`[AutoFill] 段落 "${sectionType}": click() 无效，尝试 MouseEvent`);
        addButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await delay(50);
        addButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await delay(1000);

        const retryCount = countEntries(container).count;
        if (retryCount > currentCount) {
          currentCount = retryCount;
        } else {
          console.warn(`[AutoFill] 段落 "${sectionType}": 添加按钮点击无效，停止尝试`);
          break;
        }
      }
    }

    console.log(`[AutoFill] 段落 "${sectionType}": 最终条目数 ${currentCount}`);
  }
}

/**
 * Get entry containers within a section, ordered top to bottom.
 */
export function getEntryContainers(sectionContainer: HTMLElement): HTMLElement[] {
  const { entryElements } = countEntries(sectionContainer);

  if (entryElements.length > 0 && entryElements[0] !== sectionContainer) {
    // Sort by DOM position
    return entryElements.sort((a, b) => {
      const pos = a.compareDocumentPosition(b);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  // Fallback: return the container itself
  return [sectionContainer];
}
