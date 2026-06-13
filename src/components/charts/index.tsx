'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAppStore } from '@/lib/store';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  label?: string;
  height?: number;
}

export function LineChart({ data, xKey, yKey, label = 'Value', height = 300 }: ChartProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const chartData = {
    labels: data.map((item) => item[xKey]),
    datasets: [
      {
        label: label,
        data: data.map((item) => item[yKey]),
        fill: true,
        borderColor: isDark ? '#818cf8' : '#4f46e5',
        backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(79, 70, 229, 0.05)',
        tension: 0.4,
        pointBackgroundColor: isDark ? '#a5b4fc' : '#6366f1',
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f3f4f6' : '#111827',
        bodyColor: isDark ? '#9ca3af' : '#4b5563',
        borderColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(100, 116, 139, 0.08)',
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

export function BarChart({ data, xKey, yKey, label = 'Value', height = 300 }: ChartProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const chartData = {
    labels: data.map((item) => item[xKey]),
    datasets: [
      {
        label: label,
        data: data.map((item) => item[yKey]),
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(79, 70, 229, 0.85)',
        hoverBackgroundColor: isDark ? '#818cf8' : '#6366f1',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f3f4f6' : '#111827',
        bodyColor: isDark ? '#9ca3af' : '#4b5563',
        borderColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(100, 116, 139, 0.08)',
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface DoughnutChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export function DoughnutChart({ data, height = 240 }: DoughnutChartProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const defaultColors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
  ];

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item, idx) => item.color || defaultColors[idx % defaultColors.length]),
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#0f172a' : '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#f3f4f6' : '#111827',
          padding: 15,
          font: { size: 11, weight: 'bold' as const },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f3f4f6' : '#111827',
        bodyColor: isDark ? '#9ca3af' : '#4b5563',
        borderColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
      },
    },
    cutout: '65%',
  };

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
