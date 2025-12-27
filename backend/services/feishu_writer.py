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
            field_mapping: 字段映射

        Returns:
            更新结果统计
        """
        print(f"[FeishuWriter] 开始批量更新，记录数: {len(scores)}")

        # 构建字段名到飞书字段 ID 的映射
        field_id_map = self._get_field_id_map(app_token, table_id, field_mapping)

        if not field_id_map:
            return {"success": 0, "failed": len(scores), "error": "无法获取字段映射"}

        # 批量更新
        success_count = 0
        failed_count = 0

        for score in scores:
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
                        print(f"[FeishuWriter] 成功更新: {score.video_id}")
                    else:
                        failed_count += 1
                        print(f"[FeishuWriter] 更新失败: {score.video_id}")
                else:
                    # 未找到记录
                    failed_count += 1
                    print(f"[FeishuWriter] 未找到记录: {score.video_id}")

            except Exception as e:
                failed_count += 1
                print(f"[FeishuWriter] 更新异常 {score.video_id}: {e}")

        result = {
            "success": success_count,
            "failed": failed_count,
            "total": len(scores)
        }
        print(f"[FeishuWriter] 批量更新完成: {result}")
        return result

    def _get_field_id_map(
        self,
        app_token: str,
        table_id: str,
        field_mapping: Dict[str, str]
    ) -> Dict[str, str]:
        """获取字段名到字段 ID 的映射"""
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
            target_field_names = list(field_mapping.keys())

            for field in response.data.items:
                if field.field_name in target_field_names:
                    field_map[field.field_name] = field.field_id

            print(f"[FeishuWriter] 字段映射: {field_map}")
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
        """根据视频 ID 查找记录 ID"""
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
                    .build()) \
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
        """更新单条记录"""
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
    """创建飞书写入服务实例"""
    return FeishuWriter(app_id, app_secret)
