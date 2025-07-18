
import type { Template } from '@/types';
import { Briefcase, Scroll, ReceiptText, SquarePercent } from 'lucide-react';

import { workOrderFields, WorkOrderPreview } from './template-definitions/work-order';
import { letterheadFields, LetterheadPreview } from './template-definitions/letterhead';
import { invoiceFields as claimInvoiceFields, InvoicePreview as ClaimInvoicePreview } from './template-definitions/claim-invoice';
import { standardInvoiceFields, StandardInvoicePreview } from './template-definitions/invoice';

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
    description: 'Generate a standard invoice for products or services with automated tax calculation.',
    icon: ReceiptText,
    fields: standardInvoiceFields,
    previewLayout: StandardInvoicePreview,
  },
  {
    id: 'claim-invoice',
    name: 'Claim Invoice',
    description: 'Create tax claim invoice, with tax calculations and bank details for clients.',
    icon: SquarePercent,
    fields: claimInvoiceFields,
    previewLayout: ClaimInvoicePreview,
  },
];
