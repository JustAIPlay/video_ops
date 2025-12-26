# -*- coding: utf-8 -*-
"""
BaseAgent - Agent 基类
所有 AI 分析 Agent 的基础实现
"""
import os
import json
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class BaseAgent(ABC):
    """
    Agent 基类

    提供：
    - 统一的 LLM 客户端封装
    - 统一的调用接口
    - 降级策略（LLM 调用失败时返回默认值）
    """

    def __init__(self):
        """初始化 Agent"""
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        )
        self.model = os.getenv("OPENAI_MODEL_NAME", "gpt-4")
        self._log_init()

    def _log_init(self):
        """记录初始化日志"""
        print(f"[{self.__class__.__name__}] 初始化完成")
        print(f"[{self.__class__.__name__}] 使用模型: {self.model}")

    def _call_llm(
        self,
        prompt: str,
        response_format: Optional[str] = None,
        temperature: float = 0.3,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        调用 LLM 并返回解析后的结果

        Args:
            prompt: 提示词
            response_format: 响应格式，"json" 或 "text"
            temperature: 温度参数
            max_retries: 最大重试次数

        Returns:
            解析后的字典结果
        """
        # 构建 messages
        messages = [{"role": "user", "content": prompt}]

        # 构建 kwargs
        kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }

        # 如果指定响应格式为 JSON，添加相应参数
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        # 重试机制
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content.strip()

                # 解析 JSON
                if response_format == "json":
                    return json.loads(content)
                else:
                    return {"result": content}

            except json.JSONDecodeError as e:
                print(f"[{self.__class__.__name__}] JSON 解析失败 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    raise
                continue

            except Exception as e:
                print(f"[{self.__class__.__name__}] LLM 调用失败 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    # 最后一次尝试失败，返回降级结果
                    return self._get_fallback_result()
                continue

        return self._get_fallback_result()

    def _get_fallback_result(self) -> Dict[str, Any]:
        """
        降级策略：返回默认值

        子类可以覆盖此方法以提供特定的降级逻辑
        """
        return {
            "score": 5,
            "advice": "AI 分析服务暂时不可用",
            "reasoning": "LLM 调用失败，使用默认评分"
        }

    @abstractmethod
    def analyze(self, data: Any) -> Any:
        """
        抽象方法：执行分析

        子类必须实现此方法

        Args:
            data: 输入数据

        Returns:
            分析结果
        """
        pass

    def batch_analyze(self, data_list: list[Any]) -> list[Any]:
        """
        批量分析（串行）

        子类可以覆盖此方法以实现并行处理

        Args:
            data_list: 输入数据列表

        Returns:
            分析结果列表
        """
        results = []
        for data in data_list:
            try:
                result = self.analyze(data)
                results.append(result)
            except Exception as e:
                print(f"[{self.__class__.__name__}] 单项分析失败: {e}")
                results.append(self._get_fallback_result())
        return results
