// Display formatting shared by every stage. Each Intl formatter is created once and reused,
// because creating one is much slower than using one.

const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const monthLong = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** '2026-03' -> 'Mar 26' */
export const formatMonth = (month: string) => monthShort.format(new Date(`${month}-01T00:00:00Z`));
/** '2026-03' -> 'March 2026' */
export const formatMonthLong = (month: string) => monthLong.format(new Date(`${month}-01T00:00:00Z`));

const integer = new Intl.NumberFormat('en-US');
const currencyCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const currencyWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const currencyCompact = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

/** 1234 -> '1,234' */
export const formatInteger = (value: number) => integer.format(value);
/** 814.7133 -> '$814.71' */
export const formatCurrencyCents = (value: number) => currencyCents.format(value);
/** 75768.34 -> '$75,768' */
export const formatCurrency = (value: number) => currencyWhole.format(value);
/** 6200000 -> '$6.2M' */
export const formatCurrencyCompact = (value: number) => currencyCompact.format(value);
