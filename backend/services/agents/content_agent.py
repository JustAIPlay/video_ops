# -*- coding: utf-8 -*-
"""
ContentQualityAgent - 视频内容层分析 Agent
负责单个视频的质量评分和优化建议
"""
from typing import Dict, Any
from .base_agent import BaseAgent
from prompts.content_prompts import VIDEO_ANALYSIS_PROMPT


class ContentQualityAgent(BaseAgent):
    """
    视频内容质量分析 Agent

    功能：
    - 分析单个视频的内容质量
    - 评估发布时机合理性
    - 计算病毒传播潜力
    - 给出优化建议
    """

    def analyze(self, video_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        分析单个视频

        Args:
            video_data: 视频数据字典，包含：
                - video_id: 视频ID
                - title: 标题
                - description: 描述
                - views: 浏览量
                - account_name: 账号名
                - group_name: 分组名（可选）
                - publish_time: 发布时间（可选）

        Returns:
            分析结果字典，包含：
                - overall_score: 综合评分 (1-10)
                - dimension_scores: 各维度评分
                - grade: 评级 (S/A/B/C)
                - optimization_advice: 优化建议
                - reasoning: 分析理由
                - suggested_publish_time: 建议发布时间
                - viral_index: 病毒指数 (0-100)
        """
        # 构建 prompt
        prompt = self._build_prompt(video_data)

        # 调用 LLM
        result = self._call_llm(prompt, response_format="json")

        # 添加 video_id
        result["video_id"] = video_data.get("video_id", "")

        return result

    def batch_analyze(self, videos_data: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
        """
        批量分析视频（串行）

        Args:
            videos_data: 视频数据列表

        Returns:
            分析结果列表
        """
        results = []
        for video_data in videos_data:
            try:
                result = self.analyze(video_data)
                results.append(result)
            except Exception as e:
                print(f"[ContentQualityAgent] 分析视频 {video_data.get('video_id')} 失败: {e}")
                # 降级结果
                results.append({
                    "video_id": video_data.get("video_id", ""),
                    "overall_score": 5,
                    "dimension_scores": {},
                    "grade": "C",
                    "optimization_advice": "分析失败，请重试",
                    "reasoning": f"错误: {str(e)}",
                    "suggested_publish_time": None,
                    "viral_index": 0
                })
        return results

    def _build_prompt(self, video_data: Dict[str, Any]) -> str:
        """
        构建视频分析提示词

        Args:
            video_data: 视频数据

        Returns:
            完整的提示词字符串
        """
        return VIDEO_ANALYSIS_PROMPT.format(
            title=video_data.get("title", ""),
            description=video_data.get("description", ""),
            views=video_data.get("views", 0),
            account_name=video_data.get("account_name", ""),
            group_name=video_data.get("group_name", "未知")
        )

    def _get_fallback_result(self) -> Dict[str, Any]:
        """
        降级策略：返回默认值
        """
        return {
            "overall_score": 5,
            "dimension_scores": {
                "content_quality": 5,
                "timing": 5,
                "account_fit": 5
            },
            "grade": "C",
            "optimization_advice": "AI 分析服务暂时不可用",
            "reasoning": "LLM 调用失败，使用默认评分",
            "suggested_publish_time": None,
            "viral_index": 0
        }


# 便捷函数
def create_content_agent() -> ContentQualityAgent:
    """
    创建 ContentQualityAgent 实例

    Returns:
        ContentQualityAgent 实例
    """
    return ContentQualityAgent()


# 测试代码
if __name__ == "__main__":
    agent = create_content_agent()

    # 测试数据
    test_video = {
        "video_id": "test001",
        "title": "绿植养护小技巧，让家里充满生机",
        "description": "分享3个简单的绿植养护技巧，让你的植物长得更好",
        "views": 5420,
        "account_name": "绿植小达人",
        "group_name": "ai绿植"
    }

    print("\n" + "="*60)
    print("测试 ContentQualityAgent")
    print("="*60 + "\n")

    result = agent.analyze(test_video)

    print(f"视频 ID: {result['video_id']}")
    print(f"综合评分: {result['overall_score']}/10")
    print(f"评级: {result['grade']}")
    print(f"维度评分: {result['dimension_scores']}")
    print(f"病毒指数: {result['viral_index']}")
    print(f"优化建议: {result['optimization_advice']}")
    print(f"分析理由: {result['reasoning']}")
    if result.get('suggested_publish_time'):
        print(f"建议发布时间: {result['suggested_publish_time']}")
