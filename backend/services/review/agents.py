# -*- coding: utf-8 -*-
"""
Review Agents - 每日复盘 Agent 实现
"""
from typing import Dict, Any, AsyncIterator

from .base_agent import ReviewAgentBase, ReviewAgentFactory
from prompts.review_prompts import (
    DATA_ANALYST_SYSTEM_PROMPT,
    STRATEGIST_SYSTEM_PROMPT,
    GROWTH_HACKER_SYSTEM_PROMPT,
    build_data_analyst_prompt,
    build_strategist_prompt,
    build_growth_hacker_prompt
)


# Agent 名称常量
AGENT_NAME = "ReviewAgent"


class DataAnalystAgent(ReviewAgentBase):
    """数据分析 Agent"""

    def __init__(self):
        super().__init__(DATA_ANALYST_SYSTEM_PROMPT)

    def build_prompt(self, context: Dict[str, Any]) -> str:
        """构建数据分析提示"""
        return build_data_analyst_prompt(context)

    def _get_fallback_response(self) -> str:
        """降级响应"""
        return """# 今日数据分析

抱歉，数据分析服务暂时不可用。以下是建议的检查项：

1. 检查今日视频发布数量
2. 查看播放量异常的视频
3. 关注互动率变化趋势

请稍后重试获取完整分析。"""


class StrategistAgent(ReviewAgentBase):
    """排期策略 Agent"""

    def __init__(self):
        super().__init__(STRATEGIST_SYSTEM_PROMPT)

    def build_prompt(self, context: Dict[str, Any]) -> str:
        """构建策略分析提示"""
        return build_strategist_prompt(context)

    def _get_fallback_response(self) -> str:
        """降级响应"""
        return """# 排期策略评估

抱歉，策略分析服务暂时不可用。建议：

1. 继续在 19:30-20:30 时段发布
2. 保持账号间的内容搭配
3. 关注每条视频的数据反馈

请稍后重试获取完整分析。"""


class GrowthHackerAgent(ReviewAgentBase):
    """增长黑客 Agent"""

    def __init__(self):
        super().__init__(GROWTH_HACKER_SYSTEM_PROMPT)

    def build_prompt(self, context: Dict[str, Any]) -> str:
        """构建增长建议提示"""
        return build_growth_hacker_prompt(context)

    def _get_fallback_response(self) -> str:
        """降级响应"""
        return """# 增长建议

抱歉，增长分析服务暂时不可用。建议尝试：

1. A/B 测试不同的标题风格
2. 优化视频前 3 秒内容
3. 测试不同的发布时段

请稍后重试获取完整分析。"""


# 注册 Agent 到工厂
ReviewAgentFactory.register("analyst", DataAnalystAgent)
ReviewAgentFactory.register("strategist", StrategistAgent)
ReviewAgentFactory.register("hacker", GrowthHackerAgent)
