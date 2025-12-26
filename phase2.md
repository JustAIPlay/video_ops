# video_ops MVP 可落地实施计划

**版本:** v2.0
**日期:** 2025-12-25
**状态:** 待实施
**基于:** plan.md Phase 1 设计

---

## 📋 项目现状分析

### 已有基础

- ✅ React 19 + TypeScript 前端框架
- ✅ 三个核心视图：SyncView、ScheduleView、SettingsView
- ✅ 飞书 API 集成（token 缓存、Wiki Token 解析）
- ✅ Vite 开发服务器配置（端口 3000）
- ✅ 日志控制台组件
- ✅ 类型定义完整

### 需要新增

- ❌ Python FastAPI 后端服务
- ❌ MatrixAdvisor Agent
- ❌ AI 分析 API 接口
- ❌ 前端 AI 触发组件
- ❌ 飞书表格 AI 字段

---

## 🎯 MVP 实施计划（分 5 个阶段）

### 阶段 0：环境准备（1 小时）

**目标：** 搭建 Python 后端基础架构

**任务清单：**

1. **创建后端目录结构**
   ```
   video_ops/
   ├── backend/
   │   ├── .env                # 环境变量
   │   ├── .gitignore
   │   ├── main.py              # FastAPI 入口
   │   ├── requirements.txt     # Python 依赖
   │   └── services/
   │       ├── __init__.py
   │       ├── matrix_agent.py  # Agent 逻辑
   │       └── lark_client.py   # 飞书客户端
   ```

2. **创建 requirements.txt**
   ```txt
   fastapi==0.115.0
   uvicorn[standard]==0.32.0
   lark-oapi==1.2.19
   openai==1.57.0
   python-dotenv==1.0.1
   pydantic==2.10.0
   pydantic-settings==2.6.0
   ```

3. **创建 .env 配置文件**
   ```env
   # Lark API
   LARK_APP_ID=cli_xxxxxxxxx
   LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxx

   # LLM API (推荐 DeepSeek 或 Kimi)
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
   OPENAI_BASE_URL=https://api.deepseek.com
   OPENAI_MODEL_NAME=deepseek-reasoner

   # Server Config
   BACKEND_PORT=8000
   BACKEND_HOST=0.0.0.0
   ```

**验证标准：** 目录结构创建完成，依赖准备就绪

---

### 阶段 1：后端核心服务（2-3 小时）

**目标：** 实现可独立运行的 FastAPI 服务

#### 任务 1.1：创建 FastAPI 主入口

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import uvicorn

from services.matrix_agent import MatrixAdvisor

load_dotenv()

app = FastAPI(title="Video Ops AI Backend")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 Agent
agent = MatrixAdvisor()

class TaskItem(BaseModel):
    id: str
    title: str
    views: int
    groupName: Optional[str] = None
    accountName: Optional[str] = None

class AnalyzeRequest(BaseModel):
    tasks: List[TaskItem]

class AnalysisResult(BaseModel):
    id: str
    score: int
    advice: str
    reasoning: str

class AnalyzeResponse(BaseModel):
    status: str
    data: List[AnalysisResult]

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_schedule(request: AnalyzeRequest):
    try:
        results = agent.analyze_schedule(request.tasks)
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "data": []}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

#### 任务 1.2：实现 MatrixAdvisor Agent

```python
# backend/services/matrix_agent.py
import os
import json
from typing import List, Dict
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class MatrixAdvisor:
    """视频排期智能分析 Agent"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")
        )
        self.model = os.getenv("OPENAI_MODEL_NAME", "deepseek-reasoner")

    def analyze_schedule(self, tasks: List[Dict]) -> List[Dict]:
        """分析排期任务并返回评分和建议"""
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
        """调用 LLM 进行分析"""
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
            # 降级策略
            return {
                "score": 5,
                "advice": f"AI 分析不可用: {str(e)}",
                "reasoning": "LLM 调用失败"
            }

    def _build_prompt(self, task: Dict) -> str:
        """构建分析提示词"""
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
"""
```

**验证标准：**
```bash
# 启动后端服务
cd backend
pip install -r requirements.txt
python main.py

# 访问 http://localhost:8000/docs 测试 API
# 测试 /api/analyze 接口返回正常
```

---

### 阶段 2：飞书集成（1-2 小时）

**目标：** 实现 AI 结果回写飞书表格

#### 任务 2.1：创建飞书客户端

```python
# backend/services/lark_client.py
import os
from typing import Dict, List
from lark_oapi.api.bitable.v1 import *
from dotenv import load_dotenv

load_dotenv()

class LarkClient:
    """飞书多维表格客户端"""

    def __init__(self):
        self.app_id = os.getenv("LARK_APP_ID")
        self.app_secret = os.getenv("LARK_APP_SECRET")
        self._token = None
        self._token_expire = 0

    def get_tenant_token(self) -> str:
        """获取 Tenant Access Token"""
        # 实现 Token 获取和缓存（参考前端的 feishuService.ts）
        pass

    def update_ai_analysis(self,
                          app_token: str,
                          table_id: str,
                          record_id: str,
                          analysis: Dict) -> bool:
        """更新 AI 分析结果到飞书表格"""
        token = self.get_tenant_token()

        # 构建更新字段
        fields = {
            "Agent评分": analysis["score"],
            "Agent建议": analysis["advice"],
            "思考链": analysis["reasoning"],
            "状态": "已AI评审"
        }

        # 调用飞书 API 更新记录
        # 具体实现参考 lark-oapi 文档
        pass
```

#### 任务 2.2：在 Agent 中集成飞书回写

```python
# 修改 backend/services/matrix_agent.py
from services.lark_client import LarkClient

class MatrixAdvisor:
    def __init__(self):
        # ... 原有代码
        self.lark = LarkClient()

    def analyze_and_update(self, tasks: List[Dict],
                          table_config: Dict) -> List[Dict]:
        """分析并回写到飞书"""
        results = []

        for task in tasks:
            analysis = self._think(task)

            # 回写飞书
            self.lark.update_ai_analysis(
                app_token=table_config["baseToken"],
                table_id=table_config["tableId"],
                record_id=task["id"],
                analysis=analysis
            )

            results.append({...})

        return results
```

**验证标准：** AI 分析结果成功写入飞书表格

---

### 阶段 3：前端集成（2 小时）

**目标：** 在 ScheduleView 中添加 AI 触发功能

#### 任务 3.1：创建 AI 分析服务

```typescript
// services/aiAnalysisService.ts
export interface AnalysisRequest {
  tasks: Array<{
    id: string;
    title: string;
    views: number;
    groupName?: string;
    accountName?: string;
  }>;
}

export interface AnalysisResult {
  id: string;
  score: number;
  advice: string;
  reasoning: string;
}

export async function analyzeSchedule(
  tasks: AnalysisRequest["tasks"]
): Promise<AnalysisResult[]> {
  const res = await fetch('http://localhost:8000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks })
  });

  const data = await res.json();
  return data.data;
}
```

#### 任务 3.2：在 ScheduleView 中添加 AI 按钮

```typescript
// 修改 components/ScheduleView.tsx

// 1. 添加状态
const [isAnalyzing, setIsAnalyzing] = useState(false);

// 2. 添加 AI 处理函数
const handleAIAnalysis = async () => {
  if (isAnalyzing) return;
  setIsAnalyzing(true);

  addLog('info', '开始 AI 智能分析...');

  try {
    // 调用 AI 分析接口
    const analysisResults = await analyzeSchedule(filteredResults);

    // 更新结果数据
    setResults(prev => prev.map(item => {
      const analysis = analysisResults.find(r => r.id === item.id);
      return analysis ? { ...item, aiAnalysis: analysis } : item;
    }));

    addLog('success', `AI 分析完成，处理 ${analysisResults.length} 条`);
  } catch (e: any) {
    addLog('error', 'AI 分析失败', e.message);
  } finally {
    setIsAnalyzing(false);
  }
};

// 3. 在渲染中添加 AI 按钮（在"开始计算"按钮旁边）
<button
  onClick={handleAIAnalysis}
  disabled={isAnalyzing || results.length === 0}
  className="..." // 相同样式
>
  {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
  <span>{isAnalyzing ? 'AI 分析中...' : 'AI 智能诊断'}</span>
</button>
```

#### 任务 3.3：在结果表格中显示 AI 评分

```tsx
{/* 在表格中添加新列 */}
<th className="px-6 py-4 ...">AI 评分</th>
<th className="px-6 py-4 ...">AI 建议</th>

{/* 在表格行中显示数据 */}
<td className="px-6 py-4 text-center">
  {item.aiAnalysis ? (
    <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
      item.aiAnalysis.score >= 8 ? 'bg-emerald-100 text-emerald-600' :
      item.aiAnalysis.score >= 6 ? 'bg-amber-100 text-amber-600' :
      'bg-rose-100 text-rose-600'
    }`}>
      {item.aiAnalysis.score}/10
    </div>
  ) : '-'}
</td>
<td className="px-6 py-4 max-w-xs truncate" title={item.aiAnalysis?.advice}>
  {item.aiAnalysis?.advice || '-'}
</td>
```

**验证标准：** 点击 AI 按钮后，表格显示评分和建议

---

### 阶段 4：飞书字段配置（30 分钟）

**目标：** 在飞书多维表格中添加 AI 相关字段

**任务清单：**

1. 登录飞书多维表格
2. 在"待发布排期表"中添加以下字段：

| 字段名称 | 字段类型 | 说明 |
|---------|---------|------|
| Agent评分 | 数字 | 1-10 分 |
| Agent建议 | 多行文本 | AI 的优化建议 |
| 思考链 | 多行文本 | AI 的推理过程 |
| 状态 | 单选 | 待审核 / 已AI评审 / 已发布 |

**验证标准：** 字段创建完成，API 可以正常写入

---

### 阶段 5：测试与文档（1 小时）

**目标：** 端到端测试并编写使用文档

**测试清单：**

```bash
# 1. 启动后端服务
cd backend
python main.py

# 2. 启动前端服务
npm run dev

# 3. 测试流程
- 打开 http://localhost:3000
- 进入"发布排期"页面
- 点击"开始计算"获取数据
- 点击"AI 智能诊断"触发分析
- 验证评分和建议正确显示
- 验证飞书表格数据更新
```

**文档内容：**

```markdown
# Video Ops AI 智能排期系统使用指南

## 快速开始

### 1. 配置环境变量

编辑 `backend/.env`：
```env
LARK_APP_ID=cli_xxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

### 2. 启动服务

```bash
# 终端 A：启动后端
cd backend && python main.py

# 终端 B：启动前端
npm run dev
```

### 3. 使用流程

1. 登录飞书多维表格，确保已添加 AI 字段
2. 在前端配置页面填写飞书 App ID 和 Secret
3. 进入"发布排期"页面
4. 点击"开始计算"获取待排期视频
5. 点击"AI 智能诊断"获取评分和建议
6. 查看分析结果并调整排期

## API 文档

访问 http://localhost:8000/docs 查看完整 API 文档
```

---

## 📊 进度跟踪

- [ ] 阶段 0：环境准备
- [ ] 阶段 1：后端核心服务
- [ ] 阶段 2：飞书集成
- [ ] 阶段 3：前端集成
- [ ] 阶段 4：飞书字段配置
- [ ] 阶段 5：测试与文档

---

## 🔄 与 BettaFish 的设计借鉴关系

| 特性 | BettaFish | video_ops Phase 2 |
|------|-----------|-------------------|
| 无框架 Agent | ✅ 纯 Python + LLM | ✅ 纯 Python + OpenAI |
| 配置管理 | Pydantic Settings | python-dotenv |
| LLM 集成 | 统一 LLMClient | OpenAI SDK |
| 多 Agent 协作 | ForumEngine | 简化为单 Agent |
| 反思循环 | MAX_REFLECTIONS=3 | 单次分析 |

---

## 📝 备注

- 本计划基于 plan.md Phase 1 设计
- 借鉴了 BettaFish 的无框架 Agent 设计思想
- 采用 MVP 策略，核心功能优先
- 预留 Phase 3 扩展空间（多 Agent 协作）
