/**
 * Formatting Utilities
 * 
 * Functions for formatting data for display
 */

/**
 * Format hours as human-readable string
 * @param hours - Number of hours
 * @param showDecimals - Whether to show decimal places
 * @returns Formatted string (e.g., "8 hours", "8.5 hours")
 */
export function formatHours(hours: number, showDecimals: boolean = true): string {
  const formatted = showDecimals ? hours.toFixed(1) : Math.round(hours).toString();
  return `${formatted} ${hours === 1 ? 'hour' : 'hours'}`;
}

/**
 * Format a name (First Last)
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

/**
 * Format currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Format initials from name
 */
export function formatInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Format employee status
 */
export function formatEmployeeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * Format request status with emoji
 */
export function formatRequestStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '🕐 Pending',
    approved: '✅ Approved',
    denied: '❌ Denied',
    cancelled: '⚠️ Cancelled',
  };
  
  return statusMap[status] || status;
}
