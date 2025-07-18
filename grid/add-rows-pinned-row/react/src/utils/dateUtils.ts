/**
 * Formats a Date object to DD/MM/YYYY string
 */
export const formatDate = (date: any): string => {
  if (!(date instanceof Date)) return date;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Converts DD/MM/YYYY string to Date object
 */
export const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};