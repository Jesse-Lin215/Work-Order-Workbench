import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  Layers,
  ShieldAlert,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import {
  OutsourceOrder,
  ProductionOrder,
  ProductionTask,
  TimeRangeOption,
} from '../types';
import { SectionTimeFilter } from './SectionTimeFilter';

// 格式化日期：最多展示到日 (YYYY-MM-DD)，不展示时分秒
const formatDateToDay = (dateStr?: string): string => {
  if (!dateStr) return '';
  const match = dateStr.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
  if (match) {
    return match[0];
  }
  return dateStr.split(' ')[0].split('T')[0];
};

interface DeliveryWarningSectionProps {
  prodOrders: ProductionOrder[];
  outsourceOrders: OutsourceOrder[];
  tasks: ProductionTask[];
  onOpenDetail: (object: any, type: 'prod' | 'outsource' | 'task' | 'report') => void;
  dragHandle?: React.ReactNode;
  // 交期预警独立时间过滤
  warningTimeRange?: TimeRangeOption;
  onWarningTimeRangeChange?: (range: TimeRangeOption) => void;
  warningStartDate?: string;
  warningEndDate?: string;
  onWarningCustomDateChange?: (start: string, end: string) => void;
  isWarningSyncedWithGlobal?: boolean;
  onWarningSyncWithGlobal?: () => void;
}

export const DeliveryWarningSection: React.FC<DeliveryWarningSectionProps> = ({
  prodOrders,
  outsourceOrders,
  tasks,
  onOpenDetail,
  dragHandle,
  warningTimeRange = 'MONTH',
  onWarningTimeRangeChange,
  warningStartDate,
  warningEndDate,
  onWarningCustomDateChange,
  isWarningSyncedWithGlobal,
  onWarningSyncWithGlobal,
}) => {
  const [warningTab, setWarningTab] = useState<'prod' | 'outsource' | 'task'>('prod');

  // 纯提示语弹窗状态
  const [warningPrompt, setWarningPrompt] = useState<{
    title: string;
    typeLabel: string;
    targetPage: string;
    code: string;
    productName: string;
    warningTypeLabel: string;
    resultText: string;
    salesOrder?: string;
    sourceOrderCode?: string;
    planEndDate?: string;
    secondaryInfo?: string;
  } | null>(null);

  // Filter valid warning items (草稿/审批中豁免)
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

  const prodOverdueCount = prodWarnings.filter((o) => o.warningType === 'OVERDUE').length;
  const outsourceOverdueCount = outsourceWarnings.filter((o) => o.warningType === 'OVERDUE').length;
  const taskOverdueCount = taskWarnings.filter((t) => t.warningType === 'OVERDUE' || t.warningType === 'NOT_STARTED_ON_TIME').length;

  const totalOverdueCount = prodOverdueCount + outsourceOverdueCount + taskOverdueCount;
  const totalUpcomingCount =
    prodWarnings.filter((o) => o.warningType === 'UPCOMING_DUE').length +
    outsourceWarnings.filter((o) => o.warningType === 'UPCOMING_DUE').length +
    taskWarnings.filter((t) => t.warningType === 'UPCOMING_DUE').length;
  const totalLagCount = prodWarnings.filter((o) => o.warningType === 'PROGRESS_LAG').length;

  return (
    <div
      id="workbench-delivery-warning"
      className="flex flex-col rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 h-[370px]"
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Header with Title & Module Time Filter */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {dragHandle}
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
              交期预警
            </h3>

            {/* Quick summary chips */}
            <div className="flex items-center gap-1.5">
              {totalOverdueCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/80 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  逾期 {totalOverdueCount}
                </span>
              )}
              {totalUpcomingCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/80 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-900">
                  临期 {totalUpcomingCount}
                </span>
              )}
              {totalLagCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200/80 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-900">
                  滞后 {totalLagCount}
                </span>
              )}
              {totalWarningsCount === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900">
                  <CheckCircle2 className="h-3 w-3" />
                  交期正常
                </span>
              )}
            </div>
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
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
            <button
              id="warning-tab-prod"
              onClick={() => setWarningTab('prod')}
              className={`relative flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                warningTab === 'prod'
                  ? 'bg-white text-slate-800 shadow-2xs dark:bg-slate-700 dark:text-slate-100 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>生产工单</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  warningTab === 'prod'
                    ? prodOverdueCount > 0
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
                    : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {prodWarnings.length}
              </span>
              {prodOverdueCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <button
              id="warning-tab-outsource"
              onClick={() => setWarningTab('outsource')}
              className={`relative flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                warningTab === 'outsource'
                  ? 'bg-white text-slate-800 shadow-2xs dark:bg-slate-700 dark:text-slate-100 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>外协工单</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  warningTab === 'outsource'
                    ? outsourceOverdueCount > 0
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
                    : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {outsourceWarnings.length}
              </span>
              {outsourceOverdueCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <button
              id="warning-tab-task"
              onClick={() => setWarningTab('task')}
              className={`relative flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                warningTab === 'task'
                  ? 'bg-white text-slate-800 shadow-2xs dark:bg-slate-700 dark:text-slate-100 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>生产任务</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  warningTab === 'task'
                    ? taskOverdueCount > 0
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
                    : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {taskWarnings.length}
              </span>
              {taskOverdueCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 逾期/滞后
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 临期提醒
            </span>
          </div>
        </div>

        {/* Warning List (一行只展示一条数据，自适应空间与清晰排版) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2">
          {warningTab === 'prod' && (
            <>
              {prodWarnings.length === 0 ? (
                <div className="col-span-full flex h-44 flex-col items-center justify-center text-xs text-slate-400">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="mt-2 font-medium text-emerald-600 dark:text-emerald-400">
                    生产工单暂无交期预警
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400">
                    工单均按计划排程推进中
                  </span>
                </div>
              ) : (
                prodWarnings.map((order) => {
                  const daysDiff = Math.round(
                    (new Date(order.planEndDate.slice(0, 10)).getTime() -
                      new Date('2026-08-31').getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const isOverdue = order.warningType === 'OVERDUE';
                  const isUpcoming = order.warningType === 'UPCOMING_DUE';
                  const lagVal = Math.max(1, (order.timeProgress || 0) - (order.totalProgress || 0));
                  const resultText = isOverdue
                    ? `超出 ${Math.max(1, Math.abs(daysDiff))} 天`
                    : isUpcoming
                    ? daysDiff <= 0
                      ? '今日到期'
                      : `临近 ${daysDiff} 天`
                    : `进度滞后 ${lagVal}%`;

                  return (
                    <div
                      key={order.id}
                      id={`warning-prod-${order.id}`}
                      onClick={() =>
                        setWarningPrompt({
                          title: '生产工单交期预警提示',
                          typeLabel: '生产工单',
                          targetPage: '工单管理',
                          code: order.code,
                          productName: order.productName,
                          warningTypeLabel: isOverdue
                            ? '已逾期'
                            : isUpcoming
                            ? '临期'
                            : '进度滞后',
                          resultText,
                          salesOrder: order.salesOrder,
                          planEndDate: formatDateToDay(order.planEndDate),
                          secondaryInfo: `${order.workshop || '总装车间'} · 计划 ${order.planQty}件`,
                        })
                      }
                      role="button"
                      tabIndex={0}
                      className={`group relative flex flex-col justify-between rounded-lg border p-2.5 transition-all cursor-pointer select-none bg-white hover:shadow-xs dark:bg-slate-900/90 ${
                        isOverdue
                          ? 'border-slate-200 border-l-[3px] border-l-rose-500 bg-rose-50/15 hover:border-rose-300 hover:bg-rose-50/30 dark:border-slate-800 dark:hover:border-rose-900/60'
                          : isUpcoming
                          ? 'border-slate-200 border-l-[3px] border-l-amber-500 bg-amber-50/15 hover:border-amber-300 hover:bg-amber-50/30 dark:border-slate-800 dark:hover:border-amber-900/60'
                          : 'border-slate-200 border-l-[3px] border-l-orange-500 bg-orange-50/15 hover:border-orange-300 hover:bg-orange-50/30 dark:border-slate-800 dark:hover:border-orange-900/60'
                      }`}
                    >
                      {/* Top Row: Tag + Code + Linked Orders + Plan Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {/* Severity Badge */}
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isOverdue
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : isUpcoming
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-orange-500 text-white shadow-2xs'
                            }`}
                          >
                            {isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
                            {isUpcoming && <Clock className="h-2.5 w-2.5" />}
                            {isOverdue
                              ? `已逾期 ${Math.max(1, Math.abs(daysDiff))}天`
                              : isUpcoming
                              ? daysDiff <= 0
                                ? '今日到期'
                                : `临近${daysDiff}天`
                              : `滞后 ${lagVal}%`}
                          </span>

                          {/* Primary Order Code */}
                          <span className="font-mono text-xs font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                            {order.code}
                          </span>

                          {/* Sales Order Tag */}
                          {order.salesOrder && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-blue-300 bg-blue-50/90 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-blue-700 shadow-2xs dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                              title="关联销售订单"
                            >
                              <ShoppingCart className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-600/80 dark:text-blue-400/80 text-[9.5px]">销售订单:</span>
                              <span className="font-bold tracking-tight">{order.salesOrder}</span>
                            </span>
                          )}
                        </div>

                        {/* Plan End Date */}
                        <div className="flex shrink-0 items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1 font-mono-num text-[11px] font-medium">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>交期: {formatDateToDay(order.planEndDate)}</span>
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:text-slate-600 dark:group-hover:text-indigo-400" />
                        </div>
                      </div>

                      {/* Bottom Row: Product Name & Specs + Accurate Progress */}
                      <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-slate-100/80 pt-1.5 dark:border-slate-800/60">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200"
                            title={order.productName}
                          >
                            {order.productName}
                          </span>
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {order.workshop || '总装车间'} · {order.planQty}件
                          </span>
                        </div>

                        {/* Progress Section */}
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              完工{' '}
                              <span className="font-mono-num font-bold text-slate-800 dark:text-slate-200">
                                {order.totalProgress}%
                              </span>
                              <span className="mx-0.5 text-slate-300 dark:text-slate-700">/</span>
                              耗时{' '}
                              <span
                                className={`font-mono-num font-bold ${
                                  (order.timeProgress || 0) > (order.totalProgress || 0)
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {order.timeProgress}%
                              </span>
                            </div>

                            {/* Mini Dual Progress Bar */}
                            <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="absolute left-0 top-0 h-full rounded-full bg-indigo-500 transition-all"
                                style={{ width: `${Math.min(100, order.totalProgress || 0)}%` }}
                              />
                              {(order.timeProgress || 0) > (order.totalProgress || 0) && (
                                <div
                                  className="absolute top-0 h-full bg-rose-500/80 transition-all"
                                  style={{
                                    left: `${Math.min(100, order.totalProgress || 0)}%`,
                                    width: `${Math.min(
                                      100 - (order.totalProgress || 0),
                                      (order.timeProgress || 0) - (order.totalProgress || 0)
                                    )}%`,
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
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
                <div className="col-span-full flex h-44 flex-col items-center justify-center text-xs text-slate-400">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="mt-2 font-medium text-emerald-600 dark:text-emerald-400">
                    外协工单暂无交期预警
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400">
                    外协厂商交期与入库均在承诺周期内
                  </span>
                </div>
              ) : (
                outsourceWarnings.map((order) => {
                  const daysDiff = Math.round(
                    (new Date(order.planEndDate.slice(0, 10)).getTime() -
                      new Date('2026-08-31').getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const isOverdue = order.warningType === 'OVERDUE';
                  const resultText = isOverdue
                    ? `超出 ${Math.max(1, Math.abs(daysDiff))} 天`
                    : daysDiff <= 0
                    ? '今日到期'
                    : `临近 ${daysDiff} 天`;
                  const outsourceSalesOrder =
                    order.salesOrder ||
                    prodOrders.find((p) => p.code === order.sourceOrderCode)?.salesOrder;

                  return (
                    <div
                      key={order.id}
                      id={`warning-outsource-${order.id}`}
                      onClick={() =>
                        setWarningPrompt({
                          title: '外协工单交期预警提示',
                          typeLabel: '外协工单',
                          targetPage: '外协管理',
                          code: order.code,
                          productName: order.productName,
                          warningTypeLabel: isOverdue ? '已逾期' : '临期',
                          resultText,
                          salesOrder: outsourceSalesOrder,
                          sourceOrderCode: order.sourceOrderCode,
                          planEndDate: formatDateToDay(order.planEndDate),
                          secondaryInfo: `${order.supplierName} · ${order.outsourceProcess || '工序外协'} (${order.planQty}件)`,
                        })
                      }
                      role="button"
                      tabIndex={0}
                      className={`group relative flex flex-col justify-between rounded-lg border p-2.5 transition-all cursor-pointer select-none bg-white hover:shadow-xs dark:bg-slate-900/90 ${
                        isOverdue
                          ? 'border-slate-200 border-l-[3px] border-l-rose-500 bg-rose-50/15 hover:border-rose-300 hover:bg-rose-50/30 dark:border-slate-800 dark:hover:border-rose-900/60'
                          : 'border-slate-200 border-l-[3px] border-l-amber-500 bg-amber-50/15 hover:border-amber-300 hover:bg-amber-50/30 dark:border-slate-800 dark:hover:border-amber-900/60'
                      }`}
                    >
                      {/* Top Row: Tag + Code + Linked Orders + Plan Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {/* Severity Badge */}
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isOverdue
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-amber-500 text-white shadow-2xs'
                            }`}
                          >
                            {isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
                            {!isOverdue && <Clock className="h-2.5 w-2.5" />}
                            {isOverdue
                              ? `已逾期 ${Math.max(1, Math.abs(daysDiff))}天`
                              : daysDiff <= 0
                              ? '今日到期'
                              : `临近${daysDiff}天`}
                          </span>

                          {/* Primary Code */}
                          <span className="font-mono text-xs font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                            {order.code}
                          </span>

                          {/* Sales Order (放在生产工单左边) */}
                          {outsourceSalesOrder && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-blue-300 bg-blue-50/90 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-blue-700 shadow-2xs dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                              title="关联销售订单"
                            >
                              <ShoppingCart className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-600/80 dark:text-blue-400/80 text-[9.5px]">销售订单:</span>
                              <span className="font-bold tracking-tight">{outsourceSalesOrder}</span>
                            </span>
                          )}

                          {/* Source Production Order */}
                          {order.sourceOrderCode && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-indigo-300 bg-indigo-50/90 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-indigo-700 shadow-2xs dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300"
                              title="来源生产工单"
                            >
                              <Layers className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
                              <span className="font-medium text-indigo-600/80 dark:text-indigo-400/80 text-[9.5px]">生产工单:</span>
                              <span className="font-bold tracking-tight">{order.sourceOrderCode}</span>
                            </span>
                          )}
                        </div>

                        {/* Plan End Date */}
                        <div className="flex shrink-0 items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1 font-mono-num text-[11px] font-medium">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>承诺: {formatDateToDay(order.planEndDate)}</span>
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:text-slate-600 dark:group-hover:text-indigo-400" />
                        </div>
                      </div>

                      {/* Bottom Row: Product + Supplier & Inbound Progress */}
                      <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-slate-100/80 pt-1.5 dark:border-slate-800/60">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200"
                            title={order.productName}
                          >
                            {order.productName}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Building2 className="h-2.5 w-2.5 text-slate-400" />
                            <span>{order.supplierName}</span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span>{order.outsourceProcess || '工序外协'}</span>
                          </span>
                        </div>

                        {/* Inbound Progress */}
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              入库进度{' '}
                              <span className="font-mono-num font-bold text-slate-800 dark:text-slate-200">
                                {order.inboundProgress}%
                              </span>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="relative h-1.5 w-18 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  order.inboundProgress >= 100
                                    ? 'bg-emerald-500'
                                    : order.inboundProgress > 0
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                                style={{ width: `${Math.min(100, order.inboundProgress)}%` }}
                              />
                            </div>
                          </div>
                        </div>
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
                <div className="col-span-full flex h-44 flex-col items-center justify-center text-xs text-slate-400">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="mt-2 font-medium text-emerald-600 dark:text-emerald-400">
                    生产任务暂无交期预警
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400">
                    各车间工序派工及加工进度正常
                  </span>
                </div>
              ) : (
                taskWarnings.map((task) => {
                  const baseDate =
                    task.estimatedEndTime || task.planStartTime || '2026-08-31';
                  const daysDiff = Math.round(
                    (new Date(baseDate.slice(0, 10)).getTime() -
                      new Date('2026-08-31').getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const isNotStarted = task.warningType === 'NOT_STARTED_ON_TIME';
                  const isOverdue = task.warningType === 'OVERDUE';
                  const resultText = isNotStarted
                    ? `未按时开工 (延期 ${Math.max(1, Math.abs(daysDiff))} 天)`
                    : isOverdue
                    ? `超出 ${Math.max(1, Math.abs(daysDiff))} 天`
                    : daysDiff <= 0
                    ? '今日到期'
                    : `临近 ${daysDiff} 天`;

                  return (
                    <div
                      key={task.id}
                      id={`warning-task-${task.id}`}
                      onClick={() =>
                        setWarningPrompt({
                          title: '生产任务交期预警提示',
                          typeLabel: '生产任务',
                          targetPage: '任务排程/报工管理',
                          code: task.code,
                          productName: task.taskName,
                          warningTypeLabel: isNotStarted
                            ? '未开工'
                            : isOverdue
                            ? '已逾期'
                            : '临期',
                          resultText,
                          sourceOrderCode: task.sourceOrderCode,
                          salesOrder: task.salesOrder,
                          planEndDate: formatDateToDay(task.estimatedEndTime || task.planStartTime),
                          secondaryInfo: `${task.workstationName || '工位'} · ${task.assignee || '主操'}`,
                        })
                      }
                      role="button"
                      tabIndex={0}
                      className={`group relative flex flex-col justify-between rounded-lg border p-2.5 transition-all cursor-pointer select-none bg-white hover:shadow-xs dark:bg-slate-900/90 ${
                        isOverdue || isNotStarted
                          ? 'border-slate-200 border-l-[3px] border-l-rose-500 bg-rose-50/15 hover:border-rose-300 hover:bg-rose-50/30 dark:border-slate-800 dark:hover:border-rose-900/60'
                          : 'border-slate-200 border-l-[3px] border-l-amber-500 bg-amber-50/15 hover:border-amber-300 hover:bg-amber-50/30 dark:border-slate-800 dark:hover:border-amber-900/60'
                      }`}
                    >
                      {/* Top Row: Tag + Code + Linked Orders + Plan Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {/* Severity Badge */}
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isOverdue || isNotStarted
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-amber-500 text-white shadow-2xs'
                            }`}
                          >
                            {(isOverdue || isNotStarted) && <AlertTriangle className="h-2.5 w-2.5" />}
                            {!isOverdue && !isNotStarted && <Clock className="h-2.5 w-2.5" />}
                            {isNotStarted
                              ? '未按时开工'
                              : isOverdue
                              ? `已逾期 ${Math.max(1, Math.abs(daysDiff))}天`
                              : daysDiff <= 0
                              ? '今日到期'
                              : `临近${daysDiff}天`}
                          </span>

                          {/* Primary Code */}
                          <span className="font-mono text-xs font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                            {task.code}
                          </span>

                          {/* Sales Order (放在生产工单左边) */}
                          {task.salesOrder && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-blue-300 bg-blue-50/90 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-blue-700 shadow-2xs dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                              title="关联销售订单"
                            >
                              <ShoppingCart className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-600/80 dark:text-blue-400/80 text-[9.5px]">销售订单:</span>
                              <span className="font-bold tracking-tight">{task.salesOrder}</span>
                            </span>
                          )}

                          {/* Source Production Order */}
                          {task.sourceOrderCode && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-indigo-300 bg-indigo-50/90 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-indigo-700 shadow-2xs dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300"
                              title="来源生产工单"
                            >
                              <Layers className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
                              <span className="font-medium text-indigo-600/80 dark:text-indigo-400/80 text-[9.5px]">生产工单:</span>
                              <span className="font-bold tracking-tight">{task.sourceOrderCode}</span>
                            </span>
                          )}
                        </div>

                        {/* Plan End Date */}
                        <div className="flex shrink-0 items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1 font-mono-num text-[11px] font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>预计: {formatDateToDay(task.estimatedEndTime || task.planStartTime)}</span>
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:text-slate-600 dark:group-hover:text-indigo-400" />
                        </div>
                      </div>

                      {/* Bottom Row: Task Name + Workstation/Assignee & Progress */}
                      <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-slate-100/80 pt-1.5 dark:border-slate-800/60">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200"
                            title={task.taskName}
                          >
                            {task.taskName}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <User className="h-2.5 w-2.5 text-slate-400" />
                            <span>{task.workstationName || '工位'}</span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span>{task.assignee || '主操'}</span>
                          </span>
                        </div>

                        {/* Task Progress */}
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              任务进度{' '}
                              <span className="font-mono-num font-bold text-indigo-600 dark:text-indigo-400">
                                {task.taskProgress}%
                              </span>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="relative h-1.5 w-18 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-indigo-500 transition-all"
                                style={{ width: `${Math.min(100, task.taskProgress)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>* 生产工单、外协工单与生产任务交期动态诊断 · 点击卡片查看处置建议</span>
          <span>独立时间过滤</span>
        </div>
      </div>

      {/* 交期预警精准处置与全景详情弹窗 */}
      {warningPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {warningPrompt.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    交期风险诊断与一键调度处置建议
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWarningPrompt(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Structured Metadata Grid */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400">单据对象与编码</span>
                <div className="mt-1 flex items-center gap-1.5 font-mono font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  <span className="rounded bg-slate-200/80 px-1 py-0.2 text-[10px] font-medium font-sans text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {warningPrompt.typeLabel}
                  </span>
                  <span>{warningPrompt.code}</span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400">预警诊断结果</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded bg-rose-100 px-1.5 py-0.2 font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {warningPrompt.warningTypeLabel}
                  </span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    {warningPrompt.resultText}
                  </span>
                </div>
              </div>

              {warningPrompt.salesOrder && (
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400">关联销售订单</span>
                  <div className="mt-1 font-mono font-bold tracking-tight text-blue-600 dark:text-blue-400">
                    {warningPrompt.salesOrder}
                  </div>
                </div>
              )}

              {warningPrompt.sourceOrderCode && (
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400">来源生产工单</span>
                  <div className="mt-1 font-mono font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                    {warningPrompt.sourceOrderCode}
                  </div>
                </div>
              )}

              {warningPrompt.planEndDate && (
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400">
                    {warningPrompt.typeLabel === '外协工单'
                      ? '外协承诺交期'
                      : warningPrompt.typeLabel === '生产任务'
                      ? '预计完成时间'
                      : '计划完工交期'}
                  </span>
                  <div className="mt-1 font-mono font-bold tracking-tight text-slate-800 dark:text-slate-200">
                    {formatDateToDay(warningPrompt.planEndDate)}
                  </div>
                </div>
              )}

              <div className="col-span-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400">产品 / 工序及执行环境</span>
                <div className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                  {warningPrompt.productName}
                  {warningPrompt.secondaryInfo && (
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                      ({warningPrompt.secondaryInfo})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Advice Box */}
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>处置建议</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                {warningPrompt.typeLabel === '生产工单'
                  ? '请排查该工单对应车间前置工序瓶颈或设备稼动率，可调配富余班组进行产能增援，避免逾期交付影响销售订单发货。'
                  : warningPrompt.typeLabel === '外协工单'
                  ? '该外协委外单据接近或已超过承诺交期，请立即联系外协厂家跟单员确认加工出货进度并下发加急催收通知。'
                  : '该任务未按计划开工或加工滞后，请通知现场班组长落实物料齐套状态并优先分配工位派工。'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setWarningPrompt(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                我知道了
              </button>
              <button
                onClick={() => {
                  const prompt = warningPrompt;
                  setWarningPrompt(null);
                  if (prompt.typeLabel === '生产工单') {
                    const target = prodOrders.find((o) => o.code === prompt.code);
                    if (target) onOpenDetail(target, 'prod');
                  } else if (prompt.typeLabel === '外协工单') {
                    const target = outsourceOrders.find((o) => o.code === prompt.code);
                    if (target) onOpenDetail(target, 'outsource');
                  } else if (prompt.typeLabel === '生产任务') {
                    const target = tasks.find((t) => t.code === prompt.code);
                    if (target) onOpenDetail(target, 'task');
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                查看单据全景详情
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

