import { useMemo } from 'react';

interface SparklineChartProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export default function SparklineChart({ data, isPositive, width = 120, height = 40 }: SparklineChartProps) {
  const pathD = useMemo(() => {
    if (!data || data.length === 0) return '';

    const samples = data.length > 50 ? data.filter((_, i) => i % Math.ceil(data.length / 50) === 0) : data;
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const range = max - min || 1;

    const points = samples.map((val, i) => {
      const x = (i / (samples.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const gradientId = useMemo(() => `sparkline-${Math.random().toString(36).slice(2)}`, []);
  const color = isPositive ? '#10b981' : '#ef4444';

  if (!pathD) return null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={pathD + ` L ${width},${height} L 0,${height} Z`}
        fill={`url(#${gradientId})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
