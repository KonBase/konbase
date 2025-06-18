import { format, parse } from 'date-fns';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12' | '24';

export const dateFormats: DateFormat[] = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
];
export const timeFormats: TimeFormat[] = ['12', '24'];

export function formatDate(date: Date, formatString: DateFormat): string {
  const formatMap: Record<DateFormat, string> = {
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd',
  };

  return format(date, formatMap[formatString]);
}

export function formatTime(date: Date, formatString: TimeFormat): string {
  const formatMap: Record<TimeFormat, string> = {
    '12': 'h:mm a',
    '24': 'HH:mm',
  };

  return format(date, formatMap[formatString]);
}

export function formatDateTime(
  date: Date,
  dateFormat: DateFormat,
  timeFormat: TimeFormat,
): string {
  return `${formatDate(date, dateFormat)} ${formatTime(date, timeFormat)}`;
}

export function parseDate(dateString: string, formatString: DateFormat): Date {
  const formatMap: Record<DateFormat, string> = {
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd',
  };

  return parse(dateString, formatMap[formatString], new Date());
}

// Hook for date and time formatting preferences
export function useDateTimeFormat() {
  const getDateFormat = (): DateFormat => {
    return (localStorage.getItem('date-format') as DateFormat) || 'MM/DD/YYYY';
  };

  const getTimeFormat = (): TimeFormat => {
    return (localStorage.getItem('time-format') as TimeFormat) || '12';
  };

  const setDateFormat = (format: DateFormat) => {
    localStorage.setItem('date-format', format);
  };

  const setTimeFormat = (format: TimeFormat) => {
    localStorage.setItem('time-format', format);
  };

  return {
    getDateFormat,
    getTimeFormat,
    setDateFormat,
    setTimeFormat,
    formatDate: (date: Date) => formatDate(date, getDateFormat()),
    formatTime: (date: Date) => formatTime(date, getTimeFormat()),
    formatDateTime: (date: Date) =>
      formatDateTime(date, getDateFormat(), getTimeFormat()),
    parseDate: (dateString: string) => parseDate(dateString, getDateFormat()),
  };
}
