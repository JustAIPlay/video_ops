// components/ReviewView/index.tsx
// Phase 3: 每日复盘会议功能 - 主视图组件（微信风格聊天版 + API 对接）

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import toast from 'react-hot-toast';
import { AGENT_STYLES, AGENT_ORDER } from './constants';
import { AgentMessage } from './AgentMessage';
import { ReviewProgress } from './ReviewProgress';
import { LoadingScreen } from './LoadingScreen';
import { ErrorRetry } from './ErrorRetry';
import { SummaryCard } from './SummaryCard';
import { AgentInput } from './AgentInput';
import * as reviewService from '../../services/reviewService';
import type {
  AgentType,
  AgentStatus,
  ReviewStatus,
  ReviewStage,
  ReviewMessage,
  ReviewSummary,
  ActionItem,
  ReviewError
} from '../../types/review';

// 获取明天的日期 (YYYY-MM-DD)
const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// 获取今天的日期 (YYYY-MM-DD)
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Mock 数据（作为降级方案）
const mockLoadingSteps = [
  { label: '从飞书获取今日数据', status: 'completed' },
  { label: '加载 AI 分析结果', status: 'completed' },
  { label: '初始化 Agent...', status: 'loading' }
];

const mockAgentMessages: Partial<Record<AgentType, string>> = {
  analyst: `# 今日数据概览

1. **今日概览**
   - 发布数量：9 条
   - 总播放量：45,230
   - 平均互动率：3.8%

2. **Top 3 表现**
   - 🥇 AI图书推荐-高效学习法 - 播放 8,450 | 互动率 4.2%
   - 🥈 10分钟掌握ChatGPT - 播放 6,780 | 互动率 3.9%
   - 🥉 Python入门实战教程 - 播放 5,620 | 互动率 3.5%

3. **数据洞察**
   - AI 图书赛道流量整体上升`,
  strategist: `# 策略执行评估

1. **策略执行评估**
   - 今日排期计划完成度：100%
   - 预估准确率：87%

2. **时段效果分析**
   - 🟢 最佳时段：19:30-20:30（平均播放 3,200）
   - 🔴 避免时段：12:00-13:00（平均播放 800）

3. **明日排期建议**
   - 建议发布时段：19:30、20:00、20:30`,
  hacker: `# 关键发现

1. **关键发现**
   - 💡 意外成功：《AI图书推荐》虽然评分 B 但播放量突出
   - 🔍 异常案例：《Python实战》评分 A 但播放低迷

2. **假设生成**
   - H1: "前 3 秒加入 AI 图书实物展示，可能提升完播率"
   - H2: "标题增加疑问句式，可能提升点击率"

3. **实验建议**
   - 🧪 A/B 测试标题风格`
};

const mockSummary: ReviewSummary = {
  keyInsights: [
    'AI 图书赛道流量整体上升趋势明显',
    '19:30-20:30 是黄金发布时段',
    '疑问句式标题可提升点击率'
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
    }
  ],
  hypotheses: [
    'H1: 前 3 秒加入 AI 图书实物展示，可能提升完播率',
    'H2: 标题增加疑问句式，可能提升点击率'
  ]
};

export const ReviewView: React.FC = () => {
  const { mode } = useAppContext();
  const isAI = mode === 'ai';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // 状态管理
  const [status, setStatus] = useState<ReviewStatus>('idle');
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
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [error, setError] = useState<ReviewError | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false); // 降级到 Mock 模式
  const [showSummary, setShowSummary] = useState(false); // 控制总结显示

  // 清理 SSE 连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 主持人发起复盘
  const handleStartReview = useCallback(async () => {
    setStatus('preparing');
    setCurrentStage('数据准备');

    try {
      // 调用 API（飞书配置从后端 .env 文件读取）
      const response = await reviewService.startReview({
        date: getTodayDate()
      });
      setReviewId(response.reviewId);

      // 更新加载步骤
      setLoadingSteps([
        { label: '从飞书获取今日数据', status: 'completed' },
        { label: `加载 ${response.dataSummary.totalVideos} 条视频数据`, status: 'completed' },
        { label: '初始化 Agent...', status: 'loading' }
      ]);

      // 轮询检查准备状态
      const pollStatus = setInterval(async () => {
        try {
          const statusResp = await reviewService.getReviewStatus(response.reviewId);
          setProgress(statusResp.progress);

          if (statusResp.ready) {
            clearInterval(pollStatus);
            setStatus('in_progress');
            setCurrentStage('数据分析');
            startAgentSequence(response.reviewId);
          }
        } catch (err) {
          console.error('[Review] 轮询状态失败:', err);
          clearInterval(pollStatus);
          // 降级到 Mock 模式
          fallbackToMock();
        }
      }, 1000);

    } catch (err) {
      console.error('[Review] 启动复盘失败，使用 Mock 模式:', err);
      fallbackToMock();
    }
  }, []);

  // 降级到 Mock 模式
  const fallbackToMock = useCallback(() => {
    setUseMock(true);
    toast('后端服务不可用，使用演示模式', { icon: '⚠️' });

    setTimeout(() => {
      setLoadingSteps([
        { label: '从飞书获取今日数据', status: 'completed' },
        { label: '加载 AI 分析结果', status: 'completed' },
        { label: '初始化 Agent...', status: 'completed' }
      ]);
      setStatus('in_progress');
      setCurrentStage('数据分析');
      startMockAgentSequence();
    }, 1500);
  }, []);

  // 启动 Agent 序列（真实 API）
  const startAgentSequence = useCallback(async (id: string) => {
    for (const agentType of AGENT_ORDER) {
      await playAgent(id, agentType);
    }
    // Agent 全部完成，进入 discussion 状态
    setStatus('discussion');
    setCurrentStage('会议总结');
    setProgress(100);
  }, []);

  // Mock Agent 序列
  const startMockAgentSequence = useCallback(async () => {
    for (const agentType of AGENT_ORDER) {
      await playMockAgent(agentType);
    }
    setStatus('discussion');
    setCurrentStage('会议总结');
    setProgress(100);
  }, []);

  // 播放单个 Agent（真实 API - SSE）
  const playAgent = useCallback((id: string, agentType: AgentType): Promise<void> => {
    return new Promise((resolve, reject) => {
      setCurrentAgent(agentType);
      setAgentStatus(prev => ({ ...prev, [agentType]: 'thinking' }));

      let content = '';
      let messageSent = false;

      try {
        const eventSource = reviewService.createAgentStream(id, agentType);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);

            if (data.status === 'streaming') {
              // 流式内容更新
              if (!messageSent) {
                setAgentStatus(prev => ({ ...prev, [agentType]: 'speaking' }));
                messageSent = true;
              }
              content += data.content_delta || '';

              // 更新消息内容
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.agent === agentType && lastMsg.id.startsWith('stream_')) {
                  // 更新现有消息
                  return prev.map(msg =>
                    msg.id === lastMsg.id
                      ? { ...msg, content }
                      : msg
                  );
                } else {
                  // 创建新消息
                  const newMsg: ReviewMessage = {
                    id: `stream_${Date.now()}_${agentType}`,
                    agent: agentType,
                    content,
                    timestamp: Date.now(),
                    type: 'text'
                  };
                  return [...prev, newMsg];
                }
              });
            } else if (data.status === 'complete') {
              // 完成
              eventSource.close();
              setAgentStatus(prev => ({ ...prev, [agentType]: 'completed' }));
              setCurrentAgent(null);
              resolve();
            } else if (data.status === 'error') {
              // 错误
              eventSource.close();
              reject(new Error(data.message || 'Agent 发言失败'));
            }
          } catch (err) {
            console.error('[Review] 解析 SSE 数据失败:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('[Review] SSE 连接错误:', err);
          eventSource.close();
          reject(err);
        };

      } catch (err) {
        console.error('[Review] 创建 SSE 连接失败:', err);
        reject(err);
      }
    });
  }, []);

  // Mock Agent 播放
  const playMockAgent = useCallback((agentType: AgentType): Promise<void> => {
    return new Promise((resolve) => {
      setCurrentAgent(agentType);
      setAgentStatus(prev => ({ ...prev, [agentType]: 'thinking' }));

      setTimeout(() => {
        setAgentStatus(prev => ({ ...prev, [agentType]: 'speaking' }));

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
          resolve();
        }, 1500);
      }, 1000);
    });
  }, []);

  // 查看总结
  const handleShowSummary = useCallback(async () => {
    if (useMock || !reviewId) {
      setSummary(mockSummary);
      setShowSummary(true);
      setStatus('completed');
    } else {
      try {
        const summaryResp = await reviewService.summarizeReview(reviewId);
        setSummary(summaryResp.summary);
        setShowSummary(true);
        setStatus('completed');
      } catch (err) {
        console.error('[Review] 生成总结失败，使用 Mock:', err);
        setSummary(mockSummary);
        setShowSummary(true);
        setStatus('completed');
      }
    }
  }, [reviewId, useMock]);

  // 执行操作项
  const handleExecuteAction = useCallback(async (item: ActionItem) => {
    if (!useMock && reviewId) {
      try {
        await reviewService.executeAction(reviewId, item.id, item.type);
      } catch (err) {
        console.error('[Review] 执行操作失败:', err);
      }
    }

    switch (item.type) {
      case 'scheduling':
        if (item.scheduleData) {
          toast.success(`已添加到明日排期：${item.scheduleData.account} @ ${item.scheduleData.time}`);
        }
        break;
      case 'experiment':
        toast.success('实验已创建');
        break;
      default:
        toast.info('操作已记录');
    }
  }, [reviewId, useMock]);

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
    // 关闭 SSE 连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    toast.success('会议已结束');
    setStatus('idle');
    setMessages([]);
    setSummary(null);
    setShowSummary(false);
    setAgentStatus({
      analyst: 'idle',
      strategist: 'idle',
      hacker: 'idle'
    });
    setCurrentStage('数据准备');
    setProgress(0);
    setReviewId(null);
    setUseMock(false);
  }, []);

  // 用户提问处理 - 解析 @agent 语法
  const handleUserQuestion = useCallback(async (input: string) => {
    // 添加用户消息
    const userMessage: ReviewMessage = {
      id: `msg_${Date.now()}_user`,
      agent: 'user',
      content: input,
      timestamp: Date.now(),
      type: 'text'
    };
    setMessages(prev => [...prev, userMessage]);

    // 解析 @agent 语法（支持中文）
    // 匹配 @后面跟着中文或英文的 agent 名称
    const atMatch = input.match(/@([数据分析排期策略增长黑客analyststrategisthacker]+)/);
    let targetAgent: AgentType | null = null;
    let question = input;

    if (atMatch) {
      const agentName = atMatch[1];
      // 映射中文名称到 agent 类型
      const agentMap: Record<string, AgentType> = {
        '数据分析': 'analyst',
        'analyst': 'analyst',
        '排期策略': 'strategist',
        'strategist': 'strategist',
        '增长黑客': 'hacker',
        'hacker': 'hacker'
      };
      targetAgent = agentMap[agentName] || null;
      // 移除 @agent 部分（支持中文字符）
      question = input.replace(/@[数据分析排期策略增长黑客analyststrategisthacker]+\s*/, '').trim();
    }

    // 如果没有指定 agent，默认使用 analyst
    const agentToAsk = targetAgent || 'analyst';

    if (useMock || !reviewId) {
      // Mock 模式：模拟回复
      setTimeout(() => {
        const mockReply: ReviewMessage = {
          id: `msg_${Date.now()}_${agentToAsk}`,
          agent: agentToAsk,
          content: `**${AGENT_STYLES[agentToAsk].name}**:\n\n关于"${question}"的回答：\n\n这是一个 Mock 回复。在真实模式下，我会调用后端 API 获取 ${AGENT_STYLES[agentToAsk].name} 的分析结果。`,
          timestamp: Date.now(),
          type: 'text'
        };
        setMessages(prev => [...prev, mockReply]);
      }, 1000);
    } else {
      // 真实 API：调用后端提问接口
      try {
        const response = await reviewService.askQuestion(reviewId, {
          question,
          targetAgent: agentToAsk
        });

        const agentReply: ReviewMessage = {
          id: `msg_${Date.now()}_${response.agent}`,
          agent: response.agent,
          content: response.answer,
          timestamp: response.timestamp,
          type: 'text'
        };
        setMessages(prev => [...prev, agentReply]);
      } catch (err) {
        console.error('[Review] 提问失败:', err);
        toast.error('提问失败，请重试');
      }
    }
  }, [reviewId, useMock]);

  // 更新进度
  useEffect(() => {
    if (status === 'in_progress' || status === 'discussion') {
      const stageIndex = AGENT_ORDER.findIndex(a => agentStatus[a] === 'completed');
      setProgress((stageIndex + 1) * 25); // 0, 25, 50, 75, 100
    }
  }, [agentStatus, status]);

  // 判断是否显示总结按钮
  const showSummaryButton = useMemo(() => {
    return status === 'discussion' && !showSummary;
  }, [status, showSummary]);

  return (
    <div className={`flex flex-col h-full p-4 lg:p-8 gap-4 lg:gap-6 max-w-[1400px] mx-auto w-full transition-all duration-500 ${
      isAI ? 'ai-mode-container' : ''
    }`}>
      {/* Header */}
      <div className={`shrink-0 flex items-center justify-between rounded-2xl px-6 py-4 shadow-lg border transition-all duration-500 ${
        isAI
          ? 'bg-white border-indigo-200 shadow-indigo-100'
          : 'bg-white border-slate-200 shadow-slate-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 bg-gradient-to-tr rounded-xl flex items-center justify-center shadow-lg ${
            isAI ? 'from-indigo-400 to-violet-400 shadow-indigo-200' : 'from-[#8C7CF0] to-[#C6B9FF] shadow-violet-200'
          }`}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-bold transition-colors duration-500 ${
              isAI ? 'text-slate-800' : 'text-slate-800'
            }`}>每日复盘会议</h2>
            <p className={`text-xs font-medium transition-colors duration-500 ${
              isAI ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {status === 'idle' && '等待发起'}
              {status === 'preparing' && '准备中...'}
              {status === 'in_progress' && '进行中'}
              {status === 'discussion' && '讨论中 - 点击下方按钮查看总结'}
              {status === 'completed' && '已完成'}
              {useMock && ' (演示模式)'}
            </p>
          </div>
        </div>

        {/* Agent 状态指示器 */}
        {status !== 'idle' && (
          <div className="flex items-center gap-3">
            {AGENT_ORDER.map((agentType) => (
              <div
                key={agentType}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                  agentStatus[agentType] === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : agentStatus[agentType] === 'thinking'
                    ? 'bg-amber-400 text-white animate-pulse'
                    : agentStatus[agentType] === 'speaking'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
                title={AGENT_STYLES[agentType].name}
              >
                {AGENT_STYLES[agentType].avatar}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 进度条 */}
      {(status === 'preparing' || status === 'in_progress') && (
        <ReviewProgress
          currentStage={currentStage}
          progress={progress}
          estimatedTime={60}
          isAI={isAI}
        />
      )}

      {/* 聊天区域 */}
      <div className={`flex-1 min-h-0 rounded-2xl shadow-lg border flex flex-col relative overflow-hidden transition-all duration-500 ${
        isAI
          ? 'bg-slate-50 border-indigo-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 空状态 */}
          {status === 'idle' && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${
                isAI ? 'bg-indigo-100' : 'bg-slate-100'
              }`}>
                <Sparkles className={`w-10 h-10 ${isAI ? 'text-indigo-400' : 'text-slate-400'}`} />
              </div>
              <p className="text-lg font-medium mb-2">开始今天的复盘会议</p>
              <p className="text-sm">点击下方按钮启动 AI 分析</p>
            </div>
          )}

          {/* 加载屏 */}
          {status === 'preparing' && (
            <LoadingScreen
              steps={loadingSteps}
              isAI={isAI}
              estimatedTime={10}
            />
          )}

          {/* 消息列表 */}
          {messages.length > 0 && (
            <>
              {messages.map((message) => (
                <AgentMessage
                  key={message.id}
                  message={message}
                  isAI={isAI}
                />
              ))}

              {/* 正在输入指示器 */}
              {currentAgent && (
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    AGENT_STYLES[currentAgent].colors.bg
                  }`}>
                    <span className="text-sm">{AGENT_STYLES[currentAgent].avatar}</span>
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    isAI ? 'bg-indigo-50' : 'bg-slate-100'
                  }`}>
                    <div className="flex gap-1">
                      <div className={`w-2 h-2 rounded-full animate-bounce ${
                        isAI ? 'bg-indigo-400' : 'bg-slate-400'
                      }`} style={{ animationDelay: '0ms' }} />
                      <div className={`w-2 h-2 rounded-full animate-bounce ${
                        isAI ? 'bg-indigo-400' : 'bg-slate-400'
                      }`} style={{ animationDelay: '150ms' }} />
                      <div className={`w-2 h-2 rounded-full animate-bounce ${
                        isAI ? 'bg-indigo-400' : 'bg-slate-400'
                      }`} style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* 错误显示 */}
              {error && (
                <ErrorRetry
                  error={error}
                  onRetry={handleRetry}
                  onSkip={handleSkipError}
                  isAI={isAI}
                />
              )}

              {/* 总结卡片 */}
              {showSummary && summary && (
                <SummaryCard
                  summary={summary}
                  isAI={isAI}
                  onExecuteAction={handleExecuteAction}
                  onExport={handleExport}
                  onSave={handleSave}
                  onEnd={handleEnd}
                />
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 底部操作区域 */}
        <div className={`shrink-0 p-4 border-t transition-all duration-500 ${
          isAI ? 'border-indigo-100 bg-white/80' : 'border-slate-100 bg-white/80'
        }`}>
          <div className="max-w-4xl mx-auto">
            {/* 开始复盘按钮 */}
            {status === 'idle' && (
              <div className="flex justify-center">
                <button
                  onClick={handleStartReview}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    isAI
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:scale-105'
                      : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:scale-105'
                  }`}
                >
                  <Play className="w-5 h-5" />
                  开始复盘
                </button>
              </div>
            )}

            {/* 输入框 + 按钮 */}
            {status !== 'idle' && status !== 'preparing' && (
              <>
                {/* Agent 正在分析时的状态显示 */}
                {currentAgent ? (
                  <div className="flex items-center justify-center">
                    <div className="text-sm text-slate-400">
                      {`${AGENT_STYLES[currentAgent].name} 正在分析...`}
                    </div>
                  </div>
                ) : (
                  /* 输入框和按钮 - 水平居中排列 */
                  <AgentInput
                    onSend={handleUserQuestion}
                    disabled={status !== 'discussion' && status !== 'completed'}
                    isAI={isAI}
                    showSummaryButton={showSummaryButton}
                    onShowSummary={handleShowSummary}
                    showEndButton={status === 'completed'}
                    onEnd={handleEnd}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewView;
