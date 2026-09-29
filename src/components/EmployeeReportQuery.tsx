import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  Download,
  Award,
  ExternalLink,
  X,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Info,
  ArrowRight,
  Filter,
  Table,
  TrendingUp,
  Building2,
  Activity,
  Layers,
  Search,
} from 'lucide-react';
import { WorkReportRecord } from '../types';

interface EmployeeReportQueryProps {
  reports: WorkReportRecord[];
  onNavigateToReport?: () => void;
  dragHandle?: React.ReactNode;
}

interface EmployeeSummary {
  reporter: string;
  department: string;
  reportCount: number;
  workHours: number;
  totalHours: number;
  avgProgress: number;
  goodQty: number;
  defectQty: number;
  totalReportQty: number;
  passRate: number;
  records: WorkReportRecord[];
}

type SortField = 'workHours' | 'reportCount' | 'totalHours' | 'goodQty' | 'totalReportQty' | 'passRate';
type SortOrder = 'desc' | 'asc' | null;

// 员工与部门关联映射
const EMPLOYEE_DEPARTMENT_MAP: Record<string, string> = {
  '刘伟': '总装车间',
  '张强': '总装车间',
  '赵刚': '总装车间',
  '徐宏': '精密机加部',
  '张建军': '精密机加部',
  '黄志远': '精密机加部',
  '郭振海': '电子装配部',
  '陈明': '电子装配部',
  '孙立新': '品质检验部',
  '李娜': '品质检验部',
};

// 获取记录对应的部门
export const getEmployeeDepartment = (record: WorkReportRecord): string => {
  if (record.department) return record.department;
  return EMPLOYEE_DEPARTMENT_MAP[record.reporter] || '总装车间';
};

type TimePresetOption = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

const PRESET_LABEL_MAP: Record<TimePresetOption, string> = {
  ALL: '全部',
  TODAY: '今日',
  WEEK: '本周',
  MONTH: '本月',
  CUSTOM: '自定义区间',
};

export const EmployeeReportQuery: React.FC<EmployeeReportQueryProps> = ({
  reports,
  onNavigateToReport,
  dragHandle,
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [timeRangePreset, setTimeRangePreset] = useState<TimePresetOption>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // 获取演示数据中的最大最新日期作为计算基准
  const latestReportDate = useMemo(() => {
    if (!reports || reports.length === 0) {
      return new Date().toISOString().slice(0, 10);
    }
    let maxDate = '2026-08-31';
    reports.forEach(r => {
      const d = r.reportTime.split(' ')[0];
      if (d > maxDate) maxDate = d;
    });
    return maxDate;
  }, [reports]);

  // 快捷时间范围选择切换 (ALL / TODAY / WEEK / MONTH / CUSTOM)
  const handleSelectPreset = (preset: TimePresetOption) => {
    setTimeRangePreset(preset);
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const base = new Date(latestReportDate);
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'TODAY') {
      setStartDate(latestReportDate);
      setEndDate(latestReportDate);
    } else if (preset === 'WEEK') {
      const dayOfWeek = base.getDay() || 7;
      const monday = new Date(base);
      monday.setDate(base.getDate() - dayOfWeek + 1);
      const sunday = new Date(base);
      sunday.setDate(base.getDate() + (7 - dayOfWeek));
      setStartDate(formatDate(monday));
      setEndDate(formatDate(sunday));
    } else if (preset === 'MONTH') {
      const y = base.getFullYear();
      const m = base.getMonth();
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
    }
  };

  const handleCustomStartDate = (val: string) => {
    setStartDate(val);
    setTimeRangePreset('CUSTOM');
  };

  const handleCustomEndDate = (val: string) => {
    setEndDate(val);
    setTimeRangePreset('CUSTOM');
  };

  // 图表视图指标切换 ('hours' | 'quantity' | 'passRate')
  const [trendMetric, setTrendMetric] = useState<'hours' | 'quantity' | 'passRate'>('hours');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  // 排序状态
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // 小弹窗提示 - 跳转指引
  const [promptSummary, setPromptSummary] = useState<EmployeeSummary | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 部门选项列表
  const departmentOptions = [
    { value: 'ALL', label: '全部部门' },
    { value: '总装车间', label: '总装车间' },
    { value: '精密机加部', label: '精密机加部' },
    { value: '电子装配部', label: '电子装配部' },
    { value: '品质检验部', label: '品质检验部' },
  ];

  // 基础过滤 (按部门与时间段过滤)
  const baseFilteredReports = useMemo(() => {
    return reports.filter(r => {
      const validStatus = r.status === '待审核' || r.status === '已完成';
      const dept = getEmployeeDepartment(r);
      const matchDept = selectedDepartment === 'ALL' || dept === selectedDepartment;
      const rDate = r.reportTime.split(' ')[0];
      const matchStart = startDate ? rDate >= startDate : true;
      const matchEnd = endDate ? rDate <= endDate : true;
      return validStatus && matchDept && matchStart && matchEnd;
    }).sort((a, b) => b.reportTime.localeCompare(a.reportTime));
  }, [reports, selectedDepartment, startDate, endDate]);

  // 按员工汇总聚合 (表格显示全部符合部门和时间的员工)
  const employeeSummaries = useMemo(() => {
    const map = new Map<string, WorkReportRecord[]>();
    baseFilteredReports.forEach(r => {
      if (!map.has(r.reporter)) {
        map.set(r.reporter, []);
      }
      map.get(r.reporter)!.push(r);
    });

    const list: EmployeeSummary[] = [];
    map.forEach((records, reporter) => {
      const dept = getEmployeeDepartment(records[0]);
      const totalHours = records.reduce((s, r) => s + r.reportHours, 0);
      const goodQty = records.reduce((s, r) => s + r.goodQty, 0);
      const defectQty = records.reduce((s, r) => s + r.defectQty, 0);
      const totalReportQty = goodQty + defectQty;
      const passRate = totalReportQty > 0 ? Number(((goodQty / totalReportQty) * 100).toFixed(1)) : 100;
      const avgProgress = Math.round(
        records.reduce((s, r) => s + (r.progress != null ? r.progress : 0), 0) / records.length
      );
      const uniqueDays = new Set(records.map(r => r.reportTime.split(' ')[0])).size;
      const workHours = Math.max(8 * uniqueDays, Math.ceil(totalHours));

      list.push({
        reporter,
        department: dept,
        reportCount: records.length,
        workHours,
        totalHours: Number(totalHours.toFixed(1)),
        avgProgress,
        goodQty,
        defectQty,
        totalReportQty,
        passRate,
        records: records.sort((a, b) => b.reportTime.localeCompare(a.reportTime)),
      });
    });

    return list;
  }, [baseFilteredReports]);

  // 左侧员工列表搜索筛选
  const filteredLeftEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeeSummaries;
    const q = employeeSearch.toLowerCase();
    return employeeSummaries.filter(s =>
      s.reporter.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  }, [employeeSummaries, employeeSearch]);

  // 当员工汇总发生变化时，如果未选择或所选员工不在当前列表中，默认选中第一位
  useEffect(() => {
    if (employeeSummaries.length > 0) {
      if (!selectedEmployee || !employeeSummaries.some(s => s.reporter === selectedEmployee)) {
        setSelectedEmployee(employeeSummaries[0].reporter);
      }
    } else {
      setSelectedEmployee('');
    }
  }, [employeeSummaries, selectedEmployee]);

  // 当前选中的员工汇总信息
  const selectedEmployeeSummary = useMemo(() => {
    if (!selectedEmployee) return employeeSummaries[0] || null;
    return employeeSummaries.find(s => s.reporter === selectedEmployee) || employeeSummaries[0] || null;
  }, [employeeSummaries, selectedEmployee]);

  // 图表使用的报工记录 (只展示当前选中员工的记录)
  const chartFilteredReports = useMemo(() => {
    if (!selectedEmployeeSummary) return [];
    return baseFilteredReports.filter(r => r.reporter === selectedEmployeeSummary.reporter);
  }, [baseFilteredReports, selectedEmployeeSummary]);

  // 按日期聚合的三种线性数据点 (工时、产量、良品率) - 生成连续天数趋势
  const dailyTrendPoints = useMemo(() => {
    const dateMap = new Map<string, { hours: number; goodQty: number; defectQty: number; count: number }>();

    chartFilteredReports.forEach(r => {
      const dStr = r.reportTime.split(' ')[0];
      if (!dateMap.has(dStr)) {
        dateMap.set(dStr, { hours: 0, goodQty: 0, defectQty: 0, count: 0 });
      }
      const entry = dateMap.get(dStr)!;
      entry.hours += r.reportHours;
      entry.goodQty += r.goodQty;
      entry.defectQty += r.defectQty;
      entry.count += 1;
    });

    const reportDates = Array.from(dateMap.keys()).sort();
    
    // 确定时间区间的起止日期
    let startDStr = startDate;
    let endDStr = endDate;

    if (!startDStr) {
      startDStr = reportDates[0] || '2026-08-15';
    }
    if (!endDStr) {
      endDStr = reportDates[reportDates.length - 1] || '2026-08-31';
    }

    // 生成起止日期之间的连续每日列表
    const fullDateList: string[] = [];
    const curr = new Date(startDStr);
    const last = new Date(endDStr);
    
    if (!isNaN(curr.getTime()) && !isNaN(last.getTime()) && curr <= last) {
      const temp = new Date(curr);
      while (temp <= last) {
        const y = temp.getFullYear();
        const m = String(temp.getMonth() + 1).padStart(2, '0');
        const d = String(temp.getDate()).padStart(2, '0');
        fullDateList.push(`${y}-${m}-${d}`);
        temp.setDate(temp.getDate() + 1);
      }
    } else {
      fullDateList.push(...(reportDates.length > 0 ? reportDates : ['2026-08-15']));
    }

    return fullDateList.map(d => {
      const item = dateMap.get(d) || { hours: 0, goodQty: 0, defectQty: 0, count: 0 };
      const totalQty = item.goodQty + item.defectQty;
      const passRate = totalQty > 0 ? Number(((item.goodQty / totalQty) * 100).toFixed(1)) : 100;
      const parts = d.split('-');
      const displayDate = parts.length === 3 ? `${parts[1]}-${parts[2]}` : d;

      return {
        date: d,
        displayDate,
        hours: Number(item.hours.toFixed(1)),
        goodQty: item.goodQty,
        defectQty: item.defectQty,
        totalQty,
        passRate,
        count: item.count,
        hasRecord: item.count > 0,
      };
    });
  }, [chartFilteredReports, startDate, endDate]);

  // 排序后的员工列表
  const sortedSummaries = useMemo(() => {
    if (!sortField || !sortOrder) {
      return [...employeeSummaries].sort((a, b) => b.totalHours - a.totalHours);
    }
    return [...employeeSummaries].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortOrder === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }, [employeeSummaries, sortField, sortOrder]);

  // 点击切换排序模式: desc -> asc -> null (取消)
  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortField(null);
      setSortOrder(null);
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 渲染表头排序指示按钮
  const renderSortHeader = (label: string, field: SortField) => {
    const isActive = sortField === field && sortOrder !== null;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="group inline-flex items-center gap-1.5 font-medium transition-colors hover:text-teal-600 focus:outline-none dark:hover:text-teal-400"
        title={`点击排序：当前 ${isActive ? (sortOrder === 'desc' ? '降序' : '升序') : '默认'}`}
      >
        <span className={isActive ? 'font-bold text-teal-700 dark:text-teal-300' : ''}>{label}</span>
        <span className="inline-flex items-center">
          {isActive ? (
            sortOrder === 'asc' ? (
              <ChevronUp className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 font-bold" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 font-bold" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
          )}
        </span>
      </button>
    );
  };

  // 当过滤条件改变时，回到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepartment, startDate, endDate, sortField, sortOrder]);

  // 总体统计数据
  const totalHours = useMemo(() => baseFilteredReports.reduce((sum, r) => sum + r.reportHours, 0), [baseFilteredReports]);
  const totalGood = useMemo(() => baseFilteredReports.reduce((sum, r) => sum + r.goodQty, 0), [baseFilteredReports]);
  const totalDefect = useMemo(() => baseFilteredReports.reduce((sum, r) => sum + r.defectQty, 0), [baseFilteredReports]);
  const overallPassRate = useMemo(() => {
    const totalQty = totalGood + totalDefect;
    return totalQty > 0 ? ((totalGood / totalQty) * 100).toFixed(1) : '100.0';
  }, [totalGood, totalDefect]);

  // 导出汇总CSV
  const handleExportSummary = () => {
    const headers = ['员工姓名', '所属部门', '工作时长(h)', '报工次数', '报工工时(h)', '良品总数', '不良品总数', '报工总数', '良品率(%)'];
    const csvRows = sortedSummaries.map(s => [
      s.reporter,
      s.department,
      s.workHours,
      s.reportCount,
      s.totalHours,
      s.goodQty,
      s.defectQty,
      s.totalReportQty,
      `${s.passRate}%`
    ].map(val => `"${val}"`).join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `报工统计情况汇总表_${selectedDepartment}_${startDate || '起'}_${endDate || '止'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 处理直接跳转到【生产任务-报工记录】
  const handleNavigateToTaskReport = () => {
    setPromptSummary(null);
    if (onNavigateToReport) {
      onNavigateToReport();
    } else {
      const el = document.getElementById('workbench-key-data-table');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 分页数据 (基于员工汇总列表)
  const totalPages = Math.ceil(sortedSummaries.length / pageSize);
  const paginatedSummaries = sortedSummaries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      {/* 头部与筛选栏 */}
      <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2.5">
          {dragHandle}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
            <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">报工统计情况</h2>
            <p className="text-xs text-slate-500">按部门与时间维度汇总工时、产量与良品率，支持表格明细与三种线性图表切换</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 部门筛选 */}
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800/50">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">部门:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none dark:text-slate-200 cursor-pointer"
            >
              {departmentOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 日期范围筛选 (快捷选项 + 自定义区间输入) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50/50 p-0.5 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="flex items-center gap-1 px-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                周期:
              </span>
              {(['ALL', 'TODAY', 'WEEK', 'MONTH', 'CUSTOM'] as TimePresetOption[]).map((preset) => {
                const isActive = timeRangePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-2xs dark:bg-teal-600 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {PRESET_LABEL_MAP[preset]}
                  </button>
                );
              })}
            </div>

            {/* 自定义日期输入框 */}
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleCustomStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none dark:text-slate-200"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleCustomEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none dark:text-slate-200"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset('ALL')}
                  title="重置时间区间"
                  className="ml-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 视图切换Tab按钮: 表格明细 vs 趋势线性表 */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-teal-700 shadow-2xs dark:bg-slate-700 dark:text-teal-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>表格明细</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'chart'
                  ? 'bg-white text-teal-700 shadow-2xs dark:bg-slate-700 dark:text-teal-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>趋势线性表</span>
            </button>
          </div>

          <button
            onClick={handleExportSummary}
            className="flex items-center gap-1 rounded-md bg-teal-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-700"
            title="导出当前筛选条件下的报工汇总表"
          >
            <Download className="h-3.5 w-3.5" />
            导出汇总
          </button>
        </div>
      </div>

      {/* 4大汇总指标卡片 (总计工时、良品总数、不良品总数、总良品率) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. 总计工时 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white p-2 shadow-sm dark:bg-slate-700">
              <Clock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">总计工时</p>
              <p className="font-mono-num text-lg font-bold text-slate-800 dark:text-slate-100">
                {totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">小时</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. 良品总数 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white p-2 shadow-sm dark:bg-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">良品总数</p>
              <p className="font-mono-num text-lg font-bold text-slate-800 dark:text-slate-100">
                {totalGood.toLocaleString()} <span className="text-xs font-normal text-slate-500">件</span>
              </p>
            </div>
          </div>
        </div>

        {/* 3. 不良品总数 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white p-2 shadow-sm dark:bg-slate-700">
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">不良品总数</p>
              <p className="font-mono-num text-lg font-bold text-slate-800 dark:text-slate-100">
                {totalDefect.toLocaleString()} <span className="text-xs font-normal text-slate-500">件</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4. 总良品率 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white p-2 shadow-sm dark:bg-slate-700">
              <Award className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">总良品率</p>
              <p className="font-mono-num text-lg font-bold text-teal-600 dark:text-teal-400">
                {overallPassRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域：表格明细视图 OR 三种数据线性表视图 */}
      {viewMode === 'table' ? (
        /* 1. 表格视图 */
        <div className="rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 select-none">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">员工姓名</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">所属部门</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    {renderSortHeader('工作时长', 'workHours')}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    {renderSortHeader('报工次数', 'reportCount')}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    {renderSortHeader('报工工时', 'totalHours')}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    {renderSortHeader('良品 / 不良品', 'goodQty')}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    {renderSortHeader('报工总数', 'totalReportQty')}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    {renderSortHeader('良品率', 'passRate')}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedSummaries.length > 0 ? (
                  paginatedSummaries.map((summary) => (
                    <tr key={summary.reporter} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                            {summary.reporter.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{summary.reporter}</span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {summary.department}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono-num font-medium text-slate-700 dark:text-slate-300">
                        {summary.workHours}h
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono-num text-slate-600 dark:text-slate-400">
                        {summary.reportCount} 次
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono-num font-medium text-slate-700 dark:text-slate-300">
                        {summary.totalHours}h
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono-num text-xs">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{summary.goodQty.toLocaleString()}</span>
                        <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{summary.defectQty.toLocaleString()}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono-num font-medium text-slate-700 dark:text-slate-300">
                        {summary.totalReportQty.toLocaleString()} 件
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono-num font-bold text-teal-600 dark:text-teal-400">
                        {summary.passRate}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedEmployee(summary.reporter);
                              setViewMode('chart');
                            }}
                            className="inline-flex items-center gap-1 rounded bg-teal-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-700 shadow-2xs"
                            title={`查看【${summary.reporter}】的线性趋势图表`}
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            看趋势
                          </button>
                          <button
                            onClick={() => setPromptSummary(summary)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            详情
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p>未找到符合条件的报工数据</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 分页控制器 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                共 {employeeSummaries.length} 位员工，当前第 {currentPage}/{totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2. 趋势线性表视图 (左侧员工列表 + 中间图表 + 最右侧核心指标列) - 三列高度统一 */
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:h-[540px]">
          {/* 左侧: 员工列表 Panel (支持滚动与点击选择) */}
          <div className="w-full lg:w-56 xl:w-60 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  <User className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  员工列表
                </h3>
              </div>
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {employeeSummaries.length} 人
              </span>
            </div>

            {/* 列表搜索过滤输入框 */}
            <div className="relative mb-2.5 flex-shrink-0">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索员工或部门..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* 滚动员工列表 */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
              {filteredLeftEmployees.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  未匹配到员工
                </div>
              ) : (
                filteredLeftEmployees.map((emp) => {
                  const isSelected = selectedEmployeeSummary?.reporter === emp.reporter;
                  return (
                    <button
                      key={emp.reporter}
                      onClick={() => setSelectedEmployee(emp.reporter)}
                      className={`w-full text-left rounded-lg p-2.5 transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white hover:bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/60 dark:text-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                          }`}
                        >
                          {emp.reporter.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{emp.reporter}</p>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                            {emp.department}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-mono-num font-bold block ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                          {emp.totalHours}h
                        </span>
                        <span className={`text-[10px] font-mono-num block ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                          {emp.passRate}%
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 中间 Panel: 可切换视图的单个报工情况趋势图表 */}
          <div className="flex-1 min-w-0 w-full flex flex-col h-full">
            {selectedEmployeeSummary ? (
              /* 单个报工情况趋势图表 */
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-colors dark:border-slate-800 dark:bg-slate-900 flex-1 h-full">
                  <div className="flex-shrink-0">
                    <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            【{selectedEmployeeSummary.reporter}】报工情况趋势
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            所属部门: {selectedEmployeeSummary.department} | 采样天数: {dailyTrendPoints.length} 天连续数据
                          </p>
                        </div>
                      </div>

                      {/* 切换视图按钮 */}
                      <div className="flex rounded bg-slate-100 p-0.5 dark:bg-slate-800 self-start sm:self-auto">
                        <button
                          onClick={() => {
                            setTrendMetric('hours');
                            setHoveredChartIndex(null);
                          }}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                            trendMetric === 'hours'
                              ? 'bg-white text-teal-700 shadow-2xs dark:bg-slate-700 dark:text-teal-300 font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          工时趋势(h)
                        </button>
                        <button
                          onClick={() => {
                            setTrendMetric('quantity');
                            setHoveredChartIndex(null);
                          }}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                            trendMetric === 'quantity'
                              ? 'bg-white text-teal-700 shadow-2xs dark:bg-slate-700 dark:text-teal-300 font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          报工产量(件)
                        </button>
                        <button
                          onClick={() => {
                            setTrendMetric('passRate');
                            setHoveredChartIndex(null);
                          }}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                            trendMetric === 'passRate'
                              ? 'bg-white text-teal-700 shadow-2xs dark:bg-slate-700 dark:text-teal-300 font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          良品率(%)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chart Container - flex-1 expands cleanly */}
                  <div className="relative mt-2 flex-1 min-h-0 w-full select-none flex flex-col justify-center">
                    {dailyTrendPoints.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        暂无【{selectedEmployeeSummary.reporter}】在当前时间段内的报工数据
                      </div>
                    ) : (
                      (() => {
                        const W = 680;
                        const H = 340;
                        const padL = 40;
                        const padR = 25;
                        const padT = 25;
                        const padB = 35;
                        const drawW = W - padL - padR;
                        const drawH = H - padT - padB;
                        const count = dailyTrendPoints.length;
                        const labelStep = count > 12 ? Math.ceil(count / 10) : 1;

                        if (trendMetric === 'hours') {
                          const maxH = Math.max(...dailyTrendPoints.map(p => p.hours), 8);
                          const points = dailyTrendPoints.map((p, i) => {
                            const x = count === 1 ? padL + drawW / 2 : padL + (i / (count - 1)) * drawW;
                            const y = H - padB - (p.hours / maxH) * drawH;
                            return { x, y, ...p };
                          });

                          const lineD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                          const areaD = `${lineD} L ${points[points.length - 1].x} ${H - padB} L ${points[0].x} ${H - padB} Z`;
                          const hoveredPt = hoveredChartIndex !== null ? points[hoveredChartIndex] : null;

                          return (
                            <div className="relative h-full w-full flex items-center justify-center">
                              <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
                                <defs>
                                  <linearGradient id="hoursGradSingle" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>

                                {/* Y轴刻度网格线 */}
                                {[0, 0.33, 0.66, 1].map((ratio) => {
                                  const y = H - padB - ratio * drawH;
                                  const val = (ratio * maxH).toFixed(1);
                                  return (
                                    <g key={ratio}>
                                      <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                                      <text x={padL - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono-num">
                                        {val}h
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Area & Line */}
                                <path d={areaD} fill="url(#hoursGradSingle)" />
                                <path d={lineD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />

                                {/* Node points */}
                                {points.map((pt, i) => {
                                  const showText = i === 0 || i === count - 1 || i % labelStep === 0;
                                  return (
                                    <g key={pt.date} className="cursor-pointer" onMouseEnter={() => setHoveredChartIndex(i)} onMouseLeave={() => setHoveredChartIndex(null)}>
                                      <circle cx={pt.x} cy={pt.y} r={pt.hasRecord ? "4" : "2.5"} fill={pt.hasRecord ? "#ffffff" : "#cbd5e1"} stroke="#0d9488" strokeWidth={pt.hasRecord ? "2" : "1"} />
                                      {showText && (
                                        <text x={pt.x} y={H - 12} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono-num">
                                          {pt.displayDate}
                                        </text>
                                      )}
                                    </g>
                                  );
                                })}
                              </svg>

                              {hoveredPt && (
                                <div
                                  className="absolute pointer-events-none rounded-md bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-xl dark:bg-slate-800/95 z-20"
                                  style={{ left: `${(hoveredPt.x / W) * 100}%`, top: `${(hoveredPt.y / H) * 100 - 35}%`, transform: 'translateX(-50%)' }}
                                >
                                  <p className="font-bold border-b border-slate-700 pb-1 mb-1">{hoveredPt.date}</p>
                                  <p className="text-teal-300 font-bold">工时: {hoveredPt.hours} 小时</p>
                                  <p className="text-slate-400 text-[10px]">{hoveredPt.hasRecord ? `当日报工: ${hoveredPt.count} 次` : '当日未发生报工'}</p>
                                </div>
                              )}
                            </div>
                          );
                        }

                        if (trendMetric === 'quantity') {
                          const maxQty = Math.max(...dailyTrendPoints.map(p => Math.max(p.goodQty, p.defectQty)), 20);
                          const goodPoints = dailyTrendPoints.map((p, i) => {
                            const x = count === 1 ? padL + drawW / 2 : padL + (i / (count - 1)) * drawW;
                            const y = H - padB - (p.goodQty / maxQty) * drawH;
                            return { x, y, ...p };
                          });
                          const defectPoints = dailyTrendPoints.map((p, i) => {
                            const x = count === 1 ? padL + drawW / 2 : padL + (i / (count - 1)) * drawW;
                            const y = H - padB - (p.defectQty / maxQty) * drawH;
                            return { x, y, ...p };
                          });

                          const goodD = goodPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                          const defectD = defectPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                          const hoveredPt = hoveredChartIndex !== null ? dailyTrendPoints[hoveredChartIndex] : null;

                          return (
                            <div className="relative h-full w-full flex items-center justify-center">
                              <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
                                <defs>
                                  <linearGradient id="goodGradSingle" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>

                                {/* Y轴刻度 */}
                                {[0, 0.33, 0.66, 1].map((ratio) => {
                                  const y = H - padB - ratio * drawH;
                                  const val = Math.round(ratio * maxQty);
                                  return (
                                    <g key={ratio}>
                                      <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                                      <text x={padL - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono-num">
                                        {val}件
                                      </text>
                                    </g>
                                  );
                                })}

                                <path d={`${goodD} L ${goodPoints[goodPoints.length - 1].x} ${H - padB} L ${goodPoints[0].x} ${H - padB} Z`} fill="url(#goodGradSingle)" />
                                <path d={goodD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                                <path d={defectD} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />

                                {goodPoints.map((pt, i) => {
                                  const showText = i === 0 || i === count - 1 || i % labelStep === 0;
                                  return (
                                    <g key={pt.date} className="cursor-pointer" onMouseEnter={() => setHoveredChartIndex(i)} onMouseLeave={() => setHoveredChartIndex(null)}>
                                      <circle cx={pt.x} cy={pt.y} r="3.5" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                                      <circle cx={defectPoints[i].x} cy={defectPoints[i].y} r="3" fill="#ffffff" stroke="#f43f5e" strokeWidth="1.5" />
                                      {showText && (
                                        <text x={pt.x} y={H - 12} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono-num">
                                          {pt.displayDate}
                                        </text>
                                      )}
                                    </g>
                                  );
                                })}
                              </svg>

                              {hoveredPt && (
                                <div
                                  className="absolute pointer-events-none rounded-md bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-xl dark:bg-slate-800/95 z-20"
                                  style={{ left: `${((hoveredChartIndex! / Math.max(1, dailyTrendPoints.length - 1)) * 0.8 + 0.1) * 100}%`, top: '15%' }}
                                >
                                  <p className="font-bold border-b border-slate-700 pb-1 mb-1">{hoveredPt.date}</p>
                                  <p className="text-emerald-400 font-bold">良品: {hoveredPt.goodQty} 件</p>
                                  <p className="text-rose-400 font-bold">不良品: {hoveredPt.defectQty} 件</p>
                                  <p className="text-slate-400 text-[10px]">当日合计: {hoveredPt.totalQty} 件</p>
                                </div>
                              )}
                            </div>
                          );
                        }

                        // passRate
                        const minRate = 80;
                        const maxRate = 100;
                        const points = dailyTrendPoints.map((p, i) => {
                          const x = count === 1 ? padL + drawW / 2 : padL + (i / (count - 1)) * drawW;
                          const y = H - padB - ((Math.max(minRate, p.passRate) - minRate) / (maxRate - minRate)) * drawH;
                          return { x, y, ...p };
                        });

                        const lineD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                        const targetY = H - padB - ((95 - minRate) / (maxRate - minRate)) * drawH;
                        const hoveredPt = hoveredChartIndex !== null ? points[hoveredChartIndex] : null;

                        return (
                          <div className="relative h-full w-full flex items-center justify-center">
                            <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
                              <defs>
                                <linearGradient id="passGradSingle" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
                                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {/* 95% 标准参考线 */}
                              <line x1={padL} y1={targetY} x2={W - padR} y2={targetY} stroke="#10b981" strokeDasharray="4 2" strokeWidth="1.5" />
                              <text x={W - padR} y={targetY - 5} textAnchor="end" className="text-[9px] fill-emerald-600 font-bold">
                                基准 95%
                              </text>

                              {/* Y轴刻度 */}
                              {[80, 85, 90, 95, 100].map((val) => {
                                const y = H - padB - ((val - minRate) / (maxRate - minRate)) * drawH;
                                return (
                                  <g key={val}>
                                    <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                                    <text x={padL - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono-num">
                                      {val}%
                                    </text>
                                  </g>
                                );
                              })}

                              <path d={`${lineD} L ${points[points.length - 1].x} ${H - padB} L ${points[0].x} ${H - padB} Z`} fill="url(#passGradSingle)" />
                              <path d={lineD} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />

                              {points.map((pt, i) => {
                                const showText = i === 0 || i === count - 1 || i % labelStep === 0;
                                return (
                                  <g key={pt.date} className="cursor-pointer" onMouseEnter={() => setHoveredChartIndex(i)} onMouseLeave={() => setHoveredChartIndex(null)}>
                                    <circle cx={pt.x} cy={pt.y} r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                                    {showText && (
                                      <text x={pt.x} y={H - 12} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono-num">
                                        {pt.displayDate}
                                      </text>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>

                            {hoveredPt && (
                              <div
                                className="absolute pointer-events-none rounded-md bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-xl dark:bg-slate-800/95 z-20"
                                style={{ left: `${(hoveredPt.x / W) * 100}%`, top: `${(hoveredPt.y / H) * 100 - 35}%`, transform: 'translateX(-50%)' }}
                              >
                                <p className="font-bold border-b border-slate-700 pb-1 mb-1">{hoveredPt.date}</p>
                                <p className="text-sky-300 font-bold">终检良品率: {hoveredPt.passRate}%</p>
                                <p className="text-slate-400 text-[10px]">合格/不良: {hoveredPt.goodQty} / {hoveredPt.defectQty}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900 flex-1 h-full flex items-center justify-center">
                请从左侧列表选择员工以查看趋势分析
              </div>
            )}
          </div>

          {/* 3. 最右侧一列: 4个核心总计指标 + 1个合成的日均效能分析卡片 (高度同步) */}
          {selectedEmployeeSummary && (
            (() => {
              const activeDays = dailyTrendPoints.filter(p => p.hasRecord).length;
              const avgDailyHours = (selectedEmployeeSummary.totalHours / Math.max(1, activeDays)).toFixed(1);
              const avgDailyQty = Math.round(selectedEmployeeSummary.goodQty / Math.max(1, activeDays));

              return (
                <div className="w-full lg:w-56 xl:w-60 flex-shrink-0 flex flex-col justify-between gap-2.5 h-full">
                  {/* 总计工时 */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">总计工时</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-lg font-bold font-mono-num text-teal-700 dark:text-teal-400">
                      {selectedEmployeeSummary.totalHours} <span className="text-xs font-normal text-slate-500">h</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      作息工时 {selectedEmployeeSummary.workHours}h
                    </p>
                  </div>

                  {/* 良品数 */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">良品数</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-lg font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
                      {selectedEmployeeSummary.goodQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">件</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      累计 {selectedEmployeeSummary.reportCount} 次报工
                    </p>
                  </div>

                  {/* 不良品数 */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">不良品数</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                        <XCircle className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-lg font-bold font-mono-num text-rose-600 dark:text-rose-400">
                      {selectedEmployeeSummary.defectQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">件</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      瑕疵件数
                    </p>
                  </div>

                  {/* 总良品率 */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">总良品率</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <Award className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-lg font-bold font-mono-num text-indigo-600 dark:text-indigo-400">
                      {selectedEmployeeSummary.passRate}%
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      标准 95.0%
                    </p>
                  </div>

                  {/* 效能汇总卡片 */}
                  <div className="flex-1 min-h-0 flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">有效报工天数</span>
                        <span className="font-bold font-mono-num text-slate-800 dark:text-slate-200">
                          {activeDays} <span className="font-normal text-[11px] text-slate-500">天</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">平均日工时</span>
                        <span className="font-bold font-mono-num text-teal-600 dark:text-teal-400">
                          {avgDailyHours} <span className="font-normal text-[11px] text-slate-500">h/天</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">平均日产量</span>
                        <span className="font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
                          {avgDailyQty.toLocaleString()} <span className="font-normal text-[11px] text-slate-500">件/天</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* 点击【详情】时的轻量跳转提示小弹窗 */}
      {promptSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    查看报工记录提示
                  </h3>
                  <p className="text-xs text-slate-500">员工: {promptSummary.reporter} ({promptSummary.department})</p>
                </div>
              </div>
              <button
                onClick={() => setPromptSummary(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 rounded-lg border border-slate-200/80 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                请按以下步骤查询具体的每一笔报工记录单据：
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-700">
                  <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    1. 位置
                  </span>
                  <span>跳转到 <strong className="text-teal-700 dark:text-teal-300">生产任务 ➔ 报工记录</strong> 标签页</span>
                </div>
                <div className="flex items-center gap-2 rounded bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-700">
                  <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    2. 搜索
                  </span>
                  <span>输入筛选员工姓名: <strong className="font-mono text-slate-900 dark:text-white">{promptSummary.reporter}</strong></span>
                </div>
                <div className="flex items-center gap-2 rounded bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-700">
                  <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    3. 时间
                  </span>
                  <span>时间范围: <strong className="font-mono text-slate-900 dark:text-white">{startDate || '全部'}</strong> 至 <strong className="font-mono text-slate-900 dark:text-white">{endDate || '全部'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPromptSummary(null)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                知道了
              </button>
              <button
                type="button"
                onClick={handleNavigateToTaskReport}
                className="flex items-center gap-1.5 rounded-md bg-teal-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-teal-700 shadow-2xs"
              >
                <span>前往【报工记录】</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



