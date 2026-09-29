/**
 * 工单工作台 TypeScript Types & Interfaces
 * Defined strictly according to PRD V1.0 specifications
 */

export type FactoryId = 'ALL' | 'F01' | 'F02' | 'F03';

export interface FactoryInfo {
  id: FactoryId;
  name: string;
  code: string;
  location: string;
}

export type TimeRangeOption = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | 'ALL';

// 6.1 生产工单状态 (无已取消)
export type ProductionOrderStatus =
  | '草稿'
  | '审批中'
  | '已审批'
  | '进行中'
  | '暂停'
  | '已完成'
  | '作废';

// 6.2 外协工单状态
export type OutsourceOrderStatus =
  | '草稿'
  | '审批中'
  | '进行中'
  | '待入库'
  | '已完成'
  | '已作废';

// 6.3 生产任务状态
export type ProductionTaskStatus =
  | '待下发'
  | '待生产'
  | '生产中'
  | '暂停'
  | '已完成'
  | '取消'
  | '作废';

// 6.4 报工记录状态
export type WorkReportStatus =
  | '草稿'
  | '待审核'
  | '已完成'
  | '已取消'
  | '审批驳回';

// 8. 预警类型
export type WarningType =
  | 'UPCOMING_DUE'       // 即将逾期
  | 'OVERDUE'            // 已逾期
  | 'PROGRESS_DELAY'     // 进度滞后
  | 'NOT_STARTED_ON_TIME'// 未按时开工
  | 'NONE';

export interface ProductionOrder {
  id: string;
  code: string;
  productName: string;
  productCode: string;
  spec: string;
  planQty: number;          // 计划数量 (件)
  finishedQty: number;      // 已完成数量 (件)
  totalProgress: number;    // 总体进度 % (0-100)
  timeProgress: number;     // 时间进度 % (0-100+)
  planStartDate: string;    // YYYY-MM-DD
  planEndDate: string;      // YYYY-MM-DD (计划交期)
  manager: string;          // 负责人
  factoryId: FactoryId;
  factoryName: string;
  status: ProductionOrderStatus;
  warningType: WarningType;
  warningReason?: string;
  priority: '高' | '中' | '低';
  salesOrder?: string;
  remark?: string;
  createTime: string;
  updateTime: string;
  workshop?: string;
}

export interface OutsourceOrder {
  id: string;
  code: string;
  productName: string;
  productCode: string;
  spec: string;
  supplierName: string;
  supplierCode: string;
  outsourceType: '工序外协' | '全委外协' | '部件外包';
  outsourceProcess: string;   // 外协工序 (e.g. 阳极氧化, 热处理, 精密磨削)
  outsourceMethod: '包工包料' | '带料加工';
  contactPerson: string;
  contactPhone: string;
  pricingMethod: '单价核算' | '重量计费' | '批次承包';
  taxIncludedAmount: number;  // 含税金额 (元)
  planQty: number;            // 计划数量 (件)
  productionProgress: number; // 生产进度 %
  inboundProgress: number;    // 入库进度 %
  planEndDate: string;        // 计划交期
  sourceOrderCode: string;    // 来源生产工单
  salesOrder?: string;        // 关联销售订单
  creator: string;
  createTime: string;
  status: OutsourceOrderStatus;
  factoryId: FactoryId;
  factoryName: string;
  warningType: WarningType;
  warningReason?: string;
}

export interface ProductionTask {
  id: string;
  code: string;               // 任务编码
  taskName: string;           // 任务名称
  priority: '高' | '中' | '低';
  salesOrder: string;
  processName: string;        // 工序名称
  sourceOrderCode: string;    // 生产工单编码
  workstationCode: string;
  workstationName: string;    // 工作站名称
  assignee: string;           // 处理人
  role: string;               // 岗位
  scheduledQty: number;       // 排产数量
  producedQty: number;        // 已生产数量
  taskProgress: number;       // 任务进度 %
  planStartTime: string;      // YYYY-MM-DD HH:mm
  estimatedEndTime: string;   // YYYY-MM-DD HH:mm (预计完成时间)
  orderType: '标准生产' | '返工返修' | '试制打样';
  reportMethod: '扫码报工' | '工位机报工' | '人工填报';
  status: ProductionTaskStatus;
  factoryId: FactoryId;
  factoryName: string;
  warningType: WarningType;
  warningReason?: string;
  createTime: string;
  updateTime: string;
  remark?: string;
  equipmentCode?: string;
}

export interface WorkReportRecord {
  id: string;
  reportCode: string;         // 报工单号
  taskCode: string;           // 生产任务编码
  priority: '高' | '中' | '低';
  productCode: string;
  productName: string;
  workstationName: string;
  processName: string;
  progress: number;           // 生产进度
  spec: string;
  unit: string;
  goodQty: number;            // 良品数
  defectQty: number;          // 不良品数量
  reportQty: number;          // 报工数量 (良品 + 不良)
  reporter: string;           // 报工人
  department?: string;        // 所属部门 (e.g. 总装一车间, 精密机加部, 电子装配部, 品质检验部)
  reportTime: string;         // 报工时间 (YYYY-MM-DD HH:mm)
  reportHours: number;        // 报工工时 (小时)
  approver: string;           // 审批人
  status: WorkReportStatus;
  factoryId: FactoryId;
  factoryName: string;
  createTime: string;
  rejectReason?: string;
}

export interface CalendarEvent {
  id: string;
  date: string;               // YYYY-MM-DD
  time?: string;
  type: '生产工单' | '外协工单' | '生产任务';
  businessCode: string;
  name: string;
  spec?: string;
  supplier?: string;
  nodeType: '计划交期' | '计划开始' | '预计完成';
  status: string;
  progress: number;
  priorityLevel: 'OVERDUE' | 'UPCOMING' | 'NORMAL';
  rawObject: ProductionOrder | OutsourceOrder | ProductionTask;
}

export interface TodoItem {
  id: string;
  title: string;
  count: number;
  unit: string;
  desc: string;
  category: 'PROD_APPROVAL' | 'OUTSOURCE_APPROVAL' | 'REPORT_APPROVAL' | 'PENDING_TASK';
  badgeType: 'danger' | 'warning' | 'info' | 'primary';
  targetTab: 'prod' | 'outsource' | 'task' | 'report';
  filterStatus?: string;
}

export interface ProductionOrderOverviewMetrics {
  completedOrdersCount: number;  // 已完成工单 (张)
  inProgressOrdersCount: number; // 进行中工单 (张)
  completedQty: number;          // 已完成工单数量 (张)
  uncompletedQty: number;        // 未完成工单数量 (张)
  plannedQty: number;            // 计划数量 (件, 统计进行中工单的计划数量)
  completedTotalProducedQty: number; // 已完成工单的总生产数量 (件)
  overallProgress: number;       // 工单总体进度 % (平均值)
  totalValidOrders: number;
  pausedOrdersCount: number;
  // 产品数量统计维度 (Product Volume Focus)
  totalPlannedQty: number;       // 计划产品总件数 (件)
  totalProducedQty: number;      // 实际已完工产品件数 (件)
  wipProductQty: number;         // 产线在制产品件数 (件)
  remainingPlanQty: number;      // 剩余待产产品件数 (件)
  productFulfillmentRate: number;// 产品完工产出率 %
}

export interface OutsourceOverviewMetrics {
  pendingCount: number;          // 待处理工单 (草稿 + 审批中)
  inProgressCount: number;       // 进行中工单
  pendingInboundCount: number;   // 待入库工单
  completedCount: number;        // 已完成工单
  totalPlanQty: number;          // 外协计划总数量 (件)
  weightedProductionProgress: number; // 加权生产进度 %
  weightedInboundProgress: number;    // 加权入库进度 %
  // 外协产品数量统计维度 (Outsourced Product Volume Focus)
  outsourcedProducedQty: number; // 供应商已加工件数 (件)
  inboundedProductQty: number;   // 已入库产品件数 (件)
  inTransitQty: number;          // 在途/待验产品件数 (件)
  unprocessedPlanQty: number;    // 待供应商加工件数 (件)
  inboundFulfillmentRate: number;// 外协产品入库交付率 %
}

export interface TaskOverviewMetrics {
  pendingProductionCount: number;// 待生产任务
  inProgressCount: number;       // 生产中任务
  pausedCount: number;           // 暂停任务
  completedCount: number;        // 已完成任务
  scheduledQty: number;          // 排产总件数 (件)
  producedQty: number;           // 工序已产出件数 (件)
  unproducedQty: number;         // 剩余待产件数 (件)
  inProgressQty: number;         // 在制加工中件数 (件)
  completionRate: number;        // 任务完成率 %
  todayScheduledQty: number;     // 周期计划排产件数 (保持向后兼容)
  todayProducedQty: number;      // 周期已产出件数 (保持向后兼容)
  periodScheduledQty?: number;   // 看板周期计划排产件数 (件)
  periodProducedQty?: number;    // 看板周期已产出件数 (件)
  totalTaskBatches: number;      // 任务工序总批次数 (批)
}

export interface WorkReportOverviewMetrics {
  totalReportQty: number;        // 报工产品总申报件数 (件)
  pendingAuditCount: number;     // 待审核记录数
  auditedCount: number;          // 已审核记录数
  totalReportHours: number;      // 报工总工时 (h)
  auditedHours: number;          // 已审核工时
  pendingAuditHours: number;     // 待审核工时
  goodQty: number;               // 质检合格良品件数 (件)
  defectQty: number;             // 质检不合格品件数 (件)
  pendingAuditQty: number;       // 待审核产品件数 (件)
  goodRate: number;              // 质检良品率 %
  defectRate: number;            // 不良品率 %
}

export interface WorkbenchMetrics {
  productionOrders: ProductionOrderOverviewMetrics;
  outsourceOrders: OutsourceOverviewMetrics;
  tasks: TaskOverviewMetrics;
  workReports: WorkReportOverviewMetrics;
}

export interface TrendDataPoint {
  date: string;                  // YYYY-MM-DD
  displayDate: string;           // MM-DD
  auditedCount: number;          // 已审核报工数量
  pendingCount: number;          // 待审核报工数量
  totalHours: number;            // 报工工时
  goodRate: number;              // 良品率 %
}
