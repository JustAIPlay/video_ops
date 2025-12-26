# -*- coding: utf-8 -*-
"""
Feishu Writer Service - 飞书 AI 分析结果批量写入服务
"""
import os
from typing import List, Dict, Any
from lark_oapi.api.bitable.v1 import *
from lark_oapi import *

from models.analysis import VideoScore


class FeishuWriter:
    """飞书批量写入服务"""

    def __init__(self, app_id: str, app_secret: str):
        """
        初始化飞书写入服务

        Args:
            app_id: 飞书应用 ID
            app_secret: 飞书应用密钥
        """
        self.app_id = app_id
        self.app_secret = app_secret
        self.client = self._create_client()

    def _create_client(self) -> Client:
        """创建飞书 API 客户端"""
        return Client.builder() \
            .app_id(self.app_id) \
            .app_secret(self.app_secret) \
            .build()

    def batch_update_video_scores(
        self,
        app_token: str,
        table_id: str,
        scores: List[VideoScore],
        field_mapping: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        批量更新视频评分到飞书表格

        Args:
            app_token: 飞书 Base token
            table_id: 数据表 ID
            scores: 视频评分列表
            field_mapping: 字段映射，例如：
                {
                    "AI 评分": "ai_score",
                    "AI 评级": "ai_grade",
                    "病毒指数": "viral_index",
                    "AI 建议": "optimization_advice",
                    "分析理由": "reasoning"
                }

        Returns:
            更新结果统计
        """
        # 构建字段名到飞书字段 ID 的映射
        # 首先获取表格字段信息
        field_id_map = self._get_field_id_map(app_token, table_id, field_mapping)

        if not field_id_map:
            return {"success": 0, "failed": len(scores), "error": "无法获取字段映射"}

        # 批量更新（每次最多 500 条）
        BATCH_SIZE = 500
        success_count = 0
        failed_count = 0

        for i in range(0, len(scores), BATCH_SIZE):
            batch = scores[i:i + BATCH_SIZE]

            # 查找记录并更新
            for score in batch:
                try:
                    # 先根据 video_id 查找对应的记录
                    record_id = self._find_record_by_video_id(
                        app_token, table_id, score.video_id
                    )

                    if record_id:
                        # 更新记录
                        if self._update_record(
                            app_token, table_id, record_id, score, field_id_map
                        ):
                            success_count += 1
                        else:
                            failed_count += 1
                    else:
                        # 未找到记录，跳过或创建新记录（这里选择跳过）
                        failed_count += 1
                        print(f"[FeishuWriter] 未找到记录: {score.video_id}")

                except Exception as e:
                    failed_count += 1
                    print(f"[FeishuWriter] 更新失败 {score.video_id}: {e}")

        return {
            "success": success_count,
            "failed": failed_count,
            "total": len(scores)
        }

    def _get_field_id_map(
        self,
        app_token: str,
        table_id: str,
        field_names: List[str]
    ) -> Dict[str, str]:
        """
        获取字段名到字段 ID 的映射

        Args:
            app_token: Base token
            table_id: 表 ID
            field_names: 需要获取的字段名列表

        Returns:
            字段名 -> 字段 ID 的映射
        """
        try:
            request = ListAppTableFieldRequest.builder() \
                .app_token(app_token) \
                .table_id(table_id) \
                .build()

            response = self.client.bitable.v1.app_table_field.list(request)

            if not response.success():
                print(f"[FeishuWriter] 获取字段列表失败: {response.msg}")
                return {}

            field_map = {}
            for field in response.data.items:
                if field.field_name in field_names:
                    field_map[field.field_name] = field.field_id

            return field_map

        except Exception as e:
            print(f"[FeishuWriter] 获取字段映射异常: {e}")
            return {}

    def _find_record_by_video_id(
        self,
        app_token: str,
        table_id: str,
        video_id: str
    ) -> str | None:
        """
        根据视频 ID 查找记录 ID

        Args:
            app_token: Base token
            table_id: 表 ID
            video_id: 视频 ID

        Returns:
            记录 ID，未找到返回 None
        """
        try:
            # 使用搜索 API
            request = SearchAppTableRecordRequest.builder() \
                .app_token(app_token) \
                .table_id(table_id) \
                .filter(formula_view.Filter.builder()
                    .conjunction("and")
                    .conditions([
                        formula_view.Condition.builder()
                            .field_name("视频编号")
                            .operator("is")
                            .value([video_id])
                            .build()
                    ])
                    .build())
                .build()

            response = self.client.bitable.v1.app_table_record.search(request)

            if response.success() and response.data.items:
                return response.data.items[0].record_id

            return None

        except Exception as e:
            print(f"[FeishuWriter] 查找记录异常: {e}")
            return None

    def _update_record(
        self,
        app_token: str,
        table_id: str,
        record_id: str,
        score: VideoScore,
        field_id_map: Dict[str, str]
    ) -> bool:
        """
        更新单条记录

        Args:
            app_token: Base token
            table_id: 表 ID
            record_id: 记录 ID
            score: 视频评分数据
            field_id_map: 字段名 -> 字段 ID 映射

        Returns:
            是否更新成功
        """
        try:
            # 构建更新数据
            fields = {}

            # AI 评分
            if "AI 评分" in field_id_map:
                fields[field_id_map["AI 评分"]] = score.overall_score

            # AI 评级
            if "AI 评级" in field_id_map:
                fields[field_id_map["AI 评级"]] = score.grade

            # 病毒指数
            if "病毒指数" in field_id_map:
                fields[field_id_map["病毒指数"]] = score.viral_index

            # AI 建议
            if "AI 建议" in field_id_map:
                fields[field_id_map["AI 建议"]] = score.optimization_advice

            # 分析理由
            if "分析理由" in field_id_map:
                fields[field_id_map["分析理由"]] = score.reasoning

            # 调用更新 API
            request = UpdateAppTableRecordRequest.builder() \
                .app_token(app_token) \
                .table_id(table_id) \
                .record_id(record_id) \
                .app_table_record(AppTableRecord.builder()
                    .fields(fields)
                    .build()) \
                .build()

            response = self.client.bitable.v1.app_table_record.update(request)

            return response.success()

        except Exception as e:
            print(f"[FeishuWriter] 更新记录异常: {e}")
            return False


# 便捷函数
def create_feishu_writer(app_id: str, app_secret: str) -> FeishuWriter:
    """
    创建飞书写入服务实例

    Args:
        app_id: 飞书应用 ID
        app_secret: 飞书应用密钥

    Returns:
        FeishuWriter 实例
    """
    return FeishuWriter(app_id, app_secret)
