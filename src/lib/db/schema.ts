
import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users Table: Stores user authentication data
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 256 }).unique().notNull(),
  email: varchar('email', { length: 256 }).unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Documents Table: Stores metadata for each document
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  templateId: varchar('template_id', { length: 128 }).notNull(),
  name: text('name').notNull().default('Untitled Document'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

// Document Fields Table: Stores the actual form data for each document
export const documentFields = pgTable('document_fields', {
    id: serial('id').primaryKey(),
    documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
    // Using jsonb for flexibility to store any kind of document structure
    fields: jsonb('fields').notNull().default('{}'), 
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type DocumentField = typeof documentFields.$inferSelect;
export type NewDocumentField = typeof documentFields.$inferInsert;

export const insertDocumentFieldSchema = createInsertSchema(documentFields);
export const selectDocumentFieldSchema = createSelectSchema(documentFields);
