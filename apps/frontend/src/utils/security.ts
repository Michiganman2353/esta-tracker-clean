/**
 * Security utilities for input validation and sanitization
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags - repeated to handle nested tags
  let sanitized = input;
  let previousLength = 0;
  
  // Repeat removal until no more tags are found
  while (sanitized.length !== previousLength) {
    previousLength = sanitized.length;
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Escape dangerous characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Additional checks
  if (email.length > 254) return false; // Max email length
  if (email.includes('..')) return false; // No consecutive dots
  
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { 
  valid: boolean; 
  message?: string;
  strength: 'weak' | 'medium' | 'strong';
} {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required', strength: 'weak' };
  }
  
  if (password.length < 8) {
    return { 
      valid: false, 
      message: 'Password must be at least 8 characters long',
      strength: 'weak'
    };
  }
  
  if (password.length > 128) {
    return { 
      valid: false, 
      message: 'Password is too long (max 128 characters)',
      strength: 'weak'
    };
  }
  
  // Check for common patterns
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strengthScore >= 3 && password.length >= 12) {
    strength = 'strong';
  } else if (strengthScore >= 2 && password.length >= 8) {
    strength = 'medium';
  }
  
  if (!hasUpperCase && !hasLowerCase && !hasNumbers) {
    return { 
      valid: false, 
      message: 'Password must contain letters or numbers',
      strength: 'weak'
    };
  }
  
  return { valid: true, strength };
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newline and tab
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Validate tenant code format
 */
export function isValidTenantCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  // Tenant codes should be alphanumeric, 6-12 characters
  const codeRegex = /^[A-Z0-9]{6,12}$/;
  return codeRegex.test(code.toUpperCase());
}

/**
 * Sanitize file name to prevent directory traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return 'file';
  
  // Remove path separators and dangerous characters
  let sanitized = fileName
    .replace(/[/\\]/g, '_')
    .replace(/\.\./g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"|?*\x00-\x1F]/g, '_')
    .trim();
  
  // Ensure it's not empty after sanitization
  if (!sanitized) sanitized = 'file';
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const nameWithoutExt = sanitized.slice(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.slice(0, 250) + '.' + ext;
  }
  
  return sanitized;
}

/**
 * Validate phone number format (US)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits)
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
}

/**
 * Rate limiting helper using localStorage
 * Returns true if action is allowed, false if rate limited
 */
export function checkRateLimit(
  action: string, 
  maxAttempts: number = 5, 
  windowMs: number = 60000
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const key = `rateLimit_${action}`;
  const now = Date.now();
  
  try {
    const stored = localStorage.getItem(key);
    let data = stored ? JSON.parse(stored) : { attempts: 0, resetTime: now + windowMs };
    
    // Reset if window has passed
    if (now > data.resetTime) {
      data = { attempts: 0, resetTime: now + windowMs };
    }
    
    // Check if rate limited
    if (data.attempts >= maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: data.resetTime
      };
    }
    
    // Increment attempts
    data.attempts += 1;
    localStorage.setItem(key, JSON.stringify(data));
    
    return {
      allowed: true,
      remainingAttempts: maxAttempts - data.attempts,
      resetTime: data.resetTime
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow the action if localStorage fails
    return { allowed: true, remainingAttempts: maxAttempts, resetTime: now + windowMs };
  }
}

/**
 * Clear rate limit for an action
 */
export function clearRateLimit(action: string): void {
  try {
    localStorage.removeItem(`rateLimit_${action}`);
  } catch (error) {
    console.error('Failed to clear rate limit:', error);
  }
}

/**
 * Validate numeric input
 */
export function isValidNumber(
  value: string | number, 
  min?: number, 
  max?: number
): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
}

/**
 * Sanitize object for logging (remove sensitive data)
 */
export function sanitizeForLogging(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = [
    'password', 
    'token', 
    'secret', 
    'apiKey', 
    'accessToken',
    'refreshToken',
    'ssn',
    'creditCard'
  ];
  
  const sanitized = { ...(obj as Record<string, unknown>) };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}
