// components/ReviewView/ErrorRetry.tsx
// Phase 3: 每日复盘会议功能 - 错误重试组件

import React from 'react';
import { AlertCircle, RefreshCw, SkipForward } from 'lucide-react';
import { AGENT_STYLES } from './constants';
import type { ReviewError } from '../../types/review';

interface ErrorRetryProps {
  error: ReviewError;
  onRetry: () => void;
  onSkip: () => void;
  isAI: boolean;
}

export const ErrorRetry: React.FC<ErrorRetryProps> = ({
  error,
  onRetry,
  onSkip,
  isAI
}) => {
  const agentName = error.agent ? AGENT_STYLES[error.agent].name : null;

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-500 ${
      isAI
        ? 'bg-rose-50 border-rose-200'
        : 'bg-rose-50 border-rose-200'
    }`}>
      <div className="flex items-start gap-4">
        {/* 错误图标 */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isAI ? 'bg-rose-100' : 'bg-rose-100'
        }`}>
          <AlertCircle className={`w-6 h-6 ${isAI ? 'text-rose-500' : 'text-rose-500'}`} />
        </div>

        {/* 错误信息 */}
        <div className="flex-1">
          <h4 className={`font-bold text-lg mb-2 ${isAI ? 'text-rose-700' : 'text-rose-700'}`}>
            出现错误
          </h4>
          <p className={`text-sm mb-4 ${isAI ? 'text-rose-600' : 'text-rose-600'}`}>
            {error.message}
          </p>

          {/* 错误详情 */}
          {agentName && (
            <p className={`text-xs mb-4 ${isAI ? 'text-rose-400' : 'text-rose-400'}`}>
              受影响的 Agent: {agentName}
            </p>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {error.retryable && (
              <button
                onClick={onRetry}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 ${
                  isAI
                    ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-indigo-200 hover:shadow-indigo-300 text-white'
                    : 'bg-[#8C7CF0] hover:bg-[#7b6be6] text-white shadow-violet-200'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                <span>重试</span>
              </button>
            )}
            <button
              onClick={onSkip}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 ${
                isAI
                  ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200'
                  : 'bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200'
              }`}
            >
              <SkipForward className="w-5 h-5" />
              <span>跳过此步骤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorRetry;
