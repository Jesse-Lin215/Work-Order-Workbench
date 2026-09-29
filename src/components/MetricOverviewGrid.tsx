import React, { useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  PackageCheck,
  PlayCircle,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { TimeRangeOption, WorkbenchMetrics } from '../types';
import { SectionTimeFilter } from './SectionTimeFilter';

export type MetricCardId = 'prod' | 'outsource' | 'tasks' | 'reports';

export const DEFAULT_METRIC_CARD_ORDER: MetricCardId[] = [
  'prod',
  'outsource',
  'tasks',
  'reports',
];

interface MetricOverviewGridProps {
  metrics: WorkbenchMetrics;
  onNavigateTab?: (tab: 'prod' | 'outsource' | 'task' | 'report') => void;
  dragHandle?: React.ReactNode;
  // 核心指标看板时间过滤
  metricTimeRange?: TimeRangeOption;
  onWarningTimeRangeChange?: (range: TimeRangeOption) => void;
  onMetricTimeRangeChange?: (range: TimeRangeOption) => void;
  metricStartDate?: string;
  metricEndDate?: string;
  onMetricCustomDateChange?: (start: string, end: string) => void;
  isMetricSyncedWithGlobal?: boolean;
  onMetricSyncWithGlobal?: () => void;
}

export const MetricOverviewGrid: React.FC<MetricOverviewGridProps> = ({
  metrics,
  dragHandle,
  metricTimeRange = 'MONTH',
  onMetricTimeRangeChange,
  metricStartDate,
  metricEndDate,
  onMetricCustomDateChange,
  isMetricSyncedWithGlobal,
  onMetricSyncWithGlobal,
}) => {
  const { productionOrders, outsourceOrders, tasks, workReports } = metrics;

  // 内部 4 个卡片拖拽排序状态（支持本地持久化）
  const [cardOrder, setCardOrder] = useState<MetricCardId[]>(() => {
    try {
      const saved = localStorage.getItem('mes_workbench_metric_cards_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === 4 &&
          parsed.every((k) => DEFAULT_METRIC_CARD_ORDER.includes(k))
        ) {
          return parsed as MetricCardId[];
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_METRIC_CARD_ORDER;
  });

  const [draggedCardId, setDraggedCardId] = useState<MetricCardId | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<MetricCardId | null>(null);

  const isCustomOrder =
    JSON.stringify(cardOrder) !== JSON.stringify(DEFAULT_METRIC_CARD_ORDER);

  const handleResetCardOrder = () => {
    setCardOrder(DEFAULT_METRIC_CARD_ORDER);
    try {
      localStorage.removeItem('mes_workbench_metric_cards_order');
    } catch {
      // ignore
    }
  };

  const handleMoveCard = (id: MetricCardId, direction: 'left' | 'right') => {
    const idx = cardOrder.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cardOrder.length) return;

    const newOrder = [...cardOrder];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);
    setCardOrder(newOrder);
    try {
      localStorage.setItem(
        'mes_workbench_metric_cards_order',
        JSON.stringify(newOrder)
      );
    } catch {
      // ignore
    }
  };

  const handleCardDragStart = (id: MetricCardId, e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', `metric:${id}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCardId(id);
  };

  const handleCardDragOver = (id: MetricCardId, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCardId && draggedCardId !== id && dragOverCardId !== id) {
      setDragOverCardId(id);
    }
  };

  const handleCardDragLeave = (id: MetricCardId, e: React.DragEvent) => {
    e.stopPropagation();
    if (dragOverCardId === id) {
      setDragOverCardId(null);
    }
  };

  const handleCardDrop = (id: MetricCardId, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedCardId || draggedCardId === id) {
      setDraggedCardId(null);
      setDragOverCardId(null);
      return;
    }

    const fromIdx = cardOrder.indexOf(draggedCardId);
    const toIdx = cardOrder.indexOf(id);
    if (fromIdx !== -1 && toIdx !== -1) {
      const newOrder = [...cardOrder];
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, draggedCardId);
      setCardOrder(newOrder);
      try {
        localStorage.setItem(
          'mes_workbench_metric_cards_order',
          JSON.stringify(newOrder)
        );
      } catch {
        // ignore
      }
    }
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleCardDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  // 渲染单个卡片内容
  const renderCard = (cardId: MetricCardId, index: number) => {
    const isDragging = draggedCardId === cardId;
    const isOver = dragOverCardId === cardId && !isDragging;

    // 通用外层卡片包裹属性
    const commonCardClasses = `group/card relative flex flex-col justify-between rounded-lg border bg-white p-3.5 shadow-xs transition-all duration-200 dark:bg-slate-900 ${
      isDragging
        ? 'opacity-40 scale-[0.98] border-dashed border-2 border-indigo-400 dark:border-indigo-500'
        : 'border-slate-200 hover:shadow-xs dark:border-slate-800'
    } ${
      isOver
        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 border-indigo-500'
        : ''
    }`;

    // 卡片顶部拖拽手柄条
    const renderCardHeaderControl = (
      cardTitle: string,
      icon: React.ReactNode,
      themeColorClass: string
    ) => (
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded ${themeColorClass}`}
          >
            {icon}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {cardTitle}
          </span>
        </div>

        {/* 内部拖拽手柄与左右微调 */}
        <div className="flex items-center gap-1">
          {/* 快捷左右移动按钮 (移动端与无障碍友好) */}
          <div className="flex items-center gap-0.5 opacity-40 group-hover/card:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveCard(cardId, 'left');
              }}
              disabled={index === 0}
              title="卡片左移"
              aria-label="卡片向左调整顺序"
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveCard(cardId, 'right');
              }}
              disabled={index === cardOrder.length - 1}
              title="卡片右移"
              aria-label="卡片向右调整顺序"
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* 拖拽手柄 */}
          <div
            draggable={true}
            onDragStart={(e) => handleCardDragStart(cardId, e)}
            onDragEnd={handleCardDragEnd}
            title="按住拖拽在核心指标看板内部调整顺序"
            className="flex cursor-grab items-center gap-0.5 rounded px-1 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 active:cursor-grabbing dark:hover:bg-slate-800 select-none"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );

    if (cardId === 'prod') {
      return (
        <div
          key="prod"
          id="metric-card-prod-orders"
          onDragOver={(e) => handleCardDragOver('prod', e)}
          onDragLeave={(e) => handleCardDragLeave('prod', e)}
          onDrop={(e) => handleCardDrop('prod', e)}
          className={`${commonCardClasses} hover:border-indigo-300`}
        >
          <div>
            {renderCardHeaderControl(
              '生产工单概览',
              <PackageCheck className="h-3.5 w-3.5" />,
              'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
            )}

            {/* Main Progress Bar: 产品完工交付达成率 */}
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  工单总生产进度
                </span>
                <span className="font-mono-num text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {productionOrders.productFulfillmentRate}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500 dark:bg-indigo-500"
                  style={{
                    width: `${Math.min(
                      100,
                      productionOrders.productFulfillmentRate
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Key Product Metrics Grid */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400">计划生产数</span>
                <div className="font-mono-num text-sm font-bold text-slate-800 dark:text-slate-200">
                  {productionOrders.totalPlannedQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">已生产总数</span>
                <div className="font-mono-num text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {productionOrders.totalProducedQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">在制产品数</span>
                <div className="font-mono-num text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {productionOrders.wipProductQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">待生产总数</span>
                <div className="font-mono-num text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {productionOrders.remainingPlanQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              工单总体均进度:{' '}
              <strong className="font-mono-num text-indigo-600 dark:text-indigo-400">
                {productionOrders.overallProgress}%
              </strong>
            </span>
            <span>
              统计:{' '}
              <strong className="font-mono-num text-slate-700 dark:text-slate-300">
                {productionOrders.totalValidOrders}
              </strong>{' '}
              笔工单
            </span>
          </div>
        </div>
      );
    }

    if (cardId === 'outsource') {
      return (
        <div
          key="outsource"
          id="metric-card-outsource-orders"
          onDragOver={(e) => handleCardDragOver('outsource', e)}
          onDragLeave={(e) => handleCardDragLeave('outsource', e)}
          onDrop={(e) => handleCardDrop('outsource', e)}
          className={`${commonCardClasses} hover:border-blue-300`}
        >
          <div>
            {renderCardHeaderControl(
              '外协工单概览',
              <Truck className="h-3.5 w-3.5" />,
              'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
            )}

            {/* Production & Inbound Progress Bars */}
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  外协入库率
                </span>
                <span className="font-mono-num text-lg font-bold text-cyan-600 dark:text-cyan-400">
                  {outsourceOrders.inboundFulfillmentRate}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                  style={{
                    width: `${outsourceOrders.inboundFulfillmentRate}%`,
                  }}
                />
              </div>
            </div>

            {/* 4 Product Quantity Breakdown Grid */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400">外协加工数</span>
                <div className="font-mono-num text-sm font-bold text-slate-800 dark:text-slate-200">
                  {outsourceOrders.totalPlanQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">已入库总数</span>
                <div className="font-mono-num text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {outsourceOrders.inboundedProductQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">已生产总数</span>
                <div className="font-mono-num text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {outsourceOrders.outsourcedProducedQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">待入库总数</span>
                <div className="font-mono-num text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {outsourceOrders.inTransitQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              待生产总数:{' '}
              <strong className="font-mono-num text-amber-600 dark:text-amber-400">
                {outsourceOrders.unprocessedPlanQty}
              </strong>{' '}
              件
            </span>
            <span>
              外协生产进度:{' '}
              <strong className="font-mono-num text-blue-600 dark:text-blue-400">
                {outsourceOrders.weightedProductionProgress}%
              </strong>
            </span>
          </div>
        </div>
      );
    }

    if (cardId === 'tasks') {
      return (
        <div
          key="tasks"
          id="metric-card-tasks"
          onDragOver={(e) => handleCardDragOver('tasks', e)}
          onDragLeave={(e) => handleCardDragLeave('tasks', e)}
          onDrop={(e) => handleCardDrop('tasks', e)}
          className={`${commonCardClasses} hover:border-emerald-300`}
        >
          <div>
            {renderCardHeaderControl(
              '生产任务概览',
              <PlayCircle className="h-3.5 w-3.5" />,
              'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            )}

            {/* Task Completion Rate */}
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  生产任务总进度
                </span>
                <span className="font-mono-num text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {tasks.completionRate}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, tasks.completionRate)}%`,
                  }}
                />
              </div>
            </div>

            {/* Quantity Metrics (4-grid for comprehensive view) */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400">排产总数量</span>
                <div className="font-mono-num text-sm font-bold text-slate-800 dark:text-slate-200">
                  {tasks.scheduledQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">已生产总数</span>
                <div className="font-mono-num text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {tasks.producedQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">生产中总数</span>
                <div className="font-mono-num text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {tasks.inProgressQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">待生产总数</span>
                <div className="font-mono-num text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {tasks.unproducedQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              计划/已产:{' '}
              <strong className="font-mono-num text-slate-700 dark:text-slate-200">
                {tasks.todayScheduledQty}
              </strong>{' '}
              /{' '}
              <strong className="font-mono-num text-emerald-600 dark:text-emerald-400">
                {tasks.todayProducedQty}
              </strong>{' '}
              件
            </span>
            <span>
              统计:{' '}
              <strong className="font-mono-num text-slate-700 dark:text-slate-300">
                {tasks.totalTaskBatches}
              </strong>{' '}
              条生产任务
            </span>
          </div>
        </div>
      );
    }

    if (cardId === 'reports') {
      return (
        <div
          key="reports"
          id="metric-card-reports"
          onDragOver={(e) => handleCardDragOver('reports', e)}
          onDragLeave={(e) => handleCardDragLeave('reports', e)}
          onDrop={(e) => handleCardDrop('reports', e)}
          className={`${commonCardClasses} hover:border-purple-300`}
        >
          <div>
            {renderCardHeaderControl(
              '报工情况概览',
              <Award className="h-3.5 w-3.5" />,
              'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
            )}

            {/* Quality Pass Rate */}
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  质检良品率
                </span>
                <span className="font-mono-num text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {workReports.goodRate}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${workReports.goodRate}%` }}
                />
              </div>
            </div>

            {/* Quantity Metrics Grid (4 items: 报工总数量, 良品总数量, 不良品总数, 待审批总数) */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400">报工总数量</span>
                <div className="font-mono-num text-sm font-bold text-slate-800 dark:text-slate-200">
                  {workReports.totalReportQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">良品总数量</span>
                <div className="font-mono-num text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {workReports.goodQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">不良品总数</span>
                <div className="font-mono-num text-sm font-bold text-rose-500">
                  {workReports.defectQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">待审批总数</span>
                <div className="font-mono-num text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {workReports.pendingAuditQty}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    件
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span
              title={`总工时 ${workReports.totalReportHours}h (已审 ${workReports.auditedHours}h, 待审 ${workReports.pendingAuditHours}h)`}
            >
              总工时:{' '}
              <strong className="font-mono-num text-slate-700 dark:text-slate-200">
                {workReports.totalReportHours}
              </strong>
              h (已审{' '}
              <strong className="font-mono-num text-emerald-600 dark:text-emerald-400">
                {workReports.auditedHours}
              </strong>
              h / 待审{' '}
              <strong className="font-mono-num text-amber-600 dark:text-amber-400">
                {workReports.pendingAuditHours}
              </strong>
              h)
            </span>
            <span>
              审批记录:{' '}
              <strong className="font-mono-num text-emerald-600 dark:text-emerald-400">
                {workReports.auditedCount}
              </strong>
              已审 /{' '}
              <strong className="font-mono-num text-amber-600 dark:text-amber-400">
                {workReports.pendingAuditCount}
              </strong>
              待审
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div id="workbench-metric-overview-grid" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {dragHandle}
          <div className="h-3.5 w-1 rounded-full bg-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            核心指标看板
          </h2>

          {/* 重置卡片顺序按钮 */}
          {isCustomOrder && (
            <button
              type="button"
              onClick={handleResetCardOrder}
              className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              title="恢复核心指标看板卡片的默认排列顺序"
            >
              <RotateCcw className="h-3 w-3" />
              <span>恢复卡片默认排列</span>
            </button>
          )}
        </div>

        {onMetricTimeRangeChange && (
          <SectionTimeFilter
            label="看板周期"
            selectedTimeRange={metricTimeRange}
            onTimeRangeChange={onMetricTimeRangeChange}
            startDate={metricStartDate}
            endDate={metricEndDate}
            onCustomDateChange={onMetricCustomDateChange}
            isSyncedWithGlobal={isMetricSyncedWithGlobal}
            onSyncWithGlobal={onMetricSyncWithGlobal}
          />
        )}
      </div>

      {/* 4 Cards Grid - dynamically rendered according to cardOrder */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cardOrder.map((cardId, index) => renderCard(cardId, index))}
      </div>
    </div>
  );
};


