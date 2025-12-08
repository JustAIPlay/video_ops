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
}