// components/ReviewView/SummaryCard.tsx
// Phase 3: 每日复盘会议功能 - 总结卡片组件

import React from 'react';
import { FileText, Download, Save, X } from 'lucide-react';
import { ActionItemCard } from './ActionItemCard';
import type { ReviewSummary, ActionItem } from '../../types/review';

interface SummaryCardProps {
  summary: ReviewSummary;
  isAI: boolean;
  onExecuteAction: (item: ActionItem) => void;
  onExport: () => void;
  onSave: () => void;
  onEnd: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  isAI,
  onExecuteAction,
  onExport,
  onSave,
  onEnd
}) => {
  // 统计可执行操作数量
  const executableCount = summary.actionItems.filter(item => item.executable).length;

  const buttonClass = `
    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold
    transition-all hover:-translate-y-1 active:scale-95
  `;

  const primaryButtonClass = `
    ${buttonClass}
    ${isAI
      ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-indigo-200 hover:shadow-indigo-300 text-white'
      : 'bg-[#8C7CF0] hover:bg-[#7b6be6] text-white shadow-violet-200'
    }
  `;

  const secondaryButtonClass = `
    ${buttonClass}
    ${isAI
      ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
    }
  `;

  return (
    <div className={`p-6 rounded-3xl shadow-xl border transition-all duration-500 ${
      isAI
        ? 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 shadow-indigo-100'
        : 'bg-slate-50 border-slate-100 shadow-slate-100'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isAI ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-50 text-violet-500'
        }`}>
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${isAI ? 'text-slate-800' : 'text-slate-800'}`}>
            今日复盘总结
          </h3>
          {executableCount > 0 && (
            <p className={`text-xs ${isAI ? 'text-indigo-500' : 'text-violet-500'}`}>
              {executableCount} 个可执行操作待处理
            </p>
          )}
        </div>
      </div>

      {/* 关键洞察 */}
      <div className="mb-6">
        <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isAI ? 'text-indigo-600' : 'text-slate-400'}`}>
          ✅ 关键洞察
        </h4>
        <ul className="space-y-2">
          {summary.keyInsights.map((insight, index) => (
            <li key={index} className={`text-sm ${isAI ? 'text-slate-700' : 'text-slate-600'}`}>
              • {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* 明日行动计划 */}
      <div className="mb-6">
        <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isAI ? 'text-indigo-600' : 'text-slate-400'}`}>
          🎯 明日行动计划
        </h4>
        <div className="space-y-2">
          {summary.actionItems.map((item, index) => (
            <ActionItemCard
              key={item.id || index}
              item={item}
              isAI={isAI}
              onExecute={onExecuteAction}
            />
          ))}
        </div>
      </div>

      {/* 待验证假设 */}
      <div className="mb-6">
        <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isAI ? 'text-indigo-600' : 'text-slate-400'}`}>
          🧪 待验证假设
        </h4>
        <ul className="space-y-2">
          {summary.hypotheses.map((hypothesis, index) => (
            <li key={index} className={`text-sm ${isAI ? 'text-slate-700' : 'text-slate-600'}`}>
              • {hypothesis}
            </li>
          ))}
        </ul>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onExport}
          className={primaryButtonClass}
        >
          <Download className="w-5 h-5" />
          <span>导出报告</span>
        </button>
        <button
          onClick={onSave}
          className={secondaryButtonClass}
        >
          <Save className="w-5 h-5" />
          <span>保存记录</span>
        </button>
        <button
          onClick={onEnd}
          className={secondaryButtonClass}
        >
          <X className="w-5 h-5" />
          <span>结束会议</span>
        </button>
      </div>
    </div>
  );
};

export default SummaryCard;
