import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Building,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Factory,
  FileCheck,
  FileText,
  Layers,
  MapPin,
  Package,
  PauseCircle,
  Phone,
  PlayCircle,
  Printer,
  RotateCcw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Tag,
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
  WorkReportRecord,
} from '../types';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedObject: any;
  objectType: 'prod' | 'outsource' | 'task' | 'report' | null;
  onActionSuccess?: (msg: string) => void;
  onStatusAction?: (
    id: string,
    type: 'prod' | 'outsource' | 'task' | 'report',
    action: string
  ) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  selectedObject,
  objectType,
  onActionSuccess,
  onStatusAction,
}) => {
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);

  // Reset override when object changes
  React.useEffect(() => {
    setStatusOverride(null);
  }, [selectedObject?.id]);

  if (!isOpen || !selectedObject || !objectType) return null;

  const currentStatus = statusOverride || selectedObject.status;

  const handleCopyCode = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeAction = (actionKey: string, nextStatus: string, successMsg: string) => {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      setStatusOverride(nextStatus);
      if (onStatusAction) {
        onStatusAction(selectedObject.id, objectType, actionKey);
      } else if (onActionSuccess) {
        onActionSuccess(successMsg);
      }
    }, 400);
  };

  const getTitleInfo = () => {
    switch (objectType) {
      case 'prod':
        return {
          title: '生产工单详情',
          code: (selectedObject as ProductionOrder).code,
          sub: (selectedObject as ProductionOrder).productName,
          icon: <FileCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
        };
      case 'outsource':
        return {
          title: '外协工单详情',
          code: (selectedObject as OutsourceOrder).code,
          sub: (selectedObject as OutsourceOrder).productName,
          icon: <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
        };
      case 'task':
        return {
          title: '生产任务详情',
          code: (selectedObject as ProductionTask).code,
          sub: (selectedObject as ProductionTask).taskName,
          icon: <PlayCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'report':
        return {
          title: '报工记录详情',
          code: (selectedObject as WorkReportRecord).reportCode,
          sub: (selectedObject as WorkReportRecord).productName,
          icon: <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
        };
      default:
        return { title: '业务详情', code: '', sub: '', icon: null };
    }
  };

  const info = getTitleInfo();

  // Status Badge Styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '草稿':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case '审批中':
      case '待审批':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case '已审批':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
      case '待下发':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300';
      case '待生产':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300';
      case '进行中':
      case '生产中':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300';
      case '待审核':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
      case '待入库':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300';
      case '暂停':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300';
      case '已完成':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
      case '审批驳回':
      case '作废':
      case '已作废':
        return 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Render Workflow Stage Step Line
  const renderWorkflowStage = () => {
    let steps: { label: string; active: boolean; done: boolean }[] = [];

    if (objectType === 'prod') {
      const s = currentStatus;
      steps = [
        { label: '1. 编制草稿', active: s === '草稿', done: s !== '草稿' },
        { label: '2. 审批流转', active: s === '审批中', done: s !== '草稿' && s !== '审批中' },
        { label: '3. 待排产', active: s === '已审批', done: s === '进行中' || s === '已完成' },
        { label: '4. 产线生产', active: s === '进行中' || s === '暂停', done: s === '已完成' },
        { label: '5. 完工入库', active: s === '已完成', done: s === '已完成' },
      ];
    } else if (objectType === 'outsource') {
      const s = currentStatus;
      steps = [
        { label: '1. 委外申请', active: s === '草稿', done: s !== '草稿' },
        { label: '2. 外协特批', active: s === '审批中', done: s !== '草稿' && s !== '审批中' },
        { label: '3. 供应商加工', active: s === '进行中', done: s === '待入库' || s === '已完成' },
        { label: '4. 回厂待验', active: s === '待入库', done: s === '已完成' },
        { label: '5. 质检入库', active: s === '已完成', done: s === '已完成' },
      ];
    } else if (objectType === 'task') {
      const s = currentStatus;
      steps = [
        { label: '1. 工序排产', active: s === '待下发', done: s !== '待下发' },
        { label: '2. 工位就绪', active: s === '待生产', done: s !== '待下发' && s !== '待生产' },
        { label: '3. 开工投产', active: s === '生产中' || s === '暂停', done: s === '已完成' },
        { label: '4. 完工报工', active: s === '已完成', done: s === '已完成' },
      ];
    } else if (objectType === 'report') {
      const s = currentStatus;
      steps = [
        { label: '1. 班组申报', active: s === '草稿', done: s !== '草稿' },
        { label: '2. 质检审核', active: s === '待审核' || s === '审批驳回', done: s === '已完成' },
        { label: '3. 工时入账', active: s === '已完成', done: s === '已完成' },
      ];
    }

    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          <span>单据生命周期阶段</span>
          <span className="font-mono text-[11px] text-slate-400">当前阶段: {currentStatus}</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-flow-col gap-1 text-[10px]">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors ${
                st.active
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : st.done
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              {st.done && !st.active ? (
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
              ) : null}
              <span className="truncate">{st.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Status Operational Guidance Banner
  const renderStatusGuidance = () => {
    if (objectType === 'prod') {
      if (currentStatus === '草稿') {
        return (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <span className="font-bold">操作指引: </span>
            当前工单处于草稿编制阶段，请核对物料BOM与工艺路线后点击下方【提交审批签署】发起流转。
          </div>
        );
      }
      if (currentStatus === '审批中') {
        return (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <span className="font-bold">审批签署环节: </span>
            等待生产主管与技术负责人签署核准。审核通过后将转为【已审批】就绪排产状态。
          </div>
        );
      }
      if (currentStatus === '已审批') {
        return (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            <span className="font-bold">就绪下发阶段: </span>
            工单已核准通过，物料齐套。点击下方【下发车间排产】即可生成产线生产任务并指派工位。
          </div>
        );
      }
    }

    if (objectType === 'outsource') {
      if (currentStatus === '草稿') {
        return (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <span className="font-bold">外协编制草稿: </span>
            委外加工参数与报价已拟定，请点击下方【提交委外特批】交由采购与财务主管核准。
          </div>
        );
      }
      if (currentStatus === '审批中') {
        return (
          <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-2.5 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
            <span className="font-bold">委外特批审批: </span>
            外协含税金额 ¥{selectedObject.taxIncludedAmount?.toLocaleString()}，需核实供应商加工能力与交期协议后签署通过。
          </div>
        );
      }
      if (currentStatus === '待入库') {
        return (
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/80 p-2.5 text-xs text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-200">
            <span className="font-bold">到货待验入库: </span>
            供应商已完成加工并将外协件发回。品检部门完成 IQC 质检后，点击下方【质检合格入库】确认入库。
          </div>
        );
      }
    }

    if (objectType === 'task') {
      if (currentStatus === '待下发') {
        return (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/80 p-2.5 text-xs text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">
            <span className="font-bold">派工分配阶段: </span>
            工序任务已建立，点击下方【指派工位下发】即可向现场机台或操作工终端下发作业指令。
          </div>
        );
      }
      if (currentStatus === '待生产') {
        return (
          <div className="rounded-lg border border-sky-200 bg-sky-50/80 p-2.5 text-xs text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
            <span className="font-bold">待生产: </span>
            工位与操作人员【{selectedObject.assignee}】已就绪，点击下方【确认开工投产】进入计时加工阶段。
          </div>
        );
      }
      if (currentStatus === '暂停') {
        return (
          <div className="rounded-lg border border-orange-200 bg-orange-50/80 p-2.5 text-xs text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-200">
            <span className="font-bold">工序异常挂起: </span>
            {selectedObject.warningReason || '产线遇到设备异常或工序调机，排除故障后可点击下方【恢复生产】。'}
          </div>
        );
      }
    }

    if (objectType === 'report') {
      if (currentStatus === '待审核') {
        return (
          <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
            <span className="font-bold">质检报工审核: </span>
            申报良品 {selectedObject.goodQty} 件 / 不良品 {selectedObject.defectQty} 件，报工工时 {selectedObject.reportHours}h。核实无误后点击下方【质检合格入账】。
          </div>
        );
      }
      if (currentStatus === '审批驳回') {
        return (
          <div className="rounded-lg border border-red-200 bg-red-50/80 p-2.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            <span className="font-bold">驳回重审提示: </span>
            {selectedObject.rejectReason || '申报数据与实际产线巡检不一致，已退回。核实确认后可点击【重新复核通过】。'}
          </div>
        );
      }
    }

    return null;
  };

  // Render Status-Specific Footer Action Buttons
  const renderFooterActions = () => {
    if (objectType === 'prod') {
      if (currentStatus === '草稿') {
        return (
          <>
            <button
              onClick={() => executeAction('submit_approval', '审批中', `工单 ${selectedObject.code} 已成功提交审批！`)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-600 transition-all"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{actionLoading ? '提交中...' : '提交审批签署'}</span>
            </button>
          </>
        );
      }
      if (currentStatus === '审批中') {
        return (
          <>
            <button
              onClick={() => executeAction('reject', '草稿', `工单 ${selectedObject.code} 已驳回退回草稿修改。`)}
              disabled={actionLoading}
              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            >
              审批驳回
            </button>
            <button
              onClick={() => executeAction('approve', '已审批', `工单 ${selectedObject.code} 审批核准通过！已进入可排产状态。`)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{actionLoading ? '签署中...' : '审批通过'}</span>
            </button>
          </>
        );
      }
      if (currentStatus === '已审批') {
        return (
          <>
            <button
              onClick={() => executeAction('dispatch', '进行中', `工单 ${selectedObject.code} 已成功下发车间排产开工！`)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{actionLoading ? '下发中...' : '下发车间排产'}</span>
            </button>
          </>
        );
      }
      if (currentStatus === '进行中') {
        return (
          <>
            <button
              onClick={() => onActionSuccess?.(`正在调取工单 ${selectedObject.code} 的产线报工流转卡...`)}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>打印流转卡</span>
            </button>
            <button
              onClick={() => onActionSuccess?.(`工单 ${selectedObject.code} 进度跟踪已刷新！`)}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>工单实时跟踪</span>
            </button>
          </>
        );
      }
    }

    if (objectType === 'outsource') {
      if (currentStatus === '草稿') {
        return (
          <button
            onClick={() => executeAction('submit_approval', '审批中', `外协工单 ${selectedObject.code} 已提交审批特批！`)}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-600 transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{actionLoading ? '提交中...' : '提交外协特批'}</span>
          </button>
        );
      }
      if (currentStatus === '审批中') {
        return (
          <>
            <button
              onClick={() => executeAction('reject', '已作废', `外协申请 ${selectedObject.code} 已被驳回。`)}
              disabled={actionLoading}
              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            >
              审批驳回
            </button>
            <button
              onClick={() => executeAction('approve', '进行中', `外协工单 ${selectedObject.code} 已核准通过，进入供应商加工阶段！`)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{actionLoading ? '核准中...' : '审批通过'}</span>
            </button>
          </>
        );
      }
      if (currentStatus === '待入库') {
        return (
          <>
            <button
              onClick={() => onActionSuccess?.(`已向供应商【${selectedObject.supplierName}】发送退回返工整改通知。`)}
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
            >
              退回返修
            </button>
            <button
              onClick={() => executeAction('inbound', '已完成', `外协工单 ${selectedObject.code} 质检合格，已全数完成入库！`)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-cyan-700 transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{actionLoading ? '入库中...' : '质检合格入库'}</span>
            </button>
          </>
        );
      }
    }

    if (objectType === 'task') {
      if (currentStatus === '待下发') {
        return (
          <button
            onClick={() => executeAction('dispatch', '待生产', `任务 ${selectedObject.code} 已成功指派并下发到工位机！`)}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{actionLoading ? '下发中...' : '确认指派并下发'}</span>
          </button>
        );
      }
      if (currentStatus === '待生产') {
        return (
          <button
            onClick={() => executeAction('start', '生产中', `任务 ${selectedObject.code} 已确认开工，开始计时生产！`)}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>{actionLoading ? '开工中...' : '确认开工投产'}</span>
          </button>
        );
      }
      if (currentStatus === '生产中') {
        return (
          <>
            <button
              onClick={() => executeAction('pause', '暂停', `任务 ${selectedObject.code} 已暂停挂起。`)}
              disabled={actionLoading}
              className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <PauseCircle className="h-3.5 w-3.5" />
              <span>异常暂停</span>
            </button>
            <button
              onClick={() => onActionSuccess?.(`已打开任务 ${selectedObject.code} 快速报工面板...`)}
              className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 transition-all"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>工序实时报工</span>
            </button>
          </>
        );
      }
      if (currentStatus === '暂停') {
        return (
          <button
            onClick={() => executeAction('resume', '生产中', `任务 ${selectedObject.code} 异常已排除，已恢复开工！`)}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{actionLoading ? '恢复中...' : '恢复生产执行'}</span>
          </button>
        );
      }
    }

    if (objectType === 'report') {
      if (currentStatus === '待审核') {
        return (
          <>
            <button
              onClick={() => executeAction('reject', '审批驳回', `报工记录 ${selectedObject.reportCode} 已驳回给员工重新核实。`)}
              disabled={actionLoading}
              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            >
              审批驳回
            </button>
            <button
              onClick={() => executeAction('approve', '已完成', `报工单 ${selectedObject.reportCode} 审批通过，工时与良品数已入账！`)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{actionLoading ? '审核中...' : '审批通过'}</span>
            </button>
          </>
        );
      }
      if (currentStatus === '审批驳回') {
        return (
          <button
            onClick={() => executeAction('re_approve', '已完成', `报工单 ${selectedObject.reportCode} 已重新复核通过并入账！`)}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{actionLoading ? '复核中...' : '重新复核通过'}</span>
          </button>
        );
      }
    }

    // Default Close only
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 transition-opacity animate-fadeIn"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div
          id="detail-drawer-panel"
          className="w-screen max-w-xl bg-white shadow-2xl transition-all duration-300 dark:bg-slate-900 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-2xs dark:bg-slate-800">
                  {info.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {info.title}
                    </h3>
                    <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${getStatusBadgeClass(currentStatus)}`}>
                      {currentStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono-num text-xs font-bold text-slate-700 dark:text-slate-300">
                      {info.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(info.code)}
                      title="复制编码"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copied && (
                      <span className="text-[10px] text-emerald-600 font-semibold">已复制!</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                id="drawer-close-btn"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning Diagnostic Alert Box */}
            {selectedObject.warningType && selectedObject.warningType !== 'NONE' && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <span className="font-bold">预警诊断: </span>
                  <span>{selectedObject.warningReason || '检测到交期或进度滞后风险'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
            {/* 1. Workflow Stage Steps */}
            {renderWorkflowStage()}

            {/* 2. Status Operational Guidance Banner */}
            {renderStatusGuidance()}

            {/* 3. Detailed Data Fields according to Object Type */}
            {/* 生产工单 (Production Order) */}
            {objectType === 'prod' && (
              <div className="space-y-4">
                {/* Progress Overview Card */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between font-semibold">
                    <span>生产执行进度</span>
                    <span className="font-mono-num text-indigo-600 dark:text-indigo-400">
                      {selectedObject.totalProgress}% (时间进度: {selectedObject.timeProgress}%)
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${selectedObject.totalProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                    <span>计划排产: {selectedObject.planQty} 件</span>
                    <span>已完成入库: {selectedObject.finishedQty} 件</span>
                  </div>
                </div>

                {/* Field Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">产品物料</span>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedObject.productName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {selectedObject.productCode}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">规格型号</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.spec}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">所属工厂 / 车间</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.factoryName} - {selectedObject.workshop || '标准车间'}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">负责人</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.manager}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">计划开工日期</span>
                    <div className="font-mono-num font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.planStartDate}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">计划交期 (核心节点)</span>
                    <div className="font-mono-num font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {selectedObject.planEndDate}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">关联销售订单</span>
                    <div className="font-mono-num text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.salesOrder || '-'}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">创建时间</span>
                    <div className="font-mono-num text-slate-600 dark:text-slate-400 mt-0.5">
                      {selectedObject.createTime}
                    </div>
                  </div>
                </div>

                {selectedObject.remark && (
                  <div className="rounded-md bg-slate-50 p-2.5 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">备注说明: </span>
                    {selectedObject.remark}
                  </div>
                )}
              </div>
            )}

            {/* 外协工单 (Outsource Order) */}
            {objectType === 'outsource' && (
              <div className="space-y-4">
                {/* Outsource Dual Progress */}
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <span className="text-[10px] text-slate-400">外协生产进度</span>
                    <div className="font-mono-num text-base font-bold text-blue-600 dark:text-blue-400">
                      {selectedObject.productionProgress}%
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">回厂入库进度</span>
                    <div className="font-mono-num text-base font-bold text-cyan-600 dark:text-cyan-400">
                      {selectedObject.inboundProgress}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">供应商信息</span>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedObject.supplierName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      联系人: {selectedObject.contactPerson} ({selectedObject.contactPhone})
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">外协工序 / 方式</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.outsourceProcess} ({selectedObject.outsourceMethod})
                    </div>
                    <div className="text-[10px] text-slate-400">类型: {selectedObject.outsourceType}</div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">计划数量 / 计价</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.planQty} 件 ({selectedObject.pricingMethod})
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">含税金额</span>
                    <div className="font-mono-num font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      ¥{selectedObject.taxIncludedAmount?.toLocaleString() || '0'}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">计划交期</span>
                    <div className="font-mono-num font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {selectedObject.planEndDate}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">来源生产工单</span>
                    <div className="font-mono-num text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.sourceOrderCode || '-'}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">关联销售订单</span>
                    <div className="font-mono-num font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                      {selectedObject.salesOrder || '-'}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">创建人 / 时间</span>
                    <div className="text-slate-700 dark:text-slate-300 mt-0.5">
                      {selectedObject.creator} ({selectedObject.createTime})
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">所属工厂</span>
                    <div className="text-slate-700 dark:text-slate-300 mt-0.5">
                      {selectedObject.factoryName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 生产任务 (Production Task) */}
            {objectType === 'task' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between font-semibold">
                    <span>任务生产进度</span>
                    <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
                      {selectedObject.taskProgress}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${selectedObject.taskProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                    <span>排产数量: {selectedObject.scheduledQty}</span>
                    <span>已完成产出: {selectedObject.producedQty}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">工作站 / 设备</span>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedObject.workstationName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {selectedObject.workstationCode}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">处理人 / 岗位</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.assignee} ({selectedObject.role})
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">工序名称 / 报工方式</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.processName} ({selectedObject.reportMethod})
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">工单类型 / 优先级</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.orderType} / {selectedObject.priority}优
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">计划开始时间</span>
                    <div className="font-mono-num text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.planStartTime}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">预计完成时间</span>
                    <div className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedObject.estimatedEndTime}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">来源生产工单</span>
                    <div className="font-mono-num text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.sourceOrderCode}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">关联销售订单</span>
                    <div className="font-mono-num text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.salesOrder || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 报工记录 (Work Report) */}
            {objectType === 'report' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <span className="text-[10px] text-slate-400">报工数量</span>
                    <div className="font-mono-num text-base font-bold text-purple-600 dark:text-purple-400">
                      {selectedObject.reportQty} {selectedObject.unit}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">良品数 / 不良数</span>
                    <div className="font-mono-num text-base font-bold text-slate-800 dark:text-slate-200">
                      <span className="text-emerald-600">{selectedObject.goodQty}</span> /{' '}
                      <span className="text-rose-500">{selectedObject.defectQty}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">报工工时</span>
                    <div className="font-mono-num text-base font-bold text-slate-800 dark:text-slate-200">
                      {selectedObject.reportHours} h
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">报工人</span>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedObject.reporter}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      报工时间: {selectedObject.reportTime}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">审批审核人</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.approver}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">工作站 / 工序</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.workstationName} ({selectedObject.processName})
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-100 p-2.5 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                    <span className="text-slate-400 text-[10px]">关联任务编码</span>
                    <div className="font-mono-num text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedObject.taskCode}
                    </div>
                  </div>
                </div>

                {selectedObject.rejectReason && (
                  <div className="rounded-md border border-rose-200 bg-rose-50/50 p-2.5 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    <span className="font-bold">驳回原因: </span>
                    {selectedObject.rejectReason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/80 flex items-center justify-between">
            <button
              onClick={() => {
                if (onActionSuccess) {
                  onActionSuccess('已打开原业务单据视图');
                }
              }}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              跳转原业务页面
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                关闭
              </button>

              {/* Dynamic Status Action Buttons */}
              {renderFooterActions()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
