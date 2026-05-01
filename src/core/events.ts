import { triggerInputEvents, selectOption, clickRadio, setCheckbox, fillContentEditable } from '@/utils/dom';
import type { FieldMapping, FillResult, FillDetail } from '@/types/form';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(50 + Math.random() * 150);
}

export async function executeFill(mappings: FieldMapping[]): Promise<FillResult> {
  const details: FillDetail[] = [];
  let filled = 0;
  let skipped = 0;
  let failed = 0;

  for (const mapping of mappings) {
    const { field, profilePath, value, confidence } = mapping;

    if (!value) {
      skipped++;
      details.push({
        profilePath,
        label: field.label || field.name || field.id,
        status: 'skipped',
        message: '无对应数据',
      });
      continue;
    }

    try {
      const element = field.element;

      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
          triggerInputEvents(element, value);
          break;

        case 'date':
          triggerInputEvents(element, value);
          break;

        case 'textarea':
          triggerInputEvents(element, value);
          break;

        case 'select':
          if (element instanceof HTMLSelectElement) {
            const success = selectOption(element, value);
            if (!success) {
              details.push({
                profilePath,
                label: field.label || field.name,
                status: 'needs_confirm',
                message: `未找到匹配选项: ${value}`,
              });
              continue;
            }
          }
          break;

        case 'radio':
          const radioContainer = element.closest('fieldset') || element.parentElement;
          if (radioContainer) {
            clickRadio(radioContainer as HTMLElement, value);
          }
          break;

        case 'checkbox':
          if (element instanceof HTMLInputElement) {
            setCheckbox(element, value === 'true' || value === '1' || value === '是');
          }
          break;

        case 'contenteditable':
          fillContentEditable(element, value);
          break;

        default:
          triggerInputEvents(element, value);
      }

      filled++;
      details.push({
        profilePath,
        label: field.label || field.name || field.id,
        status: confidence >= 0.8 ? 'filled' : 'needs_confirm',
        message: confidence < 0.8 ? `匹配置信度较低: ${(confidence * 100).toFixed(0)}%` : undefined,
      });
    } catch (err) {
      failed++;
      details.push({
        profilePath,
        label: field.label || field.name || field.id,
        status: 'failed',
        message: String(err),
      });
    }

    await randomDelay();
  }

  return { total: mappings.length, filled, skipped, failed, details };
}
