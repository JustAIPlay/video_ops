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
  // 互动数据
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  fav_count?: number;
  forward_agg_count?: number;
  // 播放数据
  full_play_rate?: string;
  avg_play_time?: string;
}

export interface VideoScore {
  video_id: string;
  overall_score: number;  // 1-10
  dimension_scores: {
    content_quality: number;  // 1-10
    timing: number;  // 1-10
    engagement: number;  // 1-10
    viral_potential: number;  // 1-10
  };
  grade: 'S' | 'A' | 'B' | 'C';
  optimization_advice: string;
  reasoning: string;
  suggested_publish_time?: string;
  viral_index: number;  // 0-1
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
const API_BASE_URL = 'http://127.0.0.1:8008';

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
    // 转换 overall_score 为整数（后端要求 int 类型）
    const scores = request.scores.map(score => ({
      ...score,
      overall_score: Math.round(score.overall_score)
    }));

    const requestBody = {
      app_id: request.app_id,
      app_secret: request.app_secret,
      app_token: request.app_token,
      table_id: request.table_id,
      scores: scores,
      field_mapping: request.field_mapping
    };

    console.log('[Feishu Write] 请求数据:', JSON.stringify(requestBody, null, 2));
    console.log('[Feishu Write] 第一个 score:', JSON.stringify(scores[0], null, 2));

    const response = await fetch(`${API_BASE_URL}/api/feishu/write-scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Feishu Write] 响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Feishu Write] 错误响应:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
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
