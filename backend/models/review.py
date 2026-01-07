# -*- coding: utf-8 -*-
"""
Review Models - 每日复盘会议数据模型
定义复盘会议相关的 Pydantic 数据结构
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import date, datetime
from enum import Enum


# ==================== 枚举类型 ====================

class AgentType(str, Enum):
    """Agent 类型"""
    ANALYST = "analyst"
    STRATEGIST = "strategist"
    HACKER = "hacker"


class AgentStatus(str, Enum):
    """Agent 状态"""
    IDLE = "idle"
    THINKING = "thinking"
    SPEAKING = "speaking"
    COMPLETED = "completed"


class ReviewStatus(str, Enum):
    """复盘状态"""
    PREPARING = "preparing"
    IN_PROGRESS = "in_progress"
    DISCUSSION = "discussion"
    COMPLETED = "completed"


class ActionItemType(str, Enum):
    """操作项类型"""
    SCHEDULING = "scheduling"
    CONTENT = "content"
    EXPERIMENT = "experiment"
    GENERAL = "general"


class Priority(str, Enum):
    """优先级"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ==================== 请求模型 ====================

class VideoDetail(BaseModel):
    """视频详细信息"""
    id: str
    title: str
    tags: List[str] = []
    coverDescription: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    duration: Optional[int] = None


class AgentContext(BaseModel):
    """Agent 上下文"""
    date: str = Field(..., description="日期 YYYY-MM-DD")
    videos: List[Dict[str, Any]] = Field(default_factory=list, description="视频数据列表")
    videoDetails: List[VideoDetail] = Field(default_factory=list, description="视频详细信息")
    aiScores: List[Dict[str, Any]] = Field(default_factory=list, description="AI 分析评分")
    feishuData: Optional[Dict[str, Any]] = Field(None, description="飞书数据")
    previousReviews: Optional[List[Dict[str, Any]]] = Field(None, description="历史复盘记录")
    yesterdayHypotheses: Optional[List[str]] = Field(None, description="昨天的假设")


class AgentPrompts(BaseModel):
    """Agent 提示词配置"""
    data_analyst: Optional[str] = Field(None, description="数据分析 Agent 提示词")
    strategist: Optional[str] = Field(None, description="排期策略 Agent 提示词")
    growth_hacker: Optional[str] = Field(None, description="增长黑客 Agent 提示词")
    summarizer: Optional[str] = Field(None, description="总结 Agent 提示词")


class StartReviewRequest(BaseModel):
    """启动复盘请求"""
    date: str = Field(..., description="复盘日期 YYYY-MM-DD")
    accountFilter: Optional[List[str]] = Field(None, description="账号过滤")
    agentPrompts: Optional[AgentPrompts] = Field(None, description="Agent 提示词配置（从前端传递）")
    # 注意：每日复盘使用 .env 文件中的飞书配置，不需要前端传递


# ==================== 响应模型 ====================

class ReviewMessage(BaseModel):
    """复盘消息"""
    id: str
    agent: AgentType
    content: str
    timestamp: int
    type: Literal["text", "data_card", "suggestion"] = "text"


class DataSummary(BaseModel):
    """数据摘要"""
    totalVideos: int
    totalViews: int
    avgScore: float


class StartReviewResponse(BaseModel):
    """启动复盘响应"""
    reviewId: str
    dataSummary: DataSummary
    agents: List[AgentType]
    estimatedTime: int = Field(10, description="预计准备时间（秒）")


class ReviewStatusResponse(BaseModel):
    """复盘状态响应"""
    ready: bool
    progress: int = Field(0, ge=0, le=100)
    currentAgent: Optional[AgentType] = None
    error: Optional[str] = None


class AgentSpeakDelta(BaseModel):
    """Agent 发言增量（SSE）"""
    agent: AgentType
    contentDelta: str = Field(..., alias="content_delta")
    status: Literal["streaming", "complete", "error"]


# ==================== 用户交互模型 ====================

class AskQuestionRequest(BaseModel):
    """用户提问请求"""
    question: str = Field(..., min_length=1, description="问题内容")
    targetAgent: Optional[AgentType] = Field(None, description="目标 Agent")


class AskQuestionResponse(BaseModel):
    """提问响应"""
    agent: AgentType
    answer: str
    timestamp: int


# ==================== 总结模型 ====================

class ScheduleData(BaseModel):
    """排期数据"""
    account: str
    time: str = Field(..., description="HH:mm 格式")
    videoId: Optional[str] = None
    date: Optional[str] = None


class ExperimentData(BaseModel):
    """实验数据"""
    hypothesisId: str
    variables: Dict[str, Any]
    duration: Optional[int] = None


class ActionItem(BaseModel):
    """可执行操作项"""
    id: str
    text: str
    priority: Priority
    type: ActionItemType
    executable: bool = False
    scheduleData: Optional[ScheduleData] = None
    experimentData: Optional[ExperimentData] = None


class ReviewSummary(BaseModel):
    """复盘总结"""
    keyInsights: List[str] = Field(default_factory=list)
    actionItems: List[ActionItem] = Field(default_factory=list)
    hypotheses: List[str] = Field(default_factory=list)


class SummarizeResponse(BaseModel):
    """总结响应"""
    summary: ReviewSummary


# ==================== 历史记录模型 ====================

class ValidatedHypothesis(BaseModel):
    """已验证假设"""
    hypothesis: str
    result: Literal["proven", "disproven", "inconclusive"]
    evidence: str


class ReviewHistoryRecord(BaseModel):
    """复盘历史记录"""
    date: str
    summary: ReviewSummary
    hypotheses: List[str] = []
    validatedHypotheses: List[ValidatedHypothesis] = []


class ReviewHistoryResponse(BaseModel):
    """复盘历史响应"""
    history: List[ReviewHistoryRecord]


# ==================== 操作执行模型 ====================

class ExecuteActionRequest(BaseModel):
    """执行操作请求"""
    actionId: str
    type: ActionItemType


class ExecuteActionResponse(BaseModel):
    """执行操作响应"""
    success: bool
    message: str
    result: Optional[Dict[str, Any]] = None


# ==================== 错误模型 ====================

class ReviewError(BaseModel):
    """复盘错误"""
    code: str
    message: str
    retryable: bool
    agent: Optional[AgentType] = None
