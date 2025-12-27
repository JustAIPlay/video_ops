# Phase 3: 每日复盘会议功能设计

**版本:** v1.3
**日期:** 2024-12-27
**状态:** 设计中
**基于:** phase2.md AI 分析系统

---

## 📋 功能概述

### 核心价值

运营的效果需要及时的复盘、总结和迭代。通过引入**每日复盘会议**功能，让用户（运营者）与多个 AI Agent 以**会议形式**进行一轮结构化复盘，从而：

1. **系统性总结**：避免遗漏关键数据和问题
2. **多维度分析**：从数据、策略、增长多角度审视
3. **可行动输出**：生成具体的明日行动计划
4. **持续迭代**：追踪假设验证，形成改进闭环

### 功能定位

- **优先在 AI 模式下体验**：虽然组件支持主题切换，但核心交互流程建议在 AI 模式下进行以获得最佳视觉反馈。
- **导航栏新增"每日复盘"入口
- **可选功能**：用户可自主选择是否开启复盘
- **技术前提**：需确保 Phase 2 的 AI 评分数据已同步至飞书或本地数据库。

---

## 🎯 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    每日复盘会议                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   数据分析    │  │   排期策略    │  │   增长黑客    │   │
│  │    Agent     │  │    Agent     │  │    Agent     │   │
│  │  [头像+状态]  │  │  [头像+状态]  │  │  [头像+状态]  │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  会议内容区域                        │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │ 📊 数据分析 Agent:                           │   │    │
│  │  │    "今日共发布 9 条视频，Top 3 表现如下..."  │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │ 🎯 排期策略 Agent:                           │   │    │
│  │  │    "19:30 发的视频效果最好，建议..."        │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                                                     │    │
│  │  [正在输入...]                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              用户输入框 / 快捷操作                    │    │
│  │  [提问] [继续] [展开] [跳过] [结束会议]              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  进度: 数据分析 ████████░░ 80%  |  预计剩余 2 分钟          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI 风格规范

### 色彩系统（与项目一致）

| 用途 | AI 模式 | 传统模式 |
|-----|---------|---------|
| 主渐变 | `from-indigo-400 to-violet-400` | `from-[#8C7CF0] to-[#C6B9FF]` |
| 边框 | `border-indigo-200` | `border-white` / `border-slate-50` |
| 阴影 | `shadow-indigo-100` / `shadow-indigo-200` | `shadow-slate-100` / `shadow-violet-200` |
| 背景 | `bg-indigo-50` | `bg-slate-50` / `bg-violet-50` |
| 文字 | `text-indigo-600` / `text-slate-800` | `text-slate-400` / `text-slate-800` |

### Agent 专属配色

| Agent | 主题色 | 渐变 | 背景 | 文字 | 阴影 |
|-------|--------|------|------|------|------|
| 数据分析 | 蓝色 | `from-blue-400 to-cyan-400` | `bg-blue-100` | `text-blue-600` | `shadow-blue-200` |
| 排期策略 | 紫色 | `from-violet-400 to-purple-400` | `bg-violet-100` | `text-violet-600` | `shadow-violet-200` |
| 增长黑客 | 橙色 | `from-orange-400 to-amber-400` | `bg-orange-100` | `text-orange-600` | `shadow-orange-200` |

### 圆角规范

- 卡片容器: `rounded-3xl` (24px)
- 按钮容器: `rounded-2xl` (16px)
- 小容器/图标: `rounded-xl` (12px)
- 输入框: `rounded-xl` (12px)

### 阴影规范

- 悬浮卡片: `shadow-xl`
- AI 模式阴影: `shadow-indigo-100` / `shadow-indigo-200`
- 传统模式阴影: `shadow-slate-100` / `shadow-violet-200`

### 动画时长

- 标准过渡: `duration-500` (0.5s)
- 快速过渡: `duration-300` (0.3s)
- 按钮点击: `active:scale-95`

---

## 🤖 Agent 角色设计

### 1. 数据分析 Agent (Data Analyst)

#### 角色定位
客观、数据驱动、用数字说话

#### 视觉形象
- **头像**：蓝色主题 📊
- **配色**：蓝色系 (`from-blue-400 to-cyan-400`)

#### 输出内容结构
```markdown
1. 今日概览
   - 发布数量：9 条
   - 总播放量：XX,XXX
   - 平均互动率：XX%

2. Top 3 表现
   - 🥇 [视频标题] - 播放 XXXX | 互动率 XX%
   - 🥈 [视频标题] - 播放 XXXX | 互动率 XX%
   - 🥉 [视频标题] - 播放 XXXX | 互动率 XX%

3. 需关注数据
   - ⚠️ 3 条视频播放量 < 1000
   - ⚠️ 平均完播率下降 X%

4. 数据洞察
   - AI 图书赛道流量整体上升
   - 19:30-20:30 时段效果最佳
```

#### System Prompt
```python
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
```

---

### 2. 排期策略 Agent (Scheduling Strategist)

#### 角色定位
策略思维、关注效率、优化排期

#### 视觉形象
- **头像**：紫色主题 🎯
- **配色**：紫色系 (`from-violet-400 to-purple-400`)

#### 输出内容结构
```markdown
1. 策略执行评估
   - 今日排期计划完成度：100%
   - 预估准确率：XX%（实际 vs 预期）

2. 时段效果分析
   - 🟢 最佳时段：19:30-20:30（平均播放 XXXX）
   - 🟡 一般时段：17:00-18:00（平均播放 XXXX）
   - 🔴 避免时段：XX:XX-XX:XX（平均播放 XXXX）

3. 内容组合评估
   - 单一内容发布 vs 组合发布效果对比
   - 账号间协同效应分析

4. 明日排期建议
   - 建议发布时段：TOP 3
   - 建议发布顺序：[理由]
   - 需要调整的账号/内容
```

#### System Prompt
```python
SCHEDULING_STRATEGIST_SYSTEM_PROMPT = """
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
```

---

### 3. 增长黑客 Agent (Growth Hacker)

#### 角色定位
创新思维、实验导向、寻找突破点

#### 视觉形象
- **头像**：橙色主题 🚀
- **配色**：橙色系 (`from-orange-400 to-amber-400`)

#### 输出内容结构
```markdown
1. 关键发现
   - 💡 意外成功：[视频] 虽然评分 B 但播放量突出
   - 🔍 异常案例：[视频] 评分 A 但播放低迷，原因分析

2. 假设生成
   - H1: "前 3 秒加入 AI 图书实物展示，可能提升完播率"
   - H2: "标题增加疑问句式，可能提升点击率"
   - H3: "[某账号] 在晚间发布效果可能更好"

3. 实验建议
   - 🧪 实验 1：A/B 测试标题风格
   - 🧪 实验 2：测试不同封面图
   - 🧪 实验 3：测试发布时间

4. 快速行动项
   - [高优先级] 明日即可尝试：XXX
   - [中优先级] 本周准备：XXX
   - [低优先级] 长期优化：XXX
```

#### System Prompt
```python
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
```

---

## 🎨 UI 组件详细设计

### 1. 主容器

```tsx
import { useAppContext } from '../contexts/AppContext';

const ReviewView: React.FC = () => {
  const { mode } = useAppContext();
  const isAI = mode === 'ai';

  return (
    <div className={`flex flex-col h-full p-4 lg:p-8 gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full transition-all duration-500 ${
      isAI ? 'ai-mode-container' : ''
    }`}>
      {/* 复盘会议内容 */}
    </div>
  );
};
```

---

### 2. 顶部 Header 卡片

```tsx
<div className={`shrink-0 flex flex-col md:flex-row justify-between items-center rounded-3xl p-6 shadow-xl border transition-all duration-500 ${
  isAI
    ? 'bg-white border-indigo-200 shadow-indigo-100'
    : 'bg-white border-white shadow-slate-100'
}`}>
  <div className="flex items-center gap-6 mb-4 md:mb-0">
    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-400 to-violet-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 rotate-3 transform transition-transform hover:rotate-6">
      <Sparkles className="w-8 h-8 text-white" />
    </div>
    <div>
      <h2 className={`text-2xl font-extrabold transition-colors duration-500 ${
        isAI ? 'text-slate-800' : 'text-slate-800'
      }`}>每日复盘会议</h2>
      <p className={`font-medium transition-colors duration-500 ${
        isAI ? 'text-slate-600' : 'text-slate-500'
      }`}>
        AI 智能复盘今日运营表现
        {isAI && <Sparkles className="w-4 h-4 inline ml-2 text-indigo-500" />}
      </p>
    </div>
  </div>

  <button
    onClick={handleStartReview}
    disabled={isReviewing}
    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold shadow-lg transition-all hover:-translate-y-1 active:scale-95 active:shadow-sm ${
      isReviewing
        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
        : isAI
          ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-indigo-200 hover:shadow-indigo-300 text-white'
          : 'bg-[#8C7CF0] hover:bg-[#7b6be6] text-white shadow-violet-200'
    }`}
  >
    {isReviewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" fill="currentColor" />}
    <span>{isReviewing ? '复盘分析中...' : '开始复盘'}</span>
  </button>
</div>
```

---

### 3. Agent 状态栏

```tsx
// Agent 样式配置
const AGENT_STYLES = {
  analyst: {
    name: '数据分析',
    avatar: '📊',
    colors: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      gradient: 'from-blue-400 to-cyan-400',
      shadow: 'shadow-blue-200',
      border: 'border-blue-200'
    }
  },
  strategist: {
    name: '排期策略',
    avatar: '🎯',
    colors: {
      bg: 'bg-violet-100',
      text: 'text-violet-600',
      gradient: 'from-violet-400 to-purple-400',
      shadow: 'shadow-violet-200',
      border: 'border-violet-200'
    }
  },
  hacker: {
    name: '增长黑客',
    avatar: '🚀',
    colors: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      gradient: 'from-orange-400 to-amber-400',
      shadow: 'shadow-orange-200',
      border: 'border-orange-200'
    }
  }
};

// AgentAvatar 组件
interface AgentAvatarProps {
  type: 'analyst' | 'strategist' | 'hacker';
  status: 'idle' | 'thinking' | 'speaking' | 'completed';
  onClick?: () => void;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ type, status, onClick }) => {
  const config = AGENT_STYLES[type];
  const { colors, avatar, name } = config;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-500 ${
        status === 'completed' ? 'opacity-60' : ''
      }`}
    >
      {/* 头像容器 */}
      <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 ${
        colors.bg
      } ${
        status === 'thinking' ? 'agent-thinking' : ''
      } ${
        status === 'speaking' ? 'agent-speaking' : ''
      } ${
        status === 'idle' ? 'opacity-40' : ''
      }`}>
        {/* Avatar 图标 */}
        <span className="text-2xl">{avatar}</span>

        {/* 状态指示器 */}
        {status === 'thinking' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-400 rounded-full animate-ping" />
        )}
        {status === 'speaking' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
        )}
        {status === 'completed' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* 名称标签 */}
      <div className={`text-xs font-bold mt-2 text-center transition-colors duration-500 ${
        status === 'idle' ? 'text-slate-400' : colors.text
      }`}>
        {name}
      </div>
    </div>
  );
};

// Agent 状态栏渲染
<div className={`flex items-center justify-center gap-8 p-6 rounded-3xl shadow-xl border transition-all duration-500 ${
  isAI
    ? 'bg-white border-indigo-200 shadow-indigo-100'
    : 'bg-white border-white shadow-slate-100'
}`}>
  <AgentAvatar type="analyst" status={agentStatus.analyst} />
  <div className={`w-16 h-0.5 transition-all duration-500 ${
    agentStatus.analyst === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'
  }`} />
  <AgentAvatar type="strategist" status={agentStatus.strategist} />
  <div className={`w-16 h-0.5 transition-all duration-500 ${
    agentStatus.strategist === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'
  }`} />
  <AgentAvatar type="hacker" status={agentStatus.hacker} />
</div>
```

---

### 4. 会议内容区域

```tsx
<div className={`flex-1 min-h-0 rounded-3xl shadow-xl border flex flex-col relative overflow-hidden transition-all duration-500 ${
  isAI
    ? 'bg-white border-indigo-200 shadow-indigo-100'
    : 'bg-white border-white shadow-slate-100'
}`}>
  {/* 装饰性 blob */}
  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-50 pointer-events-none transition-colors duration-500 ${
    isAI ? 'bg-indigo-200' : 'bg-violet-50'
  }`}></div>

  {/* 内容区域 */}
  <div className="relative z-10 flex flex-col h-full">
    {/* 消息列表 */}
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message) => (
        <AgentMessage
          key={message.id}
          message={message}
          isAI={isAI}
        />
      ))}

      {/* 正在输入指示器 */}
      {currentAgent && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500 ${
          isAI
            ? 'bg-indigo-50 border-indigo-200'
            : 'bg-slate-50 border-slate-100'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            AGENT_STYLES[currentAgent].colors.bg
          }`}>
            <span className="text-sm">{AGENT_STYLES[currentAgent].avatar}</span>
          </div>
          <div className="flex gap-1">
            <div className={`w-2 h-2 rounded-full animate-bounce ${
              isAI ? 'bg-indigo-400' : 'bg-violet-400'
            }`} style={{ animationDelay: '0ms' }} />
            <div className={`w-2 h-2 rounded-full animate-bounce ${
              isAI ? 'bg-indigo-400' : 'bg-violet-400'
            }`} style={{ animationDelay: '150ms' }} />
            <div className={`w-2 h-2 rounded-full animate-bounce ${
              isAI ? 'bg-indigo-400' : 'bg-violet-400'
            }`} style={{ animationDelay: '300ms' }} />
          </div>
          <span className={`text-sm font-medium ${
            isAI ? 'text-indigo-600' : 'text-slate-500'
          }`}>
            正在输入...
          </span>
        </div>
      )}
    </div>
  </div>
</div>
```

---

### 5. AgentMessage 组件

```tsx
interface AgentMessageProps {
  message: ReviewMessage;
  isAI: boolean;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ message, isAI }) => {
  const config = AGENT_STYLES[message.agent];
  const { colors, avatar, name } = config;

  return (
    <div className={`flex gap-3 p-4 rounded-2xl border transition-all duration-500 message-appear ${
      isAI
        ? 'bg-white border-indigo-200 shadow-indigo-50'
        : 'bg-white border-slate-100 shadow-slate-50'
    }`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        colors.bg
      }`}>
        <span className="text-lg">{avatar}</span>
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {/* 名称和时间 */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-bold text-sm ${colors.text}`}>{name}</span>
          <span className={`text-xs ${isAI ? 'text-indigo-400' : 'text-slate-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* Markdown 内容 */}
        <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
          isAI ? 'prose-indigo' : 'prose-slate'
        }`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
```

---

### 6. 用户操作面板

```tsx
<div className={`p-4 rounded-3xl shadow-xl border transition-all duration-500 ${
  isAI
    ? 'bg-white border-indigo-200 shadow-indigo-100'
    : 'bg-white border-white shadow-slate-100'
}`}>
  {/* 快捷操作按钮 */}
  <div className="flex items-center justify-center gap-3 flex-wrap">
    <button
      onClick={() => handleAction('ask')}
      disabled={!canInteract}
      className={`group relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
        isAI
          ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-indigo-200 hover:shadow-indigo-300 text-white'
          : 'bg-[#8C7CF0] hover:bg-[#7b6be6] text-white shadow-violet-200'
      }`}
    >
      {/* Shimmer 效果 */}
      <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]"></div>
      <MessageCircle className="w-5 h-5" />
      <span>提问</span>
    </button>

    <button
      onClick={() => handleAction('continue')}
      disabled={!canInteract}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
        isAI
          ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
      }`}
    >
      <CheckCircle2 className="w-5 h-5" />
      <span>继续</span>
    </button>

    <button
      onClick={() => handleAction('expand')}
      disabled={!canInteract}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
        isAI
          ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
      }`}
    >
      <FolderOpen className="w-5 h-5" />
      <span>展开</span>
    </button>

    <button
      onClick={() => handleAction('skip')}
      disabled={!canInteract}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
        isAI
          ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
      }`}
    >
      <SkipForward className="w-5 h-5" />
      <span>跳过</span>
    </button>
  </div>
</div>
```

---

### 7. 进度条组件

```tsx
<div className={`p-4 rounded-2xl border transition-all duration-500 ${
  isAI
    ? 'bg-indigo-50 border-indigo-200'
    : 'bg-slate-50 border-slate-100'
}`}>
  <div className="flex items-center justify-between mb-2">
    <span className={`text-sm font-bold ${isAI ? 'text-indigo-600' : 'text-slate-600'}`}>
      当前阶段: {currentStage}
    </span>
    <span className={`text-sm font-bold ${isAI ? 'text-indigo-600' : 'text-slate-600'}`}>
      {progress}%
    </span>
  </div>

  {/* 使用项目现有的 ai-progress-bar 样式 */}
  <div className="ai-progress-bar">
    <div className="ai-progress-fill" style={{ width: `${progress}%` }} />
  </div>

  <div className={`flex justify-between mt-2 text-xs ${isAI ? 'text-indigo-500' : 'text-slate-400'}`}>
    <span>预计剩余时间</span>
    <span>{Math.ceil(estimatedTime / 60)} 分钟</span>
  </div>
</div>
```

---

### 8. 加载屏组件（会前准备）

```tsx
const LoadingScreen: React.FC<{ isAI: boolean }> = ({ isAI }) => {
  const steps = [
    { label: '从飞书获取今日数据', status: 'completed' },
    { label: '加载 AI 分析结果', status: 'completed' },
    { label: '初始化 Agent...', status: 'loading' }
  ];

  return (
    <div className={`fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center ai-hud-overlay`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-3xl shadow-2xl border transition-all duration-500 ${
        isAI
          ? 'bg-white border-indigo-200 shadow-indigo-100'
          : 'bg-white border-white shadow-slate-100'
      }`}>
        {/* 装饰性 blob */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-80 pointer-events-none transition-colors duration-500 ${
          isAI ? 'bg-indigo-200' : 'bg-violet-50'
        }`}></div>

        <div className="relative z-10 text-center">
          {/* 旋转图标 */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-indigo-400 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
            <Sparkles className="w-10 h-10 text-white animate-spin" />
          </div>

          <h3 className={`text-xl font-bold mb-2 ${isAI ? 'text-indigo-600' : 'text-slate-700'}`}>
            正在准备复盘会议...
          </h3>

          {/* 步骤列表 */}
          <div className="mt-6 space-y-3 text-left">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                {step.status === 'completed' && (
                  <CheckCircle2 className={`w-5 h-5 ${isAI ? 'text-emerald-500' : 'text-emerald-500'}`} />
                )}
                {step.status === 'loading' && (
                  <Loader2 className={`w-5 h-5 animate-spin ${isAI ? 'text-indigo-500' : 'text-violet-500'}`} />
                )}
                <span className={`text-sm ${isAI ? 'text-slate-700' : 'text-slate-600'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <p className={`mt-6 text-sm ${isAI ? 'text-indigo-400' : 'text-slate-400'}`}>
            预计 10 秒后开始
          </p>
        </div>
      </div>
    </div>
  );
};
```

---

### 9. 错误处理组件

```tsx
// 新增：错误重试组件
interface ErrorRetryProps {
  error: ReviewError;
  onRetry: () => void;
  onSkip: () => void;
  isAI: boolean;
}

const ErrorRetry: React.FC<ErrorRetryProps> = ({ error, onRetry, onSkip, isAI }) => {
  return (
    <div className={`p-6 rounded-3xl border transition-all duration-500 ${
      isAI
        ? 'bg-rose-50 border-rose-200'
        : 'bg-rose-50 border-rose-200'
    }`}>
      <div className="flex items-start gap-4">
        {/* 错误图标 */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isAI ? 'bg-rose-100' : 'bg-rose-100'
        }`}>
          <AlertCircle className={`w-6 h-6 ${isAI ? 'text-rose-500' : 'text-rose-500'}`} />
        </div>

        {/* 错误信息 */}
        <div className="flex-1">
          <h4 className={`font-bold text-lg mb-2 ${isAI ? 'text-rose-700' : 'text-rose-700'}`}>
            出现错误
          </h4>
          <p className={`text-sm mb-4 ${isAI ? 'text-rose-600' : 'text-rose-600'}`}>
            {error.message}
          </p>

          {/* 错误详情 */}
          {error.agent && (
            <p className={`text-xs mb-4 ${isAI ? 'text-rose-400' : 'text-rose-400'}`}>
              受影响的 Agent: {AGENT_STYLES[error.agent].name}
            </p>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {error.retryable && (
              <button
                onClick={onRetry}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 ${
                  isAI
                    ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-indigo-200 hover:shadow-indigo-300 text-white'
                    : 'bg-[#8C7CF0] hover:bg-[#7b6be6] text-white shadow-violet-200'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                <span>重试</span>
              </button>
            )}
            <button
              onClick={onSkip}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 ${
                isAI
                  ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200'
                  : 'bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200'
              }`}
            >
              <SkipForward className="w-5 h-5" />
              <span>跳过此步骤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 新增：在会议内容区域中显示错误
{error && (
  <div className="p-4">
    <ErrorRetry
      error={error}
      onRetry={handleRetry}
      onSkip={handleSkipError}
      isAI={isAI}
    />
  </div>
)}
```

---

### 10. 增强版总结卡片组件（支持可执行操作）

```tsx
// 新增：可执行操作项组件
interface ActionItemCardProps {
  item: ActionItem;
  isAI: boolean;
  onExecute: (item: ActionItem) => void;
}

const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, isAI, onExecute }) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'scheduling': return <CalendarPlus className="w-4 h-4" />;
      case 'content': return <FileEdit className="w-4 h-4" />;
      case 'experiment': return <FlaskConical className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (item.priority) {
      case 'high': return 'bg-rose-100 text-rose-600';
      case 'medium': return 'bg-amber-100 text-amber-600';
      case 'low': return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
      isAI
        ? 'bg-white border-indigo-100 hover:border-indigo-200 hover:shadow-md'
        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* 类型图标 */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isAI ? 'bg-indigo-50' : 'bg-slate-50'
        }`}>
          {getTypeIcon()}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isAI ? 'text-slate-700' : 'text-slate-600'} truncate`}>
            {item.text}
          </p>
          {/* 额外信息 */}
          {item.scheduleData && (
            <p className={`text-xs ${isAI ? 'text-indigo-400' : 'text-slate-400'}`}>
              {item.scheduleData.account} @ {item.scheduleData.time}
            </p>
          )}
        </div>

        {/* 优先级标签 */}
        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getPriorityColor()}`}>
          {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
        </span>
      </div>

      {/* 执行按钮 */}
      {item.executable && (
        <button
          onClick={() => onExecute(item)}
          className={`ml-3 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
            isAI
              ? 'bg-gradient-to-r from-indigo-400 to-violet-400 text-white hover:shadow-md'
              : 'bg-[#8C7CF0] text-white hover:shadow-md'
          }`}
        >
          <Plus className="w-3 h-3" />
          <span>执行</span>
        </button>
      )}
    </div>
  );
};

// 更新后的总结卡片组件
const SummaryCard: React.FC<{
  summary: ReviewSummary;
  isAI: boolean;
  onExecuteAction: (item: ActionItem) => void;
  onExport: () => void;
  onSave: () => void;
  onEnd: () => void;
}> = ({ summary, isAI, onExecuteAction, onExport, onSave, onEnd }) => {
  // 统计可执行操作数量
  const executableCount = summary.actionItems.filter(item => item.executable).length;

  return (
    <div className={`p-6 rounded-3xl shadow-xl border transition-all duration-500 ${
      isAI
        ? 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 shadow-indigo-100'
        : 'bg-slate-50 border-slate-100 shadow-slate-100'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isAI ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-50 text-violet-500'
        }`}>
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${isAI ? 'text-slate-800' : 'text-slate-800'}`}>
            今日复盘总结
          </h3>
          {executableCount > 0 && (
            <p className={`text-xs ${isAI ? 'text-indigo-500' : 'text-violet-500'}`}>
              {executableCount} 个可执行操作待处理
            </p>
          )}
        </div>
      </div>

      {/* 关键洞察 */}
      <div className="mb-6">
        <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isAI ? 'text-indigo-600' : 'text-slate-400'}`}>
          ✅ 关键洞察
        </h4>
        <ul className="space-y-2">
          {summary.keyInsights.map((insight, index) => (
            <li key={index} className={`text-sm ${isAI ? 'text-slate-700' : 'text-slate-600'}`}>
              • {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* 明日行动计划（增强版） */}
      <div className="mb-6">
        <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isAI ? 'text-indigo-600' : 'text-slate-400'}`}>
          🎯 明日行动计划
        </h4>
        <div className="space-y-2">
          {summary.actionItems.map((item, index) => (
            <ActionItemCard
              key={item.id || index}
              item={item}
              isAI={isAI}
              onExecute={onExecuteAction}
            />
          ))}
        </div>
      </div>

      {/* 待验证假设 */}
      <div className="mb-6">
        <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isAI ? 'text-indigo-600' : 'text-slate-400'}`}>
          🧪 待验证假设
        </h4>
        <ul className="space-y-2">
          {summary.hypotheses.map((hypothesis, index) => (
            <li key={index} className={`text-sm ${isAI ? 'text-slate-700' : 'text-slate-600'}`}>
              • {hypothesis}
            </li>
          ))}
        </ul>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onExport}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 ${
            isAI
              ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-indigo-200 hover:shadow-indigo-300 text-white'
              : 'bg-[#8C7CF0] hover:bg-[#7b6be6] text-white shadow-violet-200'
          }`}
        >
          <Download className="w-5 h-5" />
          <span>导出报告</span>
        </button>
        <button
          onClick={onSave}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 ${
            isAI
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Save className="w-5 h-5" />
          <span>保存记录</span>
        </button>
        <button
          onClick={onEnd}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:-translate-y-1 active:scale-95 ${
            isAI
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <X className="w-5 h-5" />
          <span>结束会议</span>
        </button>
      </div>
    </div>
  );
};

// 新增：执行操作的处理器
const handleExecuteAction = async (item: ActionItem) => {
  switch (item.type) {
    case 'scheduling':
      if (item.scheduleData) {
        // 调用排期 API，添加到明日排期
        await fetch('/api/schedule/add', {
          method: 'POST',
          body: JSON.stringify({
            account: item.scheduleData.account,
            time: item.scheduleData.time,
            videoId: item.scheduleData.videoId,
            date: item.scheduleData.date || getTomorrowDate()
          })
        });
        // 显示成功提示
        toast.success('已添加到明日排期');
      }
      break;
    case 'experiment':
      if (item.experimentData) {
        // 创建实验记录
        await fetch('/api/experiments/create', {
          method: 'POST',
          body: JSON.stringify(item.experimentData)
        });
        toast.success('实验已创建');
      }
      break;
    default:
      // 其他类型的操作
      toast.info('操作已记录');
  }
};
```

---

## 📝 CSS 样式补充

在 `styles/theme-ai.css` 中新增以下样式：

```css
/* ==================== Agent 状态动画 ==================== */

.agent-thinking {
  animation: agent-breathe 2s ease-in-out infinite;
}

@keyframes agent-breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 0 rgba(99, 102, 241, 0);
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
  }
}

.agent-speaking {
  animation: agent-speak 1s ease-in-out infinite;
}

@keyframes agent-speak {
  0%, 100% {
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.7);
  }
}

/* ==================== 消息气泡动画 ==================== */

.message-appear {
  animation: message-slide-in 0.3s ease-out;
}

@keyframes message-slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 打字机光标效果 ==================== */

.typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: currentColor;
  animation: typewriter-blink 1s step-end infinite;
  vertical-align: text-bottom;
  margin-left: 2px;
}

@keyframes typewriter-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* ==================== shimmer 按钮动画 ==================== */

@keyframes shimmer {
  0% {
    transform: skewX(-12deg) translateX(-100%);
  }
  100% {
    transform: skewX(-12deg) translateX(200%);
  }
}
```

---

## 🛠️ 技术实现

### 前端类型定义

```typescript
// types/review.ts
export type AgentType = 'analyst' | 'strategist' | 'hacker';
export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'completed';
export type ReviewStatus = 'preparing' | 'in_progress' | 'discussion' | 'completed';
export type ReviewStage = '数据准备' | '数据分析' | '策略制定' | '增长建议' | '会议总结'; // 新增：进度条阶段名称
export type InteractionMode = 'sequential' | 'interrupt'; // 新增：交互模式

export interface ReviewMessage {
  id: string;
  agent: AgentType;
  content: string;
  timestamp: number;
  type: 'text' | 'data_card' | 'suggestion';
}

// 新增：视频内容详细信息（供增长黑客使用）
export interface VideoDetail {
  id: string;
  title: string;
  tags: string[];
  coverDescription?: string; // OCR 提取的关键帧描述（需在 Phase 2 完成相应能力或通过预置数据提供）
  thumbnailUrl?: string;
  duration?: number;
}

// 新增：增强版 ActionItem，支持可执行操作
export interface ActionItem {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  type: 'scheduling' | 'content' | 'experiment' | 'general'; // 新增：操作类型
  executable?: boolean; // 新增：是否可一键执行
  // 新增：排期相关字段（当 type='scheduling' 时使用）
  scheduleData?: {
    account: string;
    time: string; // HH:mm 格式
    videoId?: string;
    date?: string; // 默认为明天
  };
  // 新增：实验相关字段（当 type='experiment' 时使用）
  experimentData?: {
    hypothesisId: string;
    variables: Record<string, any>;
    duration?: number; // 实验持续天数
  };
}

// 新增：历史复盘记录
export interface ReviewHistory {
  date: string;
  summary: ReviewSummary;
  hypotheses: string[]; // 当日提出的假设
  validatedHypotheses: Array<{
    hypothesis: string;
    result: 'proven' | 'disproven' | 'inconclusive';
    evidence: string;
  }>;
}

export interface ReviewSummary {
  keyInsights: string[];
  actionItems: ActionItem[];
  hypotheses: string[];
}

// 新增：Agent 上下文（包含视频详细信息）
export interface AgentContext {
  date: string;
  videos: VideoItem[];
  videoDetails: VideoDetail[]; // 新增：视频详细信息
  aiScores: VideoScore[];
  feishuData: any;
  previousReviews?: ReviewHistory[]; // 新增：历史复盘记录（最多 7 天）
  yesterdayHypotheses?: string[]; // 新增：昨天提出的假设
}

// 新增：错误状态
export interface ReviewError {
  code: string;
  message: string;
  retryable: boolean;
  agent?: AgentType;
}

export interface ReviewState {
  status: ReviewStatus;
  currentAgent: AgentType | null;
  agentStatus: {
    analyst: AgentStatus;
    strategist: AgentStatus;
    hacker: AgentStatus;
  };
  messages: ReviewMessage[];
  userQuestions: string[];
  summary?: ReviewSummary;
  context: AgentContext; // 使用增强版上下文
  interactionMode: InteractionMode; // 新增：交互模式
  canInteract: boolean; // 新增：用户是否可交互
  error?: ReviewError; // 新增：错误状态
}

// 新增：前端辅助工具需求
// 1. toast: 使用项目现有的 react-hot-toast 或类似库
// 2. getTomorrowDate: () => string (YYYY-MM-DD)
// 3. Lucide Icons: 需导入 Sparkles, Play, Loader2, CheckCircle2, MessageCircle, FolderOpen, SkipForward, AlertCircle, RefreshCw, FileEdit, FlaskConical, Plus, FileText, Download, Save, X, CalendarPlus 等
```

---

### 后端 API 设计

#### 交互模式说明

**新增：用户提问时机机制**

为确保会议流程的流畅性和技术实现的简单性，本设计采用**轮流发言制（Sequential Mode）**：

| 机制 | 说明 | 实现方式 |
|-----|------|---------|
| **提问时机** | 仅在 Agent 发言完成（状态为 `completed`）后，用户方可提问 | `canInteract` 状态控制 |
| **打断机制** | MVP 阶段不支持打断，避免 SSE 流中断的复杂性 | 提问按钮在 Agent 发言时禁用 |
| **多轮对话** | 支持 Agent 完成发言后的多轮追问 | 每次提问触发新的 API 调用 |
| **上下文保持** | 所有对话内容保留在 `messages` 数组中，Agent 可引用历史 | 消息历史传递给 LLM |

```typescript
// 前端状态控制示例
const canInteract = useMemo(() => {
  // 仅在以下情况下允许用户交互：
  // 1. 会议处于 discussion 阶段
  // 2. 当前没有 Agent 在发言（speaking/thinking）
  // 3. 没有未处理的错误
  return (
    state.status === 'discussion' &&
    state.currentAgent === null &&
    !state.error
  );
}, [state.status, state.currentAgent, state.error]);
```

**未来增强（可选）**：
- 支持用户打断 Agent 发言（需要中断 SSE 流和 LLM 请求）
- 支持多 Agent 同时讨论（需要复杂的上下文共享机制）
- 支持语音提问（集成语音识别）

---

#### 1. 启动复盘会议

```python
POST /api/review/start

Request:
{
  "date": "2024-12-27",
  "account_filter": ["ai图书"]
}

Response:
{
  "review_id": "rev_20241227_xxx",
  "data_summary": {
    "total_videos": 9,
    "total_views": 45000,
    "avg_score": 6.5
  },
  "agents": ["analyst", "strategist", "hacker"]
}
```

#### 2. 获取 Agent 发言（流式）

```python
GET /api/review/{review_id}/agent/{agent_type}/speak

Response (SSE Stream):
data: {"agent": "analyst", "content_delta": "今日", "status": "streaming"}
data: {"agent": "analyst", "content_delta": "共发布", "status": "streaming"}
...
data: {"agent": "analyst", "content_delta": "", "status": "complete"}
```

#### 3. 用户提问

```python
POST /api/review/{review_id}/ask

Request:
{
  "question": "为什么 19:30 效果最好？",
  "target_agent": "analyst"
}

Response:
{
  "agent": "analyst",
  "answer": "根据数据分析..."
}
```

#### 4. 生成总结

```python
POST /api/review/{review_id}/summarize

Response:
{
  "summary": {
    "key_insights": [...],
    "action_items": [...],
    "hypotheses": [...]
  }
}
```

#### 5. 获取历史复盘记录（新增）

```python
GET /api/review/history?days=7

Response:
{
  "history": [
    {
      "date": "2024-12-26",
      "summary": {
        "key_insights": [...],
        "action_items": [...],
        "hypotheses": ["H1: 标题疑问句式可能提升点击率"]
      },
      "validated_hypotheses": [
        {
          "hypothesis": "H1: 标题疑问句式可能提升点击率",
          "result": "proven",
          "evidence": "使用疑问句式的标题平均点击率提升 15%"
        }
      ]
    },
    ...
  ]
}
```

#### 6. 执行操作项（新增）

```python
POST /api/review/{review_id}/action/execute

Request:
{
  "action_id": "act_xxx",
  "type": "scheduling"
}

Response:
{
  "success": true,
  "message": "已添加到明日排期",
  "result": {
    "schedule_id": "sch_xxx",
    "account": "ai图书",
    "time": "19:30",
    "date": "2024-12-28"
  }
}
```

---

### 后端并发预加载策略（新增）

**问题**：如果三个 Agent 串行生成，耗时可能较长（每人 30 秒，开会就要 2 分钟）。

**解决方案**：采用**并发预加载 + 串行播放**策略。

```
┌─────────────────────────────────────────────────────────────────┐
│                        加载屏阶段                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Agent 1    │  │   Agent 2    │  │   Agent 3    │         │
│  │  并发请求中  │  │  并发请求中  │  │  并发请求中  │         │
│  │  ████████░░  │  │  ████████░░  │  │  ████████░░  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  后端：同时发起 3 个 LLM 请求，缓存结果                          │
│  预计耗时：~30 秒（而非 90 秒串行）                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        会议进行阶段                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent 1: 从缓存读取 → 流式输出 ████████████████ 100%           │
│  Agent 2: 从缓存读取 → 流式输出 ████████░░░░░░░░░  40%           │
│  Agent 3: 等待中           ░░░░░░░░░░░░░░░░░░░   0%             │
│                                                                  │
│  前端：按顺序播放已缓存的内容，体感流畅                          │
└─────────────────────────────────────────────────────────────────┘
```

**实现方式**：

```python
# backend/services/review/review_manager.py

import asyncio
from typing import Dict, List

class ReviewManager:
    def __init__(self):
        self.content_cache: Dict[str, str] = {}  # agent_type -> content

    async def prepare_all_agents(self, review_id: str, context: AgentContext) -> None:
        """
        在加载屏阶段并发预加载所有 Agent 的内容
        """
        tasks = [
            self._generate_agent_content('analyst', context),
            self._generate_agent_content('strategist', context),
            self._generate_agent_content('hacker', context)
        ]
        # 并发执行，等待全部完成
        await asyncio.gather(*tasks)

    async def _generate_agent_content(self, agent_type: str, context: AgentContext) -> None:
        """
        生成单个 Agent 的内容并缓存
        """
        agent = self._create_agent(agent_type)
        content = await agent.generate(context)
        self.content_cache[agent_type] = content

    async def get_agent_stream(self, agent_type: str) -> AsyncIterator[str]:
        """
        获取 Agent 的流式输出（从缓存或实时生成）
        """
        if agent_type in self.content_cache:
            # 从缓存流式输出（模拟打字机效果）
            content = self.content_cache[agent_type]
            for char in content:
                yield char
                await asyncio.sleep(0.01)  # 打字机延迟
        else:
            # 缓存未命中，实时生成
            async for chunk in self._generate_realtime(agent_type):
                yield chunk

# backend/routes/review.py

@router.post("/api/review/{review_id}/start")
async def start_review(review_id: str, request: ReviewStartRequest):
    # 初始化 Manager
    manager = ReviewManager(review_id)

    # 异步开始预加载（不阻塞响应）
    asyncio.create_task(manager.prepare_all_agents(review_id, context))

    return {
        "review_id": review_id,
        "status": "preparing",
        "estimated_time": 10  # 预计 10 秒后开始
    }
```

**前端配合**：

```typescript
// 前端在加载屏阶段轮询检查准备状态
const checkPreparationStatus = async (reviewId: string) => {
  const response = await fetch(`/api/review/${reviewId}/status`);
  const { ready, progress } = await response.json();

  if (ready) {
    // 隐藏加载屏，开始播放
    setLoadingScreen(false);
    startPlayingAgents();
  } else {
    // 继续等待
    setTimeout(() => checkPreparationStatus(reviewId), 500);
  }
};
```

---

## 📁 目录结构

```
src/
├── components/
│   └── ReviewView/
│       ├── index.tsx             # 主视图
│       ├── AgentAvatar.tsx       # Agent 头像
│       ├── AgentMessage.tsx      # 消息气泡
│       ├── UserActions.tsx       # 用户操作
│       ├── ReviewProgress.tsx    # 进度条
│       ├── LoadingScreen.tsx     # 加载屏
│       ├── SummaryCard.tsx       # 总结卡片
│       └── constants.ts          # 样式常量

backend/
├── services/
│   └── review/
│       ├── __init__.py
│       ├── agent_factory.py
│       ├── agent_context.py
│       ├── agents/
│       │   ├── base.py
│       │   ├── data_analyst.py
│       │   ├── strategist.py
│       │   └── growth_hacker.py
│       └── prompts/
│           ├── analyst_prompt.py
│           ├── strategist_prompt.py
│           └── hacker_prompt.py
├── models/
│   └── review.py
└── routes/
    └── review.py
```

---

## 🎯 实施计划

| 阶段 | 任务 | 预计时间 |
|-----|------|---------|
| 1 | 后端基础（Agent 类、API 路由、Prompts） | 3-4 小时 |
| 2 | 前端 UI（主视图、组件实现） | 4-5 小时 |
| 3 | 流式输出（SSE、打字机效果） | 2-3 小时 |
| 4 | 自由讨论（上下文共享、多轮对话） | 2-3 小时 |
| 5 | 总结与导出 | 2 小时 |

**总计**: 13-17 小时

---

## 🚀 增强功能（可选）

1. **语音模式**：TTS 语音输出
2. **会议录制**：回放历史复盘
3. **智能摘要**：可分享图文报告
4. **趋势追踪**：连续复盘趋势图
5. **实验追踪**：记录并追踪实验结果
6. **Agent 自定义**：用户自定义 System Prompt

---

## 📝 设计变更记录

| 版本 | 日期 | 变更内容 |
|-----|------|---------|
| v1.0 | 2024-12-27 | 初始设计 |
| v1.1 | 2024-12-27 | UI 样式详细化，与项目风格对齐 |
| v1.3 | 2024-12-27 | **补充优化建议实现**：ActionItem 可执行性、历史记忆系统、视频内容上下文、错误处理 UI、用户提问机制、并发预加载策略 |

---

### 💾 数据存储方案

为了确保历史记忆的持久化和高性能读取，采用以下双重存储方案：

1. **持久化存储 (Feishu Bitable)**
   - **数据表**: `Review_Logs`
   - **存储内容**: 每日复盘的最终总结 (`ReviewSummary`)、行动项 (`ActionItems`) 和待验证假设 (`Hypotheses`)。
   - **同步时机**: 用户点击“保存记录”或会议正常结束时自动同步。
   - **核心价值**: 数据跨设备同步，支持在飞书客户端直接查看复盘结论。

2. **本地上下文缓存 (Local Storage)**
   - **路径**: `backend/data/reviews/*.json`
   - **存储内容**: 完整的会议对话原始记录 (`ReviewMessage[]`)。
   - **清理策略**: 自动保留最近 14 天的完整对话，超期仅保留 Summary。
   - **核心价值**: 提供给 AI 高性能的上下文检索，支持“回顾过去一周实验结论”的深度分析。

---

**文档版本历史**
- v1.0 (2024-12-27): 初始设计
- v1.1 (2024-12-27): 补充详细 UI 样式实现，与项目整体风格对齐
- v1.3 (2024-12-27): **补充完整优化建议**：

### v1.3 新增内容详情

1. **ActionItem 可执行性**
   - 新增 `ActionItem` 类型，支持 `scheduling`、`content`、`experiment`、`general` 四种操作类型
   - 新增 `scheduleData` 和 `experimentData` 字段，支持结构化操作数据
   - 新增 `ActionItemCard` 组件，支持一键执行操作
   - 新增 `/api/review/{review_id}/action/execute` API

2. **历史记忆 (Memory) 系统**
   - 新增 `ReviewHistory` 接口，存储历史复盘记录
   - 新增 `AgentContext.previousReviews` 字段，支持最多 7 天历史
   - 新增 `yesterdayHypotheses` 字段，供 Agent 参考昨日假设
   - 新增 `/api/review/history?days=7` API
   - Agent System Prompt 增强，支持引用历史复盘结果

3. **视频内容详细上下文**
   - 新增 `VideoDetail` 接口，包含标题、标签、封面描述（OCR）、缩略图等
   - `AgentContext.videoDetails` 字段，供增长黑客 Agent 使用
   - 增长黑客建议更加具体化（如："前 3 秒加入 AI 图书实物展示"）

4. **错误处理 UI**
   - 新增 `ReviewError` 接口，包含错误代码、消息、是否可重试等信息
   - 新增 `ErrorRetry` 组件，支持重试和跳过操作
   - 错误状态在 `ReviewState.error` 中维护

5. **用户提问时机机制**
   - 新增 `InteractionMode` 类型（`sequential` | `interrupt`）
   - 新增 `canInteract` 状态控制
   - 采用轮流发言制（Sequential Mode），确保会议流程流畅
   - Agent 发言时提问按钮禁用，避免 SSE 流中断

6. **后端并发预加载策略**
   - 新增 `ReviewManager` 类，支持 Agent 内容并发生成和缓存
   - 加载屏阶段同时发起 3 个 LLM 请求，预计耗时从 90 秒降至 30 秒
   - 前端按顺序播放已缓存内容，体感流畅
   - 新增 `/api/review/{review_id}/status` 轮询接口

---
