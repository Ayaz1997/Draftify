
import React from 'react';
import type { Template, FormData, TemplateField } from '@/types';
import { Briefcase, Scroll, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from '@/components/ui/table';

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

const formatCurrency = (amount?: number | string, currencySymbol = '₹') => {
  const num = parseFloat(String(amount || 0));
  return `${currencySymbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MAX_ITEMS_PREVIEW = 5;

const WorkOrderPreview = (data: FormData) => {
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
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-primary/30 printable-area">
      <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary">{data.businessName || 'Your Business Name'}</h1>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{data.businessAddress || '123 Business St, City, State, PIN'}</p>
            <p className="text-sm text-foreground/80">
              Contact: {data.businessContactNumber || 'N/A'} | Email: {data.businessEmail || 'N/A'}
            </p>
          </div>
           <div className="w-[120px] h-[60px] flex items-center justify-center border rounded bg-gray-50 overflow-hidden">
            {canDisplayLogo ? (
              <Image src={logoSrc} alt="Business Logo" width={120} height={60} className="object-contain" data-ai-hint="company brand" />
            ) : logoUrlFromData && typeof logoUrlFromData === 'string' && logoUrlFromData.trim() !== '' && !logoUrlFromData.startsWith('data:image') ? (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs p-2 text-center">Invalid logo data</div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">No Logo Provided</div>
            )}
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-semibold text-accent">Work Order</CardTitle>
          <Briefcase className="h-8 w-8 text-accent" />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="border p-4 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold text-primary mb-2">Order Details</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Order Number:</TableCell>
                <TableCell>{data.orderNumber || `WO-${Date.now().toString().slice(-6)}`}</TableCell>
                <TableCell className="font-medium">Order Date:</TableCell>
                <TableCell>{formatDate(data.orderDate)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Expected Start Date:</TableCell>
                <TableCell>{formatDate(data.expectedStartDate)}</TableCell>
                <TableCell className="font-medium">Expected End Date:</TableCell>
                <TableCell>{formatDate(data.expectedEndDate)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="border p-4 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold text-primary mb-2">Client Details</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Client Name:</TableCell>
                <TableCell>{data.clientName || 'N/A'}</TableCell>
                <TableCell className="font-medium">Client Phone:</TableCell>
                <TableCell>{data.clientPhone || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Client Email:</TableCell>
                <TableCell>{data.clientEmail || 'N/A'}</TableCell>
                <TableCell className="font-medium">Order Received By:</TableCell>
                <TableCell>{data.orderReceivedBy || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Work Location:</TableCell>
                <TableCell colSpan={3} className="whitespace-pre-wrap">{data.workLocation || 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {data.generalWorkDescription && (
          <div className="border p-4 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-2">Overall Work Description</h3>
            <p className="whitespace-pre-wrap text-sm">{data.generalWorkDescription}</p>
          </div>
        )}

        {data.includeWorkDescriptionTable && workItems.length > 0 && (
          <div className="border p-4 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-3">Detailed Work Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Description</TableHead>
                  <TableHead className="text-right">Area (Sq. ft.)</TableHead>
                  <TableHead className="text-right">Rate ({formatCurrency(0).charAt(0)})</TableHead>
                  <TableHead className="text-right">Amount ({formatCurrency(0).charAt(0)})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workItems.map((item, index) => (
                  <TableRow key={`work-${index}`}>
                    <TableCell className="whitespace-pre-wrap">{item.description}</TableCell>
                    <TableCell className="text-right">{item.area.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.rate, '')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount, '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <UiTableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="text-right font-bold text-primary">Subtotal Work Description</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(subtotalWorkDescription)}</TableCell>
                </TableRow>
              </UiTableFooter>
            </Table>
          </div>
        )}

        {data.includeMaterialTable && materialItems.length > 0 && (
          <div className="border p-4 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-3">Materials Used</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price/Unit ({formatCurrency(0).charAt(0)})</TableHead>
                  <TableHead className="text-right">Amount ({formatCurrency(0).charAt(0)})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialItems.map((item, index) => (
                  <TableRow key={`material-${index}`}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.pricePerUnit, '')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount, '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <UiTableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="text-right font-bold text-primary">Subtotal Materials</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(subtotalMaterial)}</TableCell>
                </TableRow>
              </UiTableFooter>
            </Table>
          </div>
        )}

        {data.includeLaborTable && laborItems.length > 0 && (
          <div className="border p-4 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-3">Labor Charges</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name / Description</TableHead>
                  <TableHead className="text-right">No. of Persons</TableHead>
                  <TableHead className="text-right">Amount ({formatCurrency(0).charAt(0)})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laborItems.map((item, index) => (
                  <TableRow key={`labor-${index}`}>
                    <TableCell>{item.teamName}</TableCell>
                    <TableCell className="text-right">{item.numPersons}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount, '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <UiTableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="text-right font-bold text-primary">Subtotal Labor</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(subtotalLabor)}</TableCell>
                </TableRow>
              </UiTableFooter>
            </Table>
          </div>
        )}

        {data.termsOfService && (
           <div className="border p-4 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-2">Terms of Service</h3>
            <p className="whitespace-pre-wrap text-sm">{data.termsOfService}</p>
          </div>
        )}

        <Separator />
        <div className="flex justify-end">
          <div className="w-full md:w-2/5 space-y-1">
            {(data.includeWorkDescriptionTable || data.includeMaterialTable || data.includeLaborTable) && (
                <div className="flex justify-between">
                  <span className="font-medium">Total Items Subtotal:</span>
                  <span>{formatCurrency(subtotalWorkDescription + subtotalMaterial + subtotalLabor)}</span>
                </div>
            )}
            {typeof data.otherCosts === 'number' && data.otherCosts > 0 || (typeof data.otherCosts === 'string' && parseFloat(data.otherCosts) > 0)  && (
                 <div className="flex justify-between">
                    <span className="font-medium">Other Costs:</span>
                    <span>{formatCurrency(data.otherCosts)}</span>
                </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Grand Subtotal:</span>
              <span>{formatCurrency(grandSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tax ({data.taxRatePercentage || 0}%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator className="my-2 bg-primary/50"/>
            <div className="flex justify-between text-xl font-bold text-primary">
              <span>Final Total Amount:</span>
              <span>{formatCurrency(finalTotalAmount)}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 bg-muted/30 rounded-b-lg text-sm text-muted-foreground border-t">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <p className="font-semibold">Approved By:</p>
                <p className="mt-4 border-b border-foreground/50 pb-1 min-h-[24px]">{data.approvedByName || ''}</p>
                <p className="text-xs">(Signature & Name)</p>
            </div>
            <div className="text-left md:text-right">
                <p className="font-semibold">Date of Approval:</p>
                <p className="mt-1">{formatDate(data.dateOfApproval)}</p>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
};


const LetterheadPreview = (data: FormData) => (
  <Card className="w-full max-w-3xl mx-auto shadow-lg p-8 border-primary/50 print-friendly-letterhead" data-ai-hint="stationery paper">
    <header className="mb-12 text-center border-b-2 border-primary pb-6">
      {data.logoUrl && typeof data.logoUrl === 'string' && data.logoUrl.startsWith('data:image') ? (
        <Image src={data.logoUrl} alt="Company Logo" width={150} height={75} className="mx-auto mb-4 object-contain" data-ai-hint="company brand"/>
      ) : data.logoUrl && typeof data.logoUrl === 'string' ? (
         <Image src={data.logoUrl} alt="Company Logo (External)" width={150} height={75} className="mx-auto mb-4 object-contain" data-ai-hint="company brand"/>
      ) : (
        <div className="h-16 w-32 bg-muted mx-auto mb-4 flex items-center justify-center text-muted-foreground rounded text-xs p-1">Logo Placeholder</div>
      )}
      <h1 className="text-4xl font-bold text-primary">{data.companyName || 'Your Company Name'}</h1>
      <p className="text-muted-foreground mt-1">{data.companySlogan || 'Your Company Slogan/Tagline'}</p>
    </header>

    <section className="mb-8">
      <p className="text-right mb-4">{formatDate(data.date)}</p>
      <p className="mb-2"><strong>{data.recipientName || 'Recipient Name'}</strong></p>
      <p className="mb-2 whitespace-pre-wrap">{data.recipientAddress || 'Recipient Address Line 1\nRecipient Address Line 2'}</p>
      {data.subject && <h2 className="text-xl font-semibold text-primary mt-6 mb-4">{data.subject}</h2>}
    </section>

    <section className="mb-12 whitespace-pre-wrap min-h-[200px]">
      {data.bodyContent || 'Dear [Recipient Name],\n\nThis is the main content of your letter. You can type multiple paragraphs here.\n\nSincerely,\n[Your Name]'}
    </section>

    <footer className="mt-16 pt-6 border-t-2 border-primary text-center text-xs text-muted-foreground">
      <p>{data.companyAddress || '123 Business Rd, Suite 100, City, State, Zip'}</p>
      <p>
        {data.companyPhone && `Phone: ${data.companyPhone}`}
        {data.companyEmail && data.companyPhone && ' | '}
        {data.companyEmail && `Email: ${data.companyEmail}`}
      </p>
      {data.companyWebsite && <p>Website: {data.companyWebsite}</p>}
    </footer>
  </Card>
);

const InvoicePreview = (data: FormData) => (
  <Card className="w-full max-w-3xl mx-auto shadow-lg border-primary/50">
    <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
      <div className="flex justify-between items-center">
        <CardTitle className="text-3xl font-bold">INVOICE</CardTitle>
        <Receipt className="h-10 w-10" />
      </div>
      <div className="flex justify-between items-end mt-2">
        <div>
          <p className="text-primary-foreground/80"><strong>{data.companyName || 'Your Company LLC'}</strong></p>
          <p className="text-sm text-primary-foreground/80 whitespace-pre-wrap">{data.companyAddress || '123 Business Rd\nCity, State ZIP'}</p>
        </div>
        <div className="text-right">
          <p className="text-primary-foreground/80">Invoice #: {data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`}</p>
          <p className="text-primary-foreground/80">Date: {formatDate(data.invoiceDate)}</p>
          <p className="text-primary-foreground/80">Due Date: {formatDate(data.dueDate)}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-8 space-y-6 bg-card text-card-foreground">
      <div>
        <h3 className="text-lg font-semibold text-primary mb-2">Bill To:</h3>
        <p><strong>{data.clientName || 'Client Company Name'}</strong></p>
        <p className="whitespace-pre-wrap">{data.clientAddress || '456 Client Ave\nClient City, State ZIP'}</p>
      </div>
      <Separator />
      <div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/50">
              <th className="text-left py-2 pr-2 font-semibold text-primary">Item Description</th>
              <th className="text-right py-2 px-2 font-semibold text-primary">Quantity</th>
              <th className="text-right py-2 px-2 font-semibold text-primary">Unit Price</th>
              <th className="text-right py-2 pl-2 font-semibold text-primary">Total</th>
            </tr>
          </thead>
          <tbody>
            {(data.items && Array.isArray(data.items) ? data.items : [{ description: data.itemDescription1, quantity: data.itemQuantity1, unitPrice: data.itemPrice1 }]).map((item: any, index: number) => (
              <tr key={index} className="border-b border-muted">
                <td className="py-2 pr-2">{item.description || 'N/A'}</td>
                <td className="text-right py-2 px-2">{item.quantity || 1}</td>
                <td className="text-right py-2 px-2">${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                <td className="text-right py-2 pl-2">${(parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Separator />
      <div className="flex justify-end">
        <div className="w-full md:w-1/2 lg:w-1/3 space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">Subtotal:</span>
            <span>${parseFloat(data.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Tax ({data.taxRate || 0}%):</span>
            <span>${parseFloat(data.taxAmount || 0).toFixed(2)}</span>
          </div>
          <Separator className="my-1 bg-primary/50"/>
          <div className="flex justify-between text-xl font-bold text-primary">
            <span>Total Due:</span>
            <span>${parseFloat(data.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
       {data.notes && (
        <>
          <Separator />
          <div>
            <h3 className="text-md font-semibold text-primary mb-1">Notes:</h3>
            <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
          </div>
        </>
      )}
    </CardContent>
    <CardFooter className="p-6 bg-muted/50 rounded-b-lg text-sm text-muted-foreground">
      <p>Thank you for your prompt payment. Please make all checks payable to {data.companyName || 'Your Company LLC'}.</p>
    </CardFooter>
  </Card>
);

const workOrderFields: TemplateField[] = [
  // Business Details
  { id: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Your Company Name', defaultValue: "ABC Constructions" },
  { id: 'businessAddress', label: 'Business Address', type: 'textarea', placeholder: '123 Business St, City, State, PIN', defaultValue: "123 Main Street, Anytown, ST 12345" },
  { id: 'businessContactNumber', label: 'Business Contact Number', type: 'text', placeholder: '9876543210', defaultValue: "555-123-4567" },
  { id: 'businessEmail', label: 'Business Email', type: 'email', placeholder: 'contact@business.com', defaultValue: "contact@abcconstructions.com" },
  {
    id: 'businessLogoUrl',
    label: 'Business Logo',
    type: 'file',
    placeholder: 'Recommended: <1MB, PNG/JPG. Ideal: 240x120px (2:1 ratio).'
  },

  // Order Details
  { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: `WO-${Date.now().toString().slice(-6)}`, defaultValue: `WO-${Date.now().toString().slice(-5)}` },
  { id: 'orderDate', label: 'Order Date', type: 'date' },
  { id: 'expectedStartDate', label: 'Expected Start Date', type: 'date' },
  { id: 'expectedEndDate', label: 'Expected End Date', type: 'date' },

  // Client Details
  { id: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Mr. John Doe' },
  { id: 'clientPhone', label: 'Client Phone', type: 'text', placeholder: '9998887770' },
  { id: 'clientEmail', label: 'Client Email', type: 'email', placeholder: 'client@example.com' },
  { id: 'workLocation', label: 'Work Location / Site Address', type: 'textarea', placeholder: 'Full address of the work site' },
  { id: 'orderReceivedBy', label: 'Order Received By (Your Staff)', type: 'text', placeholder: 'Employee Name' },

  // Work Order Specifics - General
  { id: 'generalWorkDescription', label: 'Overall Work Description', type: 'textarea', placeholder: 'Summarize the work to be done', rows: 3 },
  { id: 'termsOfService', label: 'Terms of Service', type: 'textarea', placeholder: 'Payment terms, warranty, etc.', rows: 4, defaultValue: "1. All payments are due upon completion of work unless otherwise agreed in writing.\n2. Any changes to the scope of work must be documented and may incur additional charges.\n3. Warranty for services performed is 30 days from completion date." },

  // Work Order Specifics - Work Items Table Toggle & Fields (up to 5 items)
  { id: 'includeWorkDescriptionTable', label: 'Work Items', type: 'boolean', defaultValue: true, placeholder: "Toggle visibility of the detailed work items table in the previewed document." },
  { id: 'workItem1Description', label: 'Work description 1', type: 'text', placeholder: 'E.g., Interior Painting - Living Room'},
  { id: 'workItem1Area', label: 'Area (Sq. ft.)', type: 'number', placeholder: '250' },
  { id: 'workItem1Rate', label: 'Rate (₹ per Sq. ft.)', type: 'number', placeholder: '15' },
  { id: 'workItem2Description', label: 'Work description 2', type: 'text'},
  { id: 'workItem2Area', label: 'Area (Sq. ft.)', type: 'number' },
  { id: 'workItem2Rate', label: 'Rate (₹)', type: 'number' },
  { id: 'workItem3Description', label: 'Work description 3', type: 'text' },
  { id: 'workItem3Area', label: 'Area (Sq. ft.)', type: 'number' },
  { id: 'workItem3Rate', label: 'Rate (₹)', type: 'number' },
  { id: 'workItem4Description', label: 'Work description 4', type: 'text' },
  { id: 'workItem4Area', label: 'Area (Sq. ft.)', type: 'number' },
  { id: 'workItem4Rate', label: 'Rate (₹)', type: 'number' },
  { id: 'workItem5Description', label: 'Work description 5', type: 'text' },
  { id: 'workItem5Area', label: 'Area (Sq. ft.)', type: 'number' },
  { id: 'workItem5Rate', label: 'Rate (₹)', type: 'number' },


  // Work Order Specifics - Material Table Toggle & Fields (up to 5 items)
  { id: 'includeMaterialTable', label: 'Materials', type: 'boolean', defaultValue: true, placeholder: "Toggle visibility of the materials table in the previewed document." },
  { id: 'materialItem1Name', label: 'Material name 1', type: 'text', placeholder: 'E.g., Emulsion Paint' },
  { id: 'materialItem1Quantity', label: 'Quantity', type: 'number', placeholder: '10' },
  { id: 'materialItem1Unit', label: 'Unit', type: 'select', options: [ { value: 'Pcs', label: 'Pcs' }, { value: 'Litre', label: 'Litre' }, { value: 'Kg', label: 'Kg' } ], defaultValue: 'Pcs', placeholder: 'Select unit' },
  { id: 'materialItem1PricePerUnit', label: 'Price per Unit (₹)', type: 'number', placeholder: '450' },
  { id: 'materialItem2Name', label: 'Material name 2', type: 'text' },
  { id: 'materialItem2Quantity', label: 'Quantity', type: 'number' },
  { id: 'materialItem2Unit', label: 'Unit', type: 'select', options: [ { value: 'Pcs', label: 'Pcs' }, { value: 'Litre', label: 'Litre' }, { value: 'Kg', label: 'Kg' } ], defaultValue: 'Pcs', placeholder: 'Select unit' },
  { id: 'materialItem2PricePerUnit', label: 'Price per Unit (₹)', type: 'number' },
  { id: 'materialItem3Name', label: 'Material name 3', type: 'text' },
  { id: 'materialItem3Quantity', label: 'Quantity', type: 'number' },
  { id: 'materialItem3Unit', label: 'Unit', type: 'select', options: [ { value: 'Pcs', label: 'Pcs' }, { value: 'Litre', label: 'Litre' }, { value: 'Kg', label: 'Kg' } ], defaultValue: 'Pcs', placeholder: 'Select unit' },
  { id: 'materialItem3PricePerUnit', label: 'Price per Unit (₹)', type: 'number' },
  { id: 'materialItem4Name', label: 'Material name 4', type: 'text' },
  { id: 'materialItem4Quantity', label: 'Quantity', type: 'number' },
  { id: 'materialItem4Unit', label: 'Unit', type: 'select', options: [ { value: 'Pcs', label: 'Pcs' }, { value: 'Litre', label: 'Litre' }, { value: 'Kg', label: 'Kg' } ], defaultValue: 'Pcs', placeholder: 'Select unit' },
  { id: 'materialItem4PricePerUnit', label: 'Price per Unit (₹)', type: 'number' },
  { id: 'materialItem5Name', label: 'Material name 5', type: 'text' },
  { id: 'materialItem5Quantity', label: 'Quantity', type: 'number' },
  { id: 'materialItem5Unit', label: 'Unit', type: 'select', options: [ { value: 'Pcs', label: 'Pcs' }, { value: 'Litre', label: 'Litre' }, { value: 'Kg', label: 'Kg' } ], defaultValue: 'Pcs', placeholder: 'Select unit' },
  { id: 'materialItem5PricePerUnit', label: 'Price per Unit (₹)', type: 'number' },

  // Work Order Specifics - Labor Table Toggle & Fields (up to 5 items)
  { id: 'includeLaborTable', label: 'Labour Charges', type: 'boolean', defaultValue: true, placeholder: "Toggle visibility of the labor charges table in the previewed document." },
  { id: 'laborItem1TeamName', label: 'Team/Description 1', type: 'text', placeholder: 'E.g., Painting Team A' },
  { id: 'laborItem1NumPersons', label: 'No. of Persons', type: 'number', placeholder: '2' },
  { id: 'laborItem1Amount', label: 'Amount (₹)', type: 'number', placeholder: '8000' },
  { id: 'laborItem2TeamName', label: 'Team/Description 2', type: 'text' },
  { id: 'laborItem2NumPersons', label: 'No. of Persons', type: 'number' },
  { id: 'laborItem2Amount', label: 'Amount (₹)', type: 'number' },
  { id: 'laborItem3TeamName', label: 'Team/Description 3', type: 'text' },
  { id: 'laborItem3NumPersons', label: 'No. of Persons', type: 'number' },
  { id: 'laborItem3Amount', label: 'Amount (₹)', type: 'number' },
  { id: 'laborItem4TeamName', label: 'Team/Description 4', type: 'text' },
  { id: 'laborItem4NumPersons', label: 'No. of Persons', type: 'number' },
  { id: 'laborItem4Amount', label: 'Amount (₹)', type: 'number' },
  { id: 'laborItem5TeamName', label: 'Team/Description 5', type: 'text' },
  { id: 'laborItem5NumPersons', label: 'No. of Persons', type: 'number' },
  { id: 'laborItem5Amount', label: 'Amount (₹)', type: 'number' },

  // Work Order Specifics - Financials & Approval
  { id: 'otherCosts', label: 'Other Costs (₹, e.g., Transportation)', type: 'number', placeholder: '500', defaultValue: 0 },
  { id: 'taxRatePercentage', label: 'Tax Rate (%)', type: 'number', placeholder: '18', defaultValue: 18 },
  { id: 'approvedByName', label: 'Approved By (Name)', type: 'text', placeholder: 'Project Manager Name' },
  { id: 'dateOfApproval', label: 'Date of Approval', type: 'date' },
];


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
    fields: [
      { id: 'logoUrl', label: 'Company Logo', type: 'file', placeholder: 'Upload your company logo. Recommended: <1MB, PNG/JPG.' },
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Your Company Inc.', defaultValue: 'Your Company Inc.' },
      { id: 'companySlogan', label: 'Company Slogan (optional)', type: 'text', placeholder: 'Quality Service Since 1999' },
      { id: 'companyAddress', label: 'Company Full Address', type: 'textarea', placeholder: '123 Business Rd, Suite 100, City, State, Zip', defaultValue: '123 Business Rd, Suite 100, City, State, Zip' },
      { id: 'companyPhone', label: 'Company Phone', type: 'text', placeholder: '(555) 123-4567' },
      { id: 'companyEmail', label: 'Company Email', type: 'email', placeholder: 'contact@yourcompany.com' },
      { id: 'companyWebsite', label: 'Company Website (optional)', type: 'text', placeholder: 'www.yourcompany.com' },
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'recipientName', label: 'Recipient Name', type: 'text', placeholder: 'Mr. John Smith' },
      { id: 'recipientAddress', label: 'Recipient Address', type: 'textarea', placeholder: '456 Client Ave\nClient City, State ZIP' },
      { id: 'subject', label: 'Subject (optional)', type: 'text', placeholder: 'Regarding Your Recent Inquiry' },
      { id: 'bodyContent', label: 'Letter Body', type: 'textarea', placeholder: 'Dear Mr. Smith,\n\n...', defaultValue: 'Dear [Recipient Name],\n\n\n\nSincerely,\n[Your Name]', rows: 10 },
    ],
    previewLayout: LetterheadPreview,
  },
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Generate and manage invoices for clients.',
    icon: Receipt,
    fields: [
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
    ],
    previewLayout: InvoicePreview,
  },
];
