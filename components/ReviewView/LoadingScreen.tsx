// components/ReviewView/LoadingScreen.tsx
// Phase 3: 每日复盘会议功能 - 加载屏组件

import React from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingStep {
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

interface LoadingScreenProps {
  steps: LoadingStep[];
  isAI: boolean;
  estimatedTime?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  steps,
  isAI,
  estimatedTime = 10
}) => {
  return (
    <div className={`fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center ${
      isAI ? 'ai-hud-overlay' : ''
    }`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-3xl shadow-2xl border transition-all duration-500 ${
        isAI
          ? 'bg-white border-indigo-200 shadow-indigo-100'
          : 'bg-white border-white shadow-slate-100'
      }`}>
        {/* 装饰性 blob */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-80 pointer-events-none transition-colors duration-500 ${
          isAI ? 'bg-indigo-200' : 'bg-violet-50'
        }`}></div>

        <div className="relative z-10 text-center">
          {/* 旋转图标 */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr ${
            isAI ? 'from-indigo-400 to-violet-400' : 'from-[#8C7CF0] to-[#C6B9FF]'
          } flex items-center justify-center shadow-lg ${
            isAI ? 'shadow-indigo-200' : 'shadow-violet-200'
          } animate-pulse`}>
            <Sparkles className={`w-10 h-10 text-white ${isAI ? 'animate-spin' : 'animate-pulse'}`} />
          </div>

          <h3 className={`text-xl font-bold mb-2 ${isAI ? 'text-indigo-600' : 'text-slate-700'}`}>
            正在准备复盘会议...
          </h3>

          {/* 步骤列表 */}
          <div className="mt-6 space-y-3 text-left">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                {step.status === 'completed' && (
                  <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isAI ? 'text-emerald-500' : 'text-emerald-500'}`} />
                )}
                {step.status === 'loading' && (
                  <Loader2 className={`w-5 h-5 flex-shrink-0 animate-spin ${isAI ? 'text-indigo-500' : 'text-violet-500'}`} />
                )}
                {step.status === 'pending' && (
                  <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 ${
                    isAI ? 'border-indigo-200' : 'border-slate-200'
                  }`} />
                )}
                {step.status === 'error' && (
                  <div className={`w-5 h-5 flex-shrink-0 rounded-full bg-rose-500 flex items-center justify-center`}>
                    <span className="text-white text-xs">!</span>
                  </div>
                )}
                <span className={`text-sm ${
                  step.status === 'pending'
                    ? isAI ? 'text-slate-400' : 'text-slate-400'
                    : isAI ? 'text-slate-700' : 'text-slate-600'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <p className={`mt-6 text-sm ${isAI ? 'text-indigo-400' : 'text-slate-400'}`}>
            预计 {estimatedTime} 秒后开始
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
