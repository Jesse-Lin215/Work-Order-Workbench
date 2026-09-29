/**
 * Metrics Calculator & Data Aggregation Engine
 * Follows strictly PRD Section 6 (Core Metrics), Section 7 & Section 8 (Warnings)
 */

import {
  CalendarEvent,
  FactoryId,
  OutsourceOrder,
  OutsourceOverviewMetrics,
  ProductionOrder,
  ProductionOrderOverviewMetrics,
  ProductionTask,
  TaskOverviewMetrics,
  TimeRangeOption,
  TodoItem,
  TrendDataPoint,
  WarningType,
  WorkbenchMetrics,
  WorkReportOverviewMetrics,
  WorkReportRecord,
} from '../types';

/**
 * Filter data by Factory
 */
export function filterByFactory<T extends { factoryId: FactoryId }>(
  items: T[],
  factoryId: FactoryId
): T[] {
  if (factoryId === 'ALL') return items;
  return items.filter((item) => item.factoryId === factoryId);
}

/**
 * Filter data by Time Range based on PRD Section 6.5
 * 生产工单: 计划交期
 * 外协工单: 计划交期
 * 生产任务: 计划开始时间
 * 报工记录: 报工时间
 */
export function isDateInRange(
  dateStr: string,
  timeRange: TimeRangeOption,
  customStart?: string,
  customEnd?: string,
  simulatedToday: string = '2026-08-31'
): boolean {
  if (!dateStr) return false;
  // normalize dateStr to YYYY-MM-DD
  const targetDate = dateStr.slice(0, 10);
  const today = new Date(simulatedToday);

  if (timeRange === 'TODAY') {
    return targetDate === simulatedToday;
  }

  if (timeRange === 'WEEK') {
    // Current simulated week (e.g., 2026-08-24 to 2026-08-31)
    const dayOfWeek = today.getDay() || 7; // Monday is 1, Sunday is 7
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + (7 - dayOfWeek));

    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);
    return targetDate >= mondayStr && targetDate <= sundayStr;
  }

  if (timeRange === 'MONTH') {
    // Current simulated month (e.g. 2026-08)
    const yearMonth = simulatedToday.slice(0, 7);
    return targetDate.startsWith(yearMonth);
  }

  if (timeRange === 'CUSTOM') {
    if (!customStart && !customEnd) return true;
    if (customStart && targetDate < customStart) return false;
    if (customEnd && targetDate > customEnd) return false;
    return true;
  }

  return true;
}

/**
 * 6.1 生产工单指标计算 (聚焦生产产品总量、完工产出、在制与交付达成)
 */
export function calculateProductionOrderMetrics(
  orders: ProductionOrder[]
): ProductionOrderOverviewMetrics {
  // 作废工单不参与有效执行统计
  const validOrders = orders.filter((o) => o.status !== '作废');
  const completedOrders = validOrders.filter((o) => o.status === '已完成');
  const inProgressOrders = validOrders.filter((o) => o.status === '进行中');
  const pausedOrders = validOrders.filter((o) => o.status === '暂停');

  // 产品总量维度
  const totalPlannedQty = validOrders.reduce((sum, o) => sum + (o.planQty || 0), 0);
  const totalProducedQty = validOrders.reduce(
    (sum, o) => sum + (o.finishedQty ?? (o.status === '已完成' ? o.planQty : 0) ?? 0),
    0
  );
  const wipProductQty = inProgressOrders.reduce(
    (sum, o) => sum + Math.max(0, (o.planQty || 0) - (o.finishedQty || 0)),
    0
  );
  const remainingPlanQty = Math.max(0, totalPlannedQty - totalProducedQty);
  const productFulfillmentRate =
    totalPlannedQty > 0
      ? Math.min(100, Math.round((totalProducedQty / totalPlannedQty) * 1000) / 10)
      : 0;

  // 计划数量：统计进行中工单的计划数量合计 (向后兼容)
  const plannedQty = inProgressOrders.reduce((sum, o) => sum + (o.planQty || 0), 0);
  const completedTotalProducedQty = totalProducedQty;

  // 总体进度：全部纳入统计工单的总体进度合计 ÷ 工单数量 (含暂停，不含作废)
  const countForProgress = validOrders.length;
  const sumProgress = validOrders.reduce((sum, o) => sum + (o.totalProgress || 0), 0);
  const overallProgress =
    countForProgress > 0 ? Math.min(100, Math.round((sumProgress / countForProgress) * 10) / 10) : 0;

  return {
    completedOrdersCount: completedOrders.length,
    inProgressOrdersCount: inProgressOrders.length,
    completedQty: completedOrders.length,
    uncompletedQty: inProgressOrders.length,
    plannedQty,
    completedTotalProducedQty,
    overallProgress,
    totalValidOrders: validOrders.length,
    pausedOrdersCount: pausedOrders.length,
    // 产品数量维度
    totalPlannedQty,
    totalProducedQty,
    wipProductQty,
    remainingPlanQty,
    productFulfillmentRate,
  };
}

/**
 * 6.2 外协工单指标计算 (聚焦外协产品委托加工量、供应商产出、质检入库与履约交付)
 */
export function calculateOutsourceMetrics(
  orders: OutsourceOrder[]
): OutsourceOverviewMetrics {
  const pendingCount = orders.filter(
    (o) => o.status === '草稿' || o.status === '审批中'
  ).length;
  const inProgressOrders = orders.filter((o) => o.status === '进行中');
  const pendingInboundOrders = orders.filter((o) => o.status === '待入库');
  const completedOrders = orders.filter((o) => o.status === '已完成');

  // 非已作废外协工单的计划数量合计
  const validOrders = orders.filter((o) => o.status !== '已作废');
  const totalPlanQty = validOrders.reduce((sum, o) => sum + (o.planQty || 0), 0);

  // 外协产品加工与交付件数计算
  const outsourcedProducedQty = validOrders.reduce((sum, o) => {
    if (o.status === '已完成' || o.status === '待入库') {
      return sum + (o.planQty || 0);
    }
    const rate = (o.productionProgress || 0) / 100;
    return sum + Math.round((o.planQty || 0) * rate);
  }, 0);

  const inboundedProductQty = validOrders.reduce((sum, o) => {
    if (o.status === '已完成') {
      return sum + (o.planQty || 0);
    }
    const rate = (o.inboundProgress || 0) / 100;
    return sum + Math.round((o.planQty || 0) * rate);
  }, 0);

  const inTransitQty = Math.max(0, outsourcedProducedQty - inboundedProductQty);
  const unprocessedPlanQty = Math.max(0, totalPlanQty - outsourcedProducedQty);
  const inboundFulfillmentRate =
    totalPlanQty > 0
      ? Math.min(100, Math.round((inboundedProductQty / totalPlanQty) * 1000) / 10)
      : 0;

  // 对进行中、待入库、已完成工单按计划数量加权
  const activeOrders = orders.filter(
    (o) => o.status === '进行中' || o.status === '待入库' || o.status === '已完成'
  );
  const activePlanQtySum = activeOrders.reduce((sum, o) => sum + (o.planQty || 0), 0);

  let weightedProductionProgress = 0;
  let weightedInboundProgress = 0;

  if (activePlanQtySum > 0) {
    const prodWeightedSum = activeOrders.reduce(
      (sum, o) => sum + (o.planQty || 0) * (o.productionProgress || 0),
      0
    );
    const inbWeightedSum = activeOrders.reduce(
      (sum, o) => sum + (o.planQty || 0) * (o.inboundProgress || 0),
      0
    );
    weightedProductionProgress = Math.min(100, Math.round((prodWeightedSum / activePlanQtySum) * 10) / 10);
    weightedInboundProgress = Math.min(100, Math.round((inbWeightedSum / activePlanQtySum) * 10) / 10);
  }

  return {
    pendingCount,
    inProgressCount: inProgressOrders.length,
    pendingInboundCount: pendingInboundOrders.length,
    completedCount: completedOrders.length,
    totalPlanQty,
    weightedProductionProgress,
    weightedInboundProgress,
    // 外协产品数量维度
    outsourcedProducedQty,
    inboundedProductQty,
    inTransitQty,
    unprocessedPlanQty,
    inboundFulfillmentRate,
  };
}

/**
 * 6.3 生产任务指标计算
 * 待下发仅在链路显示，不进入概览；取消和作废不展示、不统计。
 */
export function calculateTaskMetrics(
  tasks: ProductionTask[],
  simulatedToday: string = '2026-08-31'
): TaskOverviewMetrics {
  // 有效任务：待生产、生产中、暂停、已完成
  const validTasks = tasks.filter(
    (t) =>
      t.status === '待生产' ||
      t.status === '生产中' ||
      t.status === '暂停' ||
      t.status === '已完成'
  );

  const pendingProductionCount = validTasks.filter((t) => t.status === '待生产').length;
  const inProgressCount = validTasks.filter((t) => t.status === '生产中').length;
  const pausedCount = validTasks.filter((t) => t.status === '暂停').length;
  const completedCount = validTasks.filter((t) => t.status === '已完成').length;

  const scheduledQty = validTasks.reduce((sum, t) => sum + (t.scheduledQty || 0), 0);
  const producedQty = validTasks.reduce((sum, t) => sum + (t.producedQty || 0), 0);
  const inProgressTasksList = validTasks.filter((t) => t.status === '生产中');
  const inProgressQty = inProgressTasksList.reduce(
    (sum, t) => sum + Math.max(0, (t.scheduledQty || 0) - (t.producedQty || 0)),
    0
  );
  const unproducedQty = Math.max(scheduledQty - producedQty, 0);

  const completionRate =
    scheduledQty > 0 ? Math.min(100, Math.round((producedQty / scheduledQty) * 1000) / 10) : 0;

  // 周期任务计划与已产统计 (根据看板周期选中的有效任务范围进行统计)
  const periodScheduledQty = scheduledQty;
  const periodProducedQty = producedQty;

  return {
    pendingProductionCount,
    inProgressCount,
    pausedCount,
    completedCount,
    scheduledQty,
    producedQty,
    unproducedQty,
    inProgressQty,
    completionRate,
    todayScheduledQty: periodScheduledQty,
    todayProducedQty: periodProducedQty,
    periodScheduledQty,
    periodProducedQty,
    totalTaskBatches: validTasks.length,
  };
}

/**
 * 6.4 报工记录指标计算
 * 草稿不计入待办、数量、工时、质量指标；审批驳回、已取消不计入汇总。
 * 待审核报工计入数量和工时，但良品/不良品仅来自已完成报工。
 */
export function calculateWorkReportMetrics(
  reports: WorkReportRecord[]
): WorkReportOverviewMetrics {
  const validReports = reports.filter(
    (r) => r.status === '已完成' || r.status === '待审核'
  );

  const totalReportQty = validReports.reduce((sum, r) => sum + (r.reportQty || 0), 0);
  const pendingReports = validReports.filter((r) => r.status === '待审核');
  const auditedReports = validReports.filter((r) => r.status === '已完成');

  const pendingAuditCount = pendingReports.length;
  const auditedCount = auditedReports.length;

  const pendingAuditQty = pendingReports.reduce((sum, r) => sum + (r.reportQty || 0), 0);

  const totalReportHours = validReports.reduce((sum, r) => sum + (r.reportHours || 0), 0);
  const auditedHours = auditedReports.reduce((sum, r) => sum + (r.reportHours || 0), 0);
  const pendingAuditHours = pendingReports.reduce((sum, r) => sum + (r.reportHours || 0), 0);

  // 仅统计已完成报工的良品数和不良品数
  const goodQty = auditedReports.reduce((sum, r) => sum + (r.goodQty || 0), 0);
  const defectQty = auditedReports.reduce((sum, r) => sum + (r.defectQty || 0), 0);

  const totalQualityPieces = goodQty + defectQty;
  const goodRate =
    totalQualityPieces > 0 ? Math.min(100, Math.round((goodQty / totalQualityPieces) * 1000) / 10) : 100;
  const defectRate =
    totalQualityPieces > 0 ? Math.min(100, Math.round((defectQty / totalQualityPieces) * 1000) / 10) : 0;

  return {
    totalReportQty,
    pendingAuditCount,
    auditedCount,
    totalReportHours: Math.round(totalReportHours * 10) / 10,
    auditedHours: Math.round(auditedHours * 10) / 10,
    pendingAuditHours: Math.round(pendingAuditHours * 10) / 10,
    goodQty,
    defectQty,
    pendingAuditQty,
    goodRate,
    defectRate,
  };
}

/**
 * Aggregate all metrics for the workbench
 */
export function computeWorkbenchMetrics(
  prodOrders: ProductionOrder[],
  outsourceOrders: OutsourceOrder[],
  tasks: ProductionTask[],
  reports: WorkReportRecord[],
  simulatedToday: string = '2026-08-31'
): WorkbenchMetrics {
  return {
    productionOrders: calculateProductionOrderMetrics(prodOrders),
    outsourceOrders: calculateOutsourceMetrics(outsourceOrders),
    tasks: calculateTaskMetrics(tasks, simulatedToday),
    workReports: calculateWorkReportMetrics(reports),
  };
}

/**
 * FR-03 待办事项计算
 */
export function computeTodoItems(
  prodOrders: ProductionOrder[],
  outsourceOrders: OutsourceOrder[],
  tasks: ProductionTask[],
  reports: WorkReportRecord[]
): TodoItem[] {
  const prodPendingApproval = prodOrders.filter((o) => o.status === '审批中').length;
  const outsourcePendingApproval = outsourceOrders.filter((o) => o.status === '审批中').length;
  const reportPendingApproval = reports.filter((r) => r.status === '待审核').length;
  const pendingTasks = tasks.filter((t) => t.status === '待生产').length;

  return [
    {
      id: 'TODO-PROD-APP',
      title: '生产工单待审批',
      count: prodPendingApproval,
      unit: '单',
      desc: '需主管审批核实生产/排产信息',
      category: 'PROD_APPROVAL',
      badgeType: prodPendingApproval > 0 ? 'warning' : 'primary',
      targetTab: 'prod',
      filterStatus: '审批中',
    },
    {
      id: 'TODO-OUTSOURCE-APP',
      title: '外协工单待审批',
      count: outsourcePendingApproval,
      unit: '单',
      desc: '需主管审批核实外协信息',
      category: 'OUTSOURCE_APPROVAL',
      badgeType: outsourcePendingApproval > 0 ? 'warning' : 'primary',
      targetTab: 'outsource',
      filterStatus: '审批中',
    },
    {
      id: 'TODO-REPORT-APP',
      title: '报工记录待审批',
      count: reportPendingApproval,
      unit: '条',
      desc: '车间员工提交报工，待主管审批',
      category: 'REPORT_APPROVAL',
      badgeType: reportPendingApproval > 0 ? 'danger' : 'primary',
      targetTab: 'report',
      filterStatus: '待审核',
    },
    {
      id: 'TODO-TASK-PENDING',
      title: '待生产任务',
      count: pendingTasks,
      unit: '项',
      desc: '任务已下发，待车间员工开始处理',
      category: 'PENDING_TASK',
      badgeType: pendingTasks > 0 ? 'info' : 'primary',
      targetTab: 'task',
      filterStatus: '待生产',
    },
  ];
}

/**
 * FR-04 内部生产执行链路计算 (在制生产与物理流转全景)
 * 节点序列：进行中工单 → 待派工任务 → 产线生产中 → 报工已核验 → 已完工入库
 */
export function computeInternalExecutionPipeline(
  prodOrders: ProductionOrder[],
  tasks: ProductionTask[],
  reports: WorkReportRecord[]
) {
  const pendingApprovalOrders = prodOrders.filter((o) => o.status === '审批中' || o.status === '草稿').length;
  const inProgressOrders = prodOrders.filter((o) => o.status === '进行中').length;
  const pendingTasks = tasks.filter((t) => t.status === '待生产').length;
  const inProgressTasks = tasks.filter((t) => t.status === '生产中').length;
  const pendingReports = reports.filter((r) => r.status === '待审核').length;
  const auditedReports = reports.filter((r) => r.status === '已完成').length;
  const completedOrders = prodOrders.filter((o) => o.status === '已完成').length;

  return [
    { key: 'PROD_APPROVAL', label: '工单待审批', count: pendingApprovalOrders, targetTab: 'prod', statusFilter: '审批中', desc: '待签署下发的生产工单', isPending: true },
    { key: 'PROD_IN_PROGRESS', label: '工单进行中', count: inProgressOrders, targetTab: 'prod', statusFilter: '进行中', desc: '处于排产执行期内的在制工单' },
    { key: 'TASK_PENDING', label: '任务待生产', count: pendingTasks, targetTab: 'task', statusFilter: '待生产', desc: '工位已指派待开工投产', isPending: true },
    { key: 'TASK_PRODUCING', label: '任务生产中', count: inProgressTasks, targetTab: 'task', statusFilter: '生产中', desc: '机台与工位正在加工中' },
    { key: 'REPORT_PENDING', label: '报工待审批', count: pendingReports, targetTab: 'report', statusFilter: '待审核', desc: '待质检与主管校验的报工单', isPending: true },
    { key: 'REPORT_AUDITED', label: '报工已审批', count: auditedReports, targetTab: 'report', statusFilter: '已完成', desc: '质检合格并归档的报工记录' },
    { key: 'PROD_COMPLETED', label: '工单已完成', count: completedOrders, targetTab: 'prod', statusFilter: '已完成', desc: '全工序完成并合格入库' },
  ];
}

/**
 * FR-05 外协交付流转链路计算 (供应商委外交付流)
 * 节点序列：外协待审批 → 外协生产中 → 外协待入库 → 外协已完成
 */
export function computeOutsourceExecutionPipeline(outsourceOrders: OutsourceOrder[]) {
  const pendingApproval = outsourceOrders.filter((o) => o.status === '审批中' || o.status === '草稿').length;
  const inProgress = outsourceOrders.filter((o) => o.status === '进行中').length;
  const pendingInbound = outsourceOrders.filter((o) => o.status === '待入库').length;
  const completed = outsourceOrders.filter((o) => o.status === '已完成').length;

  return [
    { key: 'OUTSOURCE_APPROVAL', label: '外协待审批', count: pendingApproval, targetTab: 'outsource', statusFilter: '审批中', desc: '待特批发出的委外工单', isPending: true },
    { key: 'OUTSOURCE_IN_PROGRESS', label: '外协生产中', count: inProgress, targetTab: 'outsource', statusFilter: '进行中', desc: '供应商正在承制生产' },
    { key: 'OUTSOURCE_INBOUND', label: '外协待入库', count: pendingInbound, targetTab: 'outsource', statusFilter: '待入库', desc: '外协已送达，待质检验收入库' },
    { key: 'OUTSOURCE_COMPLETED', label: '外协已完成', count: completed, targetTab: 'outsource', statusFilter: '已完成', desc: '检验合格并入库结算' },
  ];
}

/**
 * FR-06 & Section 9: 生产日历与当天事项整合
 */
export function generateCalendarEvents(
  prodOrders: ProductionOrder[],
  outsourceOrders: OutsourceOrder[],
  tasks: ProductionTask[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // 1. 生产工单交期
  prodOrders.forEach((order) => {
    if (order.status !== '作废' && order.planEndDate) {
      let priorityLevel: 'OVERDUE' | 'UPCOMING' | 'NORMAL' = 'NORMAL';
      if (order.warningType === 'OVERDUE') priorityLevel = 'OVERDUE';
      else if (order.warningType === 'UPCOMING_DUE') priorityLevel = 'UPCOMING';

      events.push({
        id: `cal-po-${order.id}`,
        date: order.planEndDate,
        time: '18:00',
        type: '生产工单',
        businessCode: order.code,
        name: order.productName,
        spec: order.spec,
        nodeType: '计划交期',
        status: order.status,
        progress: order.totalProgress,
        priorityLevel,
        rawObject: order,
      });
    }
  });

  // 2. 外协工单交期
  outsourceOrders.forEach((order) => {
    if (order.status !== '已作废' && order.planEndDate) {
      let priorityLevel: 'OVERDUE' | 'UPCOMING' | 'NORMAL' = 'NORMAL';
      if (order.warningType === 'OVERDUE') priorityLevel = 'OVERDUE';
      else if (order.warningType === 'UPCOMING_DUE') priorityLevel = 'UPCOMING';

      events.push({
        id: `cal-os-${order.id}`,
        date: order.planEndDate,
        time: '17:00',
        type: '外协工单',
        businessCode: order.code,
        name: order.productName,
        spec: order.spec,
        supplier: order.supplierName,
        nodeType: '计划交期',
        status: order.status,
        progress: order.productionProgress,
        priorityLevel,
        rawObject: order,
      });
    }
  });

  // 3. 生产任务 (计划开始 / 预计完成)
  tasks.forEach((task) => {
    if (task.status !== '取消' && task.status !== '作废') {
      let priorityLevel: 'OVERDUE' | 'UPCOMING' | 'NORMAL' = 'NORMAL';
      if (task.warningType === 'OVERDUE') priorityLevel = 'OVERDUE';
      else if (task.warningType === 'NOT_STARTED_ON_TIME' || task.warningType === 'PROGRESS_DELAY') {
        priorityLevel = 'UPCOMING';
      }

      // Find related production order to get the spec
      const relatedOrder = prodOrders.find(o => o.code === task.sourceOrderCode);
      const spec = relatedOrder ? relatedOrder.spec : undefined;

      // 计划开始
      if (task.planStartTime) {
        events.push({
          id: `cal-tsk-start-${task.id}`,
          date: task.planStartTime.slice(0, 10),
          time: task.planStartTime.slice(11, 16),
          type: '生产任务',
          businessCode: task.code,
          name: task.taskName,
          spec,
          nodeType: '计划开始',
          status: task.status,
          progress: task.taskProgress,
          priorityLevel,
          rawObject: task,
        });
      }

      // 预计完成
      if (task.estimatedEndTime) {
        events.push({
          id: `cal-tsk-end-${task.id}`,
          date: task.estimatedEndTime.slice(0, 10),
          time: task.estimatedEndTime.slice(11, 16),
          type: '生产任务',
          businessCode: task.code,
          name: task.taskName,
          spec,
          nodeType: '预计完成',
          status: task.status,
          progress: task.taskProgress,
          priorityLevel,
          rawObject: task,
        });
      }
    }
  });

  return events;
}

/**
 * Filter and sort events for the selected date (Section 9: 最大 4 条，按优先级和时间排序)
 */
export function getDayScheduleEvents(
  events: CalendarEvent[],
  selectedDate: string
): CalendarEvent[] {
  const dayEvents = events.filter((e) => e.date === selectedDate);

  const priorityScore = {
    OVERDUE: 3,
    UPCOMING: 2,
    NORMAL: 1,
  };

  return dayEvents.sort((a, b) => {
    // 优先级比较
    const scoreDiff = priorityScore[b.priorityLevel] - priorityScore[a.priorityLevel];
    if (scoreDiff !== 0) return scoreDiff;
    // 节点时间升序比较
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB);
  });
}

/**
 * FR-13 报工趋势生成 (By Date & TimeRange)
 */
export function generateWorkReportTrends(
  reports: WorkReportRecord[],
  timeRange: TimeRangeOption = 'MONTH',
  customStartDate: string = '2026-08-01',
  customEndDate: string = '2026-08-31',
  simulatedCurrentDate: string = '2026-08-31'
): TrendDataPoint[] {
  let startDate = '2026-08-01';
  let endDate = simulatedCurrentDate;

  if (timeRange === 'TODAY') {
    startDate = simulatedCurrentDate;
    endDate = simulatedCurrentDate;
  } else if (timeRange === 'WEEK') {
    const cur = new Date(simulatedCurrentDate);
    const start = new Date(cur);
    start.setDate(cur.getDate() - 6);
    startDate = start.toISOString().slice(0, 10);
    endDate = simulatedCurrentDate;
  } else if (timeRange === 'MONTH') {
    startDate = '2026-08-01';
    endDate = simulatedCurrentDate;
  } else if (timeRange === 'CUSTOM') {
    startDate = customStartDate;
    endDate = customEndDate;
  } else if (timeRange === 'ALL') {
    if (reports.length > 0) {
      const dates = reports.map((r) => r.reportTime.slice(0, 10)).sort();
      startDate = dates[0] < '2026-08-01' ? dates[0] : '2026-08-01';
      endDate = dates[dates.length - 1] > simulatedCurrentDate ? dates[dates.length - 1] : simulatedCurrentDate;
    } else {
      startDate = '2026-08-01';
      endDate = simulatedCurrentDate;
    }
  }

  const dateMap = new Map<string, { audited: number; pending: number; hours: number; good: number; defect: number }>();

  // Initialize dates
  const curr = new Date(startDate);
  const end = new Date(endDate);
  let safetyCount = 0;
  while (curr <= end && safetyCount < 60) {
    const dStr = curr.toISOString().slice(0, 10);
    dateMap.set(dStr, { audited: 0, pending: 0, hours: 0, good: 0, defect: 0 });
    curr.setDate(curr.getDate() + 1);
    safetyCount++;
  }

  // Populate from valid reports
  reports.forEach((r) => {
    const dStr = r.reportTime.slice(0, 10);
    if (dateMap.has(dStr)) {
      const entry = dateMap.get(dStr)!;
      if (r.status === '已完成') {
        entry.audited += 1;
        entry.hours += r.reportHours;
        entry.good += r.goodQty;
        entry.defect += r.defectQty;
      } else if (r.status === '待审核') {
        entry.pending += 1;
        entry.hours += r.reportHours;
      }
    }
  });

  const result: TrendDataPoint[] = [];
  dateMap.forEach((val, dStr) => {
    const totalQ = val.good + val.defect;
    const goodRate = totalQ > 0 ? Math.round((val.good / totalQ) * 1000) / 10 : 100;
    result.push({
      date: dStr,
      displayDate: dStr.slice(5),
      auditedCount: val.audited,
      pendingCount: val.pending,
      totalHours: Math.round(val.hours * 10) / 10,
      goodRate,
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}
