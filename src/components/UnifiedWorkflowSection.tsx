import React from 'react';
import {
  Activity,
  ChevronRight,
  Clock,
  Factory,
  Truck,
} from 'lucide-react';
import { TimeRangeOption, TodoItem } from '../types';
import { SectionTimeFilter } from './SectionTimeFilter';

interface PipelineStep {
  key: string;
  label: string;
  count: number;
  targetTab: string;
  statusFilter: string;
  desc?: string;
  isPending?: boolean;
}

interface OutsourceStep {
  key: string;
  label: string;
  count: number;
  statusFilter: string;
  targetTab?: string;
  desc?: string;
  isPending?: boolean;
}

interface UnifiedWorkflowSectionProps {
  todoItems: TodoItem[];
  onTodoClick: (category: TodoItem['category']) => void;
  internalSteps: PipelineStep[];
  outsourceSteps: OutsourceStep[];
  dragHandle?: React.ReactNode;
  onStepClick: (
    tab: 'prod' | 'outsource' | 'task' | 'report',
    filter: string,
    key?: string
  ) => void;
  // 流转与待办中心时间过滤
  workflowTimeRange?: TimeRangeOption;
  onWorkflowTimeRangeChange?: (range: TimeRangeOption) => void;
  workflowStartDate?: string;
  workflowEndDate?: string;
  onWorkflowCustomDateChange?: (start: string, end: string) => void;
  isWorkflowSyncedWithGlobal?: boolean;
  onWorkflowSyncWithGlobal?: () => void;
}

export const UnifiedWorkflowSection: React.FC<UnifiedWorkflowSectionProps> = ({
  todoItems,
  internalSteps,
  outsourceSteps,
  dragHandle,
  onStepClick,
  workflowTimeRange = 'MONTH',
  onWorkflowTimeRangeChange,
  workflowStartDate,
  workflowEndDate,
  onWorkflowCustomDateChange,
  isWorkflowSyncedWithGlobal,
  onWorkflowSyncWithGlobal,
}) => {
  const totalPending = todoItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <section
      id="workbench-unified-workflow"
      className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900"
    >
      {/* 统一顶栏 (Unified Header) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          {dragHandle}
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
            业务流转与待办中心
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onWorkflowTimeRangeChange && (
            <SectionTimeFilter
              label="流转周期"
              selectedTimeRange={workflowTimeRange}
              onTimeRangeChange={onWorkflowTimeRangeChange}
              startDate={workflowStartDate}
              endDate={workflowEndDate}
              onCustomDateChange={onWorkflowCustomDateChange}
              isSyncedWithGlobal={isWorkflowSyncedWithGlobal}
              onSyncWithGlobal={onWorkflowSyncWithGlobal}
            />
          )}
        </div>
      </div>

      {/* 融合主体：生产工单流转 (7节点) + 外协工单流转 (4节点) */}
      <div className="space-y-3">
        {/* 1. 生产工单流转 (7个阶段) */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Factory className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                生产工单流转
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">点击定位单据或滑出审批</span>
          </div>

          {/* 7 个连贯阶段 */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {internalSteps.map((step, idx) => {
              const hasCount = step.count > 0;
              const isFinished = step.key === 'PROD_COMPLETED' || step.key === 'REPORT_AUDITED';

              return (
                <div
                  key={step.key}
                  onClick={() =>
                    onStepClick(
                      step.targetTab as 'prod' | 'outsource' | 'task' | 'report',
                      step.statusFilter,
                      step.key
                    )
                  }
                  role="button"
                  tabIndex={0}
                  title={step.desc || step.label}
                  className="group relative flex cursor-pointer flex-col justify-between rounded-md border border-slate-200 bg-white p-2 text-center transition-all min-h-[64px] hover:border-indigo-400 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="font-mono text-[9px] font-semibold text-slate-400">
                      0{idx + 1}
                    </span>
                    {idx < internalSteps.length - 1 && (
                      <ChevronRight className="hidden h-3 w-3 text-slate-300 group-hover:text-indigo-400 dark:text-slate-600 lg:block pointer-events-none" />
                    )}
                  </div>

                  <div className="my-1">
                    <span
                      className={`font-mono-num text-lg font-bold ${
                        hasCount
                          ? isFinished
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {step.count}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-400 truncate w-full">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 外协工单流转 (4个阶段) */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                外协工单流转
              </h3>
            </div>
          </div>

          {/* 4 个阶段 */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {outsourceSteps.map((step, idx) => {
              const hasCount = step.count > 0;
              const isCompleted = step.key === 'OUTSOURCE_COMPLETED';

              return (
                <div
                  key={step.key}
                  onClick={() => onStepClick('outsource', step.statusFilter, step.key)}
                  role="button"
                  tabIndex={0}
                  title={step.desc || step.label}
                  className="group relative flex cursor-pointer flex-col justify-between rounded-md border border-slate-200 bg-white p-2 text-center transition-all min-h-[64px] hover:border-blue-400 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="font-mono text-[9px] font-semibold text-slate-400">
                      0{idx + 1}
                    </span>
                    {idx < outsourceSteps.length - 1 && (
                      <ChevronRight className="hidden h-3 w-3 text-slate-300 group-hover:text-blue-400 dark:text-slate-600 sm:block pointer-events-none" />
                    )}
                  </div>

                  <div className="my-1">
                    <span
                      className={`font-mono-num text-lg font-bold ${
                        hasCount
                          ? isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {step.count}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400 truncate w-full">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
