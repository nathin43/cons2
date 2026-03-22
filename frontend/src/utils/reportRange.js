export const REPORT_RANGE_OPTIONS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' },
];

export const getRangeTitle = (range = 'monthly') => {
  const map = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };
  return map[range] || 'Monthly';
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
};

const endOfWeek = (date) => {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfDay(end);
};

export const getRangeDates = (range = 'monthly', anchorDate = new Date()) => {
  const now = new Date(anchorDate);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (range) {
    case 'daily':
      return { from: todayStart, to: todayEnd };
    case 'weekly': {
      return { from: startOfWeek(now), to: endOfWeek(now) };
    }
    case 'yearly': {
      const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { from, to };
    }
    case 'monthly':
    default: {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
  }
};

export const shiftRangeAnchor = (range = 'monthly', anchorDate = new Date(), direction = 1) => {
  const next = new Date(anchorDate);
  const step = direction >= 0 ? 1 : -1;

  switch (range) {
    case 'daily':
      next.setDate(next.getDate() + step);
      break;
    case 'weekly':
      next.setDate(next.getDate() + step * 7);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + step);
      break;
    case 'monthly':
    default:
      next.setMonth(next.getMonth() + step);
      break;
  }

  return next;
};

export const getRangePeriodLabel = (range = 'monthly', anchorDate = new Date()) => {
  const anchor = new Date(anchorDate);

  if (range === 'daily') {
    return anchor.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (range === 'weekly') {
    const { from, to } = getRangeDates('weekly', anchor);
    const fromLabel = from.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const toLabel = to.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return `${fromLabel} - ${toLabel}`;
  }

  if (range === 'yearly') {
    return String(anchor.getFullYear());
  }

  return anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export const formatDateInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateLabel = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};
