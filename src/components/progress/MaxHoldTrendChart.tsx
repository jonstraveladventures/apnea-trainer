import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Session } from '../../types';
import { formatTime } from '../../utils/trainingLogic';

interface MaxHoldTrendChartProps {
  sessions: Session[];
}

const MaxHoldTrendChart: React.FC<MaxHoldTrendChartProps> = ({ sessions }) => {
  const dataPoints = sessions
    .filter(s => s.actualMaxHold && s.actualMaxHold > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (dataPoints.length < 2) {
    return (
      <div className="bg-white dark:bg-deep-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-ocean-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Max Hold Trend</h3>
        </div>
        <div className="flex items-center justify-center h-40 text-gray-400 dark:text-deep-500 text-sm">
          Not enough data — complete at least 2 sessions with max hold times
        </div>
      </div>
    );
  }

  const holds = dataPoints.map(s => s.actualMaxHold as number);
  const minHold = Math.min(...holds);
  const maxHold = Math.max(...holds);
  const range = maxHold - minHold || 1; // avoid division by zero

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 600;
  const height = 200;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = dataPoints.map((s, i) => ({
    x: padding.left + (i / (dataPoints.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((s.actualMaxHold as number) - minHold) / range * chartHeight,
    hold: s.actualMaxHold as number,
    date: s.date,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = minHold + (range * i) / 4;
    const y = padding.top + chartHeight - (i / 4) * chartHeight;
    return { value: Math.round(value), y };
  });

  // X-axis labels (show up to 6 evenly spaced)
  const xLabelCount = Math.min(6, dataPoints.length);
  const xTicks = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (dataPoints.length - 1));
    return {
      x: points[idx].x,
      label: new Date(dataPoints[idx].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  return (
    <div className="bg-white dark:bg-deep-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-ocean-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Max Hold Trend</h3>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick.value}
            x1={padding.left}
            y1={tick.y}
            x2={width - padding.right}
            y2={tick.y}
            className="stroke-gray-200 dark:stroke-deep-700"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={`label-${tick.value}`}
            x={padding.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            className="fill-gray-400 dark:fill-deep-500"
            fontSize="10"
          >
            {formatTime(tick.value)}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <text
            key={`x-${i}`}
            x={tick.x}
            y={height - 8}
            textAnchor="middle"
            className="fill-gray-400 dark:fill-deep-500"
            fontSize="10"
          >
            {tick.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#oceanGradient)" opacity="0.2" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#0ea5e9" stroke="white" strokeWidth="2">
            <title>{`${new Date(p.date).toLocaleDateString()}: ${formatTime(p.hold)}`}</title>
          </circle>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="oceanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default MaxHoldTrendChart;
