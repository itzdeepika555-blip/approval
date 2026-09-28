import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  phone: z.string().optional(),
  mobileNumber: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  companyName: z.string().optional(),
  panNumber: z.string().optional(),
  // Public signups cannot specify role, but if sent, it must only be CITIZEN
  role: z.enum(['CITIZEN']).optional().default('CITIZEN'),
}).refine(data => data.phone || data.mobileNumber, {
  message: 'Mobile phone number is required',
  path: ['phone'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
