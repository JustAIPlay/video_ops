// components/ReviewView/AgentMessage.tsx
// Phase 3: 每日复盘会议功能 - 消息气泡组件（微信风格）

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
  const { colors, avatar, name, isUser } = config;
  const isRight = isUser;

  return (
    <div className={`flex gap-3 mb-4 message-appear ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : colors.bg
      }`}>
        <span className="text-lg">{isUser ? '👤' : avatar}</span>
      </div>

      {/* 内容区域 */}
      <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* 名称 */}
        {!isUser && (
          <span className={`text-xs font-medium ${colors.text} mb-1 ml-1`}>
            {name}
          </span>
        )}

        {/* 消息气泡 */}
        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
          isRight
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm'
            : `${colors.bubble} ${colors.bubbleText} border border-slate-100 rounded-bl-sm`
        }`}>
          {/* Markdown 内容 */}
          <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
            isRight ? 'prose-invert prose-emerald' : 'prose-slate'
          }`}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {/* 时间 */}
        <span className={`text-xs text-slate-400 mt-1 ${isRight ? 'mr-1' : 'ml-1'}`}>
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
};

export default AgentMessage;
