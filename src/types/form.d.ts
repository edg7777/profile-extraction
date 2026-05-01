export type FormElementType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'contenteditable'
  | 'custom-select'
  | 'unknown';

export interface FormField {
  element: HTMLElement;
  type: FormElementType;
  label: string;
  name: string;
  id: string;
  placeholder: string;
  ariaLabel: string;
  candidates: string[];
  section: string;
}

export interface FieldMapping {
  field: FormField;
  profilePath: string;
  value: string;
  confidence: number;
}

export interface FillResult {
  total: number;
  filled: number;
  skipped: number;
  failed: number;
  details: FillDetail[];
}

export interface FillDetail {
  profilePath: string;
  label: string;
  status: 'filled' | 'skipped' | 'failed' | 'needs_confirm';
  message?: string;
}
