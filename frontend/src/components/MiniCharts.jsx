import React, { useState, useEffect } from 'react';
import useCountUp from '../hooks/useCountUp';

/**
 * Modern SVG Sparkline with subtle area gradient
 */
export function TrendSparkline({
  data = [12, 18, 15, 24, 22, 28, 35],
  color = 'blue', // 'blue' | 'emerald' | 'amber' | 'purple' | 'rose'
  height = 36,
  className = '',
}) {
  const colorMap = {
    blue: { stroke: '#2563eb', fill: 'url(#gradient-blue)' },
    emerald: { stroke: '#059669', fill: 'url(#gradient-emerald)' },
    amber: { stroke: '#d97706', fill: 'url(#gradient-amber)' },
    purple: { stroke: '#7c3aed', fill: 'url(#gradient-purple)' },
    rose: { stroke: '#e11d48', fill: 'url(#gradient-rose)' },
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  if (!data || data.length < 2) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 120;
  const padding = 4;
  const innerHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * innerHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className={`inline-block overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradient-emerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradient-amber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradient-rose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient fill */}
        <path d={areaD} fill={currentTheme.fill} />

        {/* Smooth line */}
        <path
          d={pathD}
          fill="none"
          stroke={currentTheme.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pulse end dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill={currentTheme.stroke}
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

/**
 * Animated Progress Bar with percentage label
 */
export function AnimatedProgressBar({
  value = 0,
  max = 100,
  color = 'blue',
  showLabel = false,
  className = '',
}) {
  const percentage = Math.min(Math.max(Math.round((value / (max || 1)) * 100), 0), 100);

  const gradientMap = {
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-400 to-teal-600',
    amber: 'from-amber-400 to-orange-500',
    purple: 'from-purple-500 to-indigo-600',
    rose: 'from-rose-400 to-red-600',
  };

  const bgGradient = gradientMap[color] || gradientMap.blue;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1 font-display">
          <span>Capacity Completion</span>
          <span className="font-mono tabular-numbers text-slate-700">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${bgGradient} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * SVG Donut Ring Meter
 */
export function DonutMetric({
  value = 85,
  size = 64,
  strokeWidth = 6,
  color = '#2563eb',
  label = '',
  className = '',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs font-bold font-display tabular-numbers text-slate-800">
          {value}%
        </span>
        {label && <span className="text-[8px] text-slate-400 uppercase tracking-tighter">{label}</span>}
      </div>
    </div>
  );
}

/**
 * Interactive Weekly / Distribution Bar Chart
 */
export function ActivityBarChart({
  data = [
    { label: 'Mon', value: 24, secondary: 18 },
    { label: 'Tue', value: 38, secondary: 26 },
    { label: 'Wed', value: 42, secondary: 34 },
    { label: 'Thu', value: 30, secondary: 22 },
    { label: 'Fri', value: 55, secondary: 40 },
    { label: 'Sat', value: 68, secondary: 52 },
    { label: 'Sun', value: 45, secondary: 36 },
  ],
  height = 160,
  primaryColor = 'bg-blue-600',
  secondaryColor = 'bg-indigo-200',
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.secondary || 0)), 10);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between gap-2 pt-4" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const primaryHeight = Math.max(Math.round((item.value / maxValue) * 100), 6);
          const secondaryHeight = item.secondary
            ? Math.max(Math.round((item.secondary / maxValue) * 100), 4)
            : 0;

          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute -top-10 z-20 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg whitespace-nowrap font-mono animate-fade-in pointer-events-none">
                  <span className="font-bold">{item.value}</span> total
                  {item.secondary !== undefined && ` • ${item.secondary} checked`}
                </div>
              )}

              {/* Bar Columns Container */}
              <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-full">
                {item.secondary !== undefined && (
                  <div
                    className={`w-1/2 rounded-t-md transition-all duration-500 ease-out ${secondaryColor} group-hover:opacity-90`}
                    style={{ height: `${secondaryHeight}%` }}
                  />
                )}
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ease-out ${primaryColor} ${
                    isHovered ? 'brightness-110 scale-y-105' : ''
                  }`}
                  style={{ height: `${primaryHeight}%`, transformOrigin: 'bottom' }}
                />
              </div>

              {/* Bottom Label */}
              <span className="text-[10px] font-semibold text-slate-500 mt-2 font-display group-hover:text-blue-600 transition-colors">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Pure SVG Smooth Sine-Wave Sparkline for Stat Cards (matching visual reference)
 */
export function StatWaveSparkline({
  color = 'blue',
  data,
  className = 'w-full h-full',
}) {
  const colorMap = {
    blue: { stroke: '#3b82f6', stopStart: '#60a5fa', stopEnd: '#dbeafe' },
    emerald: { stroke: '#10b981', stopStart: '#34d399', stopEnd: '#d1fae5' },
    amber: { stroke: '#f59e0b', stopStart: '#fbbf24', stopEnd: '#fef3c7' },
    purple: { stroke: '#8b5cf6', stopStart: '#a78bfa', stopEnd: '#ede9fe' },
    violet: { stroke: '#8b5cf6', stopStart: '#a78bfa', stopEnd: '#ede9fe' },
    cyan: { stroke: '#06b6d4', stopStart: '#22d3ee', stopEnd: '#cffafe' },
    rose: { stroke: '#f43f5e', stopStart: '#fb7185', stopEnd: '#ffe4e6' },
  };

  const current = colorMap[color] || colorMap.blue;
  const gradientId = `wave-grad-${color}-${Math.random().toString(36).substring(2, 7)}`;

  // Default smooth wave points if dynamic array not provided
  const points = data && data.length >= 4
    ? data
    : [10, 16, 12, 22, 18, 25, 28];

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const padY = 4;
  const innerH = h - padY * 2;

  const coords = points.map((val, idx) => ({
    x: (idx / (points.length - 1)) * w,
    y: h - padY - ((val - min) / range) * innerH,
  }));

  // Build smooth cubic Bézier spline curve
  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={current.stopStart} stopOpacity="0.3" />
          <stop offset="100%" stopColor={current.stopEnd} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={current.stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Premium Spline Area Chart with Tooltip & Dropdown (matching Revenue Overview in reference)
 */
export function SplineAreaChart({
  title = 'Revenue Overview',
  icon: Icon,
  headline = '₹2,84,500',
  trendBadge = '↑ 18% vs last period',
  periods = ['Last 6 Months', 'Last 30 Days', 'This Year'],
  selectedPeriod,
  onPeriodChange,
  data,
  dataByPeriod,
  yAxisLabels,
  className = '',
}) {
  const [internalPeriod, setInternalPeriod] = useState(periods[0] || 'Last 6 Months');
  const activePeriod = selectedPeriod !== undefined ? selectedPeriod : internalPeriod;

  // Resolve dataset based on activePeriod or direct data prop
  const rawData = (dataByPeriod && dataByPeriod[activePeriod]) || data || [
    { label: 'Jan', value: 1.2, display: '₹1,20,000' },
    { label: 'Feb', value: 1.8, display: '₹1,80,000' },
    { label: 'Mar', value: 1.5, display: '₹1,50,000' },
    { label: 'Apr', value: 2.1, display: '₹2,10,000' },
    { label: 'May', value: 2.0, display: '₹2,00,000' },
    { label: 'Jun', value: 2.85, display: '₹2,84,500' },
  ];

  const chartData = Array.isArray(rawData) && rawData.length > 0 ? rawData : [
    { label: 'Start', value: 0, display: '0' },
    { label: 'Current', value: 1, display: '1' },
  ];

  const [activeIdx, setActiveIdx] = useState(chartData.length - 1);
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger draw animation on mount and whenever activePeriod or chartData changes
  useEffect(() => {
    setIsAnimated(false);
    setActiveIdx(chartData.length - 1);
    const timer = setTimeout(() => setIsAnimated(true), 60);
    return () => clearTimeout(timer);
  }, [activePeriod, chartData.length]);

  const handlePeriodChange = (e) => {
    const val = e.target.value;
    if (selectedPeriod === undefined) {
      setInternalPeriod(val);
    }
    if (onPeriodChange) {
      onPeriodChange(val);
    }
  };

  const w = 540;
  const h = 200;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 35;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  // Extract numeric values and determine dynamic ceiling
  const numericValues = chartData.map((d) =>
    typeof d.value === 'number' ? d.value : parseFloat(d.value) || 0
  );
  const rawMax = Math.max(...numericValues, 1);

  let maxVal = rawMax;
  if (rawMax <= 5) {
    maxVal = 5;
  } else if (rawMax <= 10) {
    maxVal = 10;
  } else if (rawMax <= 50) {
    maxVal = Math.ceil(rawMax / 10) * 10;
  } else if (rawMax <= 100) {
    maxVal = Math.ceil(rawMax / 20) * 20;
  } else if (rawMax <= 1000) {
    maxVal = Math.ceil(rawMax / 100) * 100;
  } else if (rawMax <= 100000) {
    maxVal = Math.ceil(rawMax / 10000) * 10000;
  } else {
    maxVal = Math.ceil(rawMax / 50000) * 50000;
  }
  if (maxVal === 0) maxVal = 10;

  const formatTick = (val) => {
    if (val >= 100000) {
      const lakhs = val / 100000;
      return `${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
    }
    if (val >= 1000) {
      const k = val / 1000;
      return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
    }
    return Math.round(val).toString();
  };

  const computedYLabels = yAxisLabels || [
    formatTick(maxVal),
    formatTick(maxVal * 0.66),
    formatTick(maxVal * 0.33),
    '0',
  ];

  const points = chartData.map((d, i) => {
    const numVal = typeof d.value === 'number' ? d.value : parseFloat(d.value) || 0;
    const x = padLeft + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const y = padTop + chartH - (numVal / maxVal) * chartH;
    return { x, y, ...d, numVal };
  });

  // Generate smooth cubic Bézier spline curve
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;
  const activePoint = points[activeIdx] || points[points.length - 1];

  // Headline animated count-up if numeric value exists
  const matchNumeric = typeof headline === 'string' ? headline.match(/([^\d]*)([\d,]+)(\.?\d*)(.*)/) : null;
  const headlineNum = matchNumeric
    ? parseFloat(matchNumeric[2].replace(/,/g, ''))
    : typeof headline === 'number'
    ? headline
    : null;
  const countUpValue = useCountUp(headlineNum !== null ? headlineNum : 0, 850);

  let animatedHeadline = headline;
  if (matchNumeric && headlineNum !== null) {
    const formattedCount = headlineNum >= 1000 ? countUpValue.toLocaleString() : countUpValue;
    animatedHeadline = `${matchNumeric[1]}${formattedCount}${matchNumeric[4] || ''}`;
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h2 className="text-sm font-bold font-display tracking-tight text-slate-800">
            {title}
          </h2>
        </div>

        {/* Dropdown filter */}
        <div className="relative">
          <select
            value={activePeriod}
            onChange={handlePeriodChange}
            className="text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer outline-none transition-colors"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Large Headline & Trend */}
      <div className="flex items-baseline gap-3 mt-1 mb-2">
        <div className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight tabular-numbers">
          {animatedHeadline}
        </div>
        {trendBadge && (
          <span className="text-xs font-bold text-emerald-600 font-mono tracking-tight">
            {trendBadge}
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-48 sm:h-52">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="splineAreaBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#93c5fd" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {computedYLabels.map((label, idx) => {
            const y = padTop + (idx / Math.max(computedYLabels.length - 1, 1)) * chartH;
            return (
              <g key={label + idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={w - padRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Area Gradient with smooth fade-in */}
          <path
            d={areaD}
            fill="url(#splineAreaBlue)"
            style={{
              opacity: isAnimated ? 1 : 0,
              transition: 'opacity 0.9s ease-out 0.25s',
            }}
          />

          {/* Spline Line with smooth SVG line-drawing animation */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1000"
            strokeDashoffset={isAnimated ? 0 : 1000}
            style={{
              transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* Data Points */}
          {points.map((p, i) => {
            const isActive = i === activeIdx;
            return (
              <g
                key={p.label + i}
                className="cursor-pointer"
                onMouseEnter={() => setActiveIdx(i)}
              >
                {isActive && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="9"
                    fill="#3b82f6"
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? '5.5' : '4'}
                  fill={isActive ? '#2563eb' : '#3b82f6'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{
                    transformOrigin: `${p.x}px ${p.y}px`,
                    transform: isAnimated ? 'scale(1)' : 'scale(0)',
                    transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.1 + i * 0.08}s, r 0.2s ease`,
                  }}
                />

                {/* X-Axis Month / Category Label */}
                <text
                  x={p.x}
                  y={h - 10}
                  fill={isActive ? '#1e293b' : '#94a3b8'}
                  fontSize="11"
                  fontWeight={isActive ? '700' : '500'}
                  textAnchor="middle"
                >
                  {p.label}
                </text>
              </g>
            );
          })}

          {/* Floating Tooltip Pill for Active Point */}
          {activePoint && (
            <g
              style={{
                transform: `translate(${Math.max(Math.min(activePoint.x, w - padRight - 50), padLeft + 50)}px, ${activePoint.y - 32}px)`,
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              filter="url(#badgeShadow)"
            >
              <rect
                x="-48"
                y="-14"
                width="96"
                height="24"
                rx="12"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="2"
                fill="#1e293b"
                fontSize="11"
                fontWeight="700"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {activePoint.display || activePoint.value}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

/**
 * Multi-Segment Donut Chart (Spacious, non-cramped with clean legend)
 */
export function MultiSegmentDonut({
  title = 'Session Status',
  icon: Icon,
  segments = [
    { label: 'Completed', value: 75, color: '#10b981', dotClass: 'bg-emerald-500' },
    { label: 'Pending', value: 15, color: '#3b82f6', dotClass: 'bg-blue-500' },
    { label: 'Cancelled', value: 10, color: '#f59e0b', dotClass: 'bg-amber-500' },
  ],
  centerValue = '75%',
  centerLabel = 'Completed',
  className = '',
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Compute total mathematically
  const total = segments.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Animate center numeric counter
  const parsedCenterNum = typeof centerValue === 'number'
    ? centerValue
    : parseFloat(String(centerValue).replace(/[^0-9.]/g, '')) || 0;
  const hasPercent = String(centerValue).includes('%');
  const animatedCenter = useCountUp(parsedCenterNum, 950);

  let cumulativePercent = 0;
  const nonZeroSegments = segments.filter((s) => (parseFloat(s.value) || 0) > 0);

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center icon-3d shadow-xs">
              <Icon className="w-4 h-4 drop-shadow-sm" />
            </div>
          )}
          <h2 className="text-sm font-bold font-display tracking-tight text-slate-800">
            {title}
          </h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full font-mono">
          Distribution
        </span>
      </div>

      {/* Donut and Legend row */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-around gap-6 py-4 my-auto w-full">
        {/* Donut circle */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
            {/* Background ring */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* If total is 0, show neutral placeholder ring */}
            {total === 0 && (
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="#cbd5e1"
                strokeWidth={strokeWidth}
                strokeDasharray="4 6"
                fill="none"
              />
            )}

            {/* Colored arcs */}
            {total > 0 &&
              segments.map((seg, idx) => {
                const segVal = parseFloat(seg.value) || 0;
                if (segVal <= 0) return null;

                const segPercent = (segVal / total) * 100;
                const strokeDash = isMounted ? (segPercent / 100) * circumference : 0;
                const strokeOffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += segPercent;

                const isHovered = hoveredIdx === idx;
                const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;

                return (
                  <circle
                    key={idx}
                    cx="65"
                    cy="65"
                    r={radius}
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={`${Math.max(strokeDash - (nonZeroSegments.length > 1 ? 2 : 0), 0)} ${circumference}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    fill="none"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      opacity: isDimmed ? 0.45 : 1,
                      transition:
                        'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.25s ease, opacity 0.25s ease',
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
          </svg>

          {/* Centered label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight leading-none tabular-numbers">
              {animatedCenter}{hasPercent ? '%' : ''}
            </span>
            <span className="text-xs font-semibold text-slate-400 mt-1">
              {centerLabel}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5 w-full sm:w-auto min-w-[150px] shrink-0">
          {segments.map((seg, idx) => {
            const segVal = parseFloat(seg.value) || 0;
            const pct = total > 0 ? Math.round((segVal / total) * 100) : 0;
            const isHovered = hoveredIdx === idx;
            const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between gap-4 text-xs px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                  isHovered
                    ? 'bg-slate-100 shadow-2xs scale-[1.02]'
                    : isDimmed
                    ? 'opacity-40'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${seg.dotClass} shrink-0 shadow-2xs transition-transform ${
                      isHovered ? 'scale-125' : ''
                    }`}
                  />
                  <span className="text-slate-700 font-semibold whitespace-nowrap">{seg.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono tabular-numbers pl-2">
                  <span className="font-bold text-slate-900">{segVal}</span>
                  <span className="text-[11px] text-slate-400 font-medium">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

