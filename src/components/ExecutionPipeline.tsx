import React from 'react';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock,
  Factory,
  Layers,
  Sparkles,
  Truck,
  Workflow,
} from 'lucide-react';

interface InternalStep {
  key: string;
  label: string;
  count: number;
  targetTab: string;
  statusFilter: string;
  desc?: string;
}

interface OutsourceStep {
  key: string;
  label: string;
  count: number;
  statusFilter: string;
  desc?: string;
}

interface ExecutionPipelineProps {
  internalSteps: InternalStep[];
  outsourceSteps: OutsourceStep[];
  onStepClick: (tab: 'prod' | 'outsource' | 'task' | 'report', statusFilter: string) => void;
}

export const ExecutionPipeline: React.FC<ExecutionPipelineProps> = ({
  internalSteps,
  outsourceSteps,
  onStepClick,
}) => {
  return (
    <div
      id="workbench-execution-pipeline"
      className="grid grid-cols-1 gap-2.5 lg:grid-cols-12"
    >
      {/* 1. 内部在制生产流转 (Internal WIP Production Flow) - 5 Core Operational Nodes */}
      <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Factory className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
              生产工单流转
            </h3>
            <span className="text-[10px] text-slate-400 hidden xl:inline">
              (进行中 → 待派工 → 生产中 → 报工已核验 → 完工入库)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">产线实时流转状态</span>
        </div>

        {/* Step Nodes Row: 5 columns on large screen */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {internalSteps.map((step, idx) => {
            const hasCount = step.count > 0;
            const isFinished = step.key === 'PROD_COMPLETED' || step.key === 'REPORT_AUDITED';

            return (
              <div
                key={step.key}
                id={`pipeline-step-${step.key}`}
                onClick={() =>
                  onStepClick(
                    step.targetTab as 'prod' | 'outsource' | 'task' | 'report',
                    step.statusFilter
                  )
                }
                role="button"
                tabIndex={0}
                className="group relative flex cursor-pointer flex-col items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 py-2.5 px-2 text-center transition-all hover:border-indigo-400 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500 dark:hover:bg-slate-800 min-h-[70px]"
                title={step.desc || step.label}
              >
                {/* Node order indicator */}
                <div className="w-full flex items-center justify-between">
                  <span className="font-mono text-[9px] font-semibold text-slate-400">
                    阶段 {idx + 1}
                  </span>
                  {idx < internalSteps.length - 1 && (
                    <ChevronRight className="hidden h-3 w-3 text-slate-300 group-hover:text-indigo-400 dark:text-slate-600 lg:block pointer-events-none" />
                  )}
                </div>

                <span
                  className={`my-1 font-mono-num text-lg font-bold ${
                    hasCount
                      ? isFinished
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {step.count}
                </span>

                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-400 truncate w-full px-0.5">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 外协交付流转链路 (Outsourced Delivery Flow) - 3 Core Operational Nodes */}
      <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Truck className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
              外协工单流转
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">供应商委外交付流</span>
        </div>

        {/* 3 columns on small & large screens */}
        <div className="grid grid-cols-3 gap-2">
          {outsourceSteps.map((step, idx) => {
            const hasCount = step.count > 0;
            const isCompleted = step.key === 'OUTSOURCE_COMPLETED';

            return (
              <div
                key={step.key}
                id={`pipeline-outsource-step-${step.key}`}
                onClick={() => onStepClick('outsource', step.statusFilter)}
                role="button"
                tabIndex={0}
                className="group relative flex cursor-pointer flex-col items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 py-2.5 px-2 text-center transition-all hover:border-blue-400 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-500 dark:hover:bg-slate-800 min-h-[70px]"
                title={step.desc || step.label}
              >
                <div className="w-full flex items-center justify-between">
                  <span className="font-mono text-[9px] font-semibold text-slate-400">
                    阶段 {idx + 1}
                  </span>
                  {idx < outsourceSteps.length - 1 && (
                    <ChevronRight className="hidden h-3 w-3 text-slate-300 group-hover:text-blue-400 dark:text-slate-600 sm:block pointer-events-none" />
                  )}
                </div>

                <span
                  className={`my-1 font-mono-num text-lg font-bold ${
                    hasCount
                      ? isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {step.count}
                </span>

                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400 truncate w-full px-0.5">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
