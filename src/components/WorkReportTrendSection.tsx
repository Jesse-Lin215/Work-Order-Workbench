import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
} from 'lucide-react';
import { TimeRangeOption, TrendDataPoint } from '../types';
import { SectionTimeFilter } from './SectionTimeFilter';

interface WorkReportTrendSectionProps {
  trendData: TrendDataPoint[];
  dragHandle?: React.ReactNode;
  // 报工情况独立时间过滤
  reportTrendTimeRange?: TimeRangeOption;
  onReportTrendTimeRangeChange?: (range: TimeRangeOption) => void;
  reportTrendStartDate?: string;
  reportTrendEndDate?: string;
  onReportTrendCustomDateChange?: (start: string, end: string) => void;
  isReportTrendSyncedWithGlobal?: boolean;
  onReportTrendSyncWithGlobal?: () => void;
}

export const WorkReportTrendSection: React.FC<WorkReportTrendSectionProps> = ({
  trendData,
  dragHandle,
  reportTrendTimeRange = 'MONTH',
  onReportTrendTimeRangeChange,
  reportTrendStartDate,
  reportTrendEndDate,
  onReportTrendCustomDateChange,
  isReportTrendSyncedWithGlobal,
  onReportTrendSyncWithGlobal,
}) => {
  const [trendMetric, setTrendMetric] = useState<'count' | 'hours' | 'quality'>('count');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 计算当前趋势数据所属的月份标签（如"8月"，跨月时"7月 - 8月"）
  const displayMonthLabel = useMemo(() => {
    if (!trendData || trendData.length === 0) return '';
    const months = Array.from(
      new Set(
        trendData
          .map((d) => {
            const parts = d.date.split('-');
            return parts.length >= 2 ? parseInt(parts[1], 10) : null;
          })
          .filter((m): m is number => m !== null)
      )
    );
    if (months.length === 0) return '';
    if (months.length === 1) {
      return `${months[0]}月`;
    }
    return `${months[0]}月 - ${months[months.length - 1]}月`;
  }, [trendData]);

  // SVG Linear Chart Dimensions
  const svgWidth = 520;
  const svgHeight = 192;
  const paddingLeft = 36;
  const paddingRight = 20;
  const paddingTop = 14;
  const paddingBottom = 38;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const dataLen = trendData.length;
  const getX = (idx: number) => {
    if (dataLen <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (idx / (dataLen - 1)) * plotWidth;
  };

  // Metrics Scaling for Linear Chart
  const maxCountVal = Math.max(
    ...trendData.map((d) => Math.max(d.auditedCount, d.pendingCount)),
    4
  );
  const maxHoursVal = Math.max(...trendData.map((d) => d.totalHours), 10);
  const minQualityVal = 85;
  const maxQualityVal = 100;

  const getYCount = (val: number) =>
    paddingTop + plotHeight - (val / maxCountVal) * plotHeight;
  const getYHours = (val: number) =>
    paddingTop + plotHeight - (val / maxHoursVal) * plotHeight;
  const getYQuality = (val: number) => {
    const clamped = Math.max(minQualityVal, Math.min(maxQualityVal, val));
    return (
      paddingTop +
      plotHeight -
      ((clamped - minQualityVal) / (maxQualityVal - minQualityVal)) * plotHeight
    );
  };

  // Build SVG Path Strings
  const auditedPoints = trendData.map((d, i) => ({
    x: getX(i),
    y: getYCount(d.auditedCount),
    val: d.auditedCount,
  }));
  const pendingPoints = trendData.map((d, i) => ({
    x: getX(i),
    y: getYCount(d.pendingCount),
    val: d.pendingCount,
  }));
  const hoursPoints = trendData.map((d, i) => ({
    x: getX(i),
    y: getYHours(d.totalHours),
    val: d.totalHours,
  }));
  const qualityPoints = trendData.map((d, i) => ({
    x: getX(i),
    y: getYQuality(d.goodRate),
    val: d.goodRate,
  }));

  const buildLinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.reduce(
      (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
      ''
    );
  };

  const buildAreaPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    const bottomY = paddingTop + plotHeight;
    const linePart = buildLinePath(pts);
    return `${linePart} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  };

  const hoveredPoint = hoveredIndex !== null ? trendData[hoveredIndex] : null;

  return (
    <div
      id="workbench-report-trend"
      className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 h-[370px]"
    >
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            {dragHandle}
            <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
              报工情况
            </h3>
          </div>

          {/* Section Time Filter */}
          {onReportTrendTimeRangeChange && (
            <SectionTimeFilter
              label="统计时间"
              selectedTimeRange={reportTrendTimeRange}
              onTimeRangeChange={onReportTrendTimeRangeChange}
              startDate={reportTrendStartDate}
              endDate={reportTrendEndDate}
              onCustomDateChange={onReportTrendCustomDateChange}
              isSyncedWithGlobal={isReportTrendSyncedWithGlobal}
              onSyncWithGlobal={onReportTrendSyncWithGlobal}
            />
          )}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">数据指标维度切换</span>
          {/* Metric Toggle */}
          <div className="flex rounded bg-slate-100 p-0.5 dark:bg-slate-800">
            <button
              id="trend-metric-count"
              onClick={() => {
                setTrendMetric('count');
                setHoveredIndex(null);
              }}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-all ${
                trendMetric === 'count'
                  ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              报工单量
            </button>
            <button
              id="trend-metric-hours"
              onClick={() => {
                setTrendMetric('hours');
                setHoveredIndex(null);
              }}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-all ${
                trendMetric === 'hours'
                  ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              报工工时(h)
            </button>
            <button
              id="trend-metric-quality"
              onClick={() => {
                setTrendMetric('quality');
                setHoveredIndex(null);
              }}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-all ${
                trendMetric === 'quality'
                  ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              良品率(%)
            </button>
          </div>
        </div>

        {/* Linear Chart Canvas Container */}
        <div className="relative mt-2 h-56 w-full select-none">
          {trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              暂无所选周期报工趋势数据
            </div>
          ) : (
            <>
              {/* Floating Tooltip */}
              {hoveredPoint && hoveredIndex !== null && (
                <div
                  className="pointer-events-none absolute top-1 z-30 transform -translate-x-1/2 rounded-md bg-slate-900/95 px-2.5 py-1.5 text-[11px] text-white shadow-md backdrop-blur dark:bg-slate-800/95"
                  style={{
                    left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
                  }}
                >
                  <div className="font-semibold text-slate-200 border-b border-slate-700 pb-0.5 mb-1">
                    {hoveredPoint.date}
                  </div>
                  {trendMetric === 'count' && (
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex items-center justify-between gap-3 text-indigo-300">
                        <span>已审核报工:</span>
                        <strong className="font-mono-num font-bold">{hoveredPoint.auditedCount} 单</strong>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-amber-300">
                        <span>待审核报工:</span>
                        <strong className="font-mono-num font-bold">{hoveredPoint.pendingCount} 单</strong>
                      </div>
                      <div className="text-slate-400 pt-0.5 border-t border-slate-800">
                        当日总工时: {hoveredPoint.totalHours}h
                      </div>
                    </div>
                  )}
                  {trendMetric === 'hours' && (
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex items-center justify-between gap-3 text-purple-300">
                        <span>累计报工工时:</span>
                        <strong className="font-mono-num font-bold">{hoveredPoint.totalHours} 小时</strong>
                      </div>
                      <div className="text-slate-400 pt-0.5">
                        完成单量: {hoveredPoint.auditedCount} 单 | 良品率: {hoveredPoint.goodRate}%
                      </div>
                    </div>
                  )}
                  {trendMetric === 'quality' && (
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex items-center justify-between gap-3 text-emerald-300">
                        <span>终检良品率:</span>
                        <strong className="font-mono-num font-bold">{hoveredPoint.goodRate}%</strong>
                      </div>
                      <div className="text-slate-400 pt-0.5">
                        已审报工: {hoveredPoint.auditedCount} 单
                      </div>
                    </div>
                  )}
                </div>
              )}

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
              >
                <defs>
                  {/* Linear Gradients for Series Area */}
                  <linearGradient id="auditedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="pendingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="hoursAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="qualityAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines & Y Axis Ticks */}
                {[0, 0.33, 0.66, 1].map((ratio) => {
                  const y = paddingTop + plotHeight * (1 - ratio);
                  let label = '';
                  if (trendMetric === 'count') {
                    label = `${Math.round(maxCountVal * ratio)}`;
                  } else if (trendMetric === 'hours') {
                    label = `${Math.round(maxHoursVal * ratio)}`;
                  } else {
                    label = `${Math.round(minQualityVal + (maxQualityVal - minQualityVal) * ratio)}%`;
                  }

                  return (
                    <g key={ratio}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        className="stroke-slate-100 dark:stroke-slate-800"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 6}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-slate-400 font-mono text-[9px]"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Baseline */}
                <line
                  x1={paddingLeft}
                  y1={paddingTop + plotHeight}
                  x2={svgWidth - paddingRight}
                  y2={paddingTop + plotHeight}
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="1"
                />

                {/* Series 1 & 2 Rendering according to trendMetric */}
                {trendMetric === 'count' && (
                  <>
                    {/* Area Fills */}
                    <path d={buildAreaPath(auditedPoints)} fill="url(#auditedAreaGrad)" />
                    <path d={buildAreaPath(pendingPoints)} fill="url(#pendingAreaGrad)" />

                    {/* Primary Lines */}
                    <path
                      d={buildLinePath(auditedPoints)}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={buildLinePath(pendingPoints)}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Nodes */}
                    {auditedPoints.map((pt, i) => (
                      <circle
                        key={`aud-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredIndex === i ? 4.5 : 3}
                        className="fill-white stroke-indigo-600 transition-all dark:fill-slate-900"
                        strokeWidth="2"
                      />
                    ))}
                    {pendingPoints.map((pt, i) => (
                      <circle
                        key={`pen-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredIndex === i ? 4 : 2.5}
                        className="fill-white stroke-amber-500 transition-all dark:fill-slate-900"
                        strokeWidth="2"
                      />
                    ))}
                  </>
                )}

                {trendMetric === 'hours' && (
                  <>
                    <path d={buildAreaPath(hoursPoints)} fill="url(#hoursAreaGrad)" />
                    <path
                      d={buildLinePath(hoursPoints)}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {hoursPoints.map((pt, i) => (
                      <circle
                        key={`hr-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredIndex === i ? 5 : 3.5}
                        className="fill-white stroke-purple-600 transition-all dark:fill-slate-900"
                        strokeWidth="2.5"
                      />
                    ))}
                  </>
                )}

                {trendMetric === 'quality' && (
                  <>
                    {/* Quality Benchmark Standard 95% Line */}
                    <line
                      x1={paddingLeft}
                      y1={getYQuality(95)}
                      x2={svgWidth - paddingRight}
                      y2={getYQuality(95)}
                      stroke="#ef4444"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                    <text
                      x={svgWidth - paddingRight}
                      y={getYQuality(95) - 3}
                      textAnchor="end"
                      className="fill-rose-400 font-mono text-[8px]"
                    >
                      合格基准 95%
                    </text>

                    <path d={buildAreaPath(qualityPoints)} fill="url(#qualityAreaGrad)" />
                    <path
                      d={buildLinePath(qualityPoints)}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {qualityPoints.map((pt, i) => (
                      <circle
                        key={`q-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredIndex === i ? 5 : 3.5}
                        className="fill-white stroke-emerald-600 transition-all dark:fill-slate-900"
                        strokeWidth="2.5"
                      />
                    ))}
                  </>
                )}

                {/* Active Crosshair Indicator */}
                {hoveredIndex !== null && (
                  <line
                    x1={getX(hoveredIndex)}
                    y1={paddingTop}
                    x2={getX(hoveredIndex)}
                    y2={paddingTop + plotHeight}
                    className="stroke-slate-400 dark:stroke-slate-500"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                  />
                )}

                {/* X Axis Date Labels (只展示日的数字，比如 8, 9, 10) */}
                {trendData.map((d, i) => {
                  const dayNumber = parseInt(d.date.slice(8, 10), 10);
                  return (
                    <text
                      key={d.date}
                      x={getX(i)}
                      y={paddingTop + plotHeight + 13}
                      textAnchor="middle"
                      className={`font-mono text-[9.5px] transition-colors ${
                        hoveredIndex === i
                          ? 'fill-indigo-600 font-bold dark:fill-indigo-400'
                          : 'fill-slate-400 dark:fill-slate-500'
                      }`}
                    >
                      {dayNumber}
                    </text>
                  );
                })}

                {/* 下方中间显示几月份的月，比如 8月 */}
                {displayMonthLabel && (
                  <g className="select-none">
                    <rect
                      x={(paddingLeft + svgWidth - paddingRight) / 2 - 22}
                      y={paddingTop + plotHeight + 20}
                      width={44}
                      height={15}
                      rx={7.5}
                      className="fill-slate-100 stroke-slate-200 dark:fill-slate-800 dark:stroke-slate-700"
                      strokeWidth="0.8"
                    />
                    <text
                      x={(paddingLeft + svgWidth - paddingRight) / 2}
                      y={paddingTop + plotHeight + 31}
                      textAnchor="middle"
                      className="fill-slate-600 dark:fill-slate-300 font-bold text-[10px]"
                    >
                      {displayMonthLabel}
                    </text>
                  </g>
                )}

                {/* Transparent Interactive Columns for Hover Hit-Testing */}
                {trendData.map((_, i) => {
                  const colWidth = plotWidth / (dataLen || 1);
                  const xStart = getX(i) - colWidth / 2;
                  return (
                    <rect
                      key={`hit-${i}`}
                      x={Math.max(paddingLeft, xStart)}
                      y={paddingTop}
                      width={colWidth}
                      height={plotHeight + 20}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {trendMetric === 'count' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
                <span className="h-2 w-2 rounded-full border border-indigo-600 bg-white" />
                已审核报工(实线)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 bg-amber-500 rounded-full border-b border-dashed" />
                <span className="h-2 w-2 rounded-full border border-amber-500 bg-white" />
                待审核报工(虚线)
              </span>
            </>
          )}
          {trendMetric === 'hours' && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-purple-600 rounded-full" />
              <span className="h-2 w-2 rounded-full border border-purple-600 bg-white" />
              当日总报工有效工时趋势 (h)
            </span>
          )}
          {trendMetric === 'quality' && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-emerald-500 rounded-full" />
              <span className="h-2 w-2 rounded-full border border-emerald-500 bg-white" />
              终检良品合格率曲线 (%)
            </span>
          )}
        </div>
        <span>多日动态线性连续追踪</span>
      </div>
    </div>
  );
};
