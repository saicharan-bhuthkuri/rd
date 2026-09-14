/**
 * Formats phone numbers for clean, professional display.
 * Handles:
 * - 919347738882 -> +91 93477 38882
 * - 9347738882 -> +91 93477 38882
 * - 09347738882 -> +91 93477 38882
 * - +919347738882 -> +91 93477 38882
 * - +91 9347738882 -> +91 93477 38882
 */
export function formatDisplayPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const trimmed = String(phone).trim();
  const digits = trimmed.replace(/\D/g, '');

  // 12 digits starting with 91 (e.g. 919347738882)
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  // 10 digits Indian mobile (e.g. 9347738882)
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // 11 digits starting with 0 (e.g. 09347738882)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91 ${digits.slice(1, 6)} ${digits.slice(6)}`;
  }

  // If already starts with +91 (e.g. +91 9347738882 or +91-9347738882)
  if (trimmed.startsWith('+91')) {
    const rest = trimmed.replace(/^\+91[\s-]*/, '').replace(/\D/g, '');
    if (rest.length === 10) {
      return `+91 ${rest.slice(0, 5)} ${rest.slice(5)}`;
    }
  }

  // Other country codes starting with +
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  // Fallback: if 10 or more digits, prefix with +91
  if (digits.length >= 10) {
    return `+91 ${digits}`;
  }

  return trimmed;
}

/**
 * Splits phone number into country code and local formatted number
 */
export function getPhoneParts(phone: string | undefined | null): { countryCode: string; localNumber: string } {
  const formatted = formatDisplayPhone(phone);
  if (!formatted) return { countryCode: '+91', localNumber: '' };
  
  if (formatted.startsWith('+')) {
    const spaceIndex = formatted.indexOf(' ');
    if (spaceIndex !== -1) {
      return {
        countryCode: formatted.slice(0, spaceIndex),
        localNumber: formatted.slice(spaceIndex + 1)
      };
    }
  }
  
  return { countryCode: '+91', localNumber: formatted };
}
