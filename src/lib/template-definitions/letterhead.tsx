
import React from 'react';
import type { FormData, TemplateField } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

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

export const LetterheadPreview = (data: FormData) => (
  <Card className="w-full max-w-3xl mx-auto shadow-lg p-6 sm:p-8 print-friendly-letterhead" data-ai-hint="stationery paper">
    <header className="flex justify-between items-center mb-10 sm:mb-12 border-b-2 border-primary pb-4 sm:pb-6">
      <div className="text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">{data.companyName || 'Your Company Name'}</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">{data.companySlogan || 'Your Company Slogan/Tagline'}</p>
      </div>
      <div className="w-[150px] h-[75px] flex-shrink-0 flex items-center justify-end">
        {data.logoUrl && typeof data.logoUrl === 'string' && data.logoUrl.startsWith('data:image') ? (
          <Image src={data.logoUrl} alt="Company Logo" width={150} height={75} className="object-contain" data-ai-hint="company brand"/>
        ) : data.logoUrl && typeof data.logoUrl === 'string' ? (
          <Image src={data.logoUrl} alt="Company Logo (External)" width={150} height={75} className="object-contain" data-ai-hint="company brand"/>
        ) : (
          <div className="h-16 w-32 bg-muted flex items-center justify-center text-muted-foreground rounded text-xs p-1">Logo Placeholder</div>
        )}
      </div>
    </header>

    <section className="mb-6 sm:mb-8 text-sm sm:text-base">
      <p className="text-right mb-4">{formatDate(data.date)}</p>
      <p className="mb-2"><strong>{data.recipientName || 'Recipient Name'}</strong></p>
      <p className="mb-2 whitespace-pre-wrap">{data.recipientAddress || 'Recipient Address Line 1\nRecipient Address Line 2'}</p>
      {data.subject && <h2 className="text-lg sm:text-xl font-semibold text-primary mt-4 sm:mt-6 mb-3 sm:mb-4">{data.subject}</h2>}
    </section>

    <section className="mb-10 sm:mb-12 whitespace-pre-wrap min-h-[150px] sm:min-h-[200px] text-sm sm:text-base">
      {data.bodyContent || 'Dear [Recipient Name],\n\nThis is the main content of your letter. You can type multiple paragraphs here.\n\nSincerely,\n[Your Name]'}
    </section>

    <footer className="mt-12 sm:mt-16 pt-4 sm:pt-6 border-t-2 border-primary text-center text-xs text-muted-foreground">
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

export const letterheadFields: TemplateField[] = [
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
];
