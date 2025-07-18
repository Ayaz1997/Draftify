

import React from 'react';
import type { FormData, TemplateField } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from '@/components/ui/table';
import { formatCurrency, formatDate, amountToWords } from '@/lib/formatters';
import Image from 'next/image';
import { currencyOptionsForSelect } from './currency-options';


export const StandardInvoicePreview = (data: FormData) => {
  const currencySymbol = data.currency || '₹';
  const invoiceItems = Array.isArray(data.items) ? data.items : [];
  let totalQuantity = 0;
  let totalCostSum = 0;

  if (data.includeItemsTable && invoiceItems.length > 0) {
    invoiceItems.forEach(item => {
      if (item.description) {
        const quantity = parseFloat(item.quantity || 1);
        const unitCost = parseFloat(item.unitCost || 0);
        const totalCost = quantity * unitCost;
        
        totalQuantity += quantity;
        totalCostSum += totalCost;
      }
    });
  }

  const taxRate = parseFloat(data.taxPercentage || 0);
  const taxAmount = totalCostSum * (taxRate / 100);
  const grandTotal = totalCostSum + taxAmount;
  
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg text-sm" data-ai-hint="invoice document">
      <CardHeader className="p-4 sm:p-6 bg-muted/30">
        {data.businessLogo && typeof data.businessLogo === 'string' && data.businessLogo.startsWith('data:image') && (
            <div className="flex justify-center mb-4">
                <Image src={data.businessLogo} alt="Business Logo" width={150} height={75} className="object-contain" data-ai-hint="company brand"/>
            </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-grow">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">{data.businessName || 'Your Business Name'}</h1>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap mt-1">{data.businessAddress || '123 Business St, City, State, PIN'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Contact:</strong> {data.businessContact || 'N/A'} | <strong>Email:</strong> {data.businessEmail || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>GST No:</strong> {data.businessGstNo || 'N/A'}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs sm:text-sm self-start sm:self-end">
            <p><strong>Invoice No:</strong> {data.invoiceNumber || 'INV-001'}</p>
            <p><strong>Date:</strong> {formatDate(data.invoiceDate)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="border p-3 sm:p-4 rounded-md">
          <h3 className="text-md font-semibold text-primary mb-2">Bill To:</h3>
          <p className="font-bold">{data.clientName || 'Client Name'}</p>
          <p className="whitespace-pre-wrap text-foreground/90">{data.clientAddress || 'Client Address'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Contact:</strong> {data.clientContact || 'N/A'} | <strong>Email:</strong> {data.clientEmail || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>GST No:</strong> {data.clientGstNo || 'N/A'}
          </p>
        </div>

        {data.includeItemsTable && invoiceItems.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="p-2 w-10">Sl. No.</TableHead>
                  <TableHead className="p-2">Description</TableHead>
                  <TableHead className="p-2 w-20">Unit</TableHead>
                  <TableHead className="p-2 text-right w-20">Quantity</TableHead>
                  <TableHead className="p-2 text-right w-24">Unit Cost</TableHead>
                  <TableHead className="p-2 text-right w-24">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItems.map((item, index) => {
                  if (!item.description) return null;
                  const quantity = parseFloat(item.quantity || 1);
                  const unitCost = parseFloat(item.unitCost || 0);
                  const totalCost = quantity * unitCost;
                  return (
                    <TableRow key={index}>
                      <TableCell className="p-2 text-center">{index + 1}</TableCell>
                      <TableCell className="p-2 whitespace-pre-wrap">{item.description}</TableCell>
                      <TableCell className="p-2">{item.unit}</TableCell>
                      <TableCell className="p-2 text-right">{quantity.toFixed(2)}</TableCell>
                      <TableCell className="p-2 text-right">{formatCurrency(unitCost, currencySymbol)}</TableCell>
                      <TableCell className="p-2 text-right font-medium">{formatCurrency(totalCost, currencySymbol)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <UiTableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="p-2 text-right text-primary">TOTAL</TableCell>
                  <TableCell className="p-2 text-right text-primary">{totalQuantity.toFixed(2)}</TableCell>
                  <TableCell className="p-2"></TableCell>
                  <TableCell className="p-2 text-right text-primary">{formatCurrency(totalCostSum, currencySymbol)}</TableCell>
                </TableRow>
              </UiTableFooter>
            </Table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-grow text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Amount in Words:</p>
            <p className="italic">{amountToWords(grandTotal, currencySymbol)}</p>
          </div>
          <div className="w-full sm:w-2/5 md:w-1/3 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Subtotal:</span>
              <span>{formatCurrency(totalCostSum, currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tax ({taxRate}%):</span>
              <span>{formatCurrency(taxAmount, currencySymbol)}</span>
            </div>
            <Separator className="my-1"/>
            <div className="flex justify-between font-bold text-lg text-primary">
              <span>Total Amount:</span>
              <span>{formatCurrency(grandTotal, currencySymbol)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t mt-6">
          <div className="text-xs space-y-1">
            <h3 className="text-md font-semibold text-primary mb-2">Bank Details:</h3>
            <p><strong>Bank Name:</strong> {data.bankName || 'N/A'}</p>
            <p><strong>Branch:</strong> {data.branchName || 'N/A'}</p>
            <p><strong>Account No:</strong> {data.accountNo || 'N/A'}</p>
            <p><strong>IFSC Code:</strong> {data.ifscCode || 'N/A'}</p>
          </div>
          
          <div className="text-center flex flex-col justify-end">
            <div className="border-b border-foreground/50 min-h-[60px] flex items-center justify-center">
              {data.authorisedSignature && typeof data.authorisedSignature === 'string' && data.authorisedSignature.startsWith('data:image') ? (
                  <Image src={data.authorisedSignature} alt="Authorised Signature" width={150} height={50} className="object-contain" data-ai-hint="signature drawing" />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Authorised Signatory for {data.businessName || 'Your Business Name'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const standardInvoiceFields: TemplateField[] = [
  // Business Details
  { id: 'businessName', label: 'Business Name', type: 'text' },
  { id: 'businessAddress', label: 'Business Address', type: 'textarea' },
  { id: 'businessContact', label: 'Business Contact', type: 'text' },
  { id: 'businessEmail', label: 'Business Email', type: 'email' },
  { id: 'businessGstNo', label: 'Business GST No.', type: 'text' },
  { id: 'businessLogo', label: 'Business Logo (optional)', type: 'file' },

  // Client Details
  { id: 'clientName', label: 'Client Name', type: 'text' },
  { id: 'clientAddress', label: 'Client Address', type: 'textarea' },
  { id: 'clientContact', label: 'Client Contact', type: 'text' },
  { id: 'clientEmail', label: 'Client Email', type: 'email' },
  { id: 'clientGstNo', label: 'Client GST No. (optional)', type: 'text' },

  // Invoice Info
  { id: 'invoiceNumber', label: 'Invoice Number', type: 'text' },
  { id: 'invoiceDate', label: 'Invoice Date', type: 'date' },
  { id: 'currency', label: 'Currency', type: 'select', options: currencyOptionsForSelect, defaultValue: '₹' },

  // Invoice Items
  { id: 'includeItemsTable', label: 'Invoice Items', type: 'boolean', defaultValue: true },
  
  // NOTE: The following are markers for the useFieldArray hook, not rendered directly as fields.
  { id: 'items.description', label: 'Item Description', type: 'text' },
  { id: 'items.unit', label: 'Unit', type: 'text' },
  { id: 'items.quantity', label: 'Quantity', type: 'number' },
  { id: 'items.unitCost', label: 'Unit Cost', type: 'number' },

  // Calculation
  { id: 'taxPercentage', label: 'Tax Percentage (%)', type: 'number' },

  // Bank Details
  { id: 'bankName', label: 'Bank Name', type: 'text' },
  { id: 'branchName', label: 'Branch Name', type: 'text' },
  { id: 'accountNo', label: 'Account Number', type: 'text' },
  { id: 'ifscCode', label: 'IFSC Code', type: 'text' },
  
  // Signature
  { id: 'authorisedSignature', label: 'Authorised Signature Image (optional)', type: 'file' },
];

    