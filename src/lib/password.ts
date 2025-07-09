import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password - The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - The plain text password
 * @param hashedPassword - The hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 * @param password - The password to validate
 * @returns Object with isValid boolean and array of error messages
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random token for email verification or password reset
 * @returns A random token string
 */
export function generateToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Server-side
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate token expiry time (default 1 hour)
 * @param hours - Number of hours until expiry (default 1)
 * @returns Date object representing expiry time
 */
export function generateTokenExpiry(hours: number = 1): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}