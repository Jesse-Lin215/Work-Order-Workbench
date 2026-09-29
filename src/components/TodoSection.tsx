import React from 'react';
import {
  ArrowUpRight,
  FileCheck,
  FileText,
  PlayCircle,
  Truck,
} from 'lucide-react';
import { TodoItem } from '../types';

interface TodoSectionProps {
  todoItems: TodoItem[];
  onTodoClick: (item: TodoItem) => void;
}

export const TodoSection: React.FC<TodoSectionProps> = ({
  todoItems,
  onTodoClick,
}) => {
  const getIcon = (category: TodoItem['category']) => {
    switch (category) {
      case 'PROD_APPROVAL':
        return <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'OUTSOURCE_APPROVAL':
        return <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'REPORT_APPROVAL':
        return <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case 'PENDING_TASK':
        return <PlayCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getCardStyle = (badgeType: TodoItem['badgeType']) => {
    switch (badgeType) {
      case 'danger':
        return 'border-rose-200 bg-rose-50/40 hover:border-rose-400 hover:bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/20 dark:hover:border-rose-800';
      case 'warning':
        return 'border-amber-200 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:border-amber-800';
      case 'info':
        return 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-400 hover:bg-indigo-50/80 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:hover:border-indigo-800';
      default:
        return 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700';
    }
  };

  return (
    <div id="workbench-todo-section" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-1 rounded-full bg-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            待办中心 (审批与派工)
          </h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            {todoItems.reduce((sum, item) => sum + item.count, 0)} 项待处理
          </span>
        </div>
        <span className="text-[11px] text-slate-400">点击卡片滑出抽屉进行即时审批或开工处理</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {todoItems.map((item) => {
          const hasCount = item.count > 0;
          return (
            <div
              key={item.id}
              id={`todo-card-${item.id}`}
              onClick={() => onTodoClick(item)}
              role="button"
              tabIndex={0}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-lg border p-3 transition-all duration-200 shadow-2xs min-h-[86px] ${getCardStyle(
                item.badgeType
              )}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white shadow-2xs dark:bg-slate-800">
                    {getIcon(item.category)}
                  </div>
                  <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-baseline gap-0.5 shrink-0 font-mono-num">
                  <span
                    className={`text-lg font-bold ${
                      hasCount
                        ? item.badgeType === 'danger'
                          ? 'text-rose-600 dark:text-rose-400'
                          : item.badgeType === 'warning'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {item.count}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.unit}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-200/50 pt-1.5 text-slate-500 dark:border-slate-800/50 dark:text-slate-400">
                <p className="truncate pr-1.5 text-[11px]">
                  {item.desc}
                </p>
                <div className="flex items-center gap-0.5 shrink-0 text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  <span>处理</span>
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
