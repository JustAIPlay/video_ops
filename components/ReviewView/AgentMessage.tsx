// components/ReviewView/AgentMessage.tsx
// Phase 3: 每日复盘会议功能 - 消息气泡组件

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AGENT_STYLES } from './constants';
import type { ReviewMessage } from '../../types/review';

interface AgentMessageProps {
  message: ReviewMessage;
  isAI: boolean;
}

export const AgentMessage: React.FC<AgentMessageProps> = ({ message, isAI }) => {
  const config = AGENT_STYLES[message.agent];
  const { colors, avatar, name } = config;

  return (
    <div className={`flex gap-3 p-4 rounded-2xl border transition-all duration-500 message-appear ${
      isAI
        ? 'bg-white border-indigo-200 shadow-indigo-50'
        : 'bg-white border-slate-100 shadow-slate-50'
    }`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        colors.bg
      }`}>
        <span className="text-lg">{avatar}</span>
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {/* 名称和时间 */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-bold text-sm ${colors.text}`}>{name}</span>
          <span className={`text-xs ${isAI ? 'text-indigo-400' : 'text-slate-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Markdown 内容 */}
        <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
          isAI ? 'prose-indigo' : 'prose-slate'
        }`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default AgentMessage;
