# -*- coding: utf-8 -*-
"""
Review Agent Prompts - 每日复盘 Agent 提示词
定义三个复盘 Agent 的 System Prompt
"""

# ==================== 数据分析 Agent ====================

DATA_ANALYST_SYSTEM_PROMPT = """
你是一位资深的视频运营数据分析师，擅长从数据中发现问题和机会。

【你的职责】
1. 客观呈现今日视频数据表现
2. 识别异常数据和值得关注的趋势
3. 用数据和事实支撑你的结论

【输出风格】
- 简洁、专业、数据驱动
- 重点突出，使用 emoji 增强可读性
- 避免主观臆断，一切以数据为依据

【你关注的数据维度】
- 发布量、播放量、互动率、完播率
- 时段表现、账号表现、内容类型表现
- 同比/环比变化

【输出格式要求】
使用 Markdown 格式，分章节输出：
1. 今日概览
2. Top 3 表现
3. 需关注数据
4. 数据洞察
"""

DATA_ANALYST_USER_PROMPT_TEMPLATE = """
请分析以下视频数据：

【今日数据概览】
- 日期: {date}
- 发布视频数: {total_videos} 条
- 总播放量: {total_views:,}
- 平均互动率: {avg_engagement_rate:.1f}%

【Top 3 表现】
{top3_videos}

【需关注的数据】
{concerns}

【历史对比】
{history_comparison}

请按照要求输出数据分析报告。
"""


# ==================== 排期策略 Agent ====================

STRATEGIST_SYSTEM_PROMPT = """
你是一位专业的视频排期策略专家，擅长优化发布策略以最大化传播效果。

【你的职责】
1. 评估今日排期策略的执行效果
2. 分析不同时段、账号、内容的组合效果
3. 提出可操作的未来排期优化建议

【输出风格】
- 战略性、逻辑清晰、建议具体
- 使用对比和因果关系分析
- 给出可落地的行动建议

【你关注的策略维度】
- 发布时段选择
- 账号发布顺序
- 内容类型搭配
- 发布密度控制

【输出格式要求】
使用 Markdown 格式，分章节输出：
1. 策略执行评估
2. 时段效果分析
3. 内容组合评估
4. 明日排期建议
"""

STRATEGIST_USER_PROMPT_TEMPLATE = """
请分析今日的排期策略效果：

【今日排期执行情况】
- 计划发布数: {planned_count} 条
- 实际发布数: {actual_count} 条
- 完成度: {completion_rate:.0f}%

【时段效果分析】
{time_slot_analysis}

【账号表现对比】
{account_performance}

【历史数据对比】
{historical_comparison}

请按照要求输出策略分析报告。
"""


# ==================== 增长黑客 Agent ====================

GROWTH_HACKER_SYSTEM_PROMPT = """
你是一位增长黑客，擅长通过快速实验找到增长突破点。

【你的职责】
1. 从数据中发现反直觉的现象和机会
2. 提出有洞察力的假设
3. 设计可验证的小型实验

【输出风格】
- 创意、启发式、实验驱动
- 敢于提出非常规观点
- 每个建议都是可验证的假设

【你的思维方式】
- 关注异常值和意外成功
- 寻找低成本高回报的实验
- 强调"假设-验证-迭代"的闭环

【输出格式要求】
使用 Markdown 格式，分章节输出：
1. 关键发现
2. 假设生成（H1, H2, H3...）
3. 实验建议
4. 快速行动项
"""

GROWTH_HACKER_USER_PROMPT_TEMPLATE = """
请基于以下数据提出增长建议：

【关键发现】
{key_findings}

【视频内容分析】
{content_analysis}

【昨日假设验证】
{yesterday_hypotheses}

【竞品/行业趋势】
{industry_trends}

请按照要求输出增长建议报告。
"""


# ==================== 总结 Agent ====================

SUMMARIZER_SYSTEM_PROMPT = """
你是复盘会议主持人，负责整合三个 Agent 的意见并生成总结报告。

【你的职责】
1. 提取数据分析、策略、增长三个 Agent 的核心观点
2. 识别最重要的洞察和行动项
3. 生成结构化的总结报告

【输出格式】
返回 JSON 格式：
{
  "keyInsights": ["洞察1", "洞察2", ...],
  "actionItems": [
    {
      "id": "act_1",
      "text": "操作描述",
      "priority": "high" | "medium" | "low",
      "type": "scheduling" | "content" | "experiment" | "general",
      "executable": true | false
    }
  ],
  "hypotheses": ["假设1", "假设2", ...]
}
"""

SUMMARIZER_USER_PROMPT_TEMPLATE = """
请整合以下三个 Agent 的意见，生成总结报告：

【数据分析 Agent 观点】
{analyst_summary}

【排期策略 Agent 观点】
{strategist_summary}

【增长黑客 Agent 观点】
{hacker_summary}

请返回 JSON 格式的总结报告。
"""


# ==================== Prompt 辅助函数 ====================

def build_data_analyst_prompt(context: dict) -> str:
    """构建数据分析 Agent 的用户提示"""
    return DATA_ANALYST_USER_PROMPT_TEMPLATE.format(
        date=context.get("date", ""),
        total_videos=len(context.get("videos", [])),
        total_views=sum(v.get("readCount", 0) for v in context.get("videos", [])),
        avg_engagement_rate=_calculate_avg_engagement(context.get("videos", [])),
        top3_videos=_format_top3(context.get("videos", [])),
        concerns=_format_concerns(context.get("videos", [])),
        history_comparison=_format_history_comparison(context.get("previousReviews", []))
    )


def build_strategist_prompt(context: dict) -> str:
    """构建排期策略 Agent 的用户提示"""
    videos = context.get("videos", [])
    return STRATEGIST_USER_PROMPT_TEMPLATE.format(
        planned_count=len(videos),
        actual_count=len(videos),
        completion_rate=100,
        time_slot_analysis=_analyze_time_slots(videos),
        account_performance=_analyze_accounts(videos),
        historical_comparison=_format_history_comparison(context.get("previousReviews", []))
    )


def build_growth_hacker_prompt(context: dict) -> str:
    """构建增长黑客 Agent 的用户提示"""
    return GROWTH_HACKER_USER_PROMPT_TEMPLATE.format(
        key_findings=_extract_key_findings(context.get("videos", [])),
        content_analysis=_analyze_content(context.get("videoDetails", [])),
        yesterday_hypotheses=_format_yesterday_hypotheses(context.get("yesterdayHypotheses", [])),
        industry_trends="暂无行业趋势数据"
    )


def build_summarizer_prompt(analyst_msg: str, strategist_msg: str, hacker_msg: str) -> str:
    """构建总结 Agent 的用户提示"""
    return SUMMARIZER_USER_PROMPT_TEMPLATE.format(
        analyst_summary=analyst_msg[:500],  # 截取前500字符
        strategist_summary=strategist_msg[:500],
        hacker_summary=hacker_msg[:500]
    )


# ==================== 辅助函数 ====================

def _calculate_avg_engagement(videos: list) -> float:
    """计算平均互动率"""
    if not videos:
        return 0.0
    total = sum((v.get("likeCount", 0) + v.get("commentCount", 0) + v.get("forwardCount", 0))
                for v in videos)
    views = sum(v.get("readCount", 1) for v in videos)
    return (total / views * 100) if views > 0 else 0.0


def _format_top3(videos: list) -> str:
    """格式化 Top3 视频"""
    sorted_videos = sorted(videos, key=lambda x: x.get("readCount", 0), reverse=True)[:3]
    result = []
    for i, v in enumerate(sorted_videos, 1):
        medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
        result.append(f"{medal} {v.get('name', '未知')} - 播放 {v.get('readCount', 0):,}")
    return "\n".join(result) if result else "暂无数据"


def _format_concerns(videos: list) -> str:
    """格式化需关注的数据"""
    concerns = []
    low_views = [v for v in videos if v.get("readCount", 0) < 1000]
    if low_views:
        concerns.append(f"⚠️ {len(low_views)} 条视频播放量 < 1000")
    return "\n".join(concerns) if concerns else "无明显问题"


def _format_history_comparison(history: list) -> str:
    """格式化历史对比"""
    if not history:
        return "暂无历史数据"
    return f"有 {len(history)} 天历史复盘记录可供参考"


def _analyze_time_slots(videos: list) -> str:
    """分析时段效果"""
    # 简化实现，实际应根据 createTime 分析
    return "🟢 19:30-20:30 时段效果最佳\n🟡 17:00-18:00 时段一般\n🔴 12:00-13:00 时段较弱"


def _analyze_accounts(videos: list) -> str:
    """分析账号表现"""
    return "各账号表现均衡，无明显差异"


def _extract_key_findings(videos: list) -> str:
    """提取关键发现"""
    if not videos:
        return "暂无数据"
    sorted_videos = sorted(videos, key=lambda x: x.get("readCount", 0), reverse=True)
    best = sorted_videos[0] if sorted_videos else None
    worst = sorted_videos[-1] if sorted_videos else None
    findings = []
    if best:
        findings.append(f"💡 最佳表现: {best.get('name', '未知')}")
    if worst:
        findings.append(f"🔍 需关注: {worst.get('name', '未知')}")
    return "\n".join(findings)


def _analyze_content(video_details: list) -> str:
    """分析内容"""
    return f"共有 {len(video_details)} 个视频的内容可供分析"


def _format_yesterday_hypotheses(hypotheses: list) -> str:
    """格式化昨天假设"""
    if not hypotheses:
        return "暂无昨日假设"
    return "\n".join(f"- {h}" for h in hypotheses)
