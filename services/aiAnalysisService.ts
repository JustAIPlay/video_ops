// AI 分析服务
// 对接后端 AI 分析 API

export interface VideoItem {
  video_id: string;
  title: string;
  description: string;
  views: number;
  account_name: string;
  group_name?: string;
  publish_time?: string;
}

export interface VideoScore {
  video_id: string;
  overall_score: number;
  dimension_scores: {
    content_quality: number;
    timing: number;
    account_fit: number;
  };
  grade: 'S' | 'A' | 'B' | 'C';
  optimization_advice: string;
  reasoning: string;
  suggested_publish_time?: string;
  viral_index: number;
}

export interface AIAnalysisResponse {
  status: string;
  message: string;
  task_id?: string;
  results?: VideoScore[];
}

export interface FeishuWriteRequest {
  app_id: string;
  app_secret: string;
  app_token: string;
  table_id: string;
  scores: VideoScore[];
  field_mapping?: Record<string, string>;
}

export interface FeishuWriteResponse {
  status: string;
  message: string;
  data?: {
    success: number;
    failed: number;
    total: number;
  };
}

// API 基础 URL
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * 分析视频内容质量
 */
export async function analyzeVideoContent(videos: VideoItem[]): Promise<AIAnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videos: videos,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AIAnalysisResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[AI Analysis Service] 分析失败:', error);
    throw error;
  }
}

/**
 * 将 AI 分析结果写入飞书表格
 */
export async function writeScoresToFeishu(request: FeishuWriteRequest): Promise<FeishuWriteResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/feishu/write-scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FeishuWriteResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[AI Analysis Service] 飞书写入失败:', error);
    throw error;
  }
}

/**
 * 查询分析任务状态（预留接口）
 */
export async function getAnalysisStatus(taskId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/status/${taskId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[AI Analysis Service] 查询状态失败:', error);
    throw error;
  }
}
