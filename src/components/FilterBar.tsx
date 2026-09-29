import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { TimeRangeOption } from '../types';

interface FilterBarProps {
  selectedTimeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  onResetFilters: () => void;
  filteredCountSummary: {
    prodCount: number;
    outsourceCount: number;
    taskCount: number;
    reportCount: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedTimeRange,
  onTimeRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  onResetFilters,
  filteredCountSummary,
}) => {
  const [tempStart, setTempStart] = useState(customStartDate);
  const [tempEnd, setTempEnd] = useState(customEndDate);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setTempStart(customStartDate);
    setTempEnd(customEndDate);
  }, [customStartDate, customEndDate]);

  const handleTimePresetClick = (range: TimeRangeOption) => {
    onTimeRangeChange(range);
    setDateError(null);
  };

  const handleStartDateChange = (val: string) => {
    setTempStart(val);
    if (tempEnd && val > tempEnd) {
      setDateError('开始日期不得晚于结束日期');
    } else {
      setDateError(null);
      if (tempEnd) {
        onCustomDateChange(val, tempEnd);
      }
    }
  };

  const handleEndDateChange = (val: string) => {
    setTempEnd(val);
    if (tempStart && tempStart > val) {
      setDateError('开始日期不得晚于结束日期');
    } else {
      setDateError(null);
      if (tempStart) {
        onCustomDateChange(tempStart, val);
      }
    }
  };

  const timeRangeLabelMap: Record<TimeRangeOption, string> = {
    TODAY: '今日',
    WEEK: '本周',
    MONTH: '本月',
    ALL: '全量',
    CUSTOM: '自定义',
  };

  return (
    <div
      id="workbench-filter-bar"
      className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Left Controls: Date Presets */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Time Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            全局默认周期:
          </span>
          <div className="flex rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
            {(['TODAY', 'WEEK', 'MONTH', 'ALL', 'CUSTOM'] as TimeRangeOption[]).map((preset) => {
              const isSelected = selectedTimeRange === preset;
              return (
                <button
                  key={preset}
                  id={`filter-time-${preset}`}
                  onClick={() => handleTimePresetClick(preset)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {timeRangeLabelMap[preset]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Input (shown when CUSTOM selected) */}
        {selectedTimeRange === 'CUSTOM' && (
          <div className="flex items-center gap-1.5 animate-fadeIn">
            <input
              id="filter-custom-start-date"
              type="date"
              value={tempStart}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-7 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono-num"
            />
            <span className="text-xs text-slate-400">至</span>
            <input
              id="filter-custom-end-date"
              type="date"
              value={tempEnd}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="h-7 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono-num"
            />
          </div>
        )}
      </div>

      {/* Right Actions: Error & Reset */}
      <div className="flex items-center gap-2">
        {dateError && (
          <span className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {dateError}
          </span>
        )}

        <button
          id="filter-reset-btn"
          onClick={onResetFilters}
          title="重置筛选条件"
          className="flex h-7 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RotateCcw className="h-3 w-3" />
          重置
        </button>
      </div>
    </div>
  );
};
