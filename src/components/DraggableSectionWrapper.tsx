import React from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

interface DraggableSectionWrapperProps {
  id: string;
  index: number;
  totalSections: number;
  isDragging: boolean;
  isDropTarget: boolean;
  className?: string;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  children: React.ReactNode;
}

export const DraggableSectionWrapper: React.FC<DraggableSectionWrapperProps> = ({
  id,
  index,
  totalSections,
  isDragging,
  isDropTarget,
  className = '',
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}) => {
  return (
    <section
      id={`section-wrapper-${id}`}
      onDragOver={(e) => onDragOver(e, id)}
      onDragLeave={(e) => onDragLeave(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={`group/section relative flex flex-col transition-all duration-200 rounded-lg ${className} ${
        isDragging
          ? 'opacity-40 scale-[0.99] ring-2 ring-dashed ring-indigo-400 bg-slate-50/50 dark:bg-slate-900/50'
          : ''
      } ${
        isDropTarget && !isDragging
          ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 shadow-lg'
          : ''
      }`}
    >
      {/* Drop Target Indicator Line */}
      {isDropTarget && !isDragging && (
        <div className="absolute -top-2 left-0 right-0 z-30 flex items-center justify-center pointer-events-none">
          <span className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-md animate-bounce">
            ↓ 释放放置于此处 (第 {index + 1} 位)
          </span>
        </div>
      )}

      {/* Main Section Content */}
      <div className="relative flex-1 h-full">{children}</div>
    </section>
  );
};
