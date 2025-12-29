# -*- coding: utf-8 -*-
"""
Feishu Config - 飞书配置
"""
import os
import logging
from typing import Dict, Any
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()


def get_feishu_config() -> Dict[str, Any]:
    """
    获取飞书配置

    从环境变量或前端配置文件读取账号表格映射
    """
    # 这里提供一个示例配置，实际应该从配置文件或环境变量读取
    # 你可以根据自己的飞书表格结构修改

    config = {
        "feishuAppId": os.getenv("LARK_APP_ID", ""),
        "feishuAppSecret": os.getenv("LARK_APP_SECRET", ""),
        "accountTableMapping": {
            # 示例配置 - 请替换为你的实际配置
            # "ai图书": {
            #     "baseToken": "bascnxxxxxxxxxxxxxx",  # 飞书 Base Token
            #     "tableId": "tblxxxxxxxxxxxxxx"        # 数据表 ID
            # },
            # "Python教程": {
            #     "baseToken": "bascnxxxxxxxxxxxxxx",
            #     "tableId": "tblxxxxxxxxxxxxxx"
            # },
        }
    }

    # 尝试从前端配置文件读取
    try:
        import json
        config_path = os.path.join(os.path.dirname(__file__), "../../constants.ts")
        # 这里可以添加解析前端配置文件的逻辑
    except:
        pass

    return config


def get_account_table_mapping() -> Dict[str, Any]:
    """
    获取账号表格映射

    返回格式：
    {
        "ai图书": {
            "baseToken": "bascnxxx",
            "tableId": "tblxxx",
            "accountField": "账号名称"  # 可选，默认为"账号名称"
        }
    }
    """
    # 从环境变量读取配置（分开配置 BaseToken 和 TableId）
    base_token = os.getenv("FEISHU_BASE_TOKEN", "").strip()
    table_id = os.getenv("FEISHU_TABLE_ID", "").strip()

    if not base_token or not table_id:
        logger.warning("[FeishuConfig] 未配置 FEISHU_BASE_TOKEN 或 FEISHU_TABLE_ID 环境变量，将使用 Mock 数据")
        return {}

    # 返回 ai 图书账号配置
    mapping = {
        "ai图书": {
            "baseToken": base_token,
            "tableId": table_id,
            "accountField": "账号名称"
        }
    }

    logger.info(f"[FeishuConfig] 加载了飞书表格配置")
    return mapping
