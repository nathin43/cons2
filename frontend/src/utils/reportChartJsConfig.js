export const chartJsBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  animation: {
    duration: 800,
    easing: 'easeInOutQuart',
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 14,
      },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      displayColors: true,
      cornerRadius: 10,
      padding: 10,
      callbacks: {
        label: (context) => `₹ ${Number(context.parsed?.y || context.parsed || 0).toLocaleString('en-IN')}`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#64748b',
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#64748b',
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.2)',
      },
    },
  },
};

export const reportChartThemes = {
  sales: {
    colors: ['#2563eb'],
    gradient: ['rgba(37,99,235,0.2)', 'rgba(37,99,235,0)'],
    borderWidth: 3,
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.2)',
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
    tension: 0.4,
  },
  orders: {
    colors: ['#2563eb'],
    gradient: ['rgba(37,99,235,0.2)', 'rgba(37,99,235,0)'],
    borderWidth: 3,
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.2)',
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
    tension: 0.4,
  },
  payments: {
    colors: ['#2563eb'],
    gradient: ['rgba(37,99,235,0.2)', 'rgba(37,99,235,0)'],
    borderWidth: 3,
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.2)',
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
    tension: 0.4,
  },
  customers: {
    colors: ['#2563eb'],
    gradient: ['rgba(37,99,235,0.2)', 'rgba(37,99,235,0)'],
    borderWidth: 3,
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.2)',
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
    tension: 0.4,
  },
  stock: {
    colors: ['#2563eb'],
    gradient: ['rgba(37,99,235,0.2)', 'rgba(37,99,235,0)'],
    borderWidth: 3,
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.2)',
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
    tension: 0.4,
  },
};
