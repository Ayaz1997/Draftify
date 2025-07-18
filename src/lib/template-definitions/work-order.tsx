

import React from 'react';
import type { FormData, TemplateField } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from '@/components/ui/table';
import { Briefcase } from 'lucide-react';
import { formatCurrency as originalFormatCurrency, formatDate } from '@/lib/formatters';
import { currencyOptionsForSelect } from './currency-options';

const formatCurrency = (amount?: number | string, currencySymbol = '₹') => {
  return originalFormatCurrency(amount, currencySymbol);
};

const MAX_ITEMS_PREVIEW = 30;

export const WorkOrderPreview = (data: FormData) => {
  const currencySymbol = data.currency || '₹';
  const workItems = [];
  let subtotalWorkDescription = 0;
  if (data.includeWorkDescriptionTable) {
    for (let i = 1; i <= MAX_ITEMS_PREVIEW; i++) {
      if (data[`workItem${i}Description`]) {
        const area = parseFloat(data[`workItem${i}Area`] || 0);
        const rate = parseFloat(data[`workItem${i}Rate`] || 0);
        const amount = area * rate;
        workItems.push({
          description: data[`workItem${i}Description`],
          area: area,
          rate: rate,
          amount: amount,
        });
        subtotalWorkDescription += amount;
      }
    }
  }

  const materialItems = [];
  let subtotalMaterial = 0;
  if (data.includeMaterialTable) {
    for (let i = 1; i <= MAX_ITEMS_PREVIEW; i++) {
      if (data[`materialItem${i}Name`]) {
        const quantity = parseFloat(data[`materialItem${i}Quantity`] || 1);
        const pricePerUnit = parseFloat(data[`materialItem${i}PricePerUnit`] || 0);
        const amount = quantity * pricePerUnit;
        materialItems.push({
          name: data[`materialItem${i}Name`],
          unit: data[`materialItem${i}Unit`],
          quantity: quantity,
          pricePerUnit: pricePerUnit,
          amount: amount,
        });
        subtotalMaterial += amount;
      }
    }
  }

  const laborItems = [];
  let subtotalLabor = 0;
  if (data.includeLaborTable) {
    for (let i = 1; i <= MAX_ITEMS_PREVIEW; i++) {
      if (data[`laborItem${i}TeamName`]) {
        const numPersons = parseInt(data[`laborItem${i}NumPersons`] || 1);
        const amount = parseFloat(data[`laborItem${i}Amount`] || 0);
        laborItems.push({
          teamName: data[`laborItem${i}TeamName`],
          numPersons: numPersons,
          amount: amount,
        });
        subtotalLabor += amount;
      }
    }
  }

  const grandSubtotal = subtotalWorkDescription + subtotalMaterial + subtotalLabor + parseFloat(data.otherCosts || 0);
  const taxRate = parseFloat(data.taxRatePercentage || 0) / 100;
  const taxAmount = grandSubtotal * taxRate;
  const finalTotalAmount = grandSubtotal + taxAmount;

  const logoUrlFromData = data.businessLogoUrl;
  const logoSrc = typeof logoUrlFromData === 'string' ? logoUrlFromData : '';
  const canDisplayLogo = logoSrc && logoSrc.startsWith('data:image');


  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader className="bg-muted/30 p-4 sm:p-6 rounded-t-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-grow">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">{data.businessName || 'Your Business Name'}</h1>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{data.businessAddress || '123 Business St, City, State, PIN'}</p>
            <p className="text-xs sm:text-sm text-foreground/80">
              Contact: {data.businessContactNumber || 'N/A'} | Email: {data.businessEmail || 'N/A'}
            </p>
          </div>
           <div className="w-[100px] h-[50px] sm:w-[120px] sm:h-[60px] flex items-center justify-center border rounded bg-gray-50 overflow-hidden self-start sm:self-center">
            {canDisplayLogo ? (
              <Image src={logoSrc} alt="Business Logo" width={120} height={60} className="object-contain" data-ai-hint="company brand" />
            ) : logoUrlFromData && typeof logoUrlFromData === 'string' && logoUrlFromData.trim() !== '' && !logoUrlFromData.startsWith('data:image') ? (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs p-2 text-center">Invalid logo data</div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-1 sm:p-2 text-center">No Logo Provided</div>
            )}
          </div>
        </div>
        <Separator className="my-3 sm:my-4" />
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-accent">Work Order</CardTitle>
          <Briefcase className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="border p-3 sm:p-4 rounded-md shadow-sm">
          <h3 className="text-md sm:text-lg font-semibold text-primary mb-2">Order Details</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Order Number:</TableCell>
                <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{data.orderNumber || `WO-${Date.now().toString().slice(-6)}`}</TableCell>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Order Date:</TableCell>
                <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatDate(data.orderDate)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Expected Start Date:</TableCell>
                <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatDate(data.expectedStartDate)}</TableCell>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Expected End Date:</TableCell>
                <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatDate(data.expectedEndDate)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="border p-3 sm:p-4 rounded-md shadow-sm">
          <h3 className="text-md sm:text-lg font-semibold text-primary mb-2">Client Details</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Client Name:</TableCell>
                <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{data.clientName || 'N/A'}</TableCell>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Client Phone:</TableCell>
                <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{data.clientPhone || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Client Email:</TableCell>
                <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{data.clientEmail || 'N/A'}</TableCell>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Order Received By:</TableCell>
                <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{data.orderReceivedBy || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Work Location:</TableCell>
                <TableCell colSpan={3} className="whitespace-pre-wrap py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{data.workLocation || 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {data.generalWorkDescription && (
          <div className="border p-3 sm:p-4 rounded-md shadow-sm">
            <h3 className="text-md sm:text-lg font-semibold text-primary mb-2">Overall Work Description</h3>
            <p className="whitespace-pre-wrap text-xs sm:text-sm">{data.generalWorkDescription}</p>
          </div>
        )}

        {data.includeWorkDescriptionTable && workItems.length > 0 && (
          <div className="border p-3 sm:p-4 rounded-md shadow-sm">
            <h3 className="text-md sm:text-lg font-semibold text-primary mb-2 sm:mb-3">Detailed Work Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Work Description</TableHead>
                  <TableHead className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Area (Sq. ft.)</TableHead>
                  <TableHead className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Rate ({currencySymbol})</TableHead>
                  <TableHead className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Amount ({currencySymbol})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workItems.map((item, index) => (
                  <TableRow key={`work-${index}`}>
                    <TableCell className="whitespace-pre-wrap py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{item.description}</TableCell>
                    <TableCell className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{item.area.toFixed(2)}</TableCell>
                    <TableCell className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatCurrency(item.rate, '')}</TableCell>
                    <TableCell className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatCurrency(item.amount, '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <UiTableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="text-right font-bold text-primary py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Subtotal Work Description</TableCell>
                  <TableCell className="text-right font-bold py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatCurrency(subtotalWorkDescription, currencySymbol)}</TableCell>
                </TableRow>
              </UiTableFooter>
            </Table>
          </div>
        )}

        {data.includeMaterialTable && materialItems.length > 0 && (
          <div className="border p-3 sm:p-4 rounded-md shadow-sm">
            <h3 className="text-md sm:text-lg font-semibold text-primary mb-2 sm:mb-3">Materials Used</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Material Name</TableHead>
                  <TableHead className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Unit</TableHead>
                  <TableHead className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Quantity</TableHead>
                  <TableHead className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Price/Unit ({currencySymbol})</TableHead>
                  <TableHead className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Amount ({currencySymbol})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialItems.map((item, index) => (
                  <TableRow key={`material-${index}`}>
                    <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{item.name}</TableCell>
                    <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{item.unit}</TableCell>
                    <TableCell className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{item.quantity}</TableCell>
                    <TableCell className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatCurrency(item.pricePerUnit, '')}</TableCell>
                    <TableCell className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatCurrency(item.amount, '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <UiTableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="text-right font-bold text-primary py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Subtotal Materials</TableCell>
                  <TableCell className="text-right font-bold py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatCurrency(subtotalMaterial, currencySymbol)}</TableCell>
                </TableRow>
              </UiTableFooter>
            </Table>
          </div>
        )}

        {data.includeLaborTable && laborItems.length > 0 && (
          <div className="border p-3 sm:p-4 rounded-md shadow-sm">
            <h3 className="text-md sm:text-lg font-semibold text-primary mb-2 sm:mb-3">Labor Charges</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Team Name / Description</TableHead>
                  <TableHead className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">No. of Persons</TableHead>
                  <TableHead className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Amount ({currencySymbol})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laborItems.map((item, index) => (
                  <TableRow key={`labor-${index}`}>
                    <TableCell className="py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{item.teamName}</TableCell>
                    <TableCell className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{item.numPersons}</TableCell>
                    <TableCell className="text-right py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatCurrency(item.amount, '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <UiTableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="text-right font-bold text-primary py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">Subtotal Labor</TableCell>
                  <TableCell className="text-right font-bold py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm">{formatCurrency(subtotalLabor, currencySymbol)}</TableCell>
                </TableRow>
              </UiTableFooter>
            </Table>
          </div>
        )}

        {data.termsOfService && (
           <div className="border p-3 sm:p-4 rounded-md shadow-sm">
            <h3 className="text-md sm:text-lg font-semibold text-primary mb-2">Terms of Service</h3>
            <p className="whitespace-pre-wrap text-xs sm:text-sm">{data.termsOfService}</p>
          </div>
        )}

        <Separator />
        <div className="flex justify-end">
          <div className="w-full md:w-2/3 lg:w-1/2 xl:w-2/5 space-y-1 text-xs sm:text-sm">
            {(data.includeWorkDescriptionTable || data.includeMaterialTable || data.includeLaborTable) && (
                <div className="flex justify-between">
                  <span className="font-medium">Total Items Subtotal:</span>
                  <span>{formatCurrency(subtotalWorkDescription + subtotalMaterial + subtotalLabor, currencySymbol)}</span>
                </div>
            )}
            {typeof data.otherCosts === 'number' && data.otherCosts > 0 || (typeof data.otherCosts === 'string' && parseFloat(data.otherCosts) > 0)  && (
                 <div className="flex justify-between">
                    <span className="font-medium">Other Costs:</span>
                    <span>{formatCurrency(data.otherCosts, currencySymbol)}</span>
                </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Grand Subtotal:</span>
              <span>{formatCurrency(grandSubtotal, currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tax ({data.taxRatePercentage || 0}%):</span>
              <span>{formatCurrency(taxAmount, currencySymbol)}</span>
            </div>
            <Separator className="my-1 sm:my-2 bg-primary/50"/>
            <div className="flex justify-between text-lg sm:text-xl font-bold text-primary">
              <span>Final Total Amount:</span>
              <span>{formatCurrency(finalTotalAmount, currencySymbol)}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-6 bg-muted/30 rounded-b-lg text-xs sm:text-sm text-muted-foreground border-t">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <p className="font-semibold">Approved By:</p>
                <p className="mt-4 border-b border-foreground/50 pb-1 min-h-[24px]">{data.approvedByName || ''}</p>
                <p className="text-xs">(Signature & Name)</p>
            </div>
            <div className="text-left md:text-right mt-4 md:mt-0">
                <p className="font-semibold">Date of Approval:</p>
                <p className="mt-1">{formatDate(data.dateOfApproval)}</p>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export const workOrderFields: TemplateField[] = [
  { id: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Your Company Name', defaultValue: "ABC Constructions" },
  { id: 'businessAddress', label: 'Business Address', type: 'textarea', placeholder: '123 Business St, City, State, PIN', defaultValue: "123 Main Street, Anytown, ST 12345" },
  { id: 'businessContactNumber', label: 'Business Contact Number', type: 'text', placeholder: '9876543210', defaultValue: "555-123-4567" },
  { id: 'businessEmail', label: 'Business Email', type: 'email', placeholder: 'contact@business.com', defaultValue: "contact@abcconstructions.com" },
  {
    id: 'businessLogoUrl',
    label: 'Business Logo',
    type: 'file',
  },
  { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: `WO-${Date.now().toString().slice(-6)}`, defaultValue: `WO-${Date.now().toString().slice(-5)}` },
  { id: 'orderDate', label: 'Order Date', type: 'date' },
  { id: 'expectedStartDate', label: 'Expected Start Date', type: 'date' },
  { id: 'expectedEndDate', label: 'Expected End Date', type: 'date' },
  { id: 'currency', label: 'Currency', type: 'select', options: currencyOptionsForSelect, defaultValue: '₹' },

  { id: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Mr. John Doe' },
  { id: 'clientPhone', label: 'Client Phone', type: 'text', placeholder: '9998887770' },
  { id: 'clientEmail', label: 'Client Email', type: 'email', placeholder: 'client@example.com' },
  { id: 'workLocation', label: 'Work Location / Site Address', type: 'textarea', placeholder: 'Full address of the work site' },
  { id: 'orderReceivedBy', label: 'Order Received By (Your Staff)', type: 'text', placeholder: 'Employee Name' },
  { id: 'generalWorkDescription', label: 'Overall Work Description', type: 'textarea', placeholder: 'Summarize the work to be done', rows: 3 },
  { id: 'termsOfService', label: 'Terms of Service', type: 'textarea', rows: 4, defaultValue: "1. All payments are due upon completion of work unless otherwise agreed in writing.\n2. Any changes to the scope of work must be documented and may incur additional charges.\n3. Warranty for services performed is 30 days from completion date." },
  
  { id: 'includeWorkDescriptionTable', label: 'Work Items', type: 'boolean', defaultValue: true },
  ...Array.from({ length: 30 }, (_, i) => i + 1).flatMap(idx => ([
    { id: `workItem${idx}Description`, label: `Work description ${idx}`, type: 'text', placeholder: idx === 1 ? 'E.g., Interior Painting - Living Room' : undefined},
    { id: `workItem${idx}Area`, label: 'Area (Sq. ft.)', type: 'number', placeholder: idx === 1 ? '250' : undefined },
    { id: `workItem${idx}Rate`, label: 'Rate (per Sq. ft.)', type: 'number', placeholder: idx === 1 ? '15' : undefined },
  ] as TemplateField[])),
  
  { id: 'includeMaterialTable', label: 'Materials', type: 'boolean', defaultValue: true },
  ...Array.from({ length: 30 }, (_, i) => i + 1).flatMap(idx => ([
    { id: `materialItem${idx}Name`, label: `Material name ${idx}`, type: 'text', placeholder: idx === 1 ? 'E.g., Emulsion Paint' : undefined },
    { id: `materialItem${idx}Quantity`, label: 'Quantity', type: 'number', placeholder: idx === 1 ? '10' : undefined },
    { id: `materialItem${idx}Unit`, label: 'Unit', type: 'select', options: [ { value: 'Pcs', label: 'Pcs' }, { value: 'Litre', label: 'Litre' }, { value: 'Kg', label: 'Kg' } ], defaultValue: 'Pcs', placeholder: 'Select unit' },
    { id: `materialItem${idx}PricePerUnit`, label: 'Price per Unit', type: 'number', placeholder: idx === 1 ? '450' : undefined },
  ] as TemplateField[])),

  { id: 'includeLaborTable', label: 'Labour Charges', type: 'boolean', defaultValue: true },
  ...Array.from({ length: 30 }, (_, i) => i + 1).flatMap(idx => ([
    { id: `laborItem${idx}TeamName`, label: `Team/Description ${idx}`, type: 'text', placeholder: idx === 1 ? 'E.g., Painting Team A' : undefined },
    { id: `laborItem${idx}NumPersons`, label: 'No. of Persons', type: 'number', placeholder: idx === 1 ? '2' : undefined },
    { id: `laborItem${idx}Amount`, label: 'Amount', type: 'number', placeholder: idx === 1 ? '8000' : undefined },
  ] as TemplateField[])),

  { id: 'otherCosts', label: 'Other Costs (e.g., Transportation)', type: 'number', placeholder: '500', defaultValue: 0 },
  { id: 'taxRatePercentage', label: 'Tax Rate (%)', type: 'number', placeholder: '18', defaultValue: 18 },
  { id: 'approvedByName', label: 'Approved By (Name)', type: 'text', placeholder: 'Project Manager Name' },
  { id: 'dateOfApproval', label: 'Date of Approval', type: 'date' },
];
