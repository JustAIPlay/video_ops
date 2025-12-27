# -*- coding: utf-8 -*-
"""
ContentQualityAgent - 视频内容层分析 Agent（批量优化版）
负责按账号批量分析视频质量
"""
from typing import Dict, Any, List
from collections import defaultdict
from .base_agent import BaseAgent
from prompts.content_prompts import VIDEO_ANALYSIS_PROMPT, BATCH_ANALYSIS_PROMPT, format_videos_list


class ContentQualityAgent(BaseAgent):
    """
    视频内容质量分析 Agent（批量优化版）

    功能：
    - 按账号分组批量分析视频
    - 评估发布时机合理性
    - 计算病毒传播潜力
    - 给出优化建议
    """

    # 每批最多分析的视频数（防止 token 超限）
    MAX_BATCH_SIZE = 20

    def analyze(self, video_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        分析单个视频（兼容旧接口）

        Args:
            video_data: 视频数据字典

        Returns:
            分析结果字典
        """
        # 构建 prompt
        prompt = self._build_prompt(video_data)

        # 调用 LLM
        result = self._call_llm(prompt, response_format="json")

        # 添加 video_id
        result["video_id"] = video_data.get("video_id", "")

        return result

    def batch_analyze(self, videos_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        按账号批量分析视频（优化版）

        流程：
        1. 按账号分组
        2. 每组按 MAX_BATCH_SIZE 分批
        3. 批量调用 LLM 分析

        Args:
            videos_data: 视频数据列表

        Returns:
            分析结果列表
        """
        if not videos_data:
            return []

        # 1. 按账号分组
        account_groups = defaultdict(list)
        for video in videos_data:
            account = video.get("account_name", "unknown")
            account_groups[account].append(video)

        print(f"[ContentQualityAgent] 按账号分组: {len(account_groups)} 个账号")
        for account, videos in account_groups.items():
            print(f"  - {account}: {len(videos)} 个视频")

        # 2. 每组分批分析
        all_results = []
        for account, videos in account_groups.items():
            print(f"\n[ContentQualityAgent] 开始分析账号: {account}")

            # 按批次大小分组
            for i in range(0, len(videos), self.MAX_BATCH_SIZE):
                batch = videos[i:i + self.MAX_BATCH_SIZE]
                batch_num = i // self.MAX_BATCH_SIZE + 1
                total_batches = (len(videos) + self.MAX_BATCH_SIZE - 1) // self.MAX_BATCH_SIZE

                print(f"  批次 {batch_num}/{total_batches}: {len(batch)} 个视频")

                try:
                    batch_results = self._analyze_batch(batch, account)
                    all_results.extend(batch_results)
                    print(f"    完成 {len(batch_results)} 个视频分析")
                except Exception as e:
                    print(f"    批次分析失败: {e}")
                    # 降级：逐个分析
                    for video in batch:
                        try:
                            result = self.analyze(video)
                            all_results.append(result)
                        except Exception as e2:
                            print(f"      视频 {video.get('video_id')} 分析失败: {e2}")
                            all_results.append(self._get_fallback_result(video.get("video_id", "")))

        print(f"\n[ContentQualityAgent] 分析完成: 共 {len(all_results)} 个视频")
        return all_results

    def _analyze_batch(self, videos: List[Dict[str, Any]], account_name: str) -> List[Dict[str, Any]]:
        """
        批量分析同一账号的视频

        Args:
            videos: 视频数据列表
            account_name: 账号名

        Returns:
            分析结果列表
        """
        # 获取分组名（从第一个视频中获取）
        group_name = videos[0].get("group_name", "未知")

        # 格式化视频列表
        videos_list = format_videos_list(videos)

        # 构建批量分析 prompt
        prompt = BATCH_ANALYSIS_PROMPT.format(
            account_name=account_name,
            group_name=group_name,
            video_count=len(videos),
            videos_list=videos_list
        )

        # 调用 LLM（期望返回 JSON 数组）
        response = self._call_llm(prompt, response_format="json")

        # 确保返回的是列表
        if isinstance(response, list):
            results = response
        elif isinstance(response, dict) and "results" in response:
            results = response["results"]
        else:
            raise ValueError(f"Unexpected response format: {type(response)}")

        # 添加 video_id（确保与输入对应）
        for i, result in enumerate(results):
            if i < len(videos):
                result["video_id"] = videos[i].get("video_id", "")

        return results

    def _build_prompt(self, video_data: Dict[str, Any]) -> str:
        """
        构建单个视频分析提示词（兼容旧接口）

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

    def _get_fallback_result(self, video_id: str = "") -> Dict[str, Any]:
        """
        降级策略：返回默认值
        """
        return {
            "video_id": video_id,
            "overall_score": 5,
            "dimension_scores": {
                "content_quality": 5,
                "timing": 5,
                "engagement": 5,
                "viral_potential": 5
            },
            "grade": "C",
            "optimization_advice": "AI 分析服务暂时不可用",
            "reasoning": "LLM 调用失败，使用默认评分",
            "suggested_publish_time": None,
            "viral_index": 0.0
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

    # 测试数据：模拟 18 个账号，每个账号 10-35 个视频
    test_videos = []
    for account_idx in range(3):  # 测试 3 个账号
        account_name = f"测试账号{account_idx + 1}"
        for video_idx in range(15):  # 每个账号 15 个视频
            test_videos.append({
                "video_id": f"{account_name}_video_{video_idx}",
                "title": f"视频标题 {video_idx + 1}",
                "description": f"这是第 {video_idx + 1} 个视频的描述内容",
                "views": 1000 + video_idx * 100,
                "account_name": account_name,
                "group_name": "测试分组",
                "like_count": 50 + video_idx * 10,
                "comment_count": 10 + video_idx * 2,
                "share_count": 5 + video_idx,
                "full_play_rate": f"{80 + video_idx}%",
                "avg_play_time": f"{10 + video_idx}秒"
            })

    print("\n" + "=" * 60)
    print("测试 ContentQualityAgent 批量分析")
    print("=" * 60)
    print(f"总视频数: {len(test_videos)}")
    print(f"预期批次数: ~2-3 批（按账号分组，每批最多 20 个）\n")

    results = agent.batch_analyze(test_videos)

    print(f"\n分析结果数: {len(results)}")
    for result in results[:3]:  # 只显示前 3 个
        print(f"\n视频: {result['video_id']}")
        print(f"  评分: {result['overall_score']}/10 ({result['grade']})")
        print(f"  病毒指数: {result['viral_index']}")
        print(f"  建议: {result['optimization_advice']}")
