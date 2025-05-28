
import React from 'react';
import type { Template, FormData } from '@/types';
import { Briefcase, Scroll, Receipt, Mail, Phone, User, Building, CalendarDays, DollarSign, Hash, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString; // Fallback if date is invalid
  }
};

const WorkOrderPreview = (data: FormData) => (
  <Card className="w-full max-w-3xl mx-auto shadow-lg border-primary/50">
    <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
      <div className="flex justify-between items-center">
        <CardTitle className="text-3xl font-bold">Work Order</CardTitle>
        <Briefcase className="h-10 w-10" />
      </div>
      <CardDescription className="text-primary-foreground/80 mt-1">
        Order ID: #{data.orderId || `WO-${Date.now().toString().slice(-6)}`}
      </CardDescription>
    </CardHeader>
    <CardContent className="p-8 space-y-6 bg-card text-card-foreground">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2 border-b pb-1">Client Details</h3>
          <p><strong>Name:</strong> {data.clientName || 'N/A'}</p>
          <p><strong>Contact:</strong> {data.clientContact || 'N/A'}</p>
          <p><strong>Address:</strong> {data.clientAddress || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2 border-b pb-1">Company Details</h3>
          <p><strong>Company:</strong> {data.companyName || 'Your Company LLC'}</p>
          <p><strong>Technician:</strong> {data.technicianName || 'N/A'}</p>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold text-primary mb-2 border-b pb-1">Work Description</h3>
        <p className="whitespace-pre-wrap">{data.workDescription || 'N/A'}</p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">Scheduled Date</h3>
          <p>{formatDate(data.scheduledDate)}</p>
        </div>
        <div className="text-left md:text-right">
          <h3 className="text-lg font-semibold text-primary mb-2">Estimated Cost</h3>
          <p className="text-2xl font-bold">${parseFloat(data.estimatedCost || 0).toFixed(2)}</p>
        </div>
      </div>
    </CardContent>
    <CardFooter className="p-6 bg-muted/50 rounded-b-lg text-sm text-muted-foreground">
      <p>Thank you for your business! Payment is due upon completion unless otherwise specified.</p>
    </CardFooter>
  </Card>
);

const LetterheadPreview = (data: FormData) => (
  <Card className="w-full max-w-3xl mx-auto shadow-lg p-8 border-primary/50 print-friendly-letterhead" data-ai-hint="stationery paper">
    <header className="mb-12 text-center border-b-2 border-primary pb-6">
      {data.logoUrl ? (
        <Image src={data.logoUrl as string} alt="Company Logo" width={150} height={75} className="mx-auto mb-4 object-contain" data-ai-hint="company logo" />
      ) : (
        <div className="h-16 w-32 bg-muted mx-auto mb-4 flex items-center justify-center text-muted-foreground rounded">Logo Placeholder</div>
      )}
      <h1 className="text-4xl font-bold text-primary">{data.companyName || 'Your Company Name'}</h1>
      <p className="text-muted-foreground mt-1">{data.companySlogan || 'Your Company Slogan/Tagline'}</p>
    </header>
    
    <section className="mb-8">
      <p className="text-right mb-4">{formatDate(data.date)}</p>
      <p className="mb-2"><strong>{data.recipientName || 'Recipient Name'}</strong></p>
      <p className="mb-2">{data.recipientAddress || 'Recipient Address Line 1\nRecipient Address Line 2'}</p>
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


export const templates: Template[] = [
  {
    id: 'work-order',
    name: 'Work Order',
    description: 'Generate detailed work orders for services.',
    icon: Briefcase,
    fields: [
      { id: 'orderId', label: 'Order ID', type: 'text', placeholder: `WO-${Date.now().toString().slice(-6)}`, defaultValue: `WO-${Date.now().toString().slice(-6)}` },
      { id: 'clientName', label: 'Client Name', type: 'text', placeholder: 'John Doe', required: true },
      { id: 'clientContact', label: 'Client Contact (Email/Phone)', type: 'text', placeholder: 'john.doe@example.com / 555-1234' },
      { id: 'clientAddress', label: 'Client Address', type: 'textarea', placeholder: '123 Main St, Anytown, USA', required: true },
      { id: 'companyName', label: 'Your Company Name', type: 'text', placeholder: 'Your Company LLC', defaultValue: 'Your Company LLC' },
      { id: 'technicianName', label: 'Technician Name', type: 'text', placeholder: 'Jane Smith' },
      { id: 'workDescription', label: 'Description of Work', type: 'textarea', placeholder: 'Detailed description of tasks and services provided.', required: true },
      { id: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
      { id: 'estimatedCost', label: 'Estimated Cost ($)', type: 'number', placeholder: '150.00' },
    ],
    previewLayout: WorkOrderPreview,
  },
  {
    id: 'letterhead',
    name: 'Letterhead',
    description: 'Create professional letterheads for official correspondence.',
    icon: Scroll,
    fields: [
      { id: 'logoUrl', label: 'Company Logo URL (optional)', type: 'text', placeholder: 'https://placehold.co/150x75.png' , defaultValue: 'https://placehold.co/150x75.png' },
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Your Company Inc.', required: true, defaultValue: 'Your Company Inc.' },
      { id: 'companySlogan', label: 'Company Slogan (optional)', type: 'text', placeholder: 'Quality Service Since 1999' },
      { id: 'companyAddress', label: 'Company Full Address', type: 'textarea', placeholder: '123 Business Rd, Suite 100, City, State, Zip', defaultValue: '123 Business Rd, Suite 100, City, State, Zip' },
      { id: 'companyPhone', label: 'Company Phone', type: 'text', placeholder: '(555) 123-4567' },
      { id: 'companyEmail', label: 'Company Email', type: 'email', placeholder: 'contact@yourcompany.com' },
      { id: 'companyWebsite', label: 'Company Website (optional)', type: 'text', placeholder: 'www.yourcompany.com' },
      { id: 'date', label: 'Date', type: 'date', required: true },
      { id: 'recipientName', label: 'Recipient Name', type: 'text', placeholder: 'Mr. John Smith', required: true },
      { id: 'recipientAddress', label: 'Recipient Address', type: 'textarea', placeholder: '456 Client Ave\nClient City, State ZIP', required: true },
      { id: 'subject', label: 'Subject (optional)', type: 'text', placeholder: 'Regarding Your Recent Inquiry' },
      { id: 'bodyContent', label: 'Letter Body', type: 'textarea', placeholder: 'Dear Mr. Smith,\n\n...', required: true, defaultValue: 'Dear [Recipient Name],\n\n\n\nSincerely,\n[Your Name]' },
    ],
    previewLayout: LetterheadPreview,
  },
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Generate and manage invoices for clients.',
    icon: Receipt,
    fields: [
      { id: 'companyName', label: 'Your Company Name', type: 'text', placeholder: 'Your Company LLC', required: true, defaultValue: 'Your Company LLC' },
      { id: 'companyAddress', label: 'Your Company Address', type: 'textarea', placeholder: '123 Business Rd\nCity, State ZIP', required: true, defaultValue: '123 Business Rd\nCity, State ZIP' },
      { id: 'clientName', label: 'Client Name/Company', type: 'text', placeholder: 'Client Inc.', required: true },
      { id: 'clientAddress', label: 'Client Address', type: 'textarea', placeholder: '456 Client Ave\nClient City, State ZIP', required: true },
      { id: 'invoiceNumber', label: 'Invoice Number', type: 'text', placeholder: `INV-${Date.now().toString().slice(-6)}`, required: true, defaultValue: `INV-${Date.now().toString().slice(-6)}` },
      { id: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { id: 'dueDate', label: 'Due Date', type: 'date', required: true },
      // For simplicity, using fixed item fields. A dynamic list of items would be more complex.
      { id: 'itemDescription1', label: 'Item 1 Description', type: 'text', placeholder: 'Service Rendered / Product Name' },
      { id: 'itemQuantity1', label: 'Item 1 Quantity', type: 'number', placeholder: '1', defaultValue: 1 },
      { id: 'itemPrice1', label: 'Item 1 Unit Price ($)', type: 'number', placeholder: '100.00' },
      // Could add more item fields or implement dynamic item list later.
      { id: 'subtotal', label: 'Subtotal ($)', type: 'number', placeholder: 'Calculate automatically or enter', required: true },
      { id: 'taxRate', label: 'Tax Rate (%)', type: 'number', placeholder: '7.5', defaultValue: 0 },
      { id: 'taxAmount', label: 'Tax Amount ($)', type: 'number', placeholder: 'Calculate automatically or enter', required: true },
      { id: 'totalAmount', label: 'Total Amount ($)', type: 'number', placeholder: 'Calculate automatically or enter', required: true },
      { id: 'notes', label: 'Notes/Terms (optional)', type: 'textarea', placeholder: 'Payment due within 30 days. Late fees may apply.' },
    ],
    previewLayout: InvoicePreview,
  },
];
