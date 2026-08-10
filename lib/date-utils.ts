/**
 * Utility helper functions for UTC+7 (Asia/Ho_Chi_Minh) timezone formatting
 */

export function getUTC7Timestamp(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value || '2026';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  let hour = parts.find(p => p.type === 'hour')?.value || '00';
  if (hour === '24') hour = '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function getUTC7Date(date: Date = new Date()): string {
  return getUTC7Timestamp(date).split(' ')[0];
}
