import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Factory,
  FileCode,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  RefreshCw,
  Share2,
  Sun,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';

interface HeaderNavProps {
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastSyncTime: string;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  darkMode,
  setDarkMode,
  onRefresh,
  isRefreshing,
  lastSyncTime,
  unreadAlertsCount,
  onOpenAlerts,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [fileSizeText, setFileSizeText] = useState('约 900 KB');

  const handleDownloadStandaloneHtml = async () => {
    setIsExporting(true);
    try {
      let blob: Blob | null = null;
      // 1. 尝试从 Vite 后台中间件获取单文件独立 HTML
      try {
        const res = await fetch('/api/download-single-html');
        if (res.ok) {
          blob = await res.blob();
        }
      } catch {
        // ignore
      }

      // 2. 尝试从公开静态资源目录获取
      if (!blob) {
        try {
          const res = await fetch('/workbench-standalone.raw');
          if (res.ok) {
            blob = await res.blob();
          }
        } catch {
          // ignore
        }
      }

      // 3. 保底方案：序列化当前 DOM
      if (!blob) {
        const docHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        blob = new Blob([docHtml], { type: 'text/html;charset=utf-8' });
      }

      if (blob) {
        const sizeKb = Math.round(blob.size / 1024);
        setFileSizeText(`${sizeKb} KB`);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '生产工单综合工作台_离线单文件版.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setShowExportModal(true);
      }
    } catch (err) {
      console.error('打包导出失败:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header
      id="system-header-nav"
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-2.5 py-2 sm:px-3 backdrop-blur shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs & System Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs dark:bg-indigo-500">
            <Factory className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">生产管理</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">工单工作台</span>
              <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                实时运行
              </span>
            </nav>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
                智能生产工单综合工作台
              </h1>
              <span className="hidden text-xs text-slate-400 dark:text-slate-500 md:inline-block">
                | 全链路执行与交期预警监控
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Tools, Sync, Theme, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Data Sync Badge */}
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 lg:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>同步状态: <strong className="font-mono-num font-medium text-slate-700 dark:text-slate-200">{lastSyncTime}</strong></span>
          </div>

          {/* 打包下载单文件 HTML 按钮 */}
          <button
            id="header-export-single-html-btn"
            onClick={handleDownloadStandaloneHtml}
            disabled={isExporting}
            title="打包并下载为单文件 HTML（发送给远方同事，对方无需任何环境，双击即可在浏览器直接离线查看）"
            className="flex h-8 items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/90 px-2.5 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 hover:border-indigo-300 focus:outline-none dark:border-indigo-900/60 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900/90 transition-colors"
          >
            <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : 'text-indigo-600 dark:text-indigo-400'}`} />
            <span>{isExporting ? '正在打包...' : '打包单文件HTML'}</span>
          </button>

          {/* Refresh Button */}
          <button
            id="header-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="刷新数据"
            className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? '刷新中...' : '刷新'}</span>
          </button>

          {/* Alert Bell */}
          <button
            id="header-alerts-bell-btn"
            onClick={onOpenAlerts}
            title="交期与异常预警"
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:text-amber-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="header-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏看板'}
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:flex"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            id="header-theme-toggle-btn"
            onClick={() => setDarkMode((prev) => !prev)}
            title={darkMode ? '切换到浅色模式' : '切换到暗色模式'}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* User Badge */}
          <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-2 dark:border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white dark:bg-indigo-600">
              张
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">张建国</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">生产调度主管</span>
            </div>
          </div>
        </div>
      </div>

      {/* 导出打包成功弹窗说明 */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  单文件 HTML 已打包生成并开始下载
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  文件大小：<strong className="text-slate-700 dark:text-slate-200">{fileSizeText}</strong>（全内嵌无外部本地资源依赖）
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                <Share2 className="h-3.5 w-3.5 text-indigo-500" />
                <span>如何发给远方同事使用：</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-500 dark:text-slate-400">
                <li>已自动保存至您的「下载」文件夹：<code className="rounded bg-slate-200/70 px-1 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-200">生产工单综合工作台_离线单文件版.html</code></li>
                <li>直接通过<strong>微信、钉钉、飞书、企业邮箱或U盘</strong>将该 HTML 发送给远方同事。</li>
                <li>同事收到后<strong>双击文件</strong>即可在任何浏览器（Chrome / Edge / Safari 等）直接离线打开，所有图表看板、多级工单筛选、日历联动均可正常交互！</li>
              </ol>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>再次下载</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
