export function extractPhoneNumbers(input: string): string[] {
  if (!input) return [];

  // Match pattern for:
  // 1. +84xxxxxxxxx or +84 xxxxxxxxx
  // 2. 0xxxxxxxxx or 0xxxxxxxxx
  // 3. 9xxxxxxxxx (missing leading 0)
  const regex = /(?:\+84\d{9,10}|84\d{9,10}|0\d{9,10}|\b[35789]\d{8}\b)/g;
  const matches = input.match(regex) || [];

  const normalized = matches.map(match => {
    const cleaned = match.replace(/\s+/g, '');
    if (cleaned.startsWith('+84')) {
      return cleaned;
    }
    if (cleaned.startsWith('84') && cleaned.length >= 11) {
      return '+' + cleaned;
    }
    if (cleaned.length === 9 && ['3', '5', '7', '8', '9'].includes(cleaned[0])) {
      return '0' + cleaned;
    }
    return cleaned;
  });

  return Array.from(new Set(normalized));
}

export function extractPrimaryPhoneNumber(input: string): string | null {
  const list = extractPhoneNumbers(input);
  return list.length > 0 ? list[0] : null;
}

export function extractAllPhoneNumbers(input: string): string | null {
  const list = extractPhoneNumbers(input);
  return list.length > 0 ? list.join(', ') : null;
}
