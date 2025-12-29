// services/reviewService.ts
// 每日复盘会议 API 服务

import { AppConfig } from '../types';

// API 基础 URL
const API_BASE_URL = 'http://127.0.0.1:8001';

export interface StartReviewRequest {
  date: string; // YYYY-MM-DD
  accountFilter?: string[];
  // 注意：飞书配置从后端 .env 文件读取，不需要前端传递
}

export interface DataSummary {
  totalVideos: number;
  totalViews: number;
  avgScore: number;
}

export interface StartReviewResponse {
  reviewId: string;
  dataSummary: DataSummary;
  agents: string[];
  estimatedTime: number;
}

export interface ReviewStatusResponse {
  ready: boolean;
  progress: number;
  currentAgent: string | null;
  error?: string;
}

export interface AskQuestionRequest {
  question: string;
  targetAgent?: string;
}

export interface AskQuestionResponse {
  agent: string;
  answer: string;
  timestamp: number;
}

export interface ActionItem {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  type: 'scheduling' | 'content' | 'experiment' | 'general';
  executable: boolean;
  scheduleData?: {
    account: string;
    time: string;
    date?: string;
  };
  experimentData?: {
    hypothesisId: string;
    variables: Record<string, any>;
    duration?: number;
  };
}

export interface ReviewSummary {
  keyInsights: string[];
  actionItems: ActionItem[];
  hypotheses: string[];
}

export interface SummarizeResponse {
  summary: ReviewSummary;
}

/**
 * 启动复盘会议
 */
export async function startReview(request: StartReviewRequest): Promise<StartReviewResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Review Service] 启动复盘失败:', error);
    throw error;
  }
}

/**
 * 查询复盘状态
 */
export async function getReviewStatus(reviewId: string): Promise<ReviewStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/${reviewId}/status`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Review Service] 查询状态失败:', error);
    throw error;
  }
}

/**
 * 用户提问
 */
export async function askQuestion(
  reviewId: string,
  request: AskQuestionRequest
): Promise<AskQuestionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/${reviewId}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Review Service] 提问失败:', error);
    throw error;
  }
}

/**
 * 生成复盘总结
 */
export async function summarizeReview(reviewId: string): Promise<SummarizeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/${reviewId}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Review Service] 生成总结失败:', error);
    throw error;
  }
}

/**
 * 执行操作项
 */
export async function executeAction(
  reviewId: string,
  actionId: string,
  type: string
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/${reviewId}/action/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ actionId, type }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Review Service] 执行操作失败:', error);
    throw error;
  }
}

/**
 * 获取复盘历史记录
 */
export async function getReviewHistory(days: number = 7): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/history?days=${days}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Review Service] 获取历史失败:', error);
    throw error;
  }
}

/**
 * Agent 发言的 SSE 流
 * 返回 EventSource 实例，调用方负责关闭
 */
export function createAgentStream(reviewId: string, agentType: string): EventSource {
  const url = `${API_BASE_URL}/api/review/${reviewId}/agent/${agentType}/speak`;
  return new EventSource(url);
}
