const toDateOnlyKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toMonthKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const toHourKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  return `${y}-${m}-${day}-${h}`;
};

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const weekday = d.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + diffToMonday);
  return d;
};

export const bucketKeyForDate = (date, range) => {
  if (!date) return '';
  if (range === 'daily') return toHourKey(date);
  if (range === 'yearly') return toMonthKey(date);
  return toDateOnlyKey(date);
};

export const getTimelinePoints = (range = 'monthly', dateFrom, dateTo) => {
  const now = new Date();
  const from = dateFrom ? new Date(dateFrom) : null;
  const to = dateTo ? new Date(dateTo) : null;

  if (range === 'daily') {
    const base = from || now;
    const points = [];
    for (let hour = 0; hour < 24; hour += 1) {
      const d = new Date(base);
      d.setHours(hour, 0, 0, 0);
      points.push({
        key: bucketKeyForDate(d, range),
        label: String(hour + 1),
        date: d,
      });
    }
    return points;
  }

  if (range === 'weekly') {
    const start = startOfWeekMonday(from || now);
    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const points = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      points.push({
        key: bucketKeyForDate(d, range),
        label: weekLabels[i],
        date: d,
      });
    }
    return points;
  }

  if (range === 'yearly') {
    const year = (from || now).getFullYear();
    const points = [];
    for (let month = 0; month < 12; month += 1) {
      const d = new Date(year, month, 1);
      points.push({
        key: bucketKeyForDate(d, range),
        label: d.toLocaleDateString('en-IN', { month: 'short' }),
        date: d,
      });
    }
    return points;
  }

  const base = from || now;
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const points = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day);
    points.push({
      key: bucketKeyForDate(d, 'monthly'),
      label: String(day),
      date: d,
    });
  }
  return points;
};

export const mapSeriesToTimeline = (timeline, source, { getBucketKey, getValue }) => {
  const valuesByKey = new Map();

  (source || []).forEach((item) => {
    const bucket = getBucketKey(item);
    if (!bucket) return;
    const value = Number(getValue(item) || 0);
    valuesByKey.set(bucket, (valuesByKey.get(bucket) || 0) + value);
  });

  return timeline.map((point) => ({
    ...point,
    value: Number((valuesByKey.get(point.key) || 0).toFixed(2)),
  }));
};

export const hasAnyNonZero = (series = []) => {
  return series.some((point) => Number(point.value || 0) > 0);
};

export const buildZeroSeriesForRange = (
  range = 'monthly',
  dateFrom,
  dateTo,
  fallbackCount = 5
) => {
  const timeline = getTimelinePoints(range, dateFrom, dateTo);
  if (timeline.length > 0) {
    return timeline.map((point) => ({
      label: point.label,
      value: 0,
    }));
  }

  return Array.from({ length: fallbackCount }, (_, index) => ({
    label: String(index + 1),
    value: 0,
  }));
};
