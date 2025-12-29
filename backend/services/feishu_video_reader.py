# -*- coding: utf-8 -*-
"""
Feishu Video Data Reader - 飞书视频数据读取服务
从飞书多维表格读取视频数据，支持按日期筛选
参考 feishu_writer.py 的实现方式
"""
import os
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from lark_oapi.api.bitable.v1 import *
from lark_oapi import *

load_dotenv()

logger = logging.getLogger(__name__)


class FeishuVideoDataReader:
    """飞书视频数据读取服务"""

    def __init__(self, app_id: str, app_secret: str):
        """
        初始化服务

        Args:
            app_id: 飞书应用 ID
            app_secret: 飞书应用密钥
        """
        self.app_id = app_id
        self.app_secret = app_secret
        self.client = self._create_client()

    def _create_client(self) -> Client:
        """创建飞书 API 客户端（SDK 会自动处理 token）"""
        return Client.builder() \
            .app_id(self.app_id) \
            .app_secret(self.app_secret) \
            .build()

    async def get_videos_by_date(
        self,
        base_token: str,
        table_id: str,
        target_date: str,
        account_field: str = "账号名称"
    ) -> List[Dict[str, Any]]:
        """
        获取指定日期发布的视频

        Args:
            base_token: 飞书 Base token (实际是 app_token)
            table_id: 数据表 ID
            target_date: 目标日期 YYYY-MM-DD
            account_field: 账号字段名

        Returns:
            视频数据列表
        """
        try:
            logger.info(f"[FeishuReader] 开始查询，app_token={base_token}, table_id={table_id}")

            # 解析日期范围（全天）
            date_obj = datetime.strptime(target_date, "%Y-%m-%d")
            start_time = int(date_obj.timestamp() * 1000)
            end_time = int((date_obj + timedelta(days=1)).timestamp() * 1000)

            logger.info(f"[FeishuReader] 查询日期: {target_date}, 时间戳范围: {start_time} - {end_time}")

            # 先尝试获取表格数据，使用 ListAppTableRecordRequest
            all_records = []
            page_token = ""

            while True:
                # 使用 list 接口而不是 search
                request = ListAppTableRecordRequest.builder() \
                    .app_token(base_token) \
                    .table_id(table_id) \
                    .page_size(100) \
                    .page_token(page_token) \
                    .build()

                response = self.client.bitable.v1.app_table_record.list(request)

                if not response.success():
                    logger.error(f"[FeishuReader] 获取记录失败: {response.msg}, code: {response.code}")
                    # 如果 list 失败，尝试 search
                    logger.info(f"[FeishuReader] 尝试使用 search 接口...")
                    return await self._search_records(base_token, table_id, start_time, end_time, account_field)

                if response.data.items:
                    all_records.extend(response.data.items)

                # 检查是否有下一页
                if not response.data.has_more or not response.data.page_token:
                    break
                page_token = response.data.page_token

            logger.info(f"[FeishuReader] 查询到 {len(all_records)} 条记录")

            # 转换为标准格式并按日期过滤
            videos = []
            for record in all_records:
                video = self._parse_feishu_record(record, account_field)
                if video:
                    # 按发布时间过滤：只返回指定日期的视频
                    publish_time_ms = record.fields.get("发布时间", 0)
                    if publish_time_ms:
                        # 检查是否在目标日期范围内
                        if start_time <= publish_time_ms < end_time:
                            logger.info(f"[FeishuReader] 匹配视频: {video.get('name')}, 发布时间: {publish_time_ms}")
                            videos.append(video)
                    else:
                        # 没有发布时间的记录，跳过
                        logger.debug(f"[FeishuReader] 跳过无发布时间的记录: {video.get('name')}")

            logger.info(f"[FeishuReader] 日期过滤后有效视频: {len(videos)} 条")
            return videos

        except Exception as e:
            logger.error(f"[FeishuReader] 获取视频数据异常: {e}")
            import traceback
            traceback.print_exc()
            return []

    async def _search_records(self, app_token: str, table_id: str, start_time: int, end_time: int, account_field: str) -> List[Dict[str, Any]]:
        """使用 search 接口获取记录"""
        try:
            all_records = []
            page_token = ""

            while True:
                request = SearchAppTableRecordRequest.builder() \
                    .app_token(app_token) \
                    .table_id(table_id) \
                    .page_size(100) \
                    .page_token(page_token) \
                    .build()

                response = self.client.bitable.v1.app_table_record.search(request)

                if not response.success():
                    logger.error(f"[FeishuReader] search 失败: {response.msg}, code: {response.code}")
                    break

                if response.data.items:
                    all_records.extend(response.data.items)

                if not response.data.has_more or not response.data.page_token:
                    break
                page_token = response.data.page_token

            # 解析并过滤
            videos = []
            for record in all_records:
                video = self._parse_feishu_record(record, account_field)
                if video:
                    publish_time_ms = record.fields.get("发布时间", 0)
                    if publish_time_ms:
                        if start_time <= publish_time_ms < end_time:
                            videos.append(video)
                    else:
                        videos.append(video)

            return videos

        except Exception as e:
            logger.error(f"[FeishuReader] search 异常: {e}")
            return []

    def _parse_feishu_record(self, record: AppTableRecord, account_field: str) -> Optional[Dict[str, Any]]:
        """
        解析飞书记录为标准视频格式

        Args:
            record: 飞书记录
            account_field: 账号字段名

        Returns:
            视频数据字典
        """
        try:
            fields = record.fields

            # 提取基本信息
            video = {
                "name": fields.get("视频标题", ""),
                "account": fields.get(account_field, "未知"),
                "readCount": self._safe_int(fields.get("浏览次数", 0)),
                "likeCount": self._safe_int(fields.get("点赞数", 0)),
                "commentCount": self._safe_int(fields.get("评论数", 0)),
                "forwardCount": self._safe_int(fields.get("转发数", 0)),
                "favCount": self._safe_int(fields.get("收藏数", 0)),
                "fullPlayRate": fields.get("完播率", "0%"),
                "avgPlayTimeSec": fields.get("平均播放时长", "0秒"),
                "url": fields.get("视频链接", ""),
                "coverUrl": fields.get("封面图", ""),
                "objectId": record.record_id,
                "tags": self._parse_tags(fields.get("标签", "")),
            }

            # 解析发布时间
            publish_time_ms = fields.get("发布时间", 0)
            if publish_time_ms:
                publish_dt = datetime.fromtimestamp(publish_time_ms / 1000)
                video["publishTime"] = publish_dt.strftime("%H:%M")
                video["createTime"] = publish_dt.strftime("%Y-%m-%d %H:%M")
            else:
                video["publishTime"] = "00:00"
                video["createTime"] = ""

            # 解析 AI 分析结果（如果有）
            ai_analysis = self._parse_ai_analysis(fields)
            if ai_analysis:
                video["aiAnalysis"] = ai_analysis

            return video

        except Exception as e:
            logger.error(f"[FeishuReader] 解析记录失败: {e}")
            return None

    def _parse_ai_analysis(self, fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """解析 AI 分析结果"""
        try:
            ai_score = fields.get("AI 评分")
            if ai_score is None:
                return None

            return {
                "overall_score": float(ai_score),
                "grade": fields.get("AI 评级", "N/A"),
                "viral_index": float(fields.get("病毒指数", 0)),
                "optimization_advice": fields.get("AI 建议", ""),
                "reasoning": fields.get("分析理由", ""),
                "dimension_scores": {
                    "content_quality": float(fields.get("内容质量", 0)),
                    "timing": float(fields.get("发布时机", 0)),
                    "engagement": float(fields.get("互动表现", 0)),
                    "viral_potential": float(fields.get("病毒传播", 0))
                }
            }
        except Exception as e:
            logger.warning(f"[FeishuReader] 解析 AI 分析失败: {e}")
            return None

    def _parse_tags(self, tags_str: str) -> List[str]:
        """解析标签字符串"""
        if not tags_str:
            return []
        # 支持逗号、空格、分号分隔
        import re
        tags = re.split(r'[,，\s;；]+', tags_str.strip())
        return [t for t in tags if t]

    def _safe_int(self, value: Any) -> int:
        """安全转换为整数"""
        try:
            if isinstance(value, (int, float)):
                return int(value)
            if isinstance(value, str):
                # 移除可能的逗号分隔符
                return int(value.replace(',', '').replace('，', ''))
            return 0
        except:
            return 0


# 全局单例
_feishu_reader: Optional[FeishuVideoDataReader] = None


def get_feishu_reader() -> FeishuVideoDataReader:
    """获取飞书读取服务单例"""
    global _feishu_reader
    if _feishu_reader is None:
        app_id = os.getenv("LARK_APP_ID")
        app_secret = os.getenv("LARK_APP_SECRET")
        if not app_id or not app_secret:
            raise ValueError("缺少 LARK_APP_ID 或 LARK_APP_SECRET 环境变量")
        _feishu_reader = FeishuVideoDataReader(app_id, app_secret)
    return _feishu_reader
