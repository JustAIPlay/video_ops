// components/ReviewView/index.tsx
// Phase 3: 每日复盘会议功能 - 主视图组件

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Play, Loader2 } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import toast from 'react-hot-toast';
import { AGENT_STYLES, AGENT_ORDER } from './constants';
import { AgentAvatar } from './AgentAvatar';
import { AgentMessage } from './AgentMessage';
import { UserActions } from './UserActions';
import { ReviewProgress } from './ReviewProgress';
import { LoadingScreen } from './LoadingScreen';
import { ErrorRetry } from './ErrorRetry';
import { SummaryCard } from './SummaryCard';
import type {
  AgentType,
  AgentStatus,
  ReviewStatus,
  ReviewStage,
  ReviewMessage,
  ReviewSummary,
  ActionItem,
  ReviewError,
  AgentContext
} from '../../types/review';

// 获取明天的日期 (YYYY-MM-DD)
const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Mock 数据准备（待后端实现后移除）
const mockLoadingSteps = [
  { label: '从飞书获取今日数据', status: 'completed' },
  { label: '加载 AI 分析结果', status: 'completed' },
  { label: '初始化 Agent...', status: 'loading' }
];

const mockAgentMessages: Partial<Record<AgentType, string>> = {
  analyst: `# 今日数据概览

1. 今日概览
   - 发布数量：9 条
   - 总播放量：45,230
   - 平均互动率：3.8%

2. Top 3 表现
   - 🥇 AI图书推荐-高效学习法 - 播放 8,450 | 互动率 4.2%
   - 🥈 10分钟掌握ChatGPT - 播放 6,780 | 互动率 3.9%
   - 🥉 Python入门实战教程 - 播放 5,620 | 互动率 3.5%

3. 需关注数据
   - ⚠️ 3 条视频播放量 < 1000
   - ⚠️ 平均完播率下降 2.1%

4. 数据洞察
   - AI 图书赛道流量整体上升
   - 19:30-20:30 时段效果最佳`,
  strategist: `# 策略执行评估

1. 策略执行评估
   - 今日排期计划完成度：100%
   - 预估准确率：87%（实际 vs 预期）

2. 时段效果分析
   - 🟢 最佳时段：19:30-20:30（平均播放 3,200）
   - 🟡 一般时段：17:00-18:00（平均播放 1,800）
   - 🔴 避免时段：12:00-13:00（平均播放 800）

3. 内容组合评估
   - 单一内容发布 vs 组合发布效果对比
   - 账号间协同效应分析

4. 明日排期建议
   - 建议发布时段：19:30、20:00、20:30
   - 建议发布顺序：先干货后引流`,
  hacker: `# 关键发现

1. 关键发现
   - 💡 意外成功：《AI图书推荐》虽然评分 B 但播放量突出
   - 🔍 异常案例：《Python实战》评分 A 但播放低迷，原因分析

2. 假设生成
   - H1: "前 3 秒加入 AI 图书实物展示，可能提升完播率"
   - H2: "标题增加疑问句式，可能提升点击率"
   - H3: "ai图书账号在晚间发布效果可能更好"

3. 实验建议
   - 🧪 实验 1：A/B 测试标题风格
   - 🧪 实验 2：测试不同封面图
   - 🧪 实验 3：测试发布时间

4. 快速行动项
   - [高优先级] 明日即可尝试：疑问句式标题
   - [中优先级] 本周准备：封面图 A/B 测试
   - [低优先级] 长期优化：实物展示开场`
};

const mockSummary: ReviewSummary = {
  keyInsights: [
    'AI 图书赛道流量整体上升趋势明显',
    '19:30-20:30 是黄金发布时段',
    '疑问句式标题可提升点击率',
    '完播率有下降趋势，需优化前3秒内容'
  ],
  actionItems: [
    {
      id: 'act_1',
      text: '明天 19:30 在 ai图书 账号发布视频',
      priority: 'high',
      type: 'scheduling',
      executable: true,
      scheduleData: {
        account: 'ai图书',
        time: '19:30',
        date: getTomorrowDate()
      }
    },
    {
      id: 'act_2',
      text: '优化视频前3秒，加入实物展示',
      priority: 'high',
      type: 'content',
      executable: false
    },
    {
      id: 'act_3',
      text: 'A/B 测试疑问句式标题',
      priority: 'medium',
      type: 'experiment',
      executable: true,
      experimentData: {
        hypothesisId: 'H1',
        variables: { titleStyle: 'question' },
        duration: 3
      }
    }
  ],
  hypotheses: [
    'H1: 前 3 秒加入 AI 图书实物展示，可能提升完播率',
    'H2: 标题增加疑问句式，可能提升点击率',
    'H3: ai图书账号在晚间发布效果可能更好'
  ]
};

export const ReviewView: React.FC = () => {
  const { mode } = useAppContext();
  const isAI = mode === 'ai';

  // 状态管理
  const [status, setStatus] = useState<ReviewStatus>('preparing');
  const [currentAgent, setCurrentAgent] = useState<AgentType | null>(null);
  const [agentStatus, setAgentStatus] = useState<Record<AgentType, AgentStatus>>({
    analyst: 'idle',
    strategist: 'idle',
    hacker: 'idle'
  });
  const [messages, setMessages] = useState<ReviewMessage[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(mockLoadingSteps);
  const [currentStage, setCurrentStage] = useState<ReviewStage>('数据准备');
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(120);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [error, setError] = useState<ReviewError | null>(null);

  // 计算是否可交互
  const canInteract = useMemo(() => {
    return (
      status === 'discussion' &&
      currentAgent === null &&
      !error
    );
  }, [status, currentAgent, error]);

  // 模拟初始化
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingSteps([
        { label: '从飞书获取今日数据', status: 'completed' },
        { label: '加载 AI 分析结果', status: 'completed' },
        { label: '初始化 Agent...', status: 'completed' }
      ]);
      setStatus('in_progress');
      setCurrentStage('数据分析');
      startAgentSequence();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 启动 Agent 序列
  const startAgentSequence = async () => {
    for (const agentType of AGENT_ORDER) {
      await playAgent(agentType);
    }
    setCurrentStage('会议总结');
    setProgress(100);
    setStatus('completed');
    setSummary(mockSummary);
  };

  // 播放单个 Agent
  const playAgent = (agentType: AgentType): Promise<void> => {
    return new Promise((resolve) => {
      setCurrentAgent(agentType);
      setAgentStatus(prev => ({ ...prev, [agentType]: 'thinking' }));

      setTimeout(() => {
        setAgentStatus(prev => ({ ...prev, [agentType]: 'speaking' }));

        // 添加消息
        const message: ReviewMessage = {
          id: `msg_${Date.now()}_${agentType}`,
          agent: agentType,
          content: mockAgentMessages[agentType] || '',
          timestamp: Date.now(),
          type: 'text'
        };
        setMessages(prev => [...prev, message]);

        setTimeout(() => {
          setAgentStatus(prev => ({ ...prev, [agentType]: 'completed' }));
          setCurrentAgent(null);
          setStatus('discussion');
          resolve();
        }, 2000);
      }, 1500);
    });
  };

  // 处理用户操作
  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'ask':
        toast.success('提问功能（待后端实现）');
        break;
      case 'continue':
        if (currentAgent) {
          toast.success(`继续 ${AGENT_STYLES[currentAgent].name} 的发言`);
        }
        break;
      case 'expand':
        toast.success('展开更多内容（待后端实现）');
        break;
      case 'skip':
        if (currentAgent) {
          setAgentStatus(prev => ({ ...prev, [currentAgent]: 'completed' }));
          setCurrentAgent(null);
          setStatus('discussion');
          toast.success('已跳过当前 Agent');
        }
        break;
    }
  }, [currentAgent]);

  // 执行操作项
  const handleExecuteAction = useCallback(async (item: ActionItem) => {
    switch (item.type) {
      case 'scheduling':
        if (item.scheduleData) {
          toast.success(`已添加到明日排期：${item.scheduleData.account} @ ${item.scheduleData.time}`);
        }
        break;
      case 'experiment':
        if (item.experimentData) {
          toast.success('实验已创建');
        }
        break;
      default:
        toast.info('操作已记录');
    }
  }, []);

  // 错误处理
  const handleRetry = useCallback(() => {
    setError(null);
    toast.success('重试中...');
  }, []);

  const handleSkipError = useCallback(() => {
    setError(null);
    if (currentAgent) {
      setAgentStatus(prev => ({ ...prev, [currentAgent]: 'completed' }));
      setCurrentAgent(null);
    }
  }, [currentAgent]);

  // 总结操作
  const handleExport = useCallback(() => {
    toast.success('报告导出中...');
  }, []);

  const handleSave = useCallback(() => {
    toast.success('记录已保存到飞书');
  }, []);

  const handleEnd = useCallback(() => {
    toast.success('会议已结束');
    setStatus('preparing');
    setMessages([]);
    setSummary(null);
    setAgentStatus({
      analyst: 'idle',
      strategist: 'idle',
      hacker: 'idle'
    });
    setCurrentStage('数据准备');
    setProgress(0);
  }, []);

  // 更新进度
  useEffect(() => {
    if (status === 'in_progress' || status === 'discussion') {
      const stageIndex = AGENT_ORDER.findIndex(a => agentStatus[a] === 'completed');
      setProgress((stageIndex + 1) * 20);
    }
  }, [agentStatus, status]);

  return (
    <div className={`flex flex-col h-full p-4 lg:p-8 gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full transition-all duration-500 ${
      isAI ? 'ai-mode-container' : ''
    }`}>
      {/* 加载屏 */}
      {status === 'preparing' && (
        <LoadingScreen
          steps={loadingSteps}
          isAI={isAI}
          estimatedTime={10}
        />
      )}

      {/* Header */}
      <div className={`shrink-0 flex flex-col md:flex-row justify-between items-center rounded-3xl p-6 shadow-xl border transition-all duration-500 ${
        isAI
          ? 'bg-white border-indigo-200 shadow-indigo-100'
          : 'bg-white border-white shadow-slate-100'
      }`}>
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <div className={`w-16 h-16 bg-gradient-to-tr ${
            isAI ? 'from-indigo-400 to-violet-400' : 'from-[#8C7CF0] to-[#C6B9FF]'
          } rounded-2xl flex items-center justify-center shadow-lg ${
            isAI ? 'shadow-indigo-200' : 'shadow-violet-200'
          } rotate-3 transform transition-transform hover:rotate-6`}>
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
      </div>

      {/* Agent 状态栏 */}
      <div className={`flex items-center justify-center gap-8 p-6 rounded-3xl shadow-xl border transition-all duration-500 ${
        isAI
          ? 'bg-white border-indigo-200 shadow-indigo-100'
          : 'bg-white border-white shadow-slate-100'
      }`}>
        {AGENT_ORDER.map((agentType, index) => (
          <React.Fragment key={agentType}>
            <AgentAvatar
              type={agentType}
              status={agentStatus[agentType]}
              size="md"
            />
            {index < AGENT_ORDER.length - 1 && (
              <div className={`w-16 h-0.5 transition-all duration-500 ${
                agentStatus[AGENT_ORDER[index]] === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 进度条 */}
      {(status === 'in_progress' || status === 'discussion') && (
        <ReviewProgress
          currentStage={currentStage}
          progress={progress}
          estimatedTime={estimatedTime}
          isAI={isAI}
        />
      )}

      {/* 会议内容区域 */}
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

            {/* 错误显示 */}
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

            {/* 总结卡片 */}
            {status === 'completed' && summary && (
              <div className="p-4">
                <SummaryCard
                  summary={summary}
                  isAI={isAI}
                  onExecuteAction={handleExecuteAction}
                  onExport={handleExport}
                  onSave={handleSave}
                  onEnd={handleEnd}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 用户操作面板 */}
      {status !== 'preparing' && status !== 'completed' && (
        <UserActions
          canInteract={canInteract}
          isAI={isAI}
          onAsk={() => handleAction('ask')}
          onContinue={() => handleAction('continue')}
          onExpand={() => handleAction('expand')}
          onSkip={() => handleAction('skip')}
        />
      )}
    </div>
  );
};

export default ReviewView;
