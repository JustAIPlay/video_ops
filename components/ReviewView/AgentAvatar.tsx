// components/ReviewView/AgentAvatar.tsx
// Phase 3: 每日复盘会议功能 - Agent 头像组件

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AGENT_STYLES } from './constants';
import type { AgentType, AgentStatus } from '../../types/review';

interface AgentAvatarProps {
  type: AgentType;
  status: AgentStatus;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-16 h-16 text-3xl'
};

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  type,
  status,
  onClick,
  size = 'md'
}) => {
  const config = AGENT_STYLES[type];
  const { colors, avatar, name } = config;
  const sizeClass = sizeClasses[size];

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-500 ${
        status === 'completed' ? 'opacity-60' : ''
      } ${onClick ? 'hover:scale-105' : ''}`}
    >
      {/* 头像容器 */}
      <div className={`relative rounded-xl flex items-center justify-center transition-all duration-500 ${sizeClass} ${
        colors.bg
      } ${
        status === 'thinking' ? 'agent-thinking' : ''
      } ${
        status === 'speaking' ? 'agent-speaking' : ''
      } ${
        status === 'idle' ? 'opacity-40' : ''
      }`}>
        {/* Avatar 图标 */}
        <span>{avatar}</span>

        {/* 状态指示器 */}
        {status === 'thinking' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-400 rounded-full animate-ping" />
        )}
        {status === 'speaking' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
        )}
        {status === 'completed' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* 名称标签（仅在 medium 和 large 尺寸显示） */}
      {(size === 'md' || size === 'lg') && (
        <div className={`text-xs font-bold mt-2 text-center transition-colors duration-500 ${
          status === 'idle' ? 'text-slate-400' : colors.text
        }`}>
          {name}
        </div>
      )}
    </div>
  );
};

export default AgentAvatar;
