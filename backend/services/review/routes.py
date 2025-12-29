# -*- coding: utf-8 -*-
"""
Review Routes - 每日复盘会议 API 路由
"""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from datetime import datetime, timedelta

from models.review import (
    StartReviewRequest, StartReviewResponse, DataSummary, AgentType,
    ReviewStatusResponse, AskQuestionRequest, AskQuestionResponse,
    SummarizeResponse, ReviewSummary, ExecuteActionRequest, ExecuteActionResponse
)
from services.review.manager import get_review_manager

router = APIRouter(prefix="/api/review", tags=["每日复盘"])


# ==================== 启动复盘 ====================

@router.post("/start", response_model=StartReviewResponse)
async def start_review(request: StartReviewRequest, background_tasks: BackgroundTasks):
    """
    启动复盘会议

    并发预加载所有 Agent 内容
    """
    try:
        manager = get_review_manager()

        # 构建上下文（这里使用 Mock 数据，实际应从飞书等数据源获取）
        context = _build_mock_context(request.date, request.accountFilter)

        # 创建会话
        session = manager.create_session(context)

        # 后台开始预加载
        background_tasks.add_task(manager.prepare_all_agents, session)

        # 计算数据摘要
        data_summary = DataSummary(
            totalVideos=len(context.get("videos", [])),
            totalViews=sum(v.get("readCount", 0) for v in context.get("videos", [])),
            avgScore=6.5  # Mock 值
        )

        return StartReviewResponse(
            reviewId=session.review_id,
            dataSummary=data_summary,
            agents=[AgentType.ANALYST, AgentType.STRATEGIST, AgentType.HACKER],
            estimatedTime=10
        )

    except Exception as e:
        print(f"[API] 启动复盘失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动失败: {str(e)}")


# ==================== 查询状态 ====================

@router.get("/{review_id}/status", response_model=ReviewStatusResponse)
async def get_review_status(review_id: str):
    """
    查询复盘准备状态

    前端可轮询此接口等待准备完成
    """
    try:
        manager = get_review_manager()
        session = manager.get_session(review_id)

        if not session:
            raise HTTPException(status_code=404, detail="复盘会话不存在")

        status = manager.get_session_status(session)
        return ReviewStatusResponse(**status)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API] 查询状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")


# ==================== Agent 发言（SSE）====================

@router.get("/{review_id}/agent/{agent_type}/speak")
async def agent_speak(review_id: str, agent_type: AgentType):
    """
    Agent 发言（SSE 流式输出）

    返回 Server-Sent Events 流
    """
    try:
        manager = get_review_manager()
        session = manager.get_session(review_id)

        if not session:
            raise HTTPException(status_code=404, detail="复盘会话不存在")

        async def event_generator():
            """SSE 事件生成器"""
            try:
                async for chunk in manager.get_agent_stream(session, agent_type):
                    # 发送数据增量
                    yield {
                        "event": "message",
                        "data": f'{{"agent": "{agent_type.value}", "content_delta": "{chunk}", "status": "streaming"}}'
                    }

                # 发送完成信号
                yield {
                    "event": "message",
                    "data": f'{{"agent": "{agent_type.value}", "content_delta": "", "status": "complete"}}'
                }

            except Exception as e:
                print(f"[SSE] 流式输出失败: {e}")
                yield {
                    "event": "error",
                    "data": f'{{"agent": "{agent_type.value}", "status": "error", "message": "{str(e)}"}}'
                }

        return EventSourceResponse(event_generator())

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API] Agent 发言失败: {e}")
        raise HTTPException(status_code=500, detail=f"发言失败: {str(e)}")


# ==================== 用户提问 ====================

@router.post("/{review_id}/ask", response_model=AskQuestionResponse)
async def ask_question(review_id: str, request: AskQuestionRequest):
    """
    用户提问

    允许用户在 Agent 发言后提问
    """
    try:
        manager = get_review_manager()
        session = manager.get_session(review_id)

        if not session:
            raise HTTPException(status_code=404, detail="复盘会话不存在")

        # 如果指定了目标 Agent，由该 Agent 回答
        target_agent = request.targetAgent or AgentType.ANALYST

        # 简化实现：返回固定回答
        # 实际应该调用 Agent 生成回答
        answer = f"根据{target_agent.value}的分析，{request.question}的建议如下..."

        return AskQuestionResponse(
            agent=target_agent,
            answer=answer,
            timestamp=int(datetime.now().timestamp())
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API] 提问失败: {e}")
        raise HTTPException(status_code=500, detail=f"提问失败: {str(e)}")


# ==================== 生成总结 ====================

@router.post("/{review_id}/summarize", response_model=SummarizeResponse)
async def summarize_review(review_id: str):
    """
    生成复盘总结

    整合三个 Agent 的意见生成总结报告
    """
    try:
        manager = get_review_manager()
        session = manager.get_session(review_id)

        if not session:
            raise HTTPException(status_code=404, detail="复盘会话不存在")

        # 从缓存的消息生成总结
        summary = _generate_summary(session)

        return SummarizeResponse(summary=summary)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API] 生成总结失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成总结失败: {str(e)}")


# ==================== 执行操作 ====================

@router.post("/{review_id}/action/execute", response_model=ExecuteActionResponse)
async def execute_action(review_id: str, request: ExecuteActionRequest):
    """
    执行操作项

    如：添加到排期、创建实验等
    """
    try:
        # 简化实现：返回成功响应
        # 实际应该调用相应的服务接口

        result = None
        if request.type.value == "scheduling":
            result = {
                "schedule_id": f"sch_{datetime.now().timestamp()}",
                "account": "ai图书",
                "time": "19:30",
                "date": datetime.now().strftime("%Y-%m-%d")
            }
            message = "已添加到明日排期"

        elif request.type.value == "experiment":
            result = {
                "experiment_id": f"exp_{datetime.now().timestamp()}"
            }
            message = "实验已创建"
        else:
            message = "操作已记录"

        return ExecuteActionResponse(
            success=True,
            message=message,
            result=result
        )

    except Exception as e:
        print(f"[API] 执行操作失败: {e}")
        raise HTTPException(status_code=500, detail=f"执行失败: {str(e)}")


# ==================== 历史记录 ====================

@router.get("/history", response_model=Dict[str, Any])
async def get_review_history(days: int = 7):
    """
    获取复盘历史记录

    Args:
        days: 查询天数，默认 7 天
    """
    try:
        # 简化实现：返回空历史
        # 实际应从数据库或文件读取
        return {"history": []}

    except Exception as e:
        print(f"[API] 获取历史失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取历史失败: {str(e)}")


# ==================== 辅助函数 ====================

def _build_mock_context(date: str, account_filter: list = None) -> Dict[str, Any]:
    """构建 Mock 上下文"""
    return {
        "date": date,
        "videos": [
            {
                "name": "AI图书推荐-高效学习法",
                "readCount": 8450,
                "likeCount": 320,
                "commentCount": 45,
                "forwardCount": 120,
                "createTime": "19:30"
            },
            {
                "name": "10分钟掌握ChatGPT",
                "readCount": 6780,
                "likeCount": 280,
                "commentCount": 38,
                "forwardCount": 95,
                "createTime": "20:00"
            }
        ],
        "videoDetails": [],
        "aiScores": [],
        "feishuData": None,
        "previousReviews": [],
        "yesterdayHypotheses": []
    }


def _generate_summary(session) -> ReviewSummary:
    """生成总结"""
    # 简化实现：返回固定总结
    # 实际应该调用总结 Agent 或分析消息内容

    from models.review import ActionItem, ActionItemType, Priority

    return ReviewSummary(
        keyInsights=[
            "AI 图书赛道流量整体上升趋势明显",
            "19:30-20:30 是黄金发布时段",
            "疑问句式标题可提升点击率"
        ],
        actionItems=[
            ActionItem(
                id="act_1",
                text="明天 19:30 在 ai图书 账号发布视频",
                priority=Priority.HIGH,
                type=ActionItemType.SCHEDULING,
                executable=True
            ),
            ActionItem(
                id="act_2",
                text="A/B 测试疑问句式标题",
                priority=Priority.MEDIUM,
                type=ActionItemType.EXPERIMENT,
                executable=True
            )
        ],
        hypotheses=[
            "H1: 前 3 秒加入 AI 图书实物展示，可能提升完播率",
            "H2: 标题增加疑问句式，可能提升点击率"
        ]
    )
