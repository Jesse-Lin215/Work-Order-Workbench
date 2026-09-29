import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  Tag,
  Truck,
} from 'lucide-react';
import { CalendarEvent } from '../types';

interface CalendarScheduleProps {
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenDetail: (object: any, type: 'prod' | 'outsource' | 'task' | 'report') => void;
  dragHandle?: React.ReactNode;
}

export const CalendarSchedule: React.FC<CalendarScheduleProps> = ({
  events,
  selectedDate,
  onSelectDate,
  onOpenDetail,
  dragHandle,
}) => {
  // Calendar month state
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    return selectedDate ? selectedDate.slice(0, 7) : '2026-08';
  });

  const [year, month] = currentYearMonth.split('-').map(Number);

  // Month navigation
  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const ym = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setCurrentYearMonth(ym);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const ym = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setCurrentYearMonth(ym);
  };

  // Build calendar matrix (Monday to Sunday)
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

  const calendarDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    calendarDays.push({
      dateStr: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill 35 or 42 cells
  const remaining = 35 - calendarDays.length;
  if (remaining > 0) {
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      calendarDays.push({
        dateStr: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }
  }

  // Map events to date lookup
  const eventDateMap = new Map<string, CalendarEvent[]>();
  events.forEach((ev) => {
    if (!eventDateMap.has(ev.date)) {
      eventDateMap.set(ev.date, []);
    }
    eventDateMap.get(ev.date)!.push(ev);
  });

  // Status statistics for currently displayed month
  const monthEvents = events.filter((ev) => ev.date.startsWith(currentYearMonth));
  const monthOverdueCount = monthEvents.filter((e) => e.priorityLevel === 'OVERDUE').length;
  const monthUpcomingCount = monthEvents.filter((e) => e.priorityLevel === 'UPCOMING').length;
  const monthNormalCount = monthEvents.filter((e) => e.priorityLevel === 'NORMAL').length;
  const monthTotalCount = monthEvents.length;

  // Selected date events (sorted: Overdue -> Upcoming -> Normal, then by time)
  const selectedDayEvents = (eventDateMap.get(selectedDate) || []).slice().sort((a, b) => {
    const priorityScore = { OVERDUE: 3, UPCOMING: 2, NORMAL: 1 };
    const diff = priorityScore[b.priorityLevel] - priorityScore[a.priorityLevel];
    if (diff !== 0) return diff;
    return (a.time || '00:00').localeCompare(b.time || '00:00');
  });

  const dayOverdueCount = selectedDayEvents.filter((e) => e.priorityLevel === 'OVERDUE').length;
  const dayUpcomingCount = selectedDayEvents.filter((e) => e.priorityLevel === 'UPCOMING').length;
  const dayNormalCount = selectedDayEvents.filter((e) => e.priorityLevel === 'NORMAL').length;

  // Max 4 items displayed as per PRD Section 9
  const displayedSchedule = selectedDayEvents.slice(0, 4);

  const getTypeBadge = (type: CalendarEvent['type']) => {
    switch (type) {
      case '生产工单':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case '外协工单':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case '生产任务':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const getPriorityTag = (level: CalendarEvent['priorityLevel']) => {
    if (level === 'OVERDUE') {
      return (
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
          逾期
        </span>
      );
    }
    if (level === 'UPCOMING') {
      return (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
          临期
        </span>
      );
    }
    return (
      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
        正常
      </span>
    );
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === '生产工单') {
      onOpenDetail(event.rawObject, 'prod');
    } else if (event.type === '外协工单') {
      onOpenDetail(event.rawObject, 'outsource');
    } else if (event.type === '生产任务') {
      onOpenDetail(event.rawObject, 'task');
    }
  };

  return (
    <div
      id="workbench-calendar-schedule"
      className="grid grid-cols-1 gap-2.5 lg:grid-cols-12"
    >
      {/* 1. 生产日历 (Production Calendar Mini View) (FR-06) */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 lg:col-span-6 min-h-[350px]">
        <div>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              {dragHandle}
              <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <CalendarIcon className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                生产计划日历
              </h3>
              <span className="font-mono-num text-xs font-semibold text-slate-600 dark:text-slate-300">
                {year}年{month}月
              </span>
            </div>

            {/* Month Status Counts Summary */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                逾期 <strong className="font-mono-num font-bold">{monthOverdueCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                临期 <strong className="font-mono-num font-bold">{monthUpcomingCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                正常 <strong className="font-mono-num font-bold">{monthNormalCount}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="calendar-prev-month-btn"
                onClick={handlePrevMonth}
                title="上个月"
                className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                id="calendar-today-btn"
                onClick={() => {
                  setCurrentYearMonth('2026-08');
                  onSelectDate('2026-08-31');
                }}
                title="回到今日"
                className="h-6 rounded border border-slate-200 bg-slate-50 px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                今日
              </button>
              <button
                id="calendar-next-month-btn"
                onClick={handleNextMonth}
                title="下个月"
                className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 pb-1">
            <div>一</div>
            <div>二</div>
            <div>三</div>
            <div>四</div>
            <div>五</div>
            <div className="text-amber-500/80">六</div>
            <div className="text-amber-500/80">日</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(({ dateStr, dayNum, isCurrentMonth }) => {
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === '2026-08-31';
              const dayEvents = eventDateMap.get(dateStr) || [];
              
              // Distinct priority levels: at most 3 colors (OVERDUE, UPCOMING, NORMAL)
              const hasOverdue = dayEvents.some((e) => e.priorityLevel === 'OVERDUE');
              const hasUpcoming = dayEvents.some((e) => e.priorityLevel === 'UPCOMING');
              const hasNormal = dayEvents.some((e) => e.priorityLevel === 'NORMAL' || !e.priorityLevel);

              const distinctColors: Array<'OVERDUE' | 'UPCOMING' | 'NORMAL'> = [];
              if (hasOverdue) distinctColors.push('OVERDUE');
              if (hasUpcoming) distinctColors.push('UPCOMING');
              if (hasNormal) distinctColors.push('NORMAL');

              const remainingCount = dayEvents.length - distinctColors.length;

              return (
                <div
                  key={dateStr}
                  id={`cal-cell-${dateStr}`}
                  onClick={() => onSelectDate(dateStr)}
                  role="button"
                  tabIndex={0}
                  className={`group relative flex h-10 cursor-pointer flex-col items-center justify-between rounded-md p-1 text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs dark:bg-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700'
                      : isToday
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-700'
                      : isCurrentMonth
                      ? 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800'
                      : 'bg-transparent text-slate-300 dark:text-slate-700'
                  }`}
                >
                  <span className="font-mono-num text-[11px] leading-tight font-medium">{dayNum}</span>

                  {/* Event indicator dots: show distinct colors (max 3) + remaining count */}
                  {dayEvents.length > 0 && (
                    <div className="flex items-center justify-center gap-0.5 max-w-full overflow-hidden">
                      {distinctColors.map((colorLevel) => (
                        <span
                          key={colorLevel}
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            colorLevel === 'OVERDUE'
                              ? 'bg-rose-500'
                              : colorLevel === 'UPCOMING'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      ))}
                      {remainingCount > 0 && (
                        <span className={`text-[8px] font-mono-num font-bold leading-none ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          +{remainingCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend with explicit counts */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 逾期: <span className="font-mono-num font-bold text-rose-600 dark:text-rose-400">{monthOverdueCount}项</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 临期: <span className="font-mono-num font-bold text-amber-600 dark:text-amber-400">{monthUpcomingCount}项</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 正常: <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">{monthNormalCount}项</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400">当月共 {monthTotalCount} 个节点</span>
        </div>
      </div>

      {/* 2. 当天事项列表 (Section 9: Max 4 items, priority sorted) */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 lg:col-span-6 min-h-[350px]">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-1 rounded-full bg-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                当天事项安排
              </h3>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono-num text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {selectedDate}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              {dayOverdueCount > 0 && (
                <span className="rounded bg-rose-50 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                  {dayOverdueCount} 逾期
                </span>
              )}
              {dayUpcomingCount > 0 && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                  {dayUpcomingCount} 临期
                </span>
              )}
              {dayNormalCount > 0 && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                  {dayNormalCount} 正常
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium">
                共 {selectedDayEvents.length} 项
              </span>
            </div>
          </div>

          {displayedSchedule.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
              <CalendarIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                该日期无计划开始、计划交期或预计完成节点
              </p>
              <span className="mt-0.5 text-[10px] text-slate-400">可点击左侧日历中带有指示圆点的日期查看</span>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedSchedule.map((item) => (
                <div
                  key={item.id}
                  id={`schedule-item-${item.id}`}
                  onClick={() => handleEventClick(item)}
                  role="button"
                  tabIndex={0}
                  className="group flex cursor-pointer items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 py-2.5 px-3 transition-all hover:border-indigo-400 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Type Badge */}
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${getTypeBadge(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-num text-xs font-bold text-slate-800 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                          {item.businessCode}
                        </span>
                        {getPriorityTag(item.priorityLevel)}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="truncate font-medium">
                          {item.name}
                          {item.spec ? ` ${item.spec}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress & Status */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="font-mono-num text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.progress}%
                      </span>
                      <span className="text-[9px] text-slate-400">进度</span>
                    </div>

                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {item.status}
                    </span>

                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
