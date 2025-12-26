import React from 'react';
import { Settings, Sparkles } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

// ==================== 模式切换组件 ====================

/**
 * AI模式切换器 - 优化版
 * - 紧凑设计，标签更小
 * - 更柔和的过渡效果
 * - 智能模式下有微妙的发光效果
 */
export const ModeSwitcher: React.FC = () => {
  const { mode, toggleMode } = useAppContext();

  const isAI = mode === 'ai';

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-500 ${
      isAI
        ? 'bg-white border-indigo-200 shadow-sm'
        : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* 左侧：传统模式 */}
      <div className={`flex items-center gap-2 transition-all duration-300 ${
        isAI ? 'opacity-40' : 'opacity-100'
      }`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isAI ? 'bg-slate-100' : 'bg-slate-100'
        }`}>
          <Settings className={`w-3.5 h-3.5 transition-colors duration-300 ${
            isAI ? 'text-slate-400' : 'text-slate-500'
          }`} />
        </div>
        <span className={`text-sm font-medium transition-all duration-300 ${
          isAI ? 'text-slate-400' : 'text-slate-600'
        }`}>
          传统
        </span>
      </div>

      {/* 中间：切换开关 */}
      <button
        onClick={toggleMode}
        className={`
          relative w-11 h-6 rounded-full p-0.5 transition-all duration-300 ease-out flex-shrink-0
          ${isAI
            ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-md shadow-indigo-200'
            : 'bg-slate-200'
          }
        `}
      >
        {/* 滑块 */}
        <div
          className={`
            w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-out relative
            ${isAI ? 'translate-x-5' : 'translate-x-0'}
          `}
        >
          {/* 滑块上的微妙光效 */}
          {isAI && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-indigo-50" />
          )}
        </div>

        {/* 智能模式激活时的发光效果 */}
        {isAI && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-300 to-violet-300 opacity-30 blur-sm animate-pulse" />
        )}
      </button>

      {/* 右侧：智能模式 */}
      <div className={`flex items-center gap-2 transition-all duration-300 ${
        isAI ? 'opacity-100' : 'opacity-40'
      }`}>
        <span className={`text-sm font-bold transition-all duration-300 ${
          isAI ? 'text-indigo-600' : 'text-slate-400'
        }`}>
          AI
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isAI ? 'bg-indigo-500' : 'bg-slate-100'
        } ${isAI && 'shadow-md shadow-indigo-200'}`}>
          <Sparkles className={`w-3.5 h-3.5 transition-all duration-300 ${
            isAI ? 'text-white' : 'text-slate-400'
          } ${isAI && 'animate-pulse'}`} />
        </div>
      </div>
    </div>
  );
};

export default ModeSwitcher;
