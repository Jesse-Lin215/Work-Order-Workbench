import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  TrendingUp,
  Info,
  X,
} from 'lucide-react';
import {
  OutsourceOrder,
  ProductionOrder,
  ProductionTask,
  TimeRangeOption,
  TrendDataPoint,
} from '../types';
import { SectionTimeFilter } from './SectionTimeFilter';

interface WarningAndTrendsProps {
  prodOrders: ProductionOrder[];
  outsourceOrders: OutsourceOrder[];
  tasks: ProductionTask[];
  trendData: TrendDataPoint[];
  onOpenDetail: (object: any, type: 'prod' | 'outsource' | 'task' | 'report') => void;
  // 交期预警时间过滤
  warningTimeRange?: TimeRangeOption;
  onWarningTimeRangeChange?: (range: TimeRangeOption) => void;
  warningStartDate?: string;
  warningEndDate?: string;
  onWarningCustomDateChange?: (start: string, end: string) => void;
  isWarningSyncedWithGlobal?: boolean;
  onWarningSyncWithGlobal?: () => void;
  // 报工情况时间过滤
  reportTrendTimeRange?: TimeRangeOption;
  onReportTrendTimeRangeChange?: (range: TimeRangeOption) => void;
  reportTrendStartDate?: string;
  reportTrendEndDate?: string;
  onReportTrendCustomDateChange?: (start: string, end: string) => void;
  isReportTrendSyncedWithGlobal?: boolean;
  onReportTrendSyncWithGlobal?: () => void;
}

export const WarningAndTrends: React.FC<WarningAndTrendsProps> = ({
  prodOrders,
  outsourceOrders,
  tasks,
  trendData,
  onOpenDetail,
  warningTimeRange = 'MONTH',
  onWarningTimeRangeChange,
  warningStartDate,
  warningEndDate,
  onWarningCustomDateChange,
  isWarningSyncedWithGlobal,
  onWarningSyncWithGlobal,
  reportTrendTimeRange = 'MONTH',
  onReportTrendTimeRangeChange,
  reportTrendStartDate,
  reportTrendEndDate,
  onReportTrendCustomDateChange,
  isReportTrendSyncedWithGlobal,
  onReportTrendSyncWithGlobal,
}) => {
  const [warningTab, setWarningTab] = useState<'prod' | 'outsource' | 'task'>('prod');
  const [trendMetric, setTrendMetric] = useState<'count' | 'hours' | 'quality'>('count');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 纯提示语弹窗状态
  const [warningPrompt, setWarningPrompt] = useState<{
    title: string;
    typeLabel: string;
    targetPage: string;
    code: string;
    productName: string;
    warningTypeLabel: string;
    resultText: string;
  } | null>(null);

  // Filter valid warning items (Section 8: 草稿/审批中不进入预警)
  const prodWarnings = prodOrders.filter(
    (o) =>
      (o.status === '已审批' || o.status === '进行中' || o.status === '暂停') &&
      o.warningType !== 'NONE'
  );

  const outsourceWarnings = outsourceOrders.filter(
    (o) =>
      (o.status === '进行中' || o.status === '待入库') &&
      o.warningType !== 'NONE'
  );

  const taskWarnings = tasks.filter(
    (t) =>
      (t.status === '待生产' || t.status === '生产中' || t.status === '暂停') &&
      t.warningType !== 'NONE'
  );

  const totalWarningsCount =
    prodWarnings.length + outsourceWarnings.length + taskWarnings.length;

  // SVG Linear Chart Dimensions
  const svgWidth = 520;
  const svgHeight = 175;
  const paddingLeft = 36;
  const paddingRight = 20;
  const paddingTop = 16;
  const paddingBottom = 26;
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
      id="workbench-warning-and-trends"
      className="grid grid-cols-1 gap-2.5 lg:grid-cols-12"
    >
      {/* 1. 交期预警 (FR-11 & FR-12) */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 lg:col-span-6 min-h-[350px]">
        <div>
          {/* Header with Title & Module Time Filter */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                交期预警
              </h3>
              {totalWarningsCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                  {totalWarningsCount} 预警
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  正常
                </span>
              )}
            </div>

            {/* Section Time Filter */}
            {onWarningTimeRangeChange && (
              <SectionTimeFilter
                label="预警范围"
                selectedTimeRange={warningTimeRange}
                onTimeRangeChange={onWarningTimeRangeChange}
                startDate={warningStartDate}
                endDate={warningEndDate}
                onCustomDateChange={onWarningCustomDateChange}
                isSyncedWithGlobal={isWarningSyncedWithGlobal}
                onSyncWithGlobal={onWarningSyncWithGlobal}
              />
            )}
          </div>

          {/* Warning Sub-tabs */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">按单据类型分类预警</span>
            <div className="flex rounded bg-slate-100 p-0.5 dark:bg-slate-800">
              <button
                id="warning-tab-prod"
                onClick={() => setWarningTab('prod')}
                className={`rounded px-2 py-1 text-[10px] font-medium transition-all ${
                  warningTab === 'prod'
                    ? 'bg-white text-rose-600 shadow-2xs dark:bg-slate-700 dark:text-rose-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                生产工单 ({prodWarnings.length})
              </button>
              <button
                id="warning-tab-outsource"
                onClick={() => setWarningTab('outsource')}
                className={`rounded px-2 py-1 text-[10px] font-medium transition-all ${
                  warningTab === 'outsource'
                    ? 'bg-white text-rose-600 shadow-2xs dark:bg-slate-700 dark:text-rose-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                外协工单 ({outsourceWarnings.length})
              </button>
              <button
                id="warning-tab-task"
                onClick={() => setWarningTab('task')}
                className={`rounded px-2 py-1 text-[10px] font-medium transition-all ${
                  warningTab === 'task'
                    ? 'bg-white text-rose-600 shadow-2xs dark:bg-slate-700 dark:text-rose-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                生产任务 ({taskWarnings.length})
              </button>
            </div>
          </div>

          {/* Warning List */}
          <div className="space-y-2 min-h-[220px] max-h-[235px] overflow-y-auto pr-0.5">
            {warningTab === 'prod' && (
              <>
                {prodWarnings.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center text-xs text-slate-400">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-80" />
                    <span className="mt-1 font-medium text-emerald-600 dark:text-emerald-400">
                      生产工单暂无交期预警
                    </span>
                  </div>
                ) : (
                  prodWarnings.map((order) => {
                    const daysDiff = Math.round(
                      (new Date(order.planEndDate.slice(0, 10)).getTime() -
                        new Date('2026-08-31').getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const resultText =
                      order.warningType === 'OVERDUE'
                        ? `超出 ${Math.max(1, Math.abs(daysDiff))} 天`
                        : order.warningType === 'UPCOMING_DUE'
                        ? daysDiff <= 0
                          ? '今日到期'
                          : `临近 ${daysDiff} 天`
                        : `进度滞后 ${Math.max(1, (order.timeProgress || 0) - (order.totalProgress || 0))}%`;

                    return (
                      <div
                        key={order.id}
                        id={`warning-prod-${order.id}`}
                        onClick={() => setWarningPrompt({
                          title: '生产工单交期预警提示',
                          typeLabel: '生产工单',
                          targetPage: '工单管理',
                          code: order.code,
                          productName: order.productName,
                          warningTypeLabel: order.warningType === 'OVERDUE' ? '已逾期' : order.warningType === 'UPCOMING_DUE' ? '临期' : '进度滞后',
                          resultText,
                        })}
                        role="button"
                        tabIndex={0}
                        className="group flex cursor-pointer items-center justify-between rounded-md border border-rose-100 bg-rose-50/40 p-2 transition-all hover:border-rose-300 hover:bg-rose-50 dark:border-rose-950/50 dark:bg-rose-950/20 dark:hover:border-rose-900"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono-num text-xs font-bold text-slate-800 dark:text-slate-200">
                              {order.code}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                order.warningType === 'OVERDUE'
                                  ? 'bg-rose-600 text-white'
                                  : order.warningType === 'UPCOMING_DUE'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {order.warningType === 'OVERDUE'
                                ? '已逾期'
                                : order.warningType === 'UPCOMING_DUE'
                                ? '临期'
                                : '进度滞后'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              交期: {order.planEndDate}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <span>{order.productName}</span>
                            <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                            <span className={`font-medium ${order.warningType === 'OVERDUE' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {resultText}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 font-mono-num text-xs">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">总体/时间</div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {order.totalProgress}% /{' '}
                              <span className="text-rose-600 dark:text-rose-400">{order.timeProgress}%</span>
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600" />
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {warningTab === 'outsource' && (
              <>
                {outsourceWarnings.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center text-xs text-slate-400">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-80" />
                    <span className="mt-1 font-medium text-emerald-600 dark:text-emerald-400">
                      外协工单暂无交期预警
                    </span>
                  </div>
                ) : (
                  outsourceWarnings.map((order) => {
                    const daysDiff = Math.round(
                      (new Date(order.planEndDate.slice(0, 10)).getTime() -
                        new Date('2026-08-31').getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const resultText =
                      order.warningType === 'OVERDUE'
                        ? `超出 ${Math.max(1, Math.abs(daysDiff))} 天`
                        : daysDiff <= 0
                        ? '今日到期'
                        : `临近 ${daysDiff} 天`;

                    return (
                      <div
                        key={order.id}
                        id={`warning-outsource-${order.id}`}
                        onClick={() => setWarningPrompt({
                          title: '外协工单交期预警提示',
                          typeLabel: '外协工单',
                          targetPage: '外协工单',
                          code: order.code,
                          productName: `${order.productName} (${order.outsourceProcess})`,
                          warningTypeLabel: order.warningType === 'OVERDUE' ? '已逾期' : '临期',
                          resultText,
                        })}
                        role="button"
                        tabIndex={0}
                        className="group flex cursor-pointer items-center justify-between rounded-md border border-amber-100 bg-amber-50/40 p-2 transition-all hover:border-amber-300 hover:bg-amber-50 dark:border-amber-950/50 dark:bg-amber-950/20 dark:hover:border-amber-900"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono-num text-xs font-bold text-slate-800 dark:text-slate-200">
                              {order.code}
                            </span>
                            <span className="rounded bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              {order.warningType === 'OVERDUE' ? '已逾期' : '临期'}
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                              {order.supplierName}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <span>{order.productName} ({order.outsourceProcess})</span>
                            <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                            <span className={`font-medium ${order.warningType === 'OVERDUE' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {resultText}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 font-mono-num text-xs">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">外协进度</div>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {order.productionProgress}%
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600" />
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {warningTab === 'task' && (
              <>
                {taskWarnings.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center text-xs text-slate-400">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-80" />
                    <span className="mt-1 font-medium text-emerald-600 dark:text-emerald-400">
                      生产任务运行正常，无交期预警
                    </span>
                  </div>
                ) : (
                  taskWarnings.map((task) => {
                    const baseDate = task.estimatedEndTime || task.planStartTime || '2026-08-31';
                    const daysDiff = Math.round(
                      (new Date(baseDate.slice(0, 10)).getTime() -
                        new Date('2026-08-31').getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const resultText =
                      task.warningType === 'NOT_STARTED_ON_TIME'
                        ? `未按时开工 (延期 ${Math.max(1, Math.abs(daysDiff))} 天)`
                        : task.warningType === 'OVERDUE'
                        ? `超出 ${Math.max(1, Math.abs(daysDiff))} 天`
                        : daysDiff <= 0
                        ? '今日到期'
                        : `临近 ${daysDiff} 天`;

                    return (
                      <div
                        key={task.id}
                        id={`warning-task-${task.id}`}
                        onClick={() => setWarningPrompt({
                          title: '生产任务交期预警提示',
                          typeLabel: '生产任务',
                          targetPage: '生产任务',
                          code: task.code,
                          productName: `${task.taskName} - ${task.processName}`,
                          warningTypeLabel: task.warningType === 'NOT_STARTED_ON_TIME' ? '未开工' : task.warningType === 'OVERDUE' ? '已逾期' : '临期',
                          resultText,
                        })}
                        role="button"
                        tabIndex={0}
                        className="group flex cursor-pointer items-center justify-between rounded-md border border-rose-100 bg-rose-50/40 p-2 transition-all hover:border-rose-300 hover:bg-rose-50 dark:border-rose-950/50 dark:bg-rose-950/20 dark:hover:border-rose-900"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono-num text-xs font-bold text-slate-800 dark:text-slate-200">
                              {task.code}
                            </span>
                            <span className="rounded bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              {task.warningType === 'NOT_STARTED_ON_TIME'
                                ? '未开工'
                                : task.warningType === 'OVERDUE'
                                ? '已逾期'
                                : '临期'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {task.workstationName}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <span>{task.taskName}</span>
                            <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                            <span className="font-medium text-rose-600 dark:text-rose-400">
                              {resultText}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 font-mono-num text-xs">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">任务进度</div>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {task.taskProgress}%
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600" />
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-2 text-[10px] text-slate-400">
          * 根据选择的时间周期（今日/本周/本月/自定义）独立计算单据交期风险
        </div>
      </div>

      {/* 2. 报工趋势线性表 (FR-13 - Linear Trend Chart) */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 lg:col-span-6 min-h-[350px]">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
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
          <div className="relative mt-2 h-52 w-full select-none">
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

                  {/* X Axis Date Labels */}
                  {trendData.map((d, i) => (
                    <text
                      key={d.date}
                      x={getX(i)}
                      y={paddingTop + plotHeight + 15}
                      textAnchor="middle"
                      className={`font-mono text-[9px] transition-colors ${
                        hoveredIndex === i
                          ? 'fill-indigo-600 font-bold dark:fill-indigo-400'
                          : 'fill-slate-400'
                      }`}
                    >
                      {d.displayDate}
                    </text>
                  ))}

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

      {/* 交期预警纯提示语弹窗 */}
      {warningPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {warningPrompt.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {warningPrompt.typeLabel}单号: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{warningPrompt.code}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWarningPrompt(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 rounded-lg border border-slate-200/80 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
              <div className="mb-3 rounded bg-rose-50 p-2.5 border border-rose-200/60 dark:bg-rose-950/40 dark:border-rose-900/40">
                <div className="flex items-center justify-between text-rose-800 dark:text-rose-300">
                  <span className="font-semibold">{warningPrompt.productName}</span>
                  <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {warningPrompt.warningTypeLabel}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-400">
                  预警说明: {warningPrompt.resultText}
                </p>
              </div>

              <p className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                提示：如需查看或处理该{warningPrompt.typeLabel}，请跳转到 <strong className="text-teal-700 dark:text-teal-300">【{warningPrompt.targetPage}】</strong> 对应页面搜索此{warningPrompt.typeLabel === '生产任务' ? '任务' : '工单'}。
              </p>

              <div className="flex items-center justify-between rounded bg-white p-2.5 border border-slate-200/80 font-mono text-xs text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
                <span className="text-slate-500">检索编号：</span>
                <span className="font-bold text-teal-700 dark:text-teal-300 select-all">{warningPrompt.code}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setWarningPrompt(null)}
                className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-2xs"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
