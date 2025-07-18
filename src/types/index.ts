
import type { LucideIcon } from 'lucide-react';

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'email' | 'boolean' | 'file' | 'select';
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
  options?: Array<{ value: string; label: string }>; // For select or radio
  rows?: number; // For textarea
}

export type FormData = Record<string, any>;

// Full template structure, used server-side and for client-side lookup
export interface Template {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  fields: TemplateField[];
  previewLayout: (data: FormData) => React.ReactNode;
}

// Data needed by DocumentForm (Client Component)
export interface DocumentFormPropsTemplate {
  id: string;
  name: string;
  fields: TemplateField[];
}

// Basic template info for DocumentPreview (Client Component)
export interface DocumentPreviewPropsTemplateInfo {
  id: string;
  name: string;
}
