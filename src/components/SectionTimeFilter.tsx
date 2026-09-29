import React, { useState } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import { TimeRangeOption } from '../types';

interface SectionTimeFilterProps {
  label?: string;
  selectedTimeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  isSyncedWithGlobal?: boolean;
  onSyncWithGlobal?: () => void;
  className?: string;
}

export const SectionTimeFilter: React.FC<SectionTimeFilterProps> = ({
  label = '周期',
  selectedTimeRange,
  onTimeRangeChange,
  startDate = '2026-08-01',
  endDate = '2026-08-31',
  onCustomDateChange,
  isSyncedWithGlobal,
  onSyncWithGlobal,
  className = '',
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const presets: { key: TimeRangeOption; label: string }[] = [
    { key: 'TODAY', label: '今日' },
    { key: 'WEEK', label: '本周' },
    { key: 'MONTH', label: '本月' },
    { key: 'ALL', label: '全部' },
    { key: 'CUSTOM', label: '自定义' },
  ];

  const handleSelectPreset = (key: TimeRangeOption) => {
    onTimeRangeChange(key);
    if (key === 'CUSTOM') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const handleCustomSubmit = () => {
    if (onCustomDateChange && tempStart && tempEnd) {
      onCustomDateChange(tempStart, tempEnd);
      setShowCustomPicker(false);
    }
  };

  return (
    <div className={`relative flex flex-wrap items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
        <div className="flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <Calendar className="mr-1 h-3 w-3 text-indigo-500 dark:text-indigo-400" />
          <span>{label}:</span>
        </div>
        {presets.map((p) => {
          const isSelected = selectedTimeRange === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handleSelectPreset(p.key)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                isSelected
                  ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-300 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Sync Badge / Reset Button */}
      {onSyncWithGlobal && (
        <button
          type="button"
          onClick={onSyncWithGlobal}
          title={isSyncedWithGlobal ? '当前已与全局时间同步' : '一键恢复与全局时间同步'}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-all border ${
            isSyncedWithGlobal
              ? 'border-indigo-200 bg-indigo-50/60 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <RotateCcw className="h-2.5 w-2.5" />
          <span>{isSyncedWithGlobal ? '已同步全局' : '同步全局'}</span>
        </button>
      )}

      {/* Custom Date Picker Popover / Inline */}
      {selectedTimeRange === 'CUSTOM' && (
        <div className="flex items-center gap-1 text-[10px] animate-fadeIn">
          <input
            type="date"
            value={tempStart}
            onChange={(e) => setTempStart(e.target.value)}
            className="h-6 rounded border border-slate-300 bg-white px-1 text-[10px] text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono-num"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={tempEnd}
            onChange={(e) => setTempEnd(e.target.value)}
            className="h-6 rounded border border-slate-300 bg-white px-1 text-[10px] text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono-num"
          />
          {onCustomDateChange && (
            <button
              type="button"
              onClick={handleCustomSubmit}
              className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-indigo-700"
            >
              确定
            </button>
          )}
        </div>
      )}
    </div>
  );
};
