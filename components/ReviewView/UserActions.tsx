// components/ReviewView/UserActions.tsx
// Phase 3: 每日复盘会议功能 - 用户操作面板组件

import React from 'react';
import { MessageCircle, CheckCircle2, FolderOpen, SkipForward } from 'lucide-react';

interface UserActionsProps {
  canInteract: boolean;
  isAI: boolean;
  onAsk: () => void;
  onContinue: () => void;
  onExpand: () => void;
  onSkip: () => void;
}

export const UserActions: React.FC<UserActionsProps> = ({
  canInteract,
  isAI,
  onAsk,
  onContinue,
  onExpand,
  onSkip
}) => {
  const buttonClass = `
    flex items-center gap-2 px-6 py-3 rounded-xl font-bold
    transition-all hover:-translate-y-1 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
  `;

  const primaryButtonClass = `
    ${buttonClass}
    group relative overflow-hidden shadow-lg
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
    <div className={`p-4 rounded-3xl shadow-xl border transition-all duration-500 ${
      isAI
        ? 'bg-white border-indigo-200 shadow-indigo-100'
        : 'bg-white border-white shadow-slate-100'
    }`}>
      {/* 快捷操作按钮 */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={onAsk}
          disabled={!canInteract}
          className={primaryButtonClass}
        >
          {/* Shimmer 效果 */}
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <MessageCircle className="w-5 h-5" />
          <span>提问</span>
        </button>

        <button
          onClick={onContinue}
          disabled={!canInteract}
          className={secondaryButtonClass}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>继续</span>
        </button>

        <button
          onClick={onExpand}
          disabled={!canInteract}
          className={secondaryButtonClass}
        >
          <FolderOpen className="w-5 h-5" />
          <span>展开</span>
        </button>

        <button
          onClick={onSkip}
          disabled={!canInteract}
          className={secondaryButtonClass}
        >
          <SkipForward className="w-5 h-5" />
          <span>跳过</span>
        </button>
      </div>
    </div>
  );
};

export default UserActions;
