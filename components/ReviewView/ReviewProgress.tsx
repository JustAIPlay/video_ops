// components/ReviewView/ReviewProgress.tsx
// Phase 3: 每日复盘会议功能 - 进度条组件

import React from 'react';
import type { ReviewStage } from '../../types/review';

interface ReviewProgressProps {
  currentStage: ReviewStage;
  progress: number;
  estimatedTime: number; // 秒
  isAI: boolean;
}

export const ReviewProgress: React.FC<ReviewProgressProps> = ({
  currentStage,
  progress,
  estimatedTime,
  isAI
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} 秒`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} 分钟`;
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-500 ${
      isAI
        ? 'bg-indigo-50 border-indigo-200'
        : 'bg-slate-50 border-slate-100'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-bold ${isAI ? 'text-indigo-600' : 'text-slate-600'}`}>
          当前阶段: {currentStage}
        </span>
        <span className={`text-sm font-bold ${isAI ? 'text-indigo-600' : 'text-slate-600'}`}>
          {progress}%
        </span>
      </div>

      {/* 进度条 */}
      <div className={`h-2 rounded-full overflow-hidden ${
        isAI ? 'bg-indigo-100' : 'bg-slate-200'
      }`}>
        <div
          className={`h-full transition-all duration-500 ${
            isAI
              ? 'bg-gradient-to-r from-indigo-400 to-violet-400'
              : 'bg-gradient-to-r from-[#8C7CF0] to-[#C6B9FF]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 闪光效果 */}
      {progress > 0 && progress < 100 && (
        <div className={`absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer`}
          style={{ left: `${progress - 5}%` }}
        />
      )}

      <div className={`flex justify-between mt-2 text-xs ${isAI ? 'text-indigo-500' : 'text-slate-400'}`}>
        <span>预计剩余时间</span>
        <span>{formatTime(estimatedTime)}</span>
      </div>
    </div>
  );
};

export default ReviewProgress;
