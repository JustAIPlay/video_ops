# -*- coding: utf-8 -*-
"""
Video Ops AI Backend - FastAPI 主入口
视频运营 AI 智能分析后端服务
"""
import sys
import io

# 设置 UTF-8 编码输出（解决 Windows 控制台乱码问题）
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from dotenv import load_dotenv
import uvicorn

from services.matrix_agent import MatrixAdvisor
from services.agents.content_agent import ContentQualityAgent
from models.analysis import VideoItem, VideoScore, AIAnalysisRequest, AIAnalysisResponse

# 加载环境变量
load_dotenv()

# 创建 FastAPI 应用
app = FastAPI(
    title="Video Ops AI Backend",
    description="视频运营智能分析 API 服务",
    version="2.0.0"
)

# CORS 配置（允许前端跨域访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3003"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 Agent
legacy_agent = MatrixAdvisor()
content_agent = ContentQualityAgent()


# ================== 数据模型 ==================

class TaskItem(BaseModel):
    """分析任务项"""
    id: str
    title: str
    views: int
    groupName: Optional[str] = None
    accountName: Optional[str] = None


class AnalyzeRequest(BaseModel):
    """分析请求"""
    tasks: List[TaskItem]


class AnalysisResult(BaseModel):
    """分析结果"""
    id: str
    score: int
    advice: str
    reasoning: str


class AnalyzeResponse(BaseModel):
    """分析响应"""
    status: str
    data: List[AnalysisResult]


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    service: str


class FeishuWriteRequest(BaseModel):
    """飞书写入请求"""
    app_id: str
    app_secret: str
    app_token: str
    table_id: str
    scores: List[VideoScore]
    field_mapping: Dict[str, str] = {
        "AI 评分": "ai_score",
        "AI 评级": "ai_grade",
        "病毒指数": "viral_index",
        "AI 建议": "optimization_advice",
        "分析理由": "reasoning"
    }


# ================== API 路由 ==================

@app.get("/", response_model=dict)
async def root():
    """根路径"""
    return {
        "message": "Video Ops AI Backend",
        "version": "2.0.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "service": "video-ops-ai-backend"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_schedule(request: AnalyzeRequest):
    """
    分析视频排期（兼容旧接口）

    接收视频任务列表，返回 AI 分析结果（评分、建议、推理）
    """
    try:
        # 转换为字典列表
        tasks = [task.model_dump() for task in request.tasks]

        # 调用 Agent 分析
        results = legacy_agent.analyze_schedule(tasks)

        return {"status": "success", "data": results}

    except Exception as e:
        # 错误处理
        print(f"[API] 分析失败: {str(e)}")
        return {"status": "error", "data": []}


# ================== 新增 AI 分析接口 ==================

@app.post("/api/analyze/content", response_model=AIAnalysisResponse)
async def analyze_content(request: AIAnalysisRequest):
    """
    视频内容层分析（新接口）

    分析视频内容质量，提供评分、建议和病毒指数
    """
    try:
        # 转换为字典列表
        videos = [video.model_dump() for video in request.videos]

        # 批量分析
        results = content_agent.batch_analyze(videos)

        return AIAnalysisResponse(
            status="success",
            message="分析完成",
            results=[VideoScore(**r) for r in results]
        )

    except Exception as e:
        print(f"[API] 内容分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@app.post("/api/feishu/write-scores")
async def write_scores_to_feishu(request: FeishuWriteRequest):
    """
    将 AI 分析结果写入飞书表格

    Args:
        request: 包含飞书凭证和分析结果的请求

    Returns:
        写入结果统计
    """
    try:
        from services.feishu_writer import create_feishu_writer

        # 创建飞书写入服务
        writer = create_feishu_writer(request.app_id, request.app_secret)

        # 批量更新
        result = writer.batch_update_video_scores(
            app_token=request.app_token,
            table_id=request.table_id,
            scores=request.scores,
            field_mapping=request.field_mapping
        )

        return {
            "status": "success",
            "message": f"成功写入 {result['success']} 条记录",
            "data": result
        }

    except Exception as e:
        print(f"[API] 飞书写入失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"飞书写入失败: {str(e)}")


@app.get("/api/analyze/status/{task_id}")
async def get_analysis_status(task_id: str):
    """
    查询分析任务状态（占位接口）

    后续可扩展为异步任务队列
    """
    return {
        "task_id": task_id,
        "status": "completed",
        "progress": 100,
        "message": "分析完成"
    }


# ================== 主程序入口 ==================

if __name__ == "__main__":
    import os

    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", 8000))

    print("="*60)
    print("🚀 Video Ops AI Backend 正在启动...")
    print("="*60)
    print(f"📍 服务地址: http://{host}:{port}")
    print(f"📚 API 文档: http://{host}:{port}/docs")
    print("="*60 + "\n")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True
    )
