import { z } from 'zod'

/**
 * Password validation schema
 * Requirements: minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Le mot de passe doit contenir au moins un caractère spécial'
  )

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Adresse email invalide')
  .toLowerCase()
  .trim()

/**
 * Name validation schema (for first_name and last_name)
 */
export const nameSchema = z
  .string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')
  .trim()

/**
 * Signup form validation schema
 */
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    first_name: nameSchema,
    last_name: nameSchema,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  })

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
  remember_me: z.boolean().optional(),
})

/**
 * Verification code validation schema
 */
export const verificationCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Le code doit contenir exactement 6 chiffres')
    .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres'),
})

/**
 * Password reset request validation schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

/**
 * Password reset validation schema
 */
export const passwordResetSchema = z
  .object({
    code: z
      .string()
      .length(6, 'Le code doit contenir exactement 6 chiffres')
      .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres'),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  })

/**
 * Type exports for form data
 */
export type SignupFormData = z.infer<typeof signupSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type VerificationCodeData = z.infer<typeof verificationCodeSchema>
export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetData = z.infer<typeof passwordResetSchema>
