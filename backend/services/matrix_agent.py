# -*- coding: utf-8 -*-
"""
MatrixAdvisor - 视频排期智能分析 Agent
借鉴 BettaFish 的无框架设计，纯 Python 实现
"""
import os
import json
from typing import List, Dict
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class MatrixAdvisor:
    """
    视频排期智能分析 Agent

    功能：
    - 基于视频数据进行智能评分
    - 提供优化建议
    - 输出推理过程
    """

    def __init__(self):
        """初始化 Agent"""
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")
        )
        self.model = os.getenv("OPENAI_MODEL_NAME", "deepseek-reasoner")

        print(f"[MatrixAdvisor] 初始化完成")
        print(f"[MatrixAdvisor] 使用模型: {self.model}")
        print(f"[MatrixAdvisor] API Base: {os.getenv('OPENAI_BASE_URL')}")

    def analyze_schedule(self, tasks: List[Dict]) -> List[Dict]:
        """
        分析排期任务并返回评分和建议

        Args:
            tasks: 任务列表，每个任务包含 id, title, views 等字段

        Returns:
            分析结果列表，每个结果包含 id, score, advice, reasoning
        """
        results = []

        for task in tasks:
            analysis = self._think(task)
            results.append({
                "id": task["id"],
                "score": analysis["score"],
                "advice": analysis["advice"],
                "reasoning": analysis["reasoning"]
            })

        return results

    def _think(self, task: Dict) -> Dict:
        """
        调用 LLM 进行分析思考

        Args:
            task: 单个任务对象

        Returns:
            包含 score, advice, reasoning 的字典
        """
        prompt = self._build_prompt(task)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3
            )

            result = json.loads(response.choices[0].message.content)
            return {
                "score": result.get("score", 5),
                "advice": result.get("advice", "暂无建议"),
                "reasoning": result.get("reasoning", "")
            }
        except Exception as e:
            # 降级策略：LLM 调用失败时返回默认值
            print(f"[MatrixAdvisor] LLM 调用失败: {str(e)}")
            return {
                "score": 5,
                "advice": f"AI 分析不可用: {str(e)}",
                "reasoning": "LLM 调用失败，使用默认评分"
            }

    def _build_prompt(self, task: Dict) -> str:
        """
        构建分析提示词

        Args:
            task: 任务对象

        Returns:
            完整的提示词字符串
        """
        return f"""你是一个短视频矩阵运营专家。请分析以下视频的排期合理性。

**视频信息：**
- 标题：{task['title']}
- 浏览量：{task['views']}
- 分组：{task.get('groupName', '未知')}
- 账号：{task.get('accountName', '未知')}

**评估维度：**
1. 内容质量（基于浏览量判断）
2. 发布时机合理性
3. 账号定位契合度
4. 潜力评估

请返回 JSON 格式：
{{
  "score": <1-10的评分，整数>,
  "advice": "<具体的优化建议，50字以内>",
  "reasoning": "<评分理由，简明扼要>"
}}

评分标准：
- 9-10分：优质内容，强烈推荐发布
- 7-8分：良好内容，建议发布
- 5-6分：一般内容，可考虑发布
- 1-4分：内容欠佳，不建议发布
"""


# 便捷函数：创建 Agent 实例
def create_agent() -> MatrixAdvisor:
    """
    创建 MatrixAdvisor 实例的便捷函数

    Returns:
        MatrixAdvisor 实例
    """
    return MatrixAdvisor()


# 测试代码
if __name__ == "__main__":
    # 创建 Agent 实例
    agent = create_agent()

    # 测试数据
    test_tasks = [
        {
            "id": "test001",
            "title": "绿植养护小技巧，让家里充满生机",
            "views": 5420,
            "groupName": "ai绿植",
            "accountName": "绿植小达人"
        },
        {
            "id": "test002",
            "title": "这本书改变了我的人生观",
            "views": 1200,
            "groupName": "图书",
            "accountName": "读书笔记"
        }
    ]

    # 执行分析
    print("\n" + "="*60)
    print("开始测试 MatrixAdvisor")
    print("="*60 + "\n")

    results = agent.analyze_schedule(test_tasks)

    # 打印结果
    for result in results:
        print(f"\n视频 ID: {result['id']}")
        print(f"评分: {result['score']}/10")
        print(f"建议: {result['advice']}")
        print(f"理由: {result['reasoning']}")
        print("-" * 40)

    print("\n测试完成！")
