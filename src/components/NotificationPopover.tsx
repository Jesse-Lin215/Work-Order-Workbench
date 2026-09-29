import React from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  OutsourceOrder,
  ProductionOrder,
  ProductionTask,
  TodoItem,
} from '../types';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  todoItems: TodoItem[];
  prodWarnings: ProductionOrder[];
  outsourceWarnings: OutsourceOrder[];
  taskWarnings: ProductionTask[];
  onOpenDetail: (object: any, type: 'prod' | 'outsource' | 'task' | 'report') => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  todoItems,
  prodWarnings,
  outsourceWarnings,
  taskWarnings,
  onOpenDetail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end p-4 sm:p-6">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 transition-opacity"
      />

      <div
        id="notifications-popover-card"
        className="relative z-50 mt-12 w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Bell className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              工作台待办与预警提醒
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List of high priority items */}
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1 text-xs">
          {/* Overdue / Upcoming warnings */}
          {prodWarnings.map((po) => (
            <div
              key={po.id}
              onClick={() => {
                onOpenDetail(po, 'prod');
                onClose();
              }}
              className="flex cursor-pointer items-start justify-between rounded-lg border border-rose-100 bg-rose-50/60 p-2.5 hover:bg-rose-50 dark:border-rose-950 dark:bg-rose-950/30"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-300">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <span>生产工单交期预警: {po.code}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-slate-600 dark:text-slate-300">
                  {po.productName} ({po.warningReason})
                </p>
              </div>
              <span className="font-mono text-[10px] text-rose-600 font-bold">
                {po.warningType === 'OVERDUE' ? '已逾期' : '临期'}
              </span>
            </div>
          ))}

          {outsourceWarnings.map((os) => (
            <div
              key={os.id}
              onClick={() => {
                onOpenDetail(os, 'outsource');
                onClose();
              }}
              className="flex cursor-pointer items-start justify-between rounded-lg border border-amber-100 bg-amber-50/60 p-2.5 hover:bg-amber-50 dark:border-amber-950 dark:bg-amber-950/30"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>外协工单交期风险: {os.code}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-slate-600 dark:text-slate-300">
                  {os.supplierName} - {os.productName}
                </p>
              </div>
              <span className="font-mono text-[10px] text-amber-600 font-bold">
                {os.warningType === 'OVERDUE' ? '已逾期' : '即将逾期'}
              </span>
            </div>
          ))}

          {taskWarnings.map((tsk) => (
            <div
              key={tsk.id}
              onClick={() => {
                onOpenDetail(tsk, 'task');
                onClose();
              }}
              className="flex cursor-pointer items-start justify-between rounded-lg border border-rose-100 bg-rose-50/60 p-2.5 hover:bg-rose-50 dark:border-rose-950 dark:bg-rose-950/30"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-300">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <span>任务执行异常: {tsk.code}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-slate-600 dark:text-slate-300">
                  {tsk.taskName} ({tsk.warningReason})
                </p>
              </div>
              <span className="font-mono text-[10px] text-rose-600 font-bold">异常</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end border-t border-slate-100 pt-2 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
