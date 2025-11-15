/**
 * Zod Validation Schemas for Contractor Job Application
 * Feature: 007-contractor-interface
 * 
 * Multi-step form validation for contractor onboarding process
 */

import { z } from 'zod'

// ============================================================================
// Step 1: Personal Information
// ============================================================================

export const PersonalInfoSchema = z.object({
  first_name: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),

  last_name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

  email: z.string()
    .email('Adresse email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),

  phone: z.string()
    .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Numéro de téléphone invalide (format: 0612345678 ou +33612345678)')
    .max(20),

  contractor_type: z.enum(['société', 'personnel'], {
    message: 'Veuillez sélectionner le type de structure'
  }).optional(),

  street_address: z.string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional(),

  city: z.string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(100, 'La ville ne peut pas dépasser 100 caractères')
    .optional(),

  postal_code: z.string()
    .regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)')
    .optional(),

  country: z.string()
    .min(2, 'Le pays doit contenir au moins 2 caractères')
    .max(100, 'Le pays ne peut pas dépasser 100 caractères')
    .default('France'),
})

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>

// ============================================================================
// Step 2: Professional Profile
// ============================================================================

export const ProfessionalProfileSchema = z.object({
  profession: z.enum(['massage', 'beauty', 'hair', 'health', 'other'], {
    message: 'Veuillez sélectionner une profession'
  }),
  
  years_of_experience: z.number()
    .int('L\'expérience doit être un nombre entier')
    .min(0, 'L\'expérience ne peut pas être négative')
    .max(50, 'L\'expérience ne peut pas dépasser 50 ans'),
  
  diplomas: z.string()
    .max(1000, 'La description des diplômes ne peut pas dépasser 1000 caractères')
    .optional(),
  
  specialties: z.array(z.number())
    .min(1, 'Sélectionnez au moins une spécialité')
    .max(10, 'Vous ne pouvez pas sélectionner plus de 10 spécialités'),
  
  services_offered: z.string()
    .min(10, 'Décrivez vos services (minimum 10 caractères)')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères'),
})

export type ProfessionalProfile = z.infer<typeof ProfessionalProfileSchema>

// ============================================================================
// Step 3: Availability & Geographic Zones
// ============================================================================

// Time slot schema (HH:mm format)
const TimeSlotSchema = z.object({
  start: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:mm, ex: 09:00)')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    }, 'Heure invalide'),
  end: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:mm, ex: 17:00)')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    }, 'Heure invalide'),
}).refine((slot) => {
  const [startH, startM] = slot.start.split(':').map(Number)
  const [endH, endM] = slot.end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return endMinutes > startMinutes
}, {
  message: 'L\'heure de fin doit être après l\'heure de début'
})

// Day availability schema
const DayAvailabilitySchema = z.object({
  available: z.boolean(),
  shifts: z.array(TimeSlotSchema)
    .min(1, 'Au moins un créneau est requis si vous êtes disponible')
    .max(5, 'Maximum 5 créneaux par jour'),
  breaks: z.array(TimeSlotSchema)
    .max(3, 'Maximum 3 pauses par jour')
    .optional(),
})

// Weekly availability schema
const WeeklyAvailabilitySchema = z.object({
  monday: DayAvailabilitySchema.optional(),
  tuesday: DayAvailabilitySchema.optional(),
  wednesday: DayAvailabilitySchema.optional(),
  thursday: DayAvailabilitySchema.optional(),
  friday: DayAvailabilitySchema.optional(),
  saturday: DayAvailabilitySchema.optional(),
  sunday: DayAvailabilitySchema.optional(),
}).optional()

export const AvailabilitySchema = z.object({
  geographic_zones: z.array(z.string())
    .min(1, 'Sélectionnez au moins une zone géographique')
    .max(20, 'Vous ne pouvez pas sélectionner plus de 20 zones'),

  weekly_availability: WeeklyAvailabilitySchema,

  work_frequency: z.enum(['full_time', 'part_time', 'occasional'], {
    message: 'Veuillez sélectionner une fréquence de travail'
  }),
})

export type Availability = z.infer<typeof AvailabilitySchema>
export type TimeSlot = z.infer<typeof TimeSlotSchema>
export type DayAvailability = z.infer<typeof DayAvailabilitySchema>
export type WeeklyAvailability = z.infer<typeof WeeklyAvailabilitySchema>

// ============================================================================
// Step 4: Motivation
// ============================================================================

export const MotivationSchema = z.object({
  motivation: z.string()
    .min(100, 'Votre motivation doit contenir au moins 100 caractères si vous la fournissez')
    .max(2000, 'Votre motivation ne peut pas dépasser 2000 caractères')
    .optional(),
})

export type Motivation = z.infer<typeof MotivationSchema>

// ============================================================================
// Step 5: Documents (Optional)
// ============================================================================

export const DocumentsSchema = z.object({
  cv_file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Le CV ne peut pas dépasser 5MB')
    .refine(
      (file) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'Format accepté: PDF, DOC, DOCX'
    )
    .optional(),
  
  certifications_files: z.array(z.instanceof(File))
    .refine((files) => files.every(f => f.size <= 5 * 1024 * 1024), 'Chaque fichier ne peut pas dépasser 5MB')
    .refine(
      (files) => files.every(f => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)),
      'Formats acceptés: PDF, DOC, DOCX'
    )
    .optional(),
  
  portfolio_files: z.array(z.instanceof(File))
    .refine((files) => files.every(f => f.size <= 5 * 1024 * 1024), 'Chaque image ne peut pas dépasser 5MB')
    .refine(
      (files) => files.every(f => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)),
      'Formats acceptés: JPG, PNG, WEBP'
    )
    .optional(),
})

export type Documents = z.infer<typeof DocumentsSchema>

// ============================================================================
// Complete Application Schema (all steps combined)
// ============================================================================

export const CompleteApplicationSchema = PersonalInfoSchema
  .merge(ProfessionalProfileSchema)
  .merge(AvailabilitySchema)
  .merge(MotivationSchema)
  .merge(DocumentsSchema)

export type CompleteApplication = z.infer<typeof CompleteApplicationSchema>

// ============================================================================
// Helper: Validate single step
// ============================================================================

export function validateStep(step: number, data: Partial<CompleteApplication>) {
  switch (step) {
    case 1:
      return PersonalInfoSchema.safeParse(data)
    case 2:
      return ProfessionalProfileSchema.safeParse(data)
    case 3:
      return AvailabilitySchema.safeParse(data)
    case 4:
      return MotivationSchema.safeParse(data)
    case 5:
      return DocumentsSchema.safeParse(data)
    default:
      throw new Error(`Invalid step: ${step}`)
  }
}
