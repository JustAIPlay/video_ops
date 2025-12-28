// components/ReviewView/ActionItemCard.tsx
// Phase 3: 每日复盘会议功能 - 可执行操作项组件

import React from 'react';
import { CalendarPlus, FileEdit, FlaskConical, CheckCircle2, Plus } from 'lucide-react';
import type { ActionItem } from '../../types/review';

interface ActionItemCardProps {
  item: ActionItem;
  isAI: boolean;
  onExecute: (item: ActionItem) => void;
}

export const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, isAI, onExecute }) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'scheduling': return <CalendarPlus className="w-4 h-4" />;
      case 'content': return <FileEdit className="w-4 h-4" />;
      case 'experiment': return <FlaskConical className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (item.priority) {
      case 'high': return 'bg-rose-100 text-rose-600';
      case 'medium': return 'bg-amber-100 text-amber-600';
      case 'low': return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
      isAI
        ? 'bg-white border-indigo-100 hover:border-indigo-200 hover:shadow-md'
        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* 类型图标 */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isAI ? 'bg-indigo-50' : 'bg-slate-50'
        }`}>
          {getTypeIcon()}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isAI ? 'text-slate-700' : 'text-slate-600'} truncate`}>
            {item.text}
          </p>
          {/* 额外信息 */}
          {item.scheduleData && (
            <p className={`text-xs ${isAI ? 'text-indigo-400' : 'text-slate-400'}`}>
              {item.scheduleData.account} @ {item.scheduleData.time}
            </p>
          )}
        </div>

        {/* 优先级标签 */}
        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getPriorityColor()}`}>
          {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
        </span>
      </div>

      {/* 执行按钮 */}
      {item.executable && (
        <button
          onClick={() => onExecute(item)}
          className={`ml-3 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
            isAI
              ? 'bg-gradient-to-r from-indigo-400 to-violet-400 text-white hover:shadow-md'
              : 'bg-[#8C7CF0] text-white hover:shadow-md'
          }`}
        >
          <Plus className="w-3 h-3" />
          <span>执行</span>
        </button>
      )}
    </div>
  );
};

export default ActionItemCard;
