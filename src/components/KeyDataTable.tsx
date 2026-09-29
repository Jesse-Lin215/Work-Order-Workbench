import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  Filter,
  Layers,
  PlayCircle,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react';
import {
  OutsourceOrder,
  ProductionOrder,
  ProductionTask,
  WorkReportRecord,
} from '../types';

interface KeyDataTableProps {
  activeTab: 'prod' | 'outsource' | 'task' | 'report';
  setActiveTab: (tab: 'prod' | 'outsource' | 'task' | 'report') => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  prodOrders: ProductionOrder[];
  outsourceOrders: OutsourceOrder[];
  tasks: ProductionTask[];
  reports: WorkReportRecord[];
  onOpenDetail: (object: any, type: 'prod' | 'outsource' | 'task' | 'report') => void;
}

export const KeyDataTable: React.FC<KeyDataTableProps> = ({
  activeTab,
  setActiveTab,
  statusFilter,
  setStatusFilter,
  prodOrders,
  outsourceOrders,
  tasks,
  reports,
  onOpenDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Filter items based on activeTab, search, status, and priority
  const filteredProdOrders = prodOrders.filter((o) => {
    if (statusFilter && statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && o.priority !== priorityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.productCode.toLowerCase().includes(q) ||
        o.manager.toLowerCase().includes(q) ||
        (o.salesOrder && o.salesOrder.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredOutsourceOrders = outsourceOrders.filter((o) => {
    if (statusFilter && statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.outsourceProcess.toLowerCase().includes(q) ||
        o.sourceOrderCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredTasks = tasks.filter((t) => {
    // PRD: 取消、作废任务不展示
    if (t.status === '取消' || t.status === '作废') return false;
    if (statusFilter && statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.code.toLowerCase().includes(q) ||
        t.taskName.toLowerCase().includes(q) ||
        t.workstationName.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        t.sourceOrderCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredReports = reports.filter((r) => {
    // PRD: 草稿不展示在汇总明细
    if (r.status === '草稿') return false;
    if (statusFilter && statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.reportCode.toLowerCase().includes(q) ||
        r.taskCode.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.reporter.toLowerCase().includes(q) ||
        r.workstationName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate current list and pagination
  let currentList: any[] = [];
  if (activeTab === 'prod') currentList = filteredProdOrders;
  else if (activeTab === 'outsource') currentList = filteredOutsourceOrders;
  else if (activeTab === 'task') currentList = filteredTasks;
  else if (activeTab === 'report') currentList = filteredReports;

  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleTabChange = (tab: 'prod' | 'outsource' | 'task' | 'report') => {
    setActiveTab(tab);
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '已完成':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case '进行中':
      case '生产中':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      case '审批中':
      case '待审核':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case '待生产':
      case '待入库':
      case '待下发':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case '暂停':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800';
      case '草稿':
      case '已审批':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case '审批驳回':
      case '已作废':
      case '作废':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,\ufeff' +
      `导出模块,${activeTab}\n` +
      `导出时间,${new Date().toLocaleString()}\n` +
      `总记录数,${currentList.length}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `工单工作台_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="workbench-key-data-table-card"
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Table Header: Tabs, Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        {/* Module Tabs */}
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            id="tab-prod-orders"
            onClick={() => handleTabChange('prod')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'prod'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            生产工单 ({filteredProdOrders.length})
          </button>

          <button
            id="tab-outsource-orders"
            onClick={() => handleTabChange('outsource')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'outsource'
                ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            外协工单 ({filteredOutsourceOrders.length})
          </button>

          <button
            id="tab-tasks"
            onClick={() => handleTabChange('task')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'task'
                ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <PlayCircle className="h-3.5 w-3.5" />
            生产任务 ({filteredTasks.length})
          </button>

          <button
            id="tab-reports"
            onClick={() => handleTabChange('report')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'report'
                ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-700 dark:text-purple-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            报工记录 ({filteredReports.length})
          </button>
        </div>

        {/* Search, Status Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              id="table-keyword-search"
              type="text"
              placeholder="搜索编码 / 产品 / 供应商 / 处理人..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-7.5 w-52 rounded-md border border-slate-300 bg-white pr-7 pl-8 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            id="table-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-7.5 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">全部状态</option>
            {activeTab === 'prod' && (
              <>
                <option value="草稿">草稿</option>
                <option value="审批中">审批中</option>
                <option value="已审批">已审批</option>
                <option value="进行中">进行中</option>
                <option value="暂停">暂停</option>
                <option value="已完成">已完成</option>
                <option value="作废">作废</option>
              </>
            )}
            {activeTab === 'outsource' && (
              <>
                <option value="草稿">草稿</option>
                <option value="审批中">审批中</option>
                <option value="进行中">进行中</option>
                <option value="待入库">待入库</option>
                <option value="已完成">已完成</option>
                <option value="已作废">已作废</option>
              </>
            )}
            {activeTab === 'task' && (
              <>
                <option value="待下发">待下发</option>
                <option value="待生产">待生产</option>
                <option value="生产中">生产中</option>
                <option value="暂停">暂停</option>
                <option value="已完成">已完成</option>
              </>
            )}
            {activeTab === 'report' && (
              <>
                <option value="待审核">待审核</option>
                <option value="已完成">已完成</option>
                <option value="审批驳回">审批驳回</option>
              </>
            )}
          </select>

          {/* Export Button */}
          <button
            id="table-export-csv-btn"
            onClick={handleExportCSV}
            title="导出当前明细"
            className="flex h-7.5 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">导出</span>
          </button>
        </div>
      </div>

      {/* Table Content Container */}
      <div className="mt-2 overflow-x-auto">
        {paginatedList.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center text-xs text-slate-400">
            <Search className="h-7 w-7 text-slate-300 opacity-60" />
            <span className="mt-2 font-medium">未找到符合条件的重点数据明细</span>
            <span className="text-[10px] text-slate-400">可调整搜索关键字或重置筛选条件</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs whitespace-nowrap">
            {/* 1. 生产工单表头 */}
            {activeTab === 'prod' && (
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="py-2 px-2.5">序号</th>
                  <th className="py-2 px-2.5">生产工单编码</th>
                  <th className="py-2 px-2.5">产品物料名称 / 规格</th>
                  <th className="py-2 px-2.5">计划 / 完成 (件)</th>
                  <th className="py-2 px-2.5">总体进度</th>
                  <th className="py-2 px-2.5">时间进度</th>
                  <th className="py-2 px-2.5">计划交期</th>
                  <th className="py-2 px-2.5">负责人 / 工厂</th>
                  <th className="py-2 px-2.5">状态</th>
                  <th className="py-2 px-2.5">预警提示</th>
                  <th className="py-2 px-2.5 text-right">操作</th>
                </tr>
              </thead>
            )}

            {/* 2. 外协工单表头 (Section 10.1) */}
            {activeTab === 'outsource' && (
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="py-2 px-2.5">序号</th>
                  <th className="py-2 px-2.5">外协工单编码</th>
                  <th className="py-2 px-2.5">产品信息 / 外协工序</th>
                  <th className="py-2 px-2.5">供应商信息</th>
                  <th className="py-2 px-2.5">外协类型</th>
                  <th className="py-2 px-2.5">生产进度</th>
                  <th className="py-2 px-2.5">入库进度</th>
                  <th className="py-2 px-2.5">计划数量</th>
                  <th className="py-2 px-2.5">计划交期</th>
                  <th className="py-2 px-2.5">含税金额</th>
                  <th className="py-2 px-2.5">状态</th>
                  <th className="py-2 px-2.5 text-right">操作</th>
                </tr>
              </thead>
            )}

            {/* 3. 生产任务表头 (Section 10.2) */}
            {activeTab === 'task' && (
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="py-2 px-2.5">任务编码</th>
                  <th className="py-2 px-2.5">任务名称 / 工序</th>
                  <th className="py-2 px-2.5">优先级</th>
                  <th className="py-2 px-2.5">工作站 / 处理人</th>
                  <th className="py-2 px-2.5">排产 / 已产数</th>
                  <th className="py-2 px-2.5">任务进度</th>
                  <th className="py-2 px-2.5">计划开始</th>
                  <th className="py-2 px-2.5">预计完成</th>
                  <th className="py-2 px-2.5">来源工单</th>
                  <th className="py-2 px-2.5">状态</th>
                  <th className="py-2 px-2.5 text-right">操作</th>
                </tr>
              </thead>
            )}

            {/* 4. 报工记录表头 (Section 10.3) */}
            {activeTab === 'report' && (
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="py-2 px-2.5">报工单号</th>
                  <th className="py-2 px-2.5">生产任务编码</th>
                  <th className="py-2 px-2.5">产品物料 / 工序</th>
                  <th className="py-2 px-2.5">工作站</th>
                  <th className="py-2 px-2.5">报工数 (良/不良)</th>
                  <th className="py-2 px-2.5">报工工时</th>
                  <th className="py-2 px-2.5">报工人 / 报工时间</th>
                  <th className="py-2 px-2.5">审批人</th>
                  <th className="py-2 px-2.5">状态</th>
                  <th className="py-2 px-2.5 text-right">操作</th>
                </tr>
              </thead>
            )}

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* 1. 生产工单行 */}
              {activeTab === 'prod' &&
                (paginatedList as ProductionOrder[]).map((order, idx) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-2.5 text-slate-400 font-mono-num text-[11px]">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-indigo-600 dark:text-indigo-400">
                      {order.code}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {order.productName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.spec}</div>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {order.planQty}
                      </span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {order.finishedQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                            style={{ width: `${order.totalProgress}%` }}
                          />
                        </div>
                        <span className="font-semibold">{order.totalProgress}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">
                      <span
                        className={
                          order.timeProgress > 100
                            ? 'text-rose-600 font-bold'
                            : 'text-slate-600 dark:text-slate-300'
                        }
                      >
                        {order.timeProgress}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-600 dark:text-slate-300">
                      {order.planEndDate}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {order.manager}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{order.factoryName}</span>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5">
                      {order.warningType !== 'NONE' ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            order.warningType === 'OVERDUE'
                              ? 'bg-rose-600 text-white'
                              : order.warningType === 'UPCOMING_DUE'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {order.warningType === 'OVERDUE'
                            ? '已逾期'
                            : order.warningType === 'UPCOMING_DUE'
                            ? '即将逾期'
                            : '进度滞后'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={() => onOpenDetail(order, 'prod')}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}

              {/* 2. 外协工单行 */}
              {activeTab === 'outsource' &&
                (paginatedList as OutsourceOrder[]).map((order, idx) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-2.5 text-slate-400 font-mono-num text-[11px]">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-blue-600 dark:text-blue-400">
                      {order.code}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {order.productName}
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        工序: {order.outsourceProcess}
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {order.supplierName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {order.contactPerson} ({order.contactPhone})
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300">
                      {order.outsourceType}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                            style={{ width: `${order.productionProgress}%` }}
                          />
                        </div>
                        <span className="font-semibold">{order.productionProgress}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${order.inboundProgress}%` }}
                          />
                        </div>
                        <span className="font-semibold">{order.inboundProgress}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-slate-800 dark:text-slate-200">
                      {order.planQty} 件
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-600 dark:text-slate-300">
                      {order.planEndDate}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-slate-800 dark:text-slate-200">
                      ¥{order.taxIncludedAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={() => onOpenDetail(order, 'outsource')}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}

              {/* 3. 生产任务行 */}
              {activeTab === 'task' &&
                (paginatedList as ProductionTask[]).map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                      {task.code}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {task.taskName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        工序: {task.processName}
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                          task.priority === '高'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {task.priority}优
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {task.workstationName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {task.assignee} ({task.role})
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {task.scheduledQty}
                      </span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {task.producedQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${task.taskProgress}%` }}
                          />
                        </div>
                        <span className="font-semibold">{task.taskProgress}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-600 dark:text-slate-300 text-[11px]">
                      {task.planStartTime}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-600 dark:text-slate-300 text-[11px]">
                      {task.estimatedEndTime}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-500">
                      {task.sourceOrderCode}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getStatusBadge(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={() => onOpenDetail(task, 'task')}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}

              {/* 4. 报工记录行 */}
              {activeTab === 'report' &&
                (paginatedList as WorkReportRecord[]).map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-purple-600 dark:text-purple-400">
                      {report.reportCode}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {report.taskCode}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {report.productName}
                      </div>
                      <div className="text-[10px] text-slate-400">工序: {report.processName}</div>
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-700 dark:text-slate-300">
                      {report.workstationName}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {report.reportQty}
                      </span>{' '}
                      <span className="text-[10px] text-slate-400">
                        (良 <span className="text-emerald-600 font-semibold">{report.goodQty}</span> / 不良{' '}
                        <span className="text-rose-500 font-semibold">{report.defectQty}</span>)
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-slate-800 dark:text-slate-200">
                      {report.reportHours} h
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {report.reporter}
                      </div>
                      <div className="text-[10px] font-mono-num text-slate-400">
                        {report.reportTime}
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300">
                      {report.approver}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getStatusBadge(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={() => onOpenDetail(report, 'report')}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-purple-600 hover:bg-purple-50 dark:border-slate-700 dark:bg-slate-800 dark:text-purple-400 dark:hover:bg-slate-700"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Summary Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div>
          共 <strong className="font-mono-num text-slate-800 dark:text-slate-200">{currentList.length}</strong> 条记录，当前显示第{' '}
          <span className="font-mono-num font-semibold text-indigo-600 dark:text-indigo-400">
            {currentPage}
          </span>{' '}
          / {totalPages} 页
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="table-prev-page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`h-7 min-w-7 rounded px-1.5 font-mono-num text-xs font-medium transition-all ${
                currentPage === p
                  ? 'bg-indigo-600 text-white font-bold dark:bg-indigo-500'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            id="table-next-page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
