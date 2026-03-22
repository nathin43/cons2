import { getRangeDates } from './reportRange';

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const filterByDateRange = (
  allData = [],
  selectedRange = 'monthly',
  dateField = 'createdAt',
  dateFrom,
  dateTo
) => {
  const fallbackRange = getRangeDates(selectedRange);
  const fromDate = toDate(dateFrom) || fallbackRange.from;
  const toDateValue = toDate(dateTo) || fallbackRange.to;

  return allData.filter((item) => {
    const itemDate = toDate(item?.[dateField]);
    if (!itemDate) return false;
    return itemDate >= fromDate && itemDate <= toDateValue;
  });
};

export const emitReportDataChanged = (detail = {}) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('report:data-changed', {
      detail: {
        ...detail,
        updatedAt: Date.now(),
      },
    })
  );
};
