import i18n from '../i18n';

// Map known backend messages to translated UI strings. Unknown messages fall
// back to the raw backend text (never translated user-generated content).
const KNOWN_MESSAGES: Record<string, string> = {
  'Quantity cannot go below zero': 'inventory.negativeError',
  'Scheduled pickup must be in the future': 'scheduled.futureDateError',
  'Cannot schedule food that has already expired': 'scheduled.expiredFoodError',
  'Invalid QR code': 'qr.notFound',
  'QR code has expired': 'qr.notFound',
  'Invalid image file. Only JPEG, PNG, or WebP are allowed': 'recognition.fileTypeError',
  'Image file is too large (max 5MB)': 'recognition.sizeError',
};

export function translateError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const key = KNOWN_MESSAGES[message];
  if (key) return i18n.t(key);
  return message;
}
