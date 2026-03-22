const ReportChartTooltip = ({ active, payload, label, seriesLabel = 'Value', valuePrefix = '', valueSuffix = '' }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const hasMultipleSeries = payload.length > 1;

  const formatValue = (rawValue) => {
    const formattedValue = Number(rawValue || 0).toLocaleString('en-IN');
    return valuePrefix ? `${valuePrefix} ${formattedValue}${valueSuffix}` : `${formattedValue}${valueSuffix}`;
  };

  if (hasMultipleSeries) {
    return (
      <div className="report-chart-tooltip">
        <p className="report-chart-tooltip__label">{label}</p>
        {payload.map((entry, index) => (
          <p key={`${entry.name || 'series'}-${index}`} className="report-chart-tooltip__value">
            <span
              className="report-chart-tooltip__dot"
              style={{ backgroundColor: entry.color || '#2563eb' }}
            />
            {entry.name || seriesLabel}: {formatValue(entry.value)}
          </p>
        ))}
      </div>
    );
  }

  const point = payload[0]?.value ?? 0;
  const valueText = formatValue(point);

  return (
    <div className="report-chart-tooltip">
      <p className="report-chart-tooltip__value">
        {label} {'->'} {valueText} {seriesLabel}
      </p>
    </div>
  );
};

export default ReportChartTooltip;
