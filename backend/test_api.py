# -*- coding: utf-8 -*-
"""
测试 API Key 配置是否正确
"""
import os
import sys
import io

# 设置 UTF-8 编码输出（解决 Windows 控制台乱码问题）
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# 检查环境变量
api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
model_name = os.getenv("OPENAI_MODEL_NAME")

print("="*60)
print("📋 当前配置")
print("="*60)
print(f"API Key: {api_key[:20]}...{api_key[-10:] if api_key else 'None'}")
print(f"Base URL: {base_url}")
print(f"Model: {model_name}")
print("="*60)

if not api_key or api_key.startswith("sk-xxxxxxxxxxxx"):
    print("\n❌ 错误：请先在 .env 文件中配置真实的 API Key")
    exit(1)

print("\n🔄 正在测试 API 连接...\n")

try:
    client = OpenAI(
        api_key=api_key,
        base_url=base_url
    )

    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": "你好，请回复'配置成功'"}],
        max_tokens=50
    )

    result = response.choices[0].message.content
    print(f"✅ API 连接成功！")
    print(f"📝 模型回复: {result}")
    print("\n" + "="*60)
    print("🎉 配置验证完成，可以正常使用 AI 分析功能！")
    print("="*60)

except Exception as e:
    print(f"❌ API 连接失败: {str(e)}")
    print("\n请检查：")
    print("1. API Key 是否正确")
    print("2. Base URL 是否正确")
    print("3. 账户是否有可用额度")
