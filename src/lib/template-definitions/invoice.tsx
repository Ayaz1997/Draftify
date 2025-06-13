
import React from 'react';
import type { FormData, TemplateField } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Receipt } from 'lucide-react';

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString + 'T00:00:00Z').toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  }
  try {
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

export const InvoicePreview = (data: FormData) => (
  <Card className="w-full max-w-3xl mx-auto shadow-lg">
    <CardHeader className="bg-primary text-primary-foreground p-4 sm:p-6 rounded-t-lg">
      <div className="flex justify-between items-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold">INVOICE</CardTitle>
        <Receipt className="h-8 w-8 sm:h-10 sm:w-10" />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-2 gap-2 sm:gap-0">
        <div className="text-xs sm:text-sm">
          <p className="text-primary-foreground/80"><strong>{data.companyName || 'Your Company LLC'}</strong></p>
          <p className="text-primary-foreground/80 whitespace-pre-wrap">{data.companyAddress || '123 Business Rd\nCity, State ZIP'}</p>
        </div>
        <div className="text-left sm:text-right text-xs sm:text-sm">
          <p className="text-primary-foreground/80">Invoice #: {data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`}</p>
          <p className="text-primary-foreground/80">Date: {formatDate(data.invoiceDate)}</p>
          <p className="text-primary-foreground/80">Due Date: {formatDate(data.dueDate)}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 bg-card text-card-foreground text-xs sm:text-sm">
      <div>
        <h3 className="text-md sm:text-lg font-semibold text-primary mb-2">Bill To:</h3>
        <p><strong>{data.clientName || 'Client Company Name'}</strong></p>
        <p className="whitespace-pre-wrap">{data.clientAddress || '456 Client Ave\nClient City, State ZIP'}</p>
      </div>
      <Separator />
      <div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/50">
              <th className="text-left py-1 px-1 sm:py-2 sm:pr-2 font-semibold text-primary">Item Description</th>
              <th className="text-right py-1 px-1 sm:py-2 sm:px-2 font-semibold text-primary">Quantity</th>
              <th className="text-right py-1 px-1 sm:py-2 sm:px-2 font-semibold text-primary">Unit Price</th>
              <th className="text-right py-1 px-1 sm:py-2 sm:pl-2 font-semibold text-primary">Total</th>
            </tr>
          </thead>
          <tbody>
            {(data.items && Array.isArray(data.items) ? data.items : [{ description: data.itemDescription1, quantity: data.itemQuantity1, unitPrice: data.itemPrice1 }]).map((item: any, index: number) => (
              <tr key={index} className="border-b border-muted">
                <td className="py-1 px-1 sm:py-2 sm:pr-2">{item.description || 'N/A'}</td>
                <td className="text-right py-1 px-1 sm:py-2 sm:px-2">{item.quantity || 1}</td>
                <td className="text-right py-1 px-1 sm:py-2 sm:px-2">${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                <td className="text-right py-1 px-1 sm:py-2 sm:pl-2">${(parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Separator />
      <div className="flex justify-end">
        <div className="w-full md:w-2/3 lg:w-1/2 space-y-1 sm:space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">Subtotal:</span>
            <span>${parseFloat(data.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Tax ({data.taxRate || 0}%):</span>
            <span>${parseFloat(data.taxAmount || 0).toFixed(2)}</span>
          </div>
          <Separator className="my-1 bg-primary/50"/>
          <div className="flex justify-between text-lg sm:text-xl font-bold text-primary">
            <span>Total Due:</span>
            <span>${parseFloat(data.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
       {data.notes && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm sm:text-md font-semibold text-primary mb-1">Notes:</h3>
            <p className="text-xs sm:text-sm whitespace-pre-wrap">{data.notes}</p>
          </div>
        </>
      )}
    </CardContent>
    <CardFooter className="p-4 sm:p-6 bg-muted/50 rounded-b-lg text-xs sm:text-sm text-muted-foreground">
      <p>Thank you for your prompt payment. Please make all checks payable to {data.companyName || 'Your Company LLC'}.</p>
    </CardFooter>
  </Card>
);

export const invoiceFields: TemplateField[] = [
  { id: 'companyName', label: 'Your Company Name', type: 'text', placeholder: 'Your Company LLC', defaultValue: 'Your Company LLC' },
  { id: 'companyAddress', label: 'Your Company Address', type: 'textarea', placeholder: '123 Business Rd\nCity, State ZIP', defaultValue: '123 Business Rd\nCity, State ZIP' },
  { id: 'clientName', label: 'Client Name/Company', type: 'text', placeholder: 'Client Inc.' },
  { id: 'clientAddress', label: 'Client Address', type: 'textarea', placeholder: '456 Client Ave\nClient City, State ZIP' },
  { id: 'invoiceNumber', label: 'Invoice Number', type: 'text', placeholder: `INV-${Date.now().toString().slice(-6)}`, defaultValue: `INV-${Date.now().toString().slice(-6)}` },
  { id: 'invoiceDate', label: 'Invoice Date', type: 'date' },
  { id: 'dueDate', label: 'Due Date', type: 'date' },
  { id: 'itemDescription1', label: 'Item 1 Description', type: 'text', placeholder: 'Service Rendered / Product Name' },
  { id: 'itemQuantity1', label: 'Item 1 Quantity', type: 'number', placeholder: '1', defaultValue: 1 },
  { id: 'itemPrice1', label: 'Item 1 Unit Price ($)', type: 'number', placeholder: '100.00' },
  { id: 'subtotal', label: 'Subtotal ($)', type: 'number', placeholder: 'Calculate automatically or enter' },
  { id: 'taxRate', label: 'Tax Rate (%)', type: 'number', placeholder: '7.5', defaultValue: 0 },
  { id: 'taxAmount', label: 'Tax Amount ($)', type: 'number', placeholder: 'Calculate automatically or enter' },
  { id: 'totalAmount', label: 'Total Amount ($)', type: 'number', placeholder: 'Calculate automatically or enter' },
  { id: 'notes', label: 'Notes/Terms (optional)', type: 'textarea', placeholder: 'Payment due within 30 days. Late fees may apply.' },
];
