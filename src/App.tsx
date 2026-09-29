/**
 * 工单工作台 - 生产管理系统 (Work Order Workbench)
 * Built strictly according to PRD V1.0 specifications
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarSchedule } from './components/CalendarSchedule';
import { DeliveryWarningSection } from './components/DeliveryWarningSection';
import { DetailDrawer } from './components/DetailDrawer';
import { DraggableSectionWrapper } from './components/DraggableSectionWrapper';
import { EmployeeReportQuery } from './components/EmployeeReportQuery';
import { FilterBar } from './components/FilterBar';
import { HeaderNav } from './components/HeaderNav';
import { KeyDataTable } from './components/KeyDataTable';
import { MetricOverviewGrid } from './components/MetricOverviewGrid';
import { NotificationPopover } from './components/NotificationPopover';
import { Toast } from './components/Toast';
import { TodoDrawer } from './components/TodoDrawer';
import { UnifiedWorkflowSection } from './components/UnifiedWorkflowSection';
import { WorkReportTrendSection } from './components/WorkReportTrendSection';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  GitBranch,
  GripVertical,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  CURRENT_SIMULATED_DATE,
  MOCK_OUTSOURCE_ORDERS,
  MOCK_PRODUCTION_ORDERS,
  MOCK_PRODUCTION_TASKS,
  MOCK_WORK_REPORTS,
} from './mockData';
import {
  OutsourceOrder,
  ProductionOrder,
  ProductionTask,
  TimeRangeOption,
  TodoItem,
  WorkReportRecord,
} from './types';
import {
  computeInternalExecutionPipeline,
  computeOutsourceExecutionPipeline,
  computeTodoItems,
  computeWorkbenchMetrics,
  generateCalendarEvents,
  generateWorkReportTrends,
  isDateInRange,
} from './utils/metricsCalculator';

export type DashboardSectionId =
  | 'warning'
  | 'reportTrend'
  | 'workflow'
  | 'metrics'
  | 'calendarSchedule'
  | 'employeeReport';

export const DEFAULT_DASHBOARD_SECTIONS: DashboardSectionId[] = [
  'warning',
  'reportTrend',
  'workflow',
  'metrics',
  'calendarSchedule',
  'employeeReport',
];

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Sync dark class with document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Reactive Mock Data Sources (for interactive approvals & status updates)
  const [prodOrdersList, setProdOrdersList] = useState<ProductionOrder[]>(MOCK_PRODUCTION_ORDERS);
  const [outsourceOrdersList, setOutsourceOrdersList] = useState<OutsourceOrder[]>(MOCK_OUTSOURCE_ORDERS);
  const [tasksList, setTasksList] = useState<ProductionTask[]>(MOCK_PRODUCTION_TASKS);
  const [reportsList, setReportsList] = useState<WorkReportRecord[]>(MOCK_WORK_REPORTS);

  // Global Filters state (FR-01, FR-02)
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeOption>('MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-31');

  // 1. 交期预警 模块独立时间过滤
  const [warningTimeRange, setWarningTimeRange] = useState<TimeRangeOption>('ALL');
  const [warningStartDate, setWarningStartDate] = useState<string>('2026-08-01');
  const [warningEndDate, setWarningEndDate] = useState<string>('2026-08-31');
  const [isWarningSynced, setIsWarningSynced] = useState<boolean>(false);

  // 2. 报工情况(趋势) 模块独立时间过滤
  const [reportTrendTimeRange, setReportTrendTimeRange] = useState<TimeRangeOption>('MONTH');
  const [reportTrendStartDate, setReportTrendStartDate] = useState<string>('2026-08-01');
  const [reportTrendEndDate, setReportTrendEndDate] = useState<string>('2026-08-31');
  const [isReportTrendSynced, setIsReportTrendSynced] = useState<boolean>(true);

  // 3. 业务流转与待办中心 模块独立时间过滤
  const [workflowTimeRange, setWorkflowTimeRange] = useState<TimeRangeOption>('MONTH');
  const [workflowStartDate, setWorkflowStartDate] = useState<string>('2026-08-01');
  const [workflowEndDate, setWorkflowEndDate] = useState<string>('2026-08-31');
  const [isWorkflowSynced, setIsWorkflowSynced] = useState<boolean>(true);

  // 4. 核心指标看板 模块独立时间过滤
  const [metricTimeRange, setMetricTimeRange] = useState<TimeRangeOption>('MONTH');
  const [metricStartDate, setMetricStartDate] = useState<string>('2026-08-01');
  const [metricEndDate, setMetricEndDate] = useState<string>('2026-08-31');
  const [isMetricSynced, setIsMetricSynced] = useState<boolean>(true);

  // Selected date on calendar (FR-06, Section 9)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-08-31');

  // Detail Drawer state (FR-15)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [drawerType, setDrawerType] = useState<'prod' | 'outsource' | 'task' | 'report' | null>(null);

  // Todo Items Modal state (待办事项弹窗)
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [selectedTodoCategory, setSelectedTodoCategory] = useState<TodoItem['category']>('PROD_APPROVAL');

  // Key Data Table state (数据中心与审批中心)
  const [activeTableTab, setActiveTableTab] = useState<'prod' | 'outsource' | 'task' | 'report'>('prod');
  const [tableStatusFilter, setTableStatusFilter] = useState<string>('ALL');

  // Alerts popover & toast notifications
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('17:35:12');

  // -------------------------------------------------------------
  // Data Filtering per Module
  // -------------------------------------------------------------

  // Global Table Data (filtered by global time range)
  const filteredProdOrders = useMemo(() => {
    return prodOrdersList.filter((o) =>
      isDateInRange(o.planEndDate, selectedTimeRange, customStartDate, customEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [prodOrdersList, selectedTimeRange, customStartDate, customEndDate]);

  const filteredOutsourceOrders = useMemo(() => {
    return outsourceOrdersList.filter((o) =>
      isDateInRange(o.planEndDate, selectedTimeRange, customStartDate, customEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [outsourceOrdersList, selectedTimeRange, customStartDate, customEndDate]);

  const filteredTasks = useMemo(() => {
    return tasksList.filter((t) =>
      isDateInRange(t.planStartTime, selectedTimeRange, customStartDate, customEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [tasksList, selectedTimeRange, customStartDate, customEndDate]);

  const filteredReports = useMemo(() => {
    return reportsList.filter((r) =>
      isDateInRange(r.reportTime, selectedTimeRange, customStartDate, customEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [reportsList, selectedTimeRange, customStartDate, customEndDate]);

  // 1. 交期预警 模块数据
  const warningFilteredProdOrders = useMemo(() => {
    return prodOrdersList.filter((o) =>
      isDateInRange(o.planEndDate, warningTimeRange, warningStartDate, warningEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [prodOrdersList, warningTimeRange, warningStartDate, warningEndDate]);

  const warningFilteredOutsourceOrders = useMemo(() => {
    return outsourceOrdersList.filter((o) =>
      isDateInRange(o.planEndDate, warningTimeRange, warningStartDate, warningEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [outsourceOrdersList, warningTimeRange, warningStartDate, warningEndDate]);

  const warningFilteredTasks = useMemo(() => {
    return tasksList.filter((t) =>
      isDateInRange(t.planStartTime, warningTimeRange, warningStartDate, warningEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [tasksList, warningTimeRange, warningStartDate, warningEndDate]);

  // 2. 报工情况(趋势) 模块数据
  const reportTrendFilteredReports = useMemo(() => {
    return reportsList.filter((r) =>
      isDateInRange(r.reportTime, reportTrendTimeRange, reportTrendStartDate, reportTrendEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [reportsList, reportTrendTimeRange, reportTrendStartDate, reportTrendEndDate]);

  const trendData = useMemo(() => {
    return generateWorkReportTrends(
      reportTrendFilteredReports,
      reportTrendTimeRange,
      reportTrendStartDate,
      reportTrendEndDate,
      CURRENT_SIMULATED_DATE
    );
  }, [reportTrendFilteredReports, reportTrendTimeRange, reportTrendStartDate, reportTrendEndDate]);

  // 3. 业务流转与待办中心 模块数据
  const workflowProdOrders = useMemo(() => {
    return prodOrdersList.filter((o) =>
      isDateInRange(o.planEndDate, workflowTimeRange, workflowStartDate, workflowEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [prodOrdersList, workflowTimeRange, workflowStartDate, workflowEndDate]);

  const workflowOutsourceOrders = useMemo(() => {
    return outsourceOrdersList.filter((o) =>
      isDateInRange(o.planEndDate, workflowTimeRange, workflowStartDate, workflowEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [outsourceOrdersList, workflowTimeRange, workflowStartDate, workflowEndDate]);

  const workflowTasks = useMemo(() => {
    return tasksList.filter((t) =>
      isDateInRange(t.planStartTime, workflowTimeRange, workflowStartDate, workflowEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [tasksList, workflowTimeRange, workflowStartDate, workflowEndDate]);

  const workflowReports = useMemo(() => {
    return reportsList.filter((r) =>
      isDateInRange(r.reportTime, workflowTimeRange, workflowStartDate, workflowEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [reportsList, workflowTimeRange, workflowStartDate, workflowEndDate]);

  const todoItems = useMemo(() => {
    return computeTodoItems(
      workflowProdOrders,
      workflowOutsourceOrders,
      workflowTasks,
      workflowReports
    );
  }, [workflowProdOrders, workflowOutsourceOrders, workflowTasks, workflowReports]);

  const internalPipeline = useMemo(() => {
    return computeInternalExecutionPipeline(
      workflowProdOrders,
      workflowTasks,
      workflowReports
    );
  }, [workflowProdOrders, workflowTasks, workflowReports]);

  const outsourcePipeline = useMemo(() => {
    return computeOutsourceExecutionPipeline(workflowOutsourceOrders);
  }, [workflowOutsourceOrders]);

  // 4. 核心指标看板 模块数据
  const metricProdOrders = useMemo(() => {
    return prodOrdersList.filter((o) =>
      isDateInRange(o.planEndDate, metricTimeRange, metricStartDate, metricEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [prodOrdersList, metricTimeRange, metricStartDate, metricEndDate]);

  const metricOutsourceOrders = useMemo(() => {
    return outsourceOrdersList.filter((o) =>
      isDateInRange(o.planEndDate, metricTimeRange, metricStartDate, metricEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [outsourceOrdersList, metricTimeRange, metricStartDate, metricEndDate]);

  const metricTasks = useMemo(() => {
    return tasksList.filter((t) =>
      isDateInRange(t.planStartTime, metricTimeRange, metricStartDate, metricEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [tasksList, metricTimeRange, metricStartDate, metricEndDate]);

  const metricReports = useMemo(() => {
    return reportsList.filter((r) =>
      isDateInRange(r.reportTime, metricTimeRange, metricStartDate, metricEndDate, CURRENT_SIMULATED_DATE)
    );
  }, [reportsList, metricTimeRange, metricStartDate, metricEndDate]);

  const workbenchMetrics = useMemo(() => {
    return computeWorkbenchMetrics(
      metricProdOrders,
      metricOutsourceOrders,
      metricTasks,
      metricReports,
      CURRENT_SIMULATED_DATE
    );
  }, [metricProdOrders, metricOutsourceOrders, metricTasks, metricReports]);

  // 5. Calendar Events (FR-06)
  const calendarEvents = useMemo(() => {
    return generateCalendarEvents(
      prodOrdersList,
      outsourceOrdersList,
      tasksList
    );
  }, [prodOrdersList, outsourceOrdersList, tasksList]);

  // 7. Warning lists for popover & alerts (filtered by warningTimeRange)
  const prodWarnings = useMemo(
    () =>
      warningFilteredProdOrders.filter(
        (o) =>
          (o.status === '已审批' || o.status === '进行中' || o.status === '暂停') &&
          o.warningType !== 'NONE'
      ),
    [warningFilteredProdOrders]
  );

  const outsourceWarnings = useMemo(
    () =>
      warningFilteredOutsourceOrders.filter(
        (o) =>
          (o.status === '进行中' || o.status === '待入库') &&
          o.warningType !== 'NONE'
      ),
    [warningFilteredOutsourceOrders]
  );

  const taskWarnings = useMemo(
    () =>
      warningFilteredTasks.filter(
        (t) =>
          (t.status === '待生产' || t.status === '生产中' || t.status === '暂停') &&
          t.warningType !== 'NONE'
      ),
    [warningFilteredTasks]
  );

  const totalWarningsCount =
    prodWarnings.length + outsourceWarnings.length + taskWarnings.length;

  // Global Time Range Change handler
  const handleGlobalTimeRangeChange = (range: TimeRangeOption) => {
    setSelectedTimeRange(range);
    if (isWarningSynced) setWarningTimeRange(range);
    if (isReportTrendSynced) setReportTrendTimeRange(range);
    if (isWorkflowSynced) setWorkflowTimeRange(range);
    if (isMetricSynced) setMetricTimeRange(range);
    setToastMessage(`全局默认时间调整为【${range === 'ALL' ? '全量' : range === 'TODAY' ? '今日' : range === 'WEEK' ? '本周' : range === 'MONTH' ? '本月' : '自定义'}】`);
  };

  const handleGlobalCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    if (isWarningSynced) {
      setWarningStartDate(start);
      setWarningEndDate(end);
    }
    if (isReportTrendSynced) {
      setReportTrendStartDate(start);
      setReportTrendEndDate(end);
    }
    if (isWorkflowSynced) {
      setWorkflowStartDate(start);
      setWorkflowEndDate(end);
    }
    if (isMetricSynced) {
      setMetricStartDate(start);
      setMetricEndDate(end);
    }
  };

  const handleResetFilters = () => {
    setSelectedTimeRange('MONTH');
    setCustomStartDate('2026-08-01');
    setCustomEndDate('2026-08-31');
    // Reset all modules to default
    setWarningTimeRange('ALL');
    setIsWarningSynced(false);
    setReportTrendTimeRange('MONTH');
    setIsReportTrendSynced(true);
    setWorkflowTimeRange('MONTH');
    setIsWorkflowSynced(true);
    setMetricTimeRange('MONTH');
    setIsMetricSynced(true);
    setToastMessage('已重置全站及各模块筛选周期至默认视图');
  };

  // Handlers
  const handleOpenDetail = (
    object: any,
    type: 'prod' | 'outsource' | 'task' | 'report'
  ) => {
    setSelectedObject(object);
    setDrawerType(type);
    setDrawerOpen(true);
  };

  // Clicking any of the 4 Todo Cards opens the dedicated TodoModal
  const handleTodoClick = (category: TodoItem['category']) => {
    setSelectedTodoCategory(category);
    setTodoModalOpen(true);
  };

  // Handle item status actions with instant feedback across all categories and statuses
  const handleStatusAction = (
    id: string,
    type: 'prod' | 'outsource' | 'task' | 'report',
    action: string
  ) => {
    if (type === 'prod') {
      let nextStatus = '已审批';
      let msg = '生产工单已审批通过，已就绪可下发排产！';

      if (action === 'submit_approval') {
        nextStatus = '审批中';
        msg = '生产工单已提交审批签署流转！';
      } else if (action === 'approve') {
        nextStatus = '已审批';
        msg = '生产工单已审批签署通过，已就绪可下发排产！';
      } else if (action === 'reject') {
        nextStatus = '草稿';
        msg = '生产工单已驳回退回草稿修改。';
      } else if (action === 'dispatch') {
        nextStatus = '进行中';
        msg = '生产工单已下发车间排产开工！';
      }

      setProdOrdersList((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
      );
      setToastMessage(msg);
    } else if (type === 'outsource') {
      let nextStatus = '进行中';
      let msg = '外协工单已核准通过，进入加工执行阶段！';

      if (action === 'submit_approval') {
        nextStatus = '审批中';
        msg = '外协工单已提交委外特批！';
      } else if (action === 'approve') {
        nextStatus = '进行中';
        msg = '外协工单已核准通过，进入加工执行阶段！';
      } else if (action === 'reject') {
        nextStatus = '已作废';
        msg = '外协申请已被驳回。';
      } else if (action === 'inbound') {
        nextStatus = '已完成';
        msg = '外协工单质检合格，已全数完成入库！';
      }

      setOutsourceOrdersList((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
      );
      setToastMessage(msg);
    } else if (type === 'report') {
      let nextStatus = '已完成';
      let msg = '员工报工记录质检审核通过，工时已计入！';

      if (action === 'approve' || action === 're_approve') {
        nextStatus = '已完成';
        msg = '员工报工记录质检审核通过，工时已计入！';
      } else if (action === 'reject') {
        nextStatus = '审批驳回';
        msg = '报工记录已驳回，需员工重新核实填报。';
      }

      setReportsList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
      );
      setToastMessage(msg);
    } else if (type === 'task') {
      let nextStatus = '生产中';
      let msg = '生产任务已开工下发，工位机已接入！';

      if (action === 'dispatch') {
        nextStatus = '待生产';
        msg = '生产任务已指派并下发到工位机！';
      } else if (action === 'start' || action === 'approve') {
        nextStatus = '生产中';
        msg = '生产任务已确认开工，开始计时生产！';
      } else if (action === 'pause') {
        nextStatus = '暂停';
        msg = '生产任务已异常挂起暂停。';
      } else if (action === 'resume') {
        nextStatus = '生产中';
        msg = '生产任务异常已排除，已恢复开工！';
      } else if (action === 'reject') {
        nextStatus = '取消';
        msg = '任务已取消。';
      }

      setTasksList((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );
      setToastMessage(msg);
    }
  };

  // Handle single item approve/reject (alias for compatibility)
  const handleApproveItem = (
    id: string,
    type: 'prod' | 'outsource' | 'task' | 'report',
    action: string
  ) => {
    handleStatusAction(id, type, action);
  };

  // Handle Batch Approve for a given category
  const handleBatchApprove = (type: 'prod' | 'outsource' | 'task' | 'report') => {
    if (type === 'prod') {
      setProdOrdersList((prev) =>
        prev.map((o) =>
          o.status === '审批中' || o.status === '草稿'
            ? { ...o, status: '已审批' }
            : o
        )
      );
      setToastMessage('已一键批量通过全部待审批生产工单！');
    } else if (type === 'outsource') {
      setOutsourceOrdersList((prev) =>
        prev.map((o) =>
          o.status === '审批中' || o.status === '草稿'
            ? { ...o, status: '进行中' }
            : o
        )
      );
      setToastMessage('已一键批量通过全部待审批外协工单！');
    } else if (type === 'report') {
      setReportsList((prev) =>
        prev.map((r) =>
          r.status === '待审核' ? { ...r, status: '已完成' } : r
        )
      );
      setToastMessage('已一键批量审核通过全部报工记录！');
    } else if (type === 'task') {
      setTasksList((prev) =>
        prev.map((t) =>
          t.status === '待生产' || t.status === '待下发'
            ? { ...t, status: '生产中' }
            : t
        )
      );
      setToastMessage('已一键批量派发全部待生产任务！');
    }
  };

  // Jump from TodoModal directly to the KeyDataTable table / approval page
  const handleJumpToApprovalPage = (
    tab: 'prod' | 'outsource' | 'task' | 'report',
    statusFilter: string
  ) => {
    setActiveTableTab(tab);
    setTableStatusFilter(statusFilter || 'ALL');
    const tableEl = document.getElementById('workbench-key-data-table');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
    setToastMessage(`已切换至【${tab === 'prod' ? '生产工单' : tab === 'outsource' ? '外协工单' : tab === 'task' ? '生产任务' : '报工记录'}】审批管理台`);
  };

  const handlePipelineStepClick = (
    tab: 'prod' | 'outsource' | 'task' | 'report',
    filter: string,
    key?: string
  ) => {
    // 只有三个待审批节点点击后会弹出待审批弹窗
    const pendingApprovalCategoryMap: Record<string, TodoItem['category']> = {
      PROD_APPROVAL: 'PROD_APPROVAL',
      REPORT_PENDING: 'REPORT_APPROVAL',
      OUTSOURCE_APPROVAL: 'OUTSOURCE_APPROVAL',
    };

    if (key && pendingApprovalCategoryMap[key]) {
      setSelectedTodoCategory(pendingApprovalCategoryMap[key]);
      setTodoModalOpen(true);
      setToastMessage(`已展示【${filter}】待审批处理单据`);
    } else {
      // 非待审批节点点击后，直接跳转对应页面/定位对应数据表
      setActiveTableTab(tab);
      setTableStatusFilter(filter || 'ALL');
      const tableEl = document.getElementById('workbench-key-data-table');
      if (tableEl) {
        tableEl.scrollIntoView({ behavior: 'smooth' });
      }
      setToastMessage(`已定位至【${filter}】对应列表`);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastSyncTime(timeStr);
      setToastMessage('工作台聚合数据与预警指标已同步至最新！');
    }, 450);
  };

  // 6大模块拖拽排序状态（支持本地持久化）
  const [sectionOrder, setSectionOrder] = useState<DashboardSectionId[]>(() => {
    try {
      const saved = localStorage.getItem('mes_workbench_section_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === DEFAULT_DASHBOARD_SECTIONS.length &&
          DEFAULT_DASHBOARD_SECTIONS.every((k) => parsed.includes(k))
        ) {
          return parsed as DashboardSectionId[];
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_DASHBOARD_SECTIONS;
  });

  const [draggedSectionId, setDraggedSectionId] = useState<DashboardSectionId | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<DashboardSectionId | null>(null);

  const isCustomSectionOrder =
    JSON.stringify(sectionOrder) !== JSON.stringify(DEFAULT_DASHBOARD_SECTIONS);

  const handleResetSectionOrder = () => {
    setSectionOrder(DEFAULT_DASHBOARD_SECTIONS);
    try {
      localStorage.removeItem('mes_workbench_section_order');
    } catch {
      // ignore
    }
    setToastMessage('已恢复工作台6大模块默认排序');
  };

  const handleSectionMoveUp = (id: DashboardSectionId) => {
    const idx = sectionOrder.indexOf(id);
    if (idx <= 0) return;
    const newOrder = [...sectionOrder];
    const [item] = newOrder.splice(idx, 1);
    newOrder.splice(idx - 1, 0, item);
    setSectionOrder(newOrder);
    try {
      localStorage.setItem('mes_workbench_section_order', JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  };

  const handleSectionMoveDown = (id: DashboardSectionId) => {
    const idx = sectionOrder.indexOf(id);
    if (idx === -1 || idx >= sectionOrder.length - 1) return;
    const newOrder = [...sectionOrder];
    const [item] = newOrder.splice(idx, 1);
    newOrder.splice(idx + 1, 0, item);
    setSectionOrder(newOrder);
    try {
      localStorage.setItem('mes_workbench_section_order', JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  };

  const handleSectionDragStart = (id: DashboardSectionId, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', `section:${id}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSectionId(id);
  };

  const handleSectionDragOver = (e: React.DragEvent, id: DashboardSectionId) => {
    // 仅响应大模块级别的拖拽，排除核心指标看板内部4个子卡片拖拽
    if (draggedSectionId && draggedSectionId !== id) {
      e.preventDefault();
      if (dragOverSectionId !== id) {
        setDragOverSectionId(id);
      }
    }
  };

  const handleSectionDragLeave = (e: React.DragEvent, id: DashboardSectionId) => {
    if (dragOverSectionId === id) {
      setDragOverSectionId(null);
    }
  };

  const handleSectionDrop = (e: React.DragEvent, id: DashboardSectionId) => {
    e.preventDefault();
    if (!draggedSectionId || draggedSectionId === id) {
      setDraggedSectionId(null);
      setDragOverSectionId(null);
      return;
    }

    const fromIdx = sectionOrder.indexOf(draggedSectionId);
    const toIdx = sectionOrder.indexOf(id);
    if (fromIdx !== -1 && toIdx !== -1) {
      const newOrder = [...sectionOrder];
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, draggedSectionId);
      setSectionOrder(newOrder);
      try {
        localStorage.setItem('mes_workbench_section_order', JSON.stringify(newOrder));
      } catch {
        // ignore
      }
      setToastMessage('已更新工作台展示模块位置');
    }
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  };

  // 渲染模块内部名称左边的六个点拖拽手柄
  const renderSectionDragHandle = (secId: DashboardSectionId, title: string) => (
    <div
      draggable={true}
      onDragStart={(e) => handleSectionDragStart(secId, e)}
      onDragEnd={handleSectionDragEnd}
      title={`按住拖拽移动「${title}」模块`}
      aria-label={`按住拖拽移动「${title}」模块`}
      className="flex h-5 w-5 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-indigo-600 active:cursor-grabbing dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors select-none -ml-0.5"
    >
      <GripVertical className="h-3.5 w-3.5" />
    </div>
  );

  // 渲染大模块
  const renderDashboardSection = (secId: DashboardSectionId, index: number) => {
    const isDragging = draggedSectionId === secId;
    const isDropTarget = dragOverSectionId === secId;

    switch (secId) {
      case 'warning':
        return (
          <DraggableSectionWrapper
            key="warning"
            id="warning"
            index={index}
            totalSections={sectionOrder.length}
            className="lg:col-span-1"
            isDragging={isDragging}
            isDropTarget={isDropTarget}
            onDragOver={handleSectionDragOver}
            onDragLeave={handleSectionDragLeave}
            onDrop={handleSectionDrop}
          >
            <DeliveryWarningSection
              dragHandle={renderSectionDragHandle('warning', '交期预警')}
              prodOrders={warningFilteredProdOrders}
              outsourceOrders={warningFilteredOutsourceOrders}
              tasks={warningFilteredTasks}
              onOpenDetail={handleOpenDetail}
              warningTimeRange={warningTimeRange}
              onWarningTimeRangeChange={(r) => {
                setWarningTimeRange(r);
                setIsWarningSynced(false);
              }}
              warningStartDate={warningStartDate}
              warningEndDate={warningEndDate}
              onWarningCustomDateChange={(s, e) => {
                setWarningStartDate(s);
                setWarningEndDate(e);
                setIsWarningSynced(false);
              }}
              isWarningSyncedWithGlobal={isWarningSynced}
              onWarningSyncWithGlobal={() => {
                setWarningTimeRange(selectedTimeRange);
                setWarningStartDate(customStartDate);
                setWarningEndDate(customEndDate);
                setIsWarningSynced(true);
              }}
            />
          </DraggableSectionWrapper>
        );

      case 'reportTrend':
        return (
          <DraggableSectionWrapper
            key="reportTrend"
            id="reportTrend"
            index={index}
            totalSections={sectionOrder.length}
            className="lg:col-span-1"
            isDragging={isDragging}
            isDropTarget={isDropTarget}
            onDragOver={handleSectionDragOver}
            onDragLeave={handleSectionDragLeave}
            onDrop={handleSectionDrop}
          >
            <WorkReportTrendSection
              dragHandle={renderSectionDragHandle('reportTrend', '报工情况')}
              trendData={trendData}
              reportTrendTimeRange={reportTrendTimeRange}
              onReportTrendTimeRangeChange={(r) => {
                setReportTrendTimeRange(r);
                setIsReportTrendSynced(false);
              }}
              reportTrendStartDate={reportTrendStartDate}
              reportTrendEndDate={reportTrendEndDate}
              onReportTrendCustomDateChange={(s, e) => {
                setReportTrendStartDate(s);
                setReportTrendEndDate(e);
                setIsReportTrendSynced(false);
              }}
              isReportTrendSyncedWithGlobal={isReportTrendSynced}
              onReportTrendSyncWithGlobal={() => {
                setReportTrendTimeRange(selectedTimeRange);
                setReportTrendStartDate(customStartDate);
                setReportTrendEndDate(customEndDate);
                setIsReportTrendSynced(true);
              }}
            />
          </DraggableSectionWrapper>
        );

      case 'workflow':
        return (
          <DraggableSectionWrapper
            key="workflow"
            id="workflow"
            index={index}
            totalSections={sectionOrder.length}
            className="lg:col-span-2"
            isDragging={isDragging}
            isDropTarget={isDropTarget}
            onDragOver={handleSectionDragOver}
            onDragLeave={handleSectionDragLeave}
            onDrop={handleSectionDrop}
          >
            <UnifiedWorkflowSection
              dragHandle={renderSectionDragHandle('workflow', '业务流转与待办中心')}
              todoItems={todoItems}
              onTodoClick={handleTodoClick}
              internalSteps={internalPipeline}
              outsourceSteps={outsourcePipeline}
              onStepClick={handlePipelineStepClick}
              workflowTimeRange={workflowTimeRange}
              onWorkflowTimeRangeChange={(r) => {
                setWorkflowTimeRange(r);
                setIsWorkflowSynced(false);
              }}
              workflowStartDate={workflowStartDate}
              workflowEndDate={workflowEndDate}
              onWorkflowCustomDateChange={(s, e) => {
                setWorkflowStartDate(s);
                setWorkflowEndDate(e);
                setIsWorkflowSynced(false);
              }}
              isWorkflowSyncedWithGlobal={isWorkflowSynced}
              onWorkflowSyncWithGlobal={() => {
                setWorkflowTimeRange(selectedTimeRange);
                setWorkflowStartDate(customStartDate);
                setWorkflowEndDate(customEndDate);
                setIsWorkflowSynced(true);
              }}
            />
          </DraggableSectionWrapper>
        );

      case 'metrics':
        return (
          <DraggableSectionWrapper
            key="metrics"
            id="metrics"
            index={index}
            totalSections={sectionOrder.length}
            className="lg:col-span-2"
            isDragging={isDragging}
            isDropTarget={isDropTarget}
            onDragOver={handleSectionDragOver}
            onDragLeave={handleSectionDragLeave}
            onDrop={handleSectionDrop}
          >
            <MetricOverviewGrid
              dragHandle={renderSectionDragHandle('metrics', '核心指标看板')}
              metrics={workbenchMetrics}
              onNavigateTab={(tab) => {
                setActiveTableTab(tab);
                const el = document.getElementById('workbench-key-data-table');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              metricTimeRange={metricTimeRange}
              onMetricTimeRangeChange={(r) => {
                setMetricTimeRange(r);
                setIsMetricSynced(false);
              }}
              metricStartDate={metricStartDate}
              metricEndDate={metricEndDate}
              onMetricCustomDateChange={(s, e) => {
                setMetricStartDate(s);
                setMetricEndDate(e);
                setIsMetricSynced(false);
              }}
              isMetricSyncedWithGlobal={isMetricSynced}
              onMetricSyncWithGlobal={() => {
                setMetricTimeRange(selectedTimeRange);
                setMetricStartDate(customStartDate);
                setMetricEndDate(customEndDate);
                setIsMetricSynced(true);
              }}
            />
          </DraggableSectionWrapper>
        );

      case 'calendarSchedule':
        return (
          <DraggableSectionWrapper
            key="calendarSchedule"
            id="calendarSchedule"
            index={index}
            totalSections={sectionOrder.length}
            className="lg:col-span-2"
            isDragging={isDragging}
            isDropTarget={isDropTarget}
            onDragOver={handleSectionDragOver}
            onDragLeave={handleSectionDragLeave}
            onDrop={handleSectionDrop}
          >
            <CalendarSchedule
              dragHandle={renderSectionDragHandle('calendarSchedule', '生产计划日历')}
              events={calendarEvents}
              selectedDate={selectedCalendarDate}
              onSelectDate={setSelectedCalendarDate}
              onOpenDetail={handleOpenDetail}
            />
          </DraggableSectionWrapper>
        );

      case 'employeeReport':
        return (
          <DraggableSectionWrapper
            key="employeeReport"
            id="employeeReport"
            index={index}
            totalSections={sectionOrder.length}
            className="lg:col-span-2"
            isDragging={isDragging}
            isDropTarget={isDropTarget}
            onDragOver={handleSectionDragOver}
            onDragLeave={handleSectionDragLeave}
            onDrop={handleSectionDrop}
          >
            <EmployeeReportQuery
              dragHandle={renderSectionDragHandle('employeeReport', '报工统计情况')}
              reports={reportsList}
              onNavigateToReport={() => {
                setActiveTableTab('report');
                setTableStatusFilter('ALL');
                const el = document.getElementById('workbench-key-data-table');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </DraggableSectionWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      {/* 1. 系统导航区 (Header & Navigation) */}
      <HeaderNav
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastSyncTime={lastSyncTime}
        unreadAlertsCount={totalWarningsCount}
        onOpenAlerts={() => setAlertsOpen(true)}
      />

      {/* Main Workspace Container - Full Edge-to-Edge Fluid Grid Layout */}
      <main className="w-full flex-1 px-2.5 py-2.5 sm:px-3 sm:py-3 space-y-2.5">
        {/* 2. 筛选与数据范围控制区 */}
        <FilterBar
          selectedTimeRange={selectedTimeRange}
          onTimeRangeChange={handleGlobalTimeRangeChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleGlobalCustomDateChange}
          onResetFilters={handleResetFilters}
        />

        {/* 自定义模块顺序重置按钮 (无提示语，仅在用户调换过顺序时显示) */}
        {isCustomSectionOrder && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResetSectionOrder}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-2xs hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              title="重置6大模块至系统初始默认顺序"
            >
              <RotateCcw className="h-3 w-3 text-slate-400" />
              <span>恢复默认模块顺序</span>
            </button>
          </div>
        )}

        {/* 3. 动态渲染 6 大大模块 (交期预警与报工情况为左右半宽，其它为全宽) */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {sectionOrder.map((secId, idx) => renderDashboardSection(secId, idx))}
        </div>

        {/* 4. 业务单据数据台与审批列表 (KeyDataTable) */}
        <div id="workbench-key-data-table" className="pt-1">
          <KeyDataTable
            activeTab={activeTableTab}
            setActiveTab={setActiveTableTab}
            statusFilter={tableStatusFilter}
            setStatusFilter={setTableStatusFilter}
            prodOrders={filteredProdOrders}
            outsourceOrders={filteredOutsourceOrders}
            tasks={filteredTasks}
            reports={filteredReports}
            onOpenDetail={handleOpenDetail}
          />
        </div>
      </main>

      {/* Footer System Status Bar */}
      <footer className="border-t border-slate-200 bg-white/80 px-2.5 py-1.5 sm:px-3 text-center text-[11px] text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          <span>
            工单工作台 V1.0 · 生产执行管理
          </span>
          <span className="font-mono-num">
            数据更新周期: 实时 · 预警引擎状态: <span className="text-emerald-600 font-semibold">在线监测中</span>
          </span>
        </div>
      </footer>

      {/* 9. 待办事项推拉门抽屉 (TodoDrawer - Slide-over style with concise info & 前往审批 button) */}
      <TodoDrawer
        isOpen={todoModalOpen}
        onClose={() => setTodoModalOpen(false)}
        initialCategory={selectedTodoCategory}
        prodOrders={prodOrdersList}
        outsourceOrders={outsourceOrdersList}
        tasks={tasksList}
        reports={reportsList}
        onOpenDetail={(obj, type) => {
          handleOpenDetail(obj, type);
        }}
        onApproveItem={handleApproveItem}
        onJumpToApprovalPage={handleJumpToApprovalPage}
      />

      {/* 10. 详情抽屉 (FR-15) */}
      <DetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedObject={selectedObject}
        objectType={drawerType}
        onStatusAction={handleStatusAction}
        onActionSuccess={(msg) => {
          setToastMessage(msg);
        }}
      />

      {/* 11. 预警通知 Popover */}
      <NotificationPopover
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        todoItems={todoItems}
        prodWarnings={prodWarnings}
        outsourceWarnings={outsourceWarnings}
        taskWarnings={taskWarnings}
        onOpenDetail={handleOpenDetail}
      />

      {/* 12. Toast 状态反馈 */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
