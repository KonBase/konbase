import { z } from 'zod';

// Authentication schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  totpCode: z.string().optional(),
});

export const signUpSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Association schemas
export const associationSchema = z.object({
  name: z.string().min(1, 'Association name is required').max(255),
  description: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const associationMemberSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum([
    'super_admin',
    'system_admin',
    'admin',
    'manager',
    'member',
    'guest',
  ]),
});

// Profile schemas
export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(255),
  lastName: z.string().min(1, 'Last name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

export const twoFactorSetupSchema = z.object({
  totpCode: z.string().length(6, 'TOTP code must be 6 digits'),
});

// Inventory schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(255),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'broken']),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().positive().optional(),
  warrantyExpires: z.string().optional(),
  notes: z.string().optional(),
});

export const equipmentSetSchema = z.object({
  name: z.string().min(1, 'Equipment set name is required').max(255),
  description: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      quantity: z.number().positive().min(1),
    })
  ),
});

// Convention schemas
export const conventionSchema = z
  .object({
    name: z.string().min(1, 'Convention name is required').max(255),
    description: z.string().optional(),
    startDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: 'Invalid start date',
    }),
    endDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: 'Invalid end date',
    }),
    location: z.string().optional(),
    status: z
      .enum(['planning', 'active', 'completed', 'cancelled'])
      .default('planning'),
  })
  .refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const conventionMemberSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'participant', 'guest']),
});

export const conventionEquipmentSchema = z.object({
  itemId: z.string().uuid(),
  quantityRequested: z.number().positive().min(1),
  notes: z.string().optional(),
});

// Document schemas
export const documentUploadSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(255),
  description: z.string().optional(),
  itemId: z.string().uuid().optional(),
  conventionId: z.string().uuid().optional(),
});

// Notification schemas
export const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  userId: z.string().uuid(),
});

// Chat schemas
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const itemFilterSchema = searchSchema.extend({
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'broken']).optional(),
});

export const conventionFilterSchema = searchSchema.extend({
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any().refine(file => file instanceof File, 'Invalid file'),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z
    .array(z.string())
    .default(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
});

// Type exports for form components
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type AssociationFormData = z.infer<typeof associationSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type ItemFormData = z.infer<typeof itemSchema>;
export type EquipmentSetFormData = z.infer<typeof equipmentSetSchema>;
export type ConventionFormData = z.infer<typeof conventionSchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type ItemFilterFormData = z.infer<typeof itemFilterSchema>;
export type ConventionFilterFormData = z.infer<typeof conventionFilterSchema>;
