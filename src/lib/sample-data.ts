
import type { FormData } from '@/types';

const today = new Date().toISOString().split('T')[0];

const indianBusiness = {
  businessName: 'Surya Innovations Pvt. Ltd.',
  businessAddress: '789, Electronics City, Phase 1\nBengaluru, Karnataka 560100',
  businessContactNumber: '+91 98765 43210',
  businessEmail: 'contact@suryainnovations.in',
  businessLogoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGN0YwMCIgc3Ryb2tlPSIjRkY0NTAwIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyMCIgZmlsbD0iI0ZGRkY5OSIvPjwvc3ZnPg==',
};

const indianClient = {
  clientName: 'Priya Sharma',
  clientAddress: 'A-101, Sunshine Apartments\nJ.P. Nagar, Mysuru\nKarnataka 570008',
  clientPhone: '+91 91234 56789',
  clientEmail: 'priya.sharma@email.com',
  workLocation: 'Site B, Industrial Area, Mysuru',
};

export const sampleData: Record<string, FormData> = {
  'work-order': {
    ...indianBusiness,
    ...indianClient,
    orderNumber: `WO-${Date.now().toString().slice(-6)}`,
    orderDate: today,
    expectedStartDate: today,
    expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    currency: '₹',
    orderReceivedBy: 'Rajesh Kumar',
    generalWorkDescription: 'Complete interior painting and finishing for the new office space as per approved design brief.',
    termsOfService: "1. 50% advance payment required to commence work.\n2. All materials used will be as specified in the agreement.\n3. Final payment due upon satisfactory completion of work.",
    
    includeWorkDescriptionTable: true,
    workItems: [
      { description: 'Interior Wall Painting (Two Coats)', area: '1500', rate: '25' },
      { description: 'Ceiling Painting', area: '500', rate: '20' },
      { description: 'Wood Polishing for Doors & Windows', area: '250', rate: '80' },
    ],
    
    includeMaterialTable: true,
    materials: [
      { name: 'Asian Paints Royale Emulsion (20L)', quantity: '5', unit: 'Pcs', pricePerUnit: '7500' },
      { name: 'Nippon Paint Primer (10L)', quantity: '3', unit: 'Pcs', pricePerUnit: '2200' },
    ],
    
    includeLaborTable: true,
    labor: [
      { teamName: 'Skilled Painters Team', numPersons: '4', amount: '12000' },
      { teamName: 'Supervision & Quality Check', numPersons: '1', amount: '3000' },
    ],
    
    otherCosts: 500, // For transportation
    taxRatePercentage: 18,
    approvedByName: 'Anjali Desai (Project Manager)',
    dateOfApproval: today,
  },
  'letterhead': {
    logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iIzBFNEQ4MiIgc3Ryb2tlPSIjMDI4NzY2IiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmaWxsPSJ3aGl0ZSI+QjwvdGV4dD48L3N2Zz4=',
    companyName: 'Bansal & Associates',
    companySlogan: 'Your Trusted Financial Partners',
    companyAddress: '4th Floor, Corporate Towers, MG Road\nGurugram, Haryana 122002',
    companyPhone: '+91 124 456 7890',
    companyEmail: 'info@bansalassociates.co.in',
    companyWebsite: 'www.bansalassociates.co.in',
    date: today,
    recipientName: 'Mr. Vikram Singh',
    recipientAddress: 'Managing Director\nFuture Enterprises Ltd.\nConnaught Place, New Delhi 110001',
    subject: 'Regarding Financial Audit for FY 2023-2024',
    bodyContent: 'Dear Mr. Singh,\n\nFurther to our discussion last week, this letter serves to confirm our engagement for the statutory financial audit of Future Enterprises Ltd. for the fiscal year ending March 31, 2024.\n\nOur team will commence the preliminary work from the first week of next month. We have attached a list of required documents for your reference. We look forward to a successful collaboration.\n\nSincerely,\n\nAnkit Bansal\nSenior Partner',
  },
  'invoice': {
    businessName: 'Creative Goods Co.',
    businessAddress: '12, Artisan Lane, Jaipur\nRajasthan 302012, India',
    businessContact: '+91 99887 76655',
    businessEmail: 'orders@creativegoods.co',
    businessGstNo: '08ABCDE1234F1Z5',
    businessLogo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMjAgMjBoNjB2NjBIMjBaIiBmaWxsPSIjRjBDOEM4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiMzMzMiPkM8L3RleHQ+PC9zdmc+',
    clientName: 'The Heritage Hotel',
    clientAddress: 'Palace Road, Jodhpur\nRajasthan 342001, India',
    clientContact: '+91 291 234 5678',
    clientEmail: 'purchase@heritagejodhpur.com',
    clientGstNo: '08AABBC1234B1Z4',
    invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
    invoiceDate: today,
    currency: '₹',
    includeItemsTable: true,
    items: [
      { description: 'Hand-painted Ceramic Mugs', unit: 'pcs', quantity: '50', unitCost: '450' },
      { description: 'Block-printed Cotton Cushion Covers', unit: 'pcs', quantity: '100', unitCost: '700' },
      { description: 'Brass Decor Piece - Elephant', unit: 'pcs', quantity: '20', unitCost: '1500' },
    ],
    taxPercentage: 12,
    bankName: 'HDFC Bank',
    branchName: 'Jaipur Main Branch',
    accountNo: '50200012345678',
    ifscCode: 'HDFC0000012',
    authorisedSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgODAiPjxwYXRoIGQ9Ik0xMCA3MEM1MCAyMCwgMTMwIDIwLCAxOTAgNzAiIHN0cm9rZT0iIzAwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
  },
  'claim-invoice': {
    businessName: 'Excel Tech Services',
    businessAddress: 'Plot 42, Hinjewadi IT Park\nPune, Maharashtra 411057',
    businessContact: '+91 20 6789 1234',
    businessEmail: 'accounts@exceltech.co.in',
    businessGstNo: '27AAGCE1234A1Z9',
    businessLogo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB4PSIxMCIgeT0iMzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiMwMDdCQiIgc3Ryb2tlPSIjMDA1OTdCIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmnob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyNSIgZm9udC1mYW1pbHk9IlZlcmRhbmEiIGZpbGw9IndoaXRlIj5FVEk8L3RleHQ+PC9zdmc+',
    clientName: 'Global Pharma Inc.',
    clientAddress: 'Pharma Zone, SEZ, Hyderabad\nTelangana 500081, India',
    clientContact: '+91 40 2345 6789',
    clientEmail: 'finance.india@globalpharma.com',
    clientGstNo: '36AABCD1234E1Z2',
    invoiceNumber: `CI-${Date.now().toString().slice(-5)}`,
    invoiceDate: today,
    currency: '₹',
    includeItemsTable: true,
    items: [
      { description: 'On-site Server Maintenance (Jan)', unit: 'Lump Sum', quantity: '1', unitCost: '50000', claimPercentage: '100' },
      { description: 'Software License Renewal - Annual', unit: 'License', quantity: '25', unitCost: '8000', claimPercentage: '100' },
      { description: 'New Hardware Procurement (Laptops)', unit: 'pcs', quantity: '5', unitCost: '85000', claimPercentage: '50' },
    ],
    taxPercentage: 18,
    bankName: 'ICICI Bank',
    branchName: 'Pune IT Park',
    accountNo: '001201001234',
    ifscCode: 'ICIC0000012',
    authorisedSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgODAiPjxwYXRoIGQ9Ik0xMCA3MEM1MCAyMCwgMTMwIDIwLCAxOTAgNzAiIHN0cm9rZT0iIzAwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
  },
};
