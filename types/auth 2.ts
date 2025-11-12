import { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * Extended user type combining Supabase auth user with profile data
 */
export interface User extends SupabaseUser {
  profile?: Profile
}

/**
 * User profile stored in public.profiles table
 * Synced with auth.users via trigger
 * NOTE: Aligns with existing database schema from Phase 1
 */
export interface Profile {
  id: string // UUID, matches auth.users.id
  role: 'client' | 'contractor' | 'admin' | 'manager' | 'staff'
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  email_verified: boolean // Added by auth migration
  created_at: string
  updated_at: string
  last_login_at: string | null // Added by auth migration
}

/**
 * Verification code for email verification or password reset
 */
export interface VerificationCode {
  id: number
  user_id: string
  code: string // 6-digit code
  type: 'email_verification' | 'password_reset'
  attempts: number
  created_at: string
  expires_at: string
}

/**
 * Auth session state
 */
export interface AuthSession {
  user: User | null
  loading: boolean
  error: Error | null
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

/**
 * Signup data
 */
export interface SignupData {
  email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  code: string
  new_password: string
  confirm_password: string
}

/**
 * Auth error types
 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'account_not_verified'
  | 'account_locked'
  | 'rate_limit_exceeded'
  | 'invalid_code'
  | 'code_expired'
  | 'max_attempts_exceeded'
  | 'weak_password'
  | 'email_already_exists'
  | 'unknown_error'

/**
 * Auth error with type
 */
export interface AuthError extends Error {
  type: AuthErrorType
}
