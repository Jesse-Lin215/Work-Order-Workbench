import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Factory,
  FileCheck,
  FileText,
  Filter,
  Layers,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import {
  OutsourceOrder,
  ProductionOrder,
  ProductionTask,
  TodoItem,
  WorkReportRecord,
} from '../types';

interface TodoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory: TodoItem['category'] | null;
  prodOrders: ProductionOrder[];
  outsourceOrders: OutsourceOrder[];
  tasks: ProductionTask[];
  reports: WorkReportRecord[];
  onOpenDetail: (
    object: any,
    type: 'prod' | 'outsource' | 'task' | 'report'
  ) => void;
  onApproveItem?: (
    id: string,
    type: 'prod' | 'outsource' | 'task' | 'report',
    action: string
  ) => void;
  onJumpToApprovalPage: (
    tab: 'prod' | 'outsource' | 'task' | 'report',
    statusFilter: string
  ) => void;
}

export const TodoDrawer: React.FC<TodoDrawerProps> = ({
  isOpen,
  onClose,
  initialCategory,
  prodOrders,
  outsourceOrders,
  tasks,
  reports,
  onOpenDetail,
  onApproveItem,
  onJumpToApprovalPage,
}) => {
  const [activeCategory, setActiveCategory] = useState<TodoItem['category']>(
    initialCategory || 'PROD_APPROVAL'
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync activeCategory when initialCategory changes
  React.useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
      
      let initialStatus = 'ALL';
      switch(initialCategory) {
        case 'PROD_APPROVAL': initialStatus = '审批中'; break;
        case 'OUTSOURCE_APPROVAL': initialStatus = '审批中'; break;
        case 'REPORT_APPROVAL': initialStatus = '待审核'; break;
        case 'PENDING_TASK': initialStatus = '待生产'; break;
      }
      setStatusFilter(initialStatus);
      setSearchTerm('');
    }
  }, [initialCategory, isOpen]);

  // Counts for each category (Strictly matching pending approval / pending production)
  const pendingProdCount = useMemo(
    () => prodOrders.filter((o) => o.status === '审批中').length,
    [prodOrders]
  );

  const pendingOutsourceCount = useMemo(
    () => outsourceOrders.filter((o) => o.status === '审批中').length,
    [outsourceOrders]
  );

  const pendingReportsCount = useMemo(
    () => reports.filter((r) => r.status === '待审核').length,
    [reports]
  );

  const pendingTasksCount = useMemo(
    () => tasks.filter((t) => t.status === '待生产').length,
    [tasks]
  );

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Get Category Meta
  const getCategoryMeta = (cat: TodoItem['category']) => {
    switch (cat) {
      case 'PROD_APPROVAL':
        return {
          title: '生产工单待审批',
          type: 'prod' as const,
          count: pendingProdCount,
          icon: <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          colorBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
          desc: '生产排产方案、工艺路线与批次交期待审批',
          statusTabs: [
            { label: '待审批', value: '审批中' },
          ],
          targetStatus: '审批中',
          footerJumpText: '跳转工单管理',
        };
      case 'OUTSOURCE_APPROVAL':
        return {
          title: '外协工单待审批',
          type: 'outsource' as const,
          count: pendingOutsourceCount,
          icon: <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
          colorBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
          desc: '委外加工申请、特批报价待主管审核核准',
          statusTabs: [
            { label: '待审批', value: '审批中' },
          ],
          targetStatus: '审批中',
          footerJumpText: '跳转外协工单',
        };
      case 'REPORT_APPROVAL':
        return {
          title: '报工记录待审批',
          type: 'report' as const,
          count: pendingReportsCount,
          icon: <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
          colorBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
          desc: '车间班组报工工时、良品件数与质检待审核',
          statusTabs: [
            { label: '待审批', value: '待审核' },
          ],
          targetStatus: '待审核',
          footerJumpText: '跳转报工记录',
        };
      case 'PENDING_TASK':
        return {
          title: '待生产任务',
          type: 'task' as const,
          count: pendingTasksCount,
          icon: <PlayCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
          colorBadge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
          desc: '工序任务已下发至工位，处于待开工生产状态',
          statusTabs: [
            { label: '待生产', value: '待生产' },
          ],
          targetStatus: '待生产',
          footerJumpText: '跳转生产任务',
        };
    }
  };

  const currentMeta = getCategoryMeta(activeCategory);

  // List of items strictly filtered: prod/outsource/report are strictly 待审批, tasks are strictly 待生产
  const currentList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let rawItems: any[] = [];

    switch (activeCategory) {
      case 'PROD_APPROVAL':
        rawItems = prodOrders.filter((o) => o.status === '审批中');
        break;
      case 'OUTSOURCE_APPROVAL':
        rawItems = outsourceOrders.filter((o) => o.status === '审批中');
        break;
      case 'REPORT_APPROVAL':
        rawItems = reports.filter((r) => r.status === '待审核');
        break;
      case 'PENDING_TASK':
        rawItems = tasks.filter((t) => t.status === '待生产');
        break;
    }

    if (!q) return rawItems;

    return rawItems.filter((item) => {
      const code = (item.code || item.reportCode || '').toLowerCase();
      const name = (item.productName || item.taskName || '').toLowerCase();
      const person = (item.manager || item.supplierName || item.reporter || item.assignee || item.creator || '').toLowerCase();
      const workshop = (item.workshop || item.workstationName || item.outsourceProcess || '').toLowerCase();
      return code.includes(q) || name.includes(q) || person.includes(q) || workshop.includes(q);
    });
  }, [activeCategory, searchTerm, prodOrders, outsourceOrders, reports, tasks]);

  const handleGoToDetail = (item: any) => {
    onOpenDetail(item, currentMeta.type);
  };

  // Helper for Status Badge & Visual Styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case '草稿':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            草稿未提交
          </span>
        );
      case '审批中':
      case '待审批':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            待审批
          </span>
        );
      case '已审批':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
            已核准待排产
          </span>
        );
      case '待下发':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
            <Layers className="h-2.5 w-2.5 text-indigo-600" />
            待派工下发
          </span>
        );
      case '待生产':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
            <PlayCircle className="h-2.5 w-2.5 text-sky-600" />
            待生产
          </span>
        );
      case '进行中':
      case '生产中':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
            <Activity className="h-2.5 w-2.5 text-blue-600" />
            生产执行中
          </span>
        );
      case '待审核':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <FileText className="h-2.5 w-2.5 text-rose-600 animate-pulse" />
            待审批
          </span>
        );
      case '待入库':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300">
            <Truck className="h-2.5 w-2.5 text-cyan-600" />
            在途待验入库
          </span>
        );
      case '暂停':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-950/80 dark:text-orange-300">
            <PauseCircle className="h-2.5 w-2.5 text-orange-600" />
            工序异常挂起
          </span>
        );
      case '审批驳回':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950/80 dark:text-red-300">
            <XCircle className="h-2.5 w-2.5 text-red-600" />
            审批驳回待修改
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };


  // Render Status-Specific Action Buttons for each Item Card
  const renderStatusActionButtons = (item: any, type: 'prod' | 'outsource' | 'task' | 'report') => {
    const status = item.status;

    // 1. 生产工单 (Production Order)
    if (type === 'prod') {
      return (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onApproveItem?.(item.id, 'prod', 'reject')}
            className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
          >
            审批驳回
          </button>
          <button
            onClick={() => onApproveItem?.(item.id, 'prod', 'approve')}
            className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>审批通过</span>
          </button>
          <button
            onClick={() => handleGoToDetail(item)}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <span>详情</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      );
    }

    // 2. 外协工单 (Outsource Order)
    if (type === 'outsource') {
      return (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onApproveItem?.(item.id, 'outsource', 'reject')}
            className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
          >
            审批驳回
          </button>
          <button
            onClick={() => onApproveItem?.(item.id, 'outsource', 'approve')}
            className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>审批通过</span>
          </button>
          <button
            onClick={() => handleGoToDetail(item)}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <span>详情</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      );
    }

    // 3. 生产任务 (Production Task)
    if (type === 'task') {
      return (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleGoToDetail(item)}
            className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <span>前往处理</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleGoToDetail(item)}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <span>详情</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      );
    }

    // 4. 报工记录 (Work Report)
    if (type === 'report') {
      return (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onApproveItem?.(item.id, 'report', 'reject')}
            className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
          >
            审批驳回
          </button>
          <button
            onClick={() => onApproveItem?.(item.id, 'report', 'approve')}
            className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>审批通过</span>
          </button>
          <button
            onClick={() => handleGoToDetail(item)}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <span>详情</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      );
    }

    // Default fallback button
    return (
      <button
        onClick={() => handleGoToDetail(item)}
        className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 active:scale-95 transition-all"
      >
        <span>查看单据详情</span>
        <ArrowRight className="h-3 w-3" />
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div id="todo-drawer-root" className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        id="todo-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 transition-opacity duration-300 animate-fadeIn"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div
          id="todo-drawer-panel"
          className="w-screen max-w-xl bg-white shadow-2xl transition-all duration-300 dark:bg-slate-900 flex flex-col justify-between animate-slideInRight border-l border-slate-200 dark:border-slate-800"
        >
          {/* Top Header */}
          <div className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-2xs dark:bg-slate-800">
                  {currentMeta.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentMeta.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${currentMeta.colorBadge}`}
                    >
                      共 {currentMeta.count} 项单据
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentMeta.desc}
                  </p>
                </div>
              </div>

              <button
                id="todo-drawer-close-btn"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                title="关闭抽屉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-status filter pills + Search box */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
                {currentMeta.statusTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                      statusFilter === tab.value
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[170px] flex-1 sm:max-w-[200px]">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索单号、品名..."
                  className="w-full rounded-md border border-slate-200 bg-white py-1 pl-7 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* List of Status-Differentiated Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
            {currentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  当前筛选条件下暂无单据
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  该状态下的单据均已完成审核、排产或处于流转就绪状态。
                </p>
              </div>
            ) : (
              currentList.map((item: any, idx: number) => {
                const code = item.code || item.reportCode;
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id || idx}
                    className="group rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/80"
                  >
                    {/* Header Row: Code, Status Badge & Priority */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {code}
                        </span>
                        <button
                          onClick={(e) => handleCopy(code, item.id, e)}
                          title="复制单据号"
                          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                        >
                          {isCopied ? (
                            <span className="text-[9px] text-emerald-600 font-semibold">已复制</span>
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>

                        {/* Exact Status Badge */}
                        {renderStatusBadge(item.status)}

                        {item.priority && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                              item.priority === '高'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {item.priority}优
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{item.createTime || item.reportTime || item.planStartTime || '刚刚'}</span>
                      </div>
                    </div>

                    {/* Middle: Product / Task Title */}
                    <div className="mt-2.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.productName || item.taskName}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.spec || item.processName || '标准工序要求'}
                      </p>
                    </div>

                    {/* Status Context / Stage Narrative */}

                    {/* Concise Parameter Strip */}
                    <div className="mt-2.5 rounded bg-slate-50 px-2.5 py-1.5 text-[11px] font-mono-num text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                      {activeCategory === 'PROD_APPROVAL' && (
                        <div className="flex items-center justify-between">
                          <span>
                            计划量: <strong className="text-slate-900 dark:text-white font-bold">{item.planQty}</strong> 件
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span>已产: <strong className="text-emerald-600 font-bold">{item.finishedQty || 0}</strong> 件</span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span>负责人: {item.manager}</span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{item.planEndDate}</span>
                        </div>
                      )}

                      {activeCategory === 'OUTSOURCE_APPROVAL' && (
                        <div className="flex items-center justify-between">
                          <span>
                            外协量: <strong className="text-slate-900 dark:text-white font-bold">{item.planQty}</strong> 件
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="text-blue-600 dark:text-blue-400 truncate max-w-[120px] font-semibold">{item.supplierName}</span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">¥{(item.taxIncludedAmount || 0).toLocaleString()}</span>
                        </div>
                      )}

                      {activeCategory === 'REPORT_APPROVAL' && (
                        <div className="flex items-center justify-between">
                          <span>
                            报工量: <strong className="text-slate-900 dark:text-white font-bold">{item.reportQty}</strong> 件
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span>良品: <strong className="text-emerald-600 font-bold">{item.goodQty}</strong> / 废品: <strong className="text-rose-500 font-bold">{item.defectQty}</strong></span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span>报工: {item.reporter} ({item.reportHours}h)</span>
                        </div>
                      )}

                      {activeCategory === 'PENDING_TASK' && (
                        <div className="flex items-center justify-between">
                          <span>
                            排产量: <strong className="text-slate-900 dark:text-white font-bold">{item.scheduledQty}</strong> 件
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span>指派: {item.assignee} ({item.role})</span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{item.workstationName}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Dynamic Action Buttons */}
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                      {/* Status-Differentiated Action Buttons */}
                      {renderStatusActionButtons(item, currentMeta.type)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/60 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              当前展示 <strong className="text-slate-800 dark:text-slate-200 font-bold">{currentList.length}</strong> 条单据
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onJumpToApprovalPage(currentMeta.type, currentMeta.targetStatus);
                }}
                className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>{currentMeta.footerJumpText}</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
