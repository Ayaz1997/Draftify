
import type { Template } from '@/types';
import { Briefcase, Scroll, Receipt } from 'lucide-react';

import { workOrderFields, WorkOrderPreview } from './template-definitions/work-order';
import { letterheadFields, LetterheadPreview } from './template-definitions/letterhead';
import { invoiceFields, InvoicePreview } from './template-definitions/invoice';

export const templates: Template[] = [
  {
    id: 'work-order',
    name: 'Work Order',
    description: 'Generate detailed work orders for services, including itemized work, materials, and labor.',
    icon: Briefcase,
    fields: workOrderFields,
    previewLayout: WorkOrderPreview,
  },
  {
    id: 'letterhead',
    name: 'Letterhead',
    description: 'Create professional letterheads for official correspondence.',
    icon: Scroll,
    fields: letterheadFields,
    previewLayout: LetterheadPreview,
  },
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Generate and manage invoices for clients.',
    icon: Receipt,
    fields: invoiceFields,
    previewLayout: InvoicePreview,
  },
];
