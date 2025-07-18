/**
 * Formats a Date object to DD/MM/YYYY string
 */
function formatDate(date) {
  if (!(date instanceof Date)) return date;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Converts DD/MM/YYYY string to Date object
 */
function parseDate(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(year, month - 1, day); // month is 0-indexed
}
