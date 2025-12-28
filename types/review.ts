// types/review.ts
// Phase 3: 每日复盘会议功能 - 类型定义

import type { VideoItem } from '../types';

export type AgentType = 'analyst' | 'strategist' | 'hacker';
export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'completed';
export type ReviewStatus = 'preparing' | 'in_progress' | 'discussion' | 'completed';
export type ReviewStage = '数据准备' | '数据分析' | '策略制定' | '增长建议' | '会议总结';
export type InteractionMode = 'sequential' | 'interrupt';

export interface ReviewMessage {
  id: string;
  agent: AgentType;
  content: string;
  timestamp: number;
  type: 'text' | 'data_card' | 'suggestion';
}

// 视频内容详细信息（供增长黑客使用）
export interface VideoDetail {
  id: string;
  title: string;
  tags: string[];
  coverDescription?: string; // OCR 提取的关键帧描述
  thumbnailUrl?: string;
  duration?: number;
}

// 增强版 ActionItem，支持可执行操作
export interface ActionItem {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  type: 'scheduling' | 'content' | 'experiment' | 'general';
  executable?: boolean;
  // 排期相关字段
  scheduleData?: {
    account: string;
    time: string; // HH:mm 格式
    videoId?: string;
    date?: string; // 默认为明天
  };
  // 实验相关字段
  experimentData?: {
    hypothesisId: string;
    variables: Record<string, any>;
    duration?: number;
  };
}

// 历史复盘记录
export interface ReviewHistory {
  date: string;
  summary: ReviewSummary;
  hypotheses: string[];
  validatedHypotheses: Array<{
    hypothesis: string;
    result: 'proven' | 'disproven' | 'inconclusive';
    evidence: string;
  }>;
}

export interface ReviewSummary {
  keyInsights: string[];
  actionItems: ActionItem[];
  hypotheses: string[];
}

// Agent 上下文（包含视频详细信息）
export interface AgentContext {
  date: string;
  videos: VideoItem[];
  videoDetails: VideoDetail[];
  aiScores: any[];
  feishuData: any;
  previousReviews?: ReviewHistory[];
  yesterdayHypotheses?: string[];
}

// 错误状态
export interface ReviewError {
  code: string;
  message: string;
  retryable: boolean;
  agent?: AgentType;
}

export interface ReviewState {
  status: ReviewStatus;
  currentAgent: AgentType | null;
  agentStatus: {
    analyst: AgentStatus;
    strategist: AgentStatus;
    hacker: AgentStatus;
  };
  messages: ReviewMessage[];
  userQuestions: string[];
  summary?: ReviewSummary;
  context: AgentContext;
  interactionMode: InteractionMode;
  canInteract: boolean;
  error?: ReviewError;
  reviewId?: string;
  currentStage?: ReviewStage;
  progress?: number;
  estimatedTime?: number;
}
