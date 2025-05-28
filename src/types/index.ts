import type { LucideIcon } from 'lucide-react';

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'email';
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
}

export type FormData = Record<string, any>;

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  fields: TemplateField[];
  previewLayout: (data: FormData) => React.ReactNode;
}
