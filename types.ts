export interface JiKeResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// Based on PDF "videos.desc.media"
export interface VideoMedia {
  url: string;
  coverUrl: string;
  width: number;
  height: number;
  videoPlayLen: number;
  fileSize: string;
}

// Based on PDF "videos.desc"
export interface VideoDesc {
  description: string;
  mediaType: number;
  media: VideoMedia[];
}

// Based on PDF "videos" array element
export interface VideoItem {
  name: string;
  createTime: string; // "yyyy-MM-dd HH:mm"
  create_time: number; // timestamp
  url: string;
  coverUrl: string;
  readCount: number;
  likeCount: number;
  commentCount: number;
  forwardCount: number;
  forwardAggregationCount: number;
  favCount: number;
  fullPlayRate: string; // "85.50%"
  avgPlayTimeSec: string; // "15.30秒"
  followCount: number;
  exportId: string;
  objectId: string;
  visibleType: number;
  status: number;
  desc?: VideoDesc;
}

// Based on PDF "data" array element
export interface AccountData {
  user_id: number;
  username: string;
  group_name?: string; // Corresponds to config mapping
  window_name: string;
  platform: string;
  total_count: number;
  videos: VideoItem[];
}

export interface SyncLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  detail?: string;
}

export interface TargetConfig {
  baseToken: string;
  tableId: string;
}

export interface AppConfig {
  feishuAppId: string;
  feishuAppSecret: string;
  // Map JiKe username (or group name) to specific Base Token and Table ID
  accountTableMapping: Record<string, TargetConfig>; 
}

export interface ScheduleItem {
  id: string; // Record ID
  videoId: string; // 视频编号
  description: string; // 内容描述
  readCount: number; // 浏览次数
  groupName: string; // 分组名
  publishTime?: number; // 发布时间
  repeatCount: number; // 重复次数
  url?: string; // 链接
  accountName?: string; // 账号名称
  accountTodayCount?: number; // 账号今日发布次数
  aiAnalysis?: AIAnalysis; // AI分析结果
}

// ==================== AI 分析相关类型 ====================

/**
 * AI视频分析评分结果
 */
export interface AIAnalysis {
  // 综合评分 (1-10)
  overall_score: number;
  // 各维度评分
  dimension_scores: {
    content_quality: number; // 内容质量 (1-10)
    timing: number; // 发布时机 (1-10)
    engagement: number; // 互动表现 (1-10)
    viral_potential: number; // 病毒传播潜力 (1-10)
  };
  // 优化建议
  optimization_advice: string;
  // 评分理由
  reasoning: string;
  // 建议发布时间
  suggested_publish_time?: string;
  // A/B测试建议
  ab_test_suggestion?: string;
  // 病毒指数 (0-1)
  viral_index: number;
  // 评级标签 (S/A/B/C)
  grade: 'S' | 'A' | 'B' | 'C';
}

/**
 * 账号分析报告
 */
export interface AccountReport {
  account_id: string;
  account_name: string;
  overall_score: number; // 0-100
  metrics: {
    growth_rate: number;
    engagement_rate: number;
    content_quality: number;
    consistency: number;
  };
  ranking_in_group: number;
  strengths: string[];
  weaknesses: string[];
  improvement_plan: string;
}

/**
 * 分组对比分析
 */
export interface GroupComparison {
  group_name: string;
  ranking_table: Array<{
    account_name: string;
    score: number;
  }>;
  similarity_matrix: Record<string, number>;
  collaboration_opportunities: Array<{
    account_a: string;
    account_b: string;
    reason: string;
  }>;
  group_insights: string;
}

/**
 * 全局运营健康报告
 */
export interface GlobalHealthReport {
  overall_health_score: number; // 0-100
  group_performance_comparison: Record<string, number>;
  growth_trend: 'up' | 'stable' | 'down';
  risk_alerts: string[];
  strategic_recommendations: string[];
}

/**
 * 完整分析结果
 */
export interface FullAnalysisResults {
  content: AIAnalysis[];
  account: AccountReport[];
  group: GroupComparison[];
  global: GlobalHealthReport;
}