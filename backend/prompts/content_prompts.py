# -*- coding: utf-8 -*-
"""
Content Analysis Prompts
视频内容分析提示词模板
"""

# ==================== 单个视频分析提示词 ====================

VIDEO_ANALYSIS_PROMPT = """你是一个短视频矩阵运营专家，专注于视频内容质量分析和发布策略。

**视频信息：**
- 标题：{title}
- 描述：{description}
- 浏览量：{views}
- 账号：{account_name}
- 分组：{group_name}

**分析维度：**
1. **内容质量** (1-10分)：内容创意、制作水准、信息价值
2. **发布时机** (1-10分)：当前发布时机的合理性
3. **互动表现** (1-10分)：用户互动数据的表现（点赞、评论、分享）
4. **病毒潜力** (1-10分)：预测病毒传播潜力

**评级标准：**
- S级 (9-10分)：优质内容，强烈推荐立即发布
- A级 (7-8分)：良好内容，建议近期发布
- B级 (5-6分)：一般内容，可发布或优化后再发布
- C级 (1-4分)：内容欠佳，不建议发布

请返回 JSON 格式：
{{
  "overall_score": <综合评分 1-10>,
  "dimension_scores": {{
    "content_quality": <内容质量 1-10>,
    "timing": <发布时机 1-10>,
    "engagement": <互动表现 1-10>,
    "viral_potential": <病毒潜力 1-10>
  }},
  "grade": "<评级 S/A/B/C>",
  "optimization_advice": "<具体的优化建议，80字以内>",
  "reasoning": "<评分理由，简明扼要，100字以内>",
  "suggested_publish_time": "<建议发布时间，格式如'今天 20:00'，留空则表示随时可发布>",
  "viral_index": <病毒传播指数 0-1，保留3位小数>
}}

**注意事项：**
- 评分要客观公正，基于数据和分析
- viral_index 是 0-1 之间的小数（如 0.85 表示 85%）
- 建议要具体可行，有操作性
- 理由要逻辑清晰，有说服力
"""


# ==================== 按账号批量分析提示词（优化版）====================

BATCH_ANALYSIS_PROMPT = """你是一个短视频矩阵运营专家，正在分析【{account_name}】账号的 {video_count} 个视频。

**账号信息：**
- 账号名：{account_name}
- 分组：{group_name}
- 本次分析视频数：{video_count}

**视频列表（包含互动数据）：**
{videos_list}

**分析要求：**
1. 综合评估每个视频的内容质量和发布价值
2. 重点参考互动数据：浏览量、点赞、评论、分享、完播率等
3. 考虑账号定位和内容风格的连贯性
4. 识别高潜力内容（viral_index > 0.7）
5. 给出具体的优化建议和发布时机建议

**评分标准：**
- **S级** (9-10分)：优质内容，强烈推荐立即发布
- **A级** (7-8分)：良好内容，建议近期发布
- **B级** (5-6分)：一般内容，可发布或优化后再发布
- **C级** (1-4分)：内容欠佳，不建议发布

请对每个视频返回 JSON 数组格式：
[
  {{
    "video_id": "视频ID",
    "overall_score": 综合评分1-10,
    "dimension_scores": {{
      "content_quality": 内容质量1-10,
      "timing": 发布时机1-10,
      "engagement": 互动表现1-10,
      "viral_potential": 病毒潜力1-10
    }},
    "grade": "S/A/B/C",
    "optimization_advice": "具体优化建议，80字以内",
    "reasoning": "评分理由，100字以内",
    "suggested_publish_time": "建议发布时间，如'今天 20:00'，留空则随时可发布",
    "viral_index": 病毒指数0-1（保留3位小数，如0.85）
  }}
]

**注意事项：**
- 互动数据越高，说明内容越受用户欢迎，应给予更高评分
- 完播率高说明内容质量好，应重点关注
- viral_index 是 0-1 之间的小数，不是百分比（如 0.85 表示 85%）
- 同一账号的视频可以相互对比，识别出差异化优势
- 评分要客观，建议要具体可行
"""


# ==================== 视频列表格式化函数 ====================

def format_videos_list(videos_data: list) -> str:
    """
    格式化视频列表用于 prompt

    Args:
        videos_data: 视频数据列表

    Returns:
        格式化的字符串
    """
    result = []
    for i, video in enumerate(videos_data, 1):
        # 提取数据
        title = video.get("title", "无标题")
        desc = video.get("description", "")[:100]  # 限制长度

        # 互动数据
        views = video.get("views", 0)
        likes = video.get("like_count", 0)
        comments = video.get("comment_count", 0)
        shares = video.get("share_count", 0)
        favs = video.get("fav_count", 0)

        # 播放数据
        play_rate = video.get("full_play_rate", "0%")
        play_time = video.get("avg_play_time", "0秒")

        # 计算互动率（点赞+评论+分享）/浏览量
        if views > 0:
            engagement_rate = ((likes + comments + shares) / views) * 100
            engagement_str = f"{engagement_rate:.2f}%"
        else:
            engagement_str = "N/A"

        # 格式化单条视频信息
        video_str = f"""【视频 {i}】
- 标题: {title}
- 描述: {desc}
- 浏览: {views} | 点赞: {likes} | 评论: {comments} | 分享: {shares} | 收藏: {favs}
- 完播率: {play_rate} | 平均时长: {play_time}
- 互动率: {engagement_str}"""

        result.append(video_str)

    return "\n\n".join(result)
