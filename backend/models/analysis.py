# -*- coding: utf-8 -*-
"""
AI Analysis Data Models
AI 分析相关的数据模型定义
"""
from typing import Optional, List
from pydantic import BaseModel, Field


# ==================== 视频数据模型 ====================

class VideoItem(BaseModel):
    """视频数据项"""
    video_id: str = Field(..., description="视频ID")
    title: str = Field(..., description="视频标题")
    description: str = Field(..., description="视频描述/内容")
    views: int = Field(0, description="浏览量")
    publish_time: Optional[str] = Field(None, description="发布时间")
    account_name: str = Field(..., description="所属账号名称")
    group_name: Optional[str] = Field(None, description="所属分组名称")
    # 互动数据
    like_count: Optional[int] = Field(None, description="点赞数")
    comment_count: Optional[int] = Field(None, description="评论数")
    share_count: Optional[int] = Field(None, description="分享数")
    fav_count: Optional[int] = Field(None, description="推荐/收藏数")
    forward_agg_count: Optional[int] = Field(None, description="转发聊天和朋友圈数")
    # 播放数据
    full_play_rate: Optional[str] = Field(None, description="完播率 (如: 85.50%)")
    avg_play_time: Optional[str] = Field(None, description="平均播放时长 (如: 15.30秒)")


class AccountContext(BaseModel):
    """账号上下文信息"""
    account_name: str = Field(..., description="账号名称")
    group_name: Optional[str] = Field(None, description="分组名称")
    total_videos: int = Field(0, description="总视频数")
    avg_views: float = Field(0.0, description="平均浏览量")


# ==================== AI 分析结果模型 ====================

class VideoScore(BaseModel):
    """视频评分结果"""
    video_id: str = Field(..., description="视频ID")
    overall_score: int = Field(..., ge=1, le=10, description="综合评分 (1-10)")
    dimension_scores: dict = Field(default_factory=dict, description="各维度评分 (1-10): content_quality, timing, engagement, viral_potential")
    grade: str = Field(..., description="评级 (S/A/B/C)")
    optimization_advice: str = Field(..., description="优化建议")
    reasoning: str = Field(..., description="分析推理过程")
    suggested_publish_time: Optional[str] = Field(None, description="建议发布时间")
    viral_index: float = Field(0.0, ge=0, le=1, description="病毒传播指数 (0-1)")


# ==================== API 请求/响应模型 ====================

class AIAnalysisRequest(BaseModel):
    """AI 分析请求"""
    videos: List[VideoItem] = Field(..., description="视频列表")
    account_context: Optional[AccountContext] = Field(None, description="账号上下文")


class AIAnalysisResponse(BaseModel):
    """AI 分析响应"""
    status: str = Field(..., description="状态: success/analyzing/error")
    message: str = Field(..., description="状态消息")
    task_id: Optional[str] = Field(None, description="任务ID（异步任务）")
    results: Optional[List[VideoScore]] = Field(None, description="分析结果列表")


class AnalyzeScheduleRequest(BaseModel):
    """排期分析请求（兼容旧接口）"""
    tasks: List[dict] = Field(..., description="任务列表")


class AnalyzeScheduleResponse(BaseModel):
    """排期分析响应（兼容旧接口）"""
    status: str = Field(..., description="状态")
    data: List[dict] = Field(..., description="分析结果数据")
