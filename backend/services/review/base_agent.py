# -*- coding: utf-8 -*-
"""
Review Agent Base - 复盘 Agent 基类
"""
import os
import json
from typing import Dict, Any, Optional, AsyncIterator
from abc import ABC, abstractmethod
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class ReviewAgentBase(ABC):
    """
    复盘 Agent 基类

    提供：
    - 流式输出支持
    - 上下文注入
    - 降级策略
    """

    def __init__(self, system_prompt: str):
        """
        初始化 Agent

        Args:
            system_prompt: System Prompt
        """
        self.system_prompt = system_prompt
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        )
        self.model = os.getenv("OPENAI_MODEL_NAME", "gpt-4")
        self._log_init()

    def _log_init(self):
        """记录初始化日志"""
        from . import AGENT_NAME
        print(f"[{AGENT_NAME}] 初始化完成")
        print(f"[{AGENT_NAME}] 使用模型: {self.model}")

    def build_prompt(self, context: Dict[str, Any]) -> str:
        """
        构建用户提示

        子类可以覆盖此方法以自定义提示构建逻辑

        Args:
            context: Agent 上下文

        Returns:
            用户提示字符串
        """
        return f"请分析以下数据：\n\n{json.dumps(context, ensure_ascii=False, indent=2)}"

    async def generate_stream(self, context: Dict[str, Any]) -> AsyncIterator[str]:
        """
        流式生成内容

        Args:
            context: Agent 上下文

        Yields:
            内容增量
        """
        user_prompt = self.build_prompt(context)

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            print(f"[{self.__class__.__name__}] 生成失败: {e}")
            # 返回降级响应
            fallback = self._get_fallback_response()
            for char in fallback:
                yield char

    def _get_fallback_response(self) -> str:
        """
        降级响应

        子类可以覆盖此方法提供特定的降级逻辑
        """
        return "抱歉，我暂时无法分析数据，请稍后再试。"


class ReviewAgentFactory:
    """复盘 Agent 工厂"""

    _agents: Dict[str, type] = {}

    @classmethod
    def register(cls, agent_type: str, agent_class: type):
        """注册 Agent"""
        cls._agents[agent_type] = agent_class

    @classmethod
    def create(cls, agent_type: str, **kwargs) -> ReviewAgentBase:
        """创建 Agent 实例"""
        agent_class = cls._agents.get(agent_type)
        if not agent_class:
            raise ValueError(f"未知的 Agent 类型: {agent_type}")
        return agent_class(**kwargs)
