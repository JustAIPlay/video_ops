# -*- coding: utf-8 -*-
"""
Feishu Data Service - 飞书数据获取服务
从飞书获取视频数据，支持按日期筛选
"""
import os
import logging
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class FeishuDataService:
    """飞书数据服务"""

    def __init__(self):
        """初始化服务"""
        self.app_id = os.getenv("LARK_APP_ID")
        self.app_secret = os.getenv("LARK_APP_SECRET")
        self._token = None
        self._token_expires_at = 0

    async def get_today_videos(self, target_date: Optional[str] = None, use_env_config: bool = False) -> List[Dict[str, Any]]:
        """
        获取指定日期发布的视频数据（从所有账号）

        Args:
            target_date: 目标日期，格式 YYYY-MM-DD，默认为今天

        Returns:
            视频数据列表
        """
        if target_date is None:
            target_date = date.today().isoformat()

        logger.info(f"[Feishu] 获取 {target_date} 的视频数据")

        try:
            # 导入飞书读取服务
            from services.feishu_video_reader import get_feishu_reader
            from constants.feishu_config import get_account_table_mapping

            reader = get_feishu_reader()
            account_mapping = get_account_table_mapping()

            all_videos = []

            # 遍历所有账号配置
            for group_name, table_config in account_mapping.items():
                base_token = table_config.get("baseToken", "")
                table_id = table_config.get("tableId", "")
                account_field = table_config.get("accountField", "账号名称")

                if not base_token or not table_id:
                    logger.warning(f"[Feishu] 跳过无效配置: {group_name}")
                    continue

                logger.info(f"[Feishu] 读取分组: {group_name}")

                try:
                    # 从飞书获取该分组的视频数据
                    videos = await reader.get_videos_by_date(
                        base_token=base_token,
                        table_id=table_id,
                        target_date=target_date,
                        account_field=account_field
                    )

                    # 添加账号信息
                    for video in videos:
                        video["groupName"] = group_name

                    all_videos.extend(videos)
                    logger.info(f"[Feishu] {group_name} 获取到 {len(videos)} 条视频")

                except Exception as e:
                    logger.error(f"[Feishu] 读取 {group_name} 失败: {e}")
                    continue

            logger.info(f"[Feishu] 总共获取到 {len(all_videos)} 条视频")

            # 如果没有获取到真实数据，返回 Mock 数据作为降级
            if not all_videos:
                logger.warning("[Feishu] 未获取到真实数据，使用 Mock 数据")
                return self._get_mock_videos(target_date)

            return all_videos

        except Exception as e:
            logger.error(f"[Feishu] 获取视频数据失败: {e}")
            import traceback
            traceback.print_exc()
            # 降级到 Mock 数据
            return self._get_mock_videos(target_date)

    async def get_videos_with_config(self, target_date: str, feishu_config: dict) -> List[Dict[str, Any]]:
        """
        使用前端传递的配置获取视频数据

        Args:
            target_date: 目标日期 YYYY-MM-DD
            feishu_config: 前端传递的飞书配置

        Returns:
            视频数据列表
        """
        if target_date is None:
            target_date = date.today().isoformat()

        logger.info(f"[Feishu] 使用前端配置获取 {target_date} 的视频数据")
        logger.info(f"[Feishu] feishu_config: {feishu_config}")

        try:
            from services.feishu_video_reader import FeishuVideoDataReader

            # 使用前端传递的 app_id 和 app_secret 创建 reader
            app_id = feishu_config.get("feishuAppId", "")
            app_secret = feishu_config.get("feishuAppSecret", "")

            if not app_id or not app_secret:
                logger.warning("[Feishu] 前端配置中缺少 feishuAppId 或 feishuAppSecret")
                return self._get_mock_videos(target_date)

            logger.info(f"[Feishu] 使用前端凭据创建 reader: {app_id[:10]}...")

            reader = FeishuVideoDataReader(app_id, app_secret)
            account_mapping = feishu_config.get("accountTableMapping", {})
            logger.info(f"[Feishu] account_table_mapping: {account_mapping}")
            logger.info(f"[Feishu] mapping 数量: {len(account_mapping)}")

            all_videos = []

            # 遍历所有账号配置
            for group_name, table_config in account_mapping.items():
                base_token = table_config.get("baseToken", "")
                table_id = table_config.get("tableId", "")
                account_field = table_config.get("accountField", "账号名称")

                if not base_token or not table_id:
                    logger.warning(f"[Feishu] 跳过无效配置: {group_name}")
                    continue

                logger.info(f"[Feishu] 读取分组: {group_name}")

                try:
                    # 从飞书获取该分组的视频数据
                    videos = await reader.get_videos_by_date(
                        base_token=base_token,
                        table_id=table_id,
                        target_date=target_date,
                        account_field=account_field
                    )

                    # 添加账号信息
                    for video in videos:
                        video["groupName"] = group_name

                    all_videos.extend(videos)
                    logger.info(f"[Feishu] {group_name} 获取到 {len(videos)} 条视频")

                except Exception as e:
                    logger.error(f"[Feishu] 读取 {group_name} 失败: {e}")
                    continue

            logger.info(f"[Feishu] 总共获取到 {len(all_videos)} 条视频")

            # 如果没有获取到真实数据，返回 Mock 数据作为降级
            if not all_videos:
                logger.warning("[Feishu] 未获取到真实数据，使用 Mock 数据")
                return self._get_mock_videos(target_date)

            return all_videos

        except Exception as e:
            logger.error(f"[Feishu] 获取视频数据失败: {e}")
            import traceback
            traceback.print_exc()
            # 降级到 Mock 数据
            return self._get_mock_videos(target_date)

    def _get_mock_videos(self, target_date: str) -> List[Dict[str, Any]]:
        """
        获取 Mock 视频数据（用于开发测试）

        实际部署时需要替换为真实的飞书 API 调用
        """
        # 解析日期
        try:
            dt = datetime.strptime(target_date, "%Y-%m-%d")
            day_of_week = dt.weekday()  # 0=周一, 6=周日
        except:
            day_of_week = 0

        # 根据星期几生成不同的数据，模拟真实变化
        base_views = 5000 + day_of_week * 1000

        mock_videos = [
            {
                "name": "AI图书推荐-高效学习法",
                "account": "ai图书",
                "readCount": base_views + 3450,
                "likeCount": 320,
                "commentCount": 45,
                "forwardCount": 120,
                "fullPlayRate": "85.50%",
                "avgPlayTimeSec": "15.30秒",
                "publishTime": "19:30",
                "aiAnalysis": {
                    "overall_score": 8.2,
                    "dimension_scores": {
                        "content_quality": 8.5,
                        "timing": 9.0,
                        "engagement": 7.5,
                        "viral_potential": 7.8
                    },
                    "optimization_advice": "内容质量优秀，建议继续保持",
                    "reasoning": "标题吸引目标用户，内容结构清晰",
                    "suggested_publish_time": "19:30",
                    "viral_index": 0.75,
                    "grade": "A"
                },
                "tags": ["AI", "图书", "学习"],
                "createTime": f"{target_date} 19:30"
            },
            {
                "name": "10分钟掌握ChatGPT",
                "account": "ai图书",
                "readCount": base_views + 1780,
                "likeCount": 280,
                "commentCount": 38,
                "forwardCount": 95,
                "fullPlayRate": "78.20%",
                "avgPlayTimeSec": "12.50秒",
                "publishTime": "20:00",
                "aiAnalysis": {
                    "overall_score": 7.5,
                    "dimension_scores": {
                        "content_quality": 8.0,
                        "timing": 7.5,
                        "engagement": 7.0,
                        "viral_potential": 7.5
                    },
                    "optimization_advice": "建议在前3秒增加更多视觉冲击",
                    "reasoning": "内容实用，但开篇吸引力有提升空间",
                    "suggested_publish_time": "19:45",
                    "viral_index": 0.68,
                    "grade": "A"
                },
                "tags": ["ChatGPT", "教程", "AI"],
                "createTime": f"{target_date} 20:00"
            },
            {
                "name": "Python入门实战教程",
                "account": "Python教程",
                "readCount": base_views + 620,
                "likeCount": 150,
                "commentCount": 22,
                "forwardCount": 45,
                "fullPlayRate": "72.30%",
                "avgPlayTimeSec": "18.20秒",
                "publishTime": "19:00",
                "aiAnalysis": {
                    "overall_score": 6.8,
                    "dimension_scores": {
                        "content_quality": 7.5,
                        "timing": 6.0,
                        "engagement": 6.5,
                        "viral_potential": 7.0
                    },
                    "optimization_advice": "发布时间偏早，建议调整到19:30后",
                    "reasoning": "内容质量不错，但时段流量较低",
                    "suggested_publish_time": "19:45",
                    "viral_index": 0.55,
                    "grade": "B"
                },
                "tags": ["Python", "编程", "入门"],
                "createTime": f"{target_date} 19:00"
            },
            {
                "name": "职场Excel技巧分享",
                "account": "办公软件",
                "readCount": base_views - 500,
                "likeCount": 85,
                "commentCount": 12,
                "forwardCount": 28,
                "fullPlayRate": "65.40%",
                "avgPlayTimeSec": "10.10秒",
                "publishTime": "18:00",
                "aiAnalysis": {
                    "overall_score": 5.5,
                    "dimension_scores": {
                        "content_quality": 6.0,
                        "timing": 4.5,
                        "engagement": 5.5,
                        "viral_potential": 6.0
                    },
                    "optimization_advice": "发布时间过早，且内容缺乏亮点",
                    "reasoning": "时段不佳，内容同质化严重",
                    "suggested_publish_time": "20:15",
                    "viral_index": 0.42,
                    "grade": "C"
                },
                "tags": ["Excel", "职场", "办公"],
                "createTime": f"{target_date} 18:00"
            },
            {
                "name": "Midjourney进阶教程",
                "account": "AI绘画",
                "readCount": base_views + 4200,
                "likeCount": 380,
                "commentCount": 52,
                "forwardCount": 145,
                "fullPlayRate": "88.70%",
                "avgPlayTimeSec": "22.40秒",
                "publishTime": "21:00",
                "aiAnalysis": {
                    "overall_score": 9.1,
                    "dimension_scores": {
                        "content_quality": 9.5,
                        "timing": 8.5,
                        "engagement": 9.0,
                        "viral_potential": 9.5
                    },
                    "optimization_advice": "表现优秀，可作为标杆案例",
                    "reasoning": "内容前沿，视觉效果出色，发布时机精准",
                    "suggested_publish_time": "21:00",
                    "viral_index": 0.85,
                    "grade": "S"
                },
                "tags": ["Midjourney", "AI", "绘画"],
                "createTime": f"{target_date} 21:00"
            }
        ]

        logger.info(f"[Feishu] 返回 {len(mock_videos)} 条 Mock 视频数据")
        return mock_videos

    async def get_videos_by_account(
        self,
        account: str,
        target_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        获取指定账号在指定日期发布的视频

        Args:
            account: 账号名称
            target_date: 目标日期

        Returns:
            视频数据列表
        """
        all_videos = await self.get_today_videos(target_date)
        return [v for v in all_videos if v.get("account") == account]

    def calculate_summary_stats(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        计算视频数据的汇总统计

        Args:
            videos: 视频数据列表

        Returns:
            汇总统计数据
        """
        if not videos:
            return {
                "total_videos": 0,
                "total_views": 0,
                "avg_views": 0,
                "avg_engagement_rate": 0,
                "top_video": None,
                "accounts": {}
            }

        total_videos = len(videos)
        total_views = sum(v.get("readCount", 0) for v in videos)
        avg_views = total_views / total_videos if total_videos > 0 else 0

        # 计算平均互动率
        total_interactions = sum(
            v.get("likeCount", 0) + v.get("commentCount", 0) + v.get("forwardCount", 0)
            for v in videos
        )
        avg_engagement_rate = (total_interactions / total_views * 100) if total_views > 0 else 0

        # 找出最佳视频
        top_video = max(videos, key=lambda x: x.get("readCount", 0)) if videos else None

        # 按账号分组统计
        accounts = {}
        for v in videos:
            acc = v.get("account", "未知")
            if acc not in accounts:
                accounts[acc] = {
                    "count": 0,
                    "total_views": 0,
                    "videos": []
                }
            accounts[acc]["count"] += 1
            accounts[acc]["total_views"] += v.get("readCount", 0)
            accounts[acc]["videos"].append(v)

        # 计算每个账号的平均播放量
        for acc_data in accounts.values():
            acc_data["avg_views"] = acc_data["total_views"] / acc_data["count"] if acc_data["count"] > 0 else 0

        return {
            "total_videos": total_videos,
            "total_views": total_views,
            "avg_views": round(avg_views, 0),
            "avg_engagement_rate": round(avg_engagement_rate, 2),
            "top_video": top_video,
            "accounts": accounts
        }


# 全局单例
_feishu_service: Optional[FeishuDataService] = None


def get_feishu_service() -> FeishuDataService:
    """获取飞书服务单例"""
    global _feishu_service
    if _feishu_service is None:
        _feishu_service = FeishuDataService()
    return _feishu_service
