
import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
  boolean,
  numeric,
  date,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===== CORE TABLES =====

// Users Table: Stores user authentication data
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 256 }).unique().notNull(),
  email: varchar('email', { length: 256 }).unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Documents Table: Stores metadata for each document
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  templateId: varchar('template_id', { length: 128 }).notNull(),
  name: text('name').notNull().default('Untitled Document'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);


// ===== TEMPLATE-SPECIFIC TABLES =====

// --- Work Order Schema ---
export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Business Details
  businessName: text('business_name'),
  businessAddress: text('business_address'),
  businessContactNumber: text('business_contact_number'),
  businessEmail: text('business_email'),
  businessLogoUrl: text('business_logo_url'),

  // Order Details
  orderNumber: text('order_number'),
  orderDate: date('order_date'),
  expectedStartDate: date('expected_start_date'),
  expectedEndDate: date('expected_end_date'),
  currency: text('currency').default('₹'),

  // Client Details
  clientName: text('client_name'),
  clientPhone: text('client_phone'),
  clientEmail: text('client_email'),
  workLocation: text('work_location'),
  orderReceivedBy: text('order_received_by'),

  // Work Specifics
  generalWorkDescription: text('general_work_description'),
  termsOfService: text('terms_of_service'),
  otherCosts: numeric('other_costs'),
  taxRatePercentage: numeric('tax_rate_percentage'),
  approvedByName: text('approved_by_name'),
  dateOfApproval: date('date_of_approval'),

  // Dynamic Item Sections (JSONB)
  includeWorkDescriptionTable: boolean('include_work_description_table').default(true),
  workItems: jsonb('work_items'), // e.g., [{ description, area, rate }]

  includeMaterialTable: boolean('include_material_table').default(true),
  materials: jsonb('materials'), // e.g., [{ name, quantity, unit, pricePerUnit }]

  includeLaborTable: boolean('include_labor_table').default(true),
  labor: jsonb('labor'), // e.g., [{ teamName, numPersons, amount }]
});

export const insertWorkOrderSchema = createInsertSchema(workOrders);
export const selectWorkOrderSchema = createSelectSchema(workOrders);

// --- Letterhead Schema ---
export const letterheads = pgTable('letterheads', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull().unique(),
  logoUrl: text('logo_url'),
  companyName: text('company_name'),
  companySlogan: text('company_slogan'),
  companyAddress: text('company_address'),
  companyPhone: text('company_phone'),
  companyEmail: text('company_email'),
  companyWebsite: text('company_website'),
  date: date('date'),
  recipientName: text('recipient_name'),
  recipientAddress: text('recipient_address'),
  subject: text('subject'),
  bodyContent: text('body_content'),
});

export const insertLetterheadSchema = createInsertSchema(letterheads);
export const selectLetterheadSchema = createSelectSchema(letterheads);

// --- Invoice Schema (Shared fields for Standard and Claim) ---
const invoiceBase = {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull().unique(),

  // Business Details
  businessName: text('business_name'),
  businessAddress: text('business_address'),
  businessContact: text('business_contact'),
  businessEmail: text('business_email'),
  businessGstNo: text('business_gst_no'),
  businessLogo: text('business_logo_url'),

  // Client Details
  clientName: text('client_name'),
  clientAddress: text('client_address'),
  clientContact: text('client_contact'),
  clientEmail: text('client_email'),
  clientGstNo: text('client_gst_no'),

  // Invoice Info
  invoiceNumber: text('invoice_number'),
  invoiceDate: date('invoice_date'),
  currency: text('currency').default('₹'),
  
  // Items
  includeItemsTable: boolean('include_items_table').default(true),
  items: jsonb('items').notNull(), // e.g., [{ description, unit, quantity, unitCost, (claimPercentage) }]

  // Calculation & Bank
  taxPercentage: numeric('tax_percentage'),
  bankName: text('bank_name'),
  branchName: text('branch_name'),
  accountNo: text('account_no'),
  ifscCode: text('ifsc_code'),
  
  // Signature
  authorisedSignature: text('authorised_signature_url'),
};

// --- Standard Invoice Table ---
export const invoices = pgTable('invoices', {
  ...invoiceBase,
});

export const insertInvoiceSchema = createInsertSchema(invoices, {
  // Make items JSONB schema more specific if needed
  items: z.array(z.object({
    description: z.string(),
    unit: z.string(),
    quantity: z.number(),
    unitCost: z.number(),
  })),
});
export const selectInvoiceSchema = createSelectSchema(invoices);


// --- Claim Invoice Table (identical structure for this app, but separate for future extension) ---
export const claimInvoices = pgTable('claim_invoices', {
  ...invoiceBase,
});

export const insertClaimInvoiceSchema = createInsertSchema(claimInvoices, {
  // Claim invoice items require claimPercentage
  items: z.array(z.object({
    description: z.string(),
    unit: z.string(),
    quantity: z.number(),
    unitCost: z.number(),
    claimPercentage: z.number().optional(),
  })),
});
export const selectClaimInvoiceSchema = createSelectSchema(claimInvoices);
