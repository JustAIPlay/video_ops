# -*- coding: utf-8 -*-
"""
Review Manager - 复盘会议管理器
负责协调三个 Agent 的并发预加载和串行播放
"""
import asyncio
import uuid
import logging
from typing import Dict, Optional, AsyncIterator
from datetime import datetime
from .agents import ReviewAgentFactory

logger = logging.getLogger(__name__)
from models.review import AgentType, AgentContext, ReviewMessage


class ReviewSession:
    """复盘会话"""

    def __init__(self, review_id: str, context: AgentContext):
        """
        初始化会话

        Args:
            review_id: 复盘 ID
            context: Agent 上下文
        """
        self.review_id = review_id
        self.context = context
        self.content_cache: Dict[AgentType, str] = {}
        self.agent_status: Dict[AgentType, str] = {
            AgentType.ANALYST: "idle",
            AgentType.STRATEGIST: "idle",
            AgentType.HACKER: "idle"
        }
        self.messages: list[ReviewMessage] = []
        self.created_at = datetime.now()
        self.ready = False

    def get_agent_status(self, agent_type: AgentType) -> str:
        """获取 Agent 状态"""
        return self.agent_status.get(agent_type, "idle")

    def set_agent_status(self, agent_type: AgentType, status: str):
        """设置 Agent 状态"""
        self.agent_status[agent_type] = status


class ReviewManager:
    """
    复盘会议管理器

    负责：
    - 并发预加载所有 Agent 内容
    - 管理会话状态
    - 提供流式输出接口
    """

    def __init__(self):
        """初始化管理器"""
        self.sessions: Dict[str, ReviewSession] = {}
        self.agent_factory = ReviewAgentFactory()

    def create_session(
        self,
        context: AgentContext,
        agent_prompts: Optional[dict] = None
    ) -> ReviewSession:
        """
        创建复盘会话

        Args:
            context: Agent 上下文
            agent_prompts: 可选的自定义提示词配置

        Returns:
            ReviewSession 实例
        """
        review_id = f"rev_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        session = ReviewSession(review_id, context)

        # 设置自定义提示词
        if agent_prompts:
            prompt_mapping = {
                "analyst": agent_prompts.get("data_analyst"),
                "strategist": agent_prompts.get("strategist"),
                "hacker": agent_prompts.get("growth_hacker"),
            }
            # 过滤掉 None 值
            filtered_prompts = {k: v for k, v in prompt_mapping.items() if v}
            self.agent_factory.set_custom_prompts(filtered_prompts)

        self.sessions[review_id] = session
        return session

    async def prepare_all_agents(self, session: ReviewSession) -> None:
        """
        并发预加载所有 Agent 内容

        Args:
            session: 复盘会话
        """
        tasks = [
            self._generate_agent_content(session, AgentType.ANALYST),
            self._generate_agent_content(session, AgentType.STRATEGIST),
            self._generate_agent_content(session, AgentType.HACKER)
        ]

        # 并发执行
        await asyncio.gather(*tasks, return_exceptions=True)
        session.ready = True

    async def _generate_agent_content(self, session: ReviewSession, agent_type: AgentType) -> None:
        """
        生成单个 Agent 的内容并缓存

        Args:
            session: 复盘会话
            agent_type: Agent 类型
        """
        try:
            session.set_agent_status(agent_type, "thinking")

            # 创建 Agent
            agent = self.agent_factory.create(agent_type.value)

            # 生成内容（流式收集）
            content_parts = []
            # session.context 可能是对象或 dict
            context_data = session.context if isinstance(session.context, dict) else session.context.__dict__
            async for chunk in agent.generate_stream(context_data):
                content_parts.append(chunk)

            # 缓存完整内容
            full_content = "".join(content_parts)
            session.content_cache[agent_type] = full_content
            session.set_agent_status(agent_type, "completed")

            # 创建消息记录
            message = ReviewMessage(
                id=f"msg_{datetime.now().timestamp()}_{agent_type.value}",
                agent=agent_type,
                content=full_content,
                timestamp=int(datetime.now().timestamp()),
                type="text"
            )
            session.messages.append(message)

        except Exception as e:
            logger.error(f"Agent {agent_type} 生成失败: {e}")
            import traceback
            traceback.print_exc()
            session.set_agent_status(agent_type, "error")
            # 使用降级内容
            agent = self.agent_factory.create(agent_type.value)
            fallback = agent._get_fallback_response()
            logger.warning(f"使用降级响应: {fallback[:50]}...")
            session.content_cache[agent_type] = fallback

    async def get_agent_stream(
        self,
        session: ReviewSession,
        agent_type: AgentType
    ) -> AsyncIterator[str]:
        """
        获取 Agent 的流式输出

        优先从缓存读取，模拟打字机效果

        Args:
            session: 复盘会话
            agent_type: Agent 类型

        Yields:
            内容增量
        """
        # 检查缓存
        if agent_type in session.content_cache:
            content = session.content_cache[agent_type]
            # 模拟打字机效果
            for char in content:
                yield char
                await asyncio.sleep(0.01)  # 10ms 延迟
        else:
            # 缓存未命中，实时生成
            agent = self.agent_factory.create(agent_type.value)
            context_data = session.context if isinstance(session.context, dict) else session.context.__dict__
            async for chunk in agent.generate_stream(context_data):
                yield chunk

    def get_session(self, review_id: str) -> Optional[ReviewSession]:
        """
        获取复盘会话

        Args:
            review_id: 复盘 ID

        Returns:
            ReviewSession 实例或 None
        """
        return self.sessions.get(review_id)

    def get_session_status(self, session: ReviewSession) -> dict:
        """
        获取会话状态

        Args:
            session: 复盘会话

        Returns:
            状态字典
        """
        # 计算准备进度
        total_agents = 3
        completed_agents = sum(
            1 for status in session.agent_status.values()
            if status == "completed"
        )
        progress = int((completed_agents / total_agents) * 100)

        # 找到当前 Agent
        current_agent = None
        for agent_type, status in session.agent_status.items():
            if status in ["thinking", "generating"]:
                current_agent = agent_type
                break

        return {
            "ready": session.ready,
            "progress": progress,
            "current_agent": current_agent.value if current_agent else None,
            "agent_status": session.agent_status
        }


# 全局单例
_review_manager: Optional[ReviewManager] = None


def get_review_manager() -> ReviewManager:
    """获取复盘管理器单例"""
    global _review_manager
    if _review_manager is None:
        _review_manager = ReviewManager()
    return _review_manager
