/**
 * Input Sanitization Utility
 * Prevents Basic XSS/Injection by escaping special characters.
 */
export const sanitizeInput = (input: string | undefined | null): string => {
  if (!input) return '';
  // Basic HTML entity encoding
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Validates strictly alphanumeric IDs (for Record IDs)
 */
export const isValidRecordId = (id: string): boolean => {
  const regex = /^[a-zA-Z0-9-_]+$/;
  return regex.test(id);
};

/**
 * Mask sensitive data for logs (e.g. email)
 */
export const maskData = (data: string): string => {
  if (!data) return '';
  if (data.includes('@')) {
    const [user, domain] = data.split('@');
    return `${user.substring(0, 2)}***@${domain}`;
  }
  return `${data.substring(0, 2)}***`;
};