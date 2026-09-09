import { z } from 'zod';

const emailSchema = z
  .string()
  .min(3, 'Enter your email address.')
  .max(320, 'Email must be 320 characters or fewer.')
  .email('Enter a valid email address.');

const registrationPasswordSchema = z
  .string()
  .min(15, 'Password must be at least 15 characters.')
  .max(1024, 'Password must be 1024 characters or fewer.');

export const createAccountSchema = z
  .object({
    displayName: z
      .string()
      .min(1, 'Enter your full name.')
      .max(160, 'Full name must be 160 characters or fewer.'),
    email: emailSchema,
    password: registrationPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Enter your password.')
    .max(1024, 'Password must be 1024 characters or fewer.'),
});

export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the six-digit verification code.'),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: registrationPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  });

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export type CreateAccountIntent = {
  displayName: string;
  email: string;
  password: string;
};
export type SignInIntent = SignInFormValues;
export type VerifyEmailIntent = VerifyEmailFormValues;
export type ForgotPasswordIntent = ForgotPasswordFormValues;
export type ResetPasswordIntent = { newPassword: string };
