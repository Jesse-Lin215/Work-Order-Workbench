import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900 shadow-lg dark:border-emerald-900/50 dark:bg-emerald-950 dark:text-emerald-200 animate-slideUp">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
