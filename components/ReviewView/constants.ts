// components/ReviewView/constants.ts
// Phase 3: 每日复盘会议功能 - Agent 样式常量

import type { AgentType } from '../../types/review';

export interface AgentStyleConfig {
  name: string;
  avatar: string;
  colors: {
    bg: string;
    text: string;
    gradient: string;
    shadow: string;
    border: string;
    bubble: string;
    bubbleText: string;
  };
  isUser?: boolean;
}

export const AGENT_STYLES: Record<AgentType, AgentStyleConfig> = {
  user: {
    name: '主持人',
    avatar: '👤',
    colors: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      gradient: 'from-slate-400 to-slate-500',
      shadow: 'shadow-slate-200',
      border: 'border-slate-200',
      bubble: 'bg-emerald-500',
      bubbleText: 'text-white'
    },
    isUser: true
  },
  analyst: {
    name: '数据分析',
    avatar: '📊',
    colors: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      gradient: 'from-blue-400 to-cyan-400',
      shadow: 'shadow-blue-200',
      border: 'border-blue-200',
      bubble: 'bg-white',
      bubbleText: 'text-slate-700'
    }
  },
  strategist: {
    name: '排期策略',
    avatar: '🎯',
    colors: {
      bg: 'bg-violet-100',
      text: 'text-violet-600',
      gradient: 'from-violet-400 to-purple-400',
      shadow: 'shadow-violet-200',
      border: 'border-violet-200',
      bubble: 'bg-white',
      bubbleText: 'text-slate-700'
    }
  },
  hacker: {
    name: '增长黑客',
    avatar: '🚀',
    colors: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      gradient: 'from-orange-400 to-amber-400',
      shadow: 'shadow-orange-200',
      border: 'border-orange-200',
      bubble: 'bg-white',
      bubbleText: 'text-slate-700'
    }
  }
};

// Agent 发言顺序
export const AGENT_ORDER: AgentType[] = ['analyst', 'strategist', 'hacker'];

// 阶段配置
export const STAGE_CONFIG = {
  preparing: { label: '数据准备', agent: null },
  analyst: { label: '数据分析', agent: 'analyst' },
  strategist: { label: '策略制定', agent: 'strategist' },
  hacker: { label: '增长建议', agent: 'hacker' },
  completed: { label: '会议总结', agent: null }
} as const;

// 进度计算（每个阶段 20%）
export const calculateProgress = (stage: number): number => {
  return Math.min(100, stage * 20);
};
