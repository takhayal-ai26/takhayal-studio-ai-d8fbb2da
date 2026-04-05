import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getOrdinal(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Format a date as "April 3rd, 2026" (English) or Arabic equivalent.
 * Returns "-" for invalid/missing dates.
 */
export function formatDate(input: string | Date | null | undefined, isAr = false): string {
  if (!input) return '-';
  try {
    const date = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(date.getTime())) return '-';

    if (isAr) {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const day = date.getDate();
    return `${months[date.getMonth()]} ${day}${getOrdinal(day)}, ${date.getFullYear()}`;
  } catch {
    return '-';
  }
}
