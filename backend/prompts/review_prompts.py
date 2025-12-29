# -*- coding: utf-8 -*-
"""
Review Agent Prompts - 每日复盘 Agent 提示词
定义三个复盘 Agent 的 System Prompt
"""
import json

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
    # 如果有用户提问，直接回答问题
    if "user_question" in context:
        return f"""用户向你提问：{context['user_question']}

请根据你的专业角色（数据分析师）来回答这个问题。
- 如果问题与今日数据相关，请基于以下数据回答：
{json.dumps({k: v for k, v in context.items() if k not in ['user_question']}, ensure_ascii=False, indent=2)}
- 如果问题是一般性咨询，请以数据分析师的专业视角给出建议
"""

    # 正常的数据分析流程
    videos = context.get("videos", [])
    summary = context.get("summary", {})
    date = context.get("date", "")

    return f"""请分析以下视频数据：

【日期】{date}

【今日概览】
- 发布视频数：{len(videos)} 条
- 总播放量：{summary.get('total_views', 0):,}
- 平均播放量：{summary.get('avg_views', 0):,.0f}
- 平均互动率：{summary.get('avg_engagement_rate', 0):.2f}%

【Top 3 表现】
{_format_top3_with_account(videos)}

【按账号统计】
{_format_account_summary(summary.get('accounts', {}))}

【需关注的数据】
{_format_concerns(videos)}

【AI 评分摘要】
{_format_ai_summary(videos)}

请按照要求输出数据分析报告。
"""


def build_strategist_prompt(context: dict) -> str:
    """构建排期策略 Agent 的用户提示"""
    # 如果有用户提问，直接回答问题
    if "user_question" in context:
        return f"""用户向你提问：{context['user_question']}

请根据你的专业角色（排期策略专家）来回答这个问题。
- 如果问题与排期策略相关，请基于今日数据给出专业建议
- 如果问题是一般性咨询，请以策略专家的视角给出分析
"""

    videos = context.get("videos", [])
    summary = context.get("summary", {})
    date = context.get("date", "")

    return f"""请分析今日的排期策略效果：

【日期】{date}

【今日排期执行情况】
- 计划发布数：{len(videos)} 条
- 实际发布数：{len(videos)} 条
- 完成度：100%

【时段效果分析】
{_analyze_time_slots(videos)}

【账号表现对比】
{_format_account_performance(summary.get('accounts', {}))}

【历史数据对比】
暂无历史数据（首次运行）

请按照要求输出策略分析报告。
"""


def build_growth_hacker_prompt(context: dict) -> str:
    """构建增长黑客 Agent 的用户提示"""
    # 如果有用户提问，直接回答问题
    if "user_question" in context:
        return f"""用户向你提问：{context['user_question']}

请根据你的专业角色（增长黑客）来回答这个问题。
- 以增长黑客的思维方式回答：关注实验、假设、快速迭代
- 提出有洞察力的观点和可验证的建议
- 鼓励创新思维和非常规观点
"""

    videos = context.get("videos", [])
    date = context.get("date", "")

    return f"""请基于以下数据提出增长建议：

【日期】{date}

【关键发现】
{_extract_key_findings(videos)}

【视频AI评分分析】
{_format_ai_analysis_for_growth(videos)}

【意外表现】
{_find_unexpected_performers(videos)}

【昨日假设验证】
暂无昨日假设（首次运行）

【竞品/行业趋势】
暂无行业趋势数据

请按照要求输出增长建议报告。
"""


def build_summarizer_prompt(analyst_msg: str, strategist_msg: str, hacker_msg: str) -> str:
    """构建总结 Agent 的用户提示"""
    return SUMMARIZER_USER_PROMPT_TEMPLATE.format(
        analyst_summary=analyst_msg[:500],  # 截取前500字符
        strategist_summary=strategist_msg[:500],
        hacker_summary=hacker_msg[:500]
    )


# ==================== 辅助函数 ====================

def _format_top3_with_account(videos: list) -> str:
    """格式化 Top3 视频（带账号信息）"""
    sorted_videos = sorted(videos, key=lambda x: x.get("readCount", 0), reverse=True)[:3]
    result = []
    for i, v in enumerate(sorted_videos, 1):
        medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
        account = v.get("account", "未知")
        name = v.get("name", "未知")
        views = v.get("readCount", 0)
        ai_grade = v.get("aiAnalysis", {}).get("grade", "N/A")
        result.append(f"{medal} [{account}] {name} - 播放 {views:,} - 评级 {ai_grade}")
    return "\n".join(result) if result else "暂无数据"


def _format_account_summary(accounts: dict) -> str:
    """格式化账号汇总"""
    if not accounts:
        return "暂无账号数据"
    result = []
    for acc, data in accounts.items():
        result.append(f"- {acc}: {data['count']} 条视频, 平均播放 {data['avg_views']:,.0f}")
    return "\n".join(result)


def _format_ai_summary(videos: list) -> str:
    """格式化 AI 评分摘要"""
    if not videos:
        return "暂无 AI 评分"
    grades = {}
    for v in videos:
        grade = v.get("aiAnalysis", {}).get("grade", "N/A")
        grades[grade] = grades.get(grade, 0) + 1
    result = []
    grade_order = ["S", "A", "B", "C", "N/A"]
    for g in grade_order:
        if g in grades:
            result.append(f"{g} 级: {grades[g]} 条")
    return " | ".join(result) if result else "暂无数据"


def _format_account_performance(accounts: dict) -> str:
    """格式化账号表现对比"""
    if not accounts:
        return "各账号表现均衡，无明显差异"

    # 按平均播放量排序
    sorted_accounts = sorted(accounts.items(), key=lambda x: x[1].get("avg_views", 0), reverse=True)

    result = []
    for i, (acc, data) in enumerate(sorted_accounts, 1):
        avg_views = data.get("avg_views", 0)
        count = data.get("count", 0)
        result.append(f"{i}. {acc}: 平均 {avg_views:,.0f} 播放 ({count} 条)")
    return "\n".join(result)


def _format_ai_analysis_for_growth(videos: list) -> str:
    """为增长黑客格式化 AI 分析"""
    insights = []
    for v in videos:
        analysis = v.get("aiAnalysis", {})
        if analysis:
            grade = analysis.get("grade", "N/A")
            score = analysis.get("overall_score", 0)
            advice = analysis.get("optimization_advice", "")
            name = v.get("name", "未知")
            insights.append(f"- {name} (评分 {score:.1f}/{grade}): {advice}")
    return "\n".join(insights) if insights else "暂无 AI 分析"


def _find_unexpected_performers(videos: list) -> str:
    """发现意外表现的视频"""
    if len(videos) < 2:
        return "数据不足，无法分析"

    # 计算平均播放量
    avg_views = sum(v.get("readCount", 0) for v in videos) / len(videos)

    unexpected = []
    for v in videos:
        views = v.get("readCount", 0)
        grade = v.get("aiAnalysis", {}).get("grade", "N/A")
        # 评分低但播放高，或评分高但播放低
        if grade in ["C", "B"] and views > avg_views * 1.2:
            unexpected.append(f"💡 意外成功: {v.get('name', '未知')} (评分 {grade}, 播放 {views:,})")
        elif grade in ["S", "A"] and views < avg_views * 0.8:
            unexpected.append(f"🔍 需关注: {v.get('name', '未知')} (评分 {grade}, 播放 {views:,})")

    return "\n".join(unexpected) if unexpected else "无明显异常"


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
