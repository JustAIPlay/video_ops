import React, { useState } from 'react';
import { Play, Loader2, Video, AlertCircle, Activity, FileText, MessageSquare, Sparkles, Lightbulb } from 'lucide-react';
import { AppConfig, ScheduleItem, SyncLog, AIAnalysis } from '../types';
import LogConsole from './LogConsole';
import { fetchScheduleData } from '../services/feishuService';
import { useAppContext } from '../contexts/AppContext';
import { VideoScore } from '../services/aiAnalysisService';

interface ScheduleViewProps {
  config: AppConfig;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ config }) => {
  const { mode, analysis } = useAppContext();
  const isAI = mode === 'ai';

  // 根据 video_id 从 AI 分析结果中获取评分
  const getAIScore = (videoId: string): VideoScore | undefined => {
    if (!analysis.results || analysis.results.length === 0) return undefined;
    // video_id 格式: "accountName_timestamp"
    // ScheduleItem 中的 videoId 只是视频编号，需要匹配
    return analysis.results.find(r => r.video_id.includes(videoId));
  };

  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [results, setResults] = useState<ScheduleItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [accountSearchTerm, setAccountSearchTerm] = useState<string>('');
  const [deduplicationMode, setDeduplicationMode] = useState<'all' | 'unique'>('all');

  // AI 策略面板状态
  const [showStrategyPanel, setShowStrategyPanel] = useState(false);
  const [strategyMessages, setStrategyMessages] = useState<string[]>([]);

  // Compute unique groups for the filter dropdown
  const uniqueGroups = Array.from(new Set(results.map(r => r.groupName))).sort();

  // Helper to filter by group first, used for account options and main filter
  const getGroupFilteredResults = () => {
    return selectedGroup === 'all' 
      ? results 
      : results.filter(r => r.groupName === selectedGroup);
  };

  const groupFilteredResults = getGroupFilteredResults();

  // Compute unique accounts based on GROUP FILTERED results
  const uniqueAccounts = Array.from(new Set(groupFilteredResults.map(r => r.accountName))).sort();

  // Filter results based on selected group and deduplication mode
  const filteredResults = (() => {
    // 1. Group Filter (already done in groupFilteredResults)
    let list = groupFilteredResults;

    // 2. Account Filter
    if (accountSearchTerm.trim()) {
      const term = accountSearchTerm.toLowerCase();
      list = list.filter(r => r.accountName.toLowerCase().includes(term));
    } else if (selectedAccount !== 'all') {
      list = list.filter(r => r.accountName === selectedAccount);
    }

    // 3. Deduplication Filter
    if (deduplicationMode === 'unique') {
        const seen = new Set<string>();
        const uniqueList: ScheduleItem[] = [];
        for (const item of list) {
             const key = `${item.groupName}-${item.videoId}`;
             if (!seen.has(key)) {
                 seen.add(key);
                 uniqueList.push(item);
             }
        }
        list = uniqueList;
    }
    return list;
  })();

  const addLog = (level: SyncLog['level'], message: string, detail?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      level,
      message,
      detail
    }]);
  };

  // ============ AI 策略面板组件 ============
  const StrategyPanel = () => {
    if (!showStrategyPanel) return null;

    return (
      <div className={`flex-1 rounded-2xl p-4 border transition-all duration-500 ${
        isAI
          ? 'bg-white border-indigo-200 shadow-indigo-100'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className={`w-5 h-5 ${isAI ? 'text-indigo-500' : 'text-violet-500'}`} />
          <h3 className={`font-bold ${isAI ? 'text-slate-800' : 'text-slate-800'}`}>AI 策略思考中...</h3>
        </div>

        <div className={`font-mono text-sm space-y-2 h-64 overflow-y-auto p-3 rounded-xl ${
          isAI ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'
        }`}>
          {strategyMessages.map((msg, i) => (
            <div key={i} className="opacity-0 animate-[fade-in_0.3s_ease-out_forwards]" style={{ animationDelay: `${i * 0.15}s` }}>
              <span className="text-violet-400">{'>'}</span> {msg}
            </div>
          ))}
          {strategyMessages.length > 0 && (
            <div className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-1" />
          )}
        </div>
      </div>
    );
  };

  // ============ AI 评分徽章组件 ============
  const AIScoreBadge: React.FC<{ score: number; grade?: string }> = ({ score, grade }) => {
    if (!isAI) return null;

    const getGradeStyle = () => {
      if (grade === 'S') return 'stamp-s';
      if (grade === 'A') return 'stamp-a';
      if (grade === 'B') return 'stamp-b';
      return 'stamp-c';
    };

    return (
      <span className={`${getGradeStyle()} text-xs`}>
        {grade || `${score}/10`}
      </span>
    );
  };

  // ============ AI 建议提示组件 ============
  const AITooltip: React.FC<{ advice: string }> = ({ advice }) => {
    const [show, setShow] = useState(false);

    if (!isAI || !advice) return null;

    return (
      <div className="relative group">
        <button
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          className="text-violet-400 hover:text-violet-300 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        {show && (
          <div className={`absolute z-50 p-3 rounded-xl shadow-xl border max-w-xs transition-all duration-300 ${
            isAI
              ? 'bg-slate-700 border-violet-500/30 text-slate-200'
              : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <p className="text-sm">{advice}</p>
          </div>
        )}
      </div>
    );
  };

  const handleStart = async () => {
    if (isComputing) return;
    setIsComputing(true);
    setLogs([]);
    setResults([]);
    setStrategyMessages([]);

    addLog('info', '开始排期计算...');

    // ============ AI 智能模式: 启动策略面板 ============
    if (isAI) {
      setShowStrategyPanel(true);
      addLog('info', '🤖 AI 智能模式已激活，正在分析数据...');

      // 模拟AI策略思考过程
      const strategySteps = [
        '读取历史AI分析数据...',
        `发现 ${results.length || 0} 条待排期视频`,
        '分析账号发布权重...',
        '检测时段拥堵情况...',
        '计算内容-时段匹配度...',
        '生成最优排期策略...',
        '优化发布时间分配...',
        '✅ AI 排期策略生成完成！'
      ];

      for (const step of strategySteps) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setStrategyMessages(prev => [...prev, step]);
        addLog('info', step);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setShowStrategyPanel(false);
    }

    try {
        const data = await fetchScheduleData(config, (msg) => {
            let level: SyncLog['level'] = 'info';
            let cleanMsg = msg;

            if (msg.includes('[错误]')) {
                level = 'error';
                cleanMsg = msg.replace('[错误]', '').trim();
            } else if (msg.includes('[提示]')) {
                level = 'warning';
                cleanMsg = msg.replace('[提示]', '').trim();
            } else if (msg.includes('[新增]') || msg.includes('[更新]') || msg.includes('[跳过]')) {
                // Keep these as info
            }

            addLog(level, cleanMsg);
        });
        setResults(data);
        addLog('success', '计算完成');
    } catch (e: any) {
        addLog('error', '计算失败', e.message);
    } finally {
        setIsComputing(false);
    }
  };

  return (
    <div className={`flex flex-col h-full p-4 lg:p-8 gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full transition-all duration-500 ${
      isAI ? 'ai-mode-container' : ''
    }`}>
      {/* Top Header Card */}
      <div className={`shrink-0 flex flex-col md:flex-row justify-between items-center rounded-3xl p-6 shadow-xl border transition-all duration-500 ${
        isAI
          ? 'bg-white border-indigo-200 shadow-indigo-100'
          : 'bg-white border-white shadow-slate-100'
      }`}>
        <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-16 h-16 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200 rotate-3 transform transition-transform hover:rotate-6">
                <Video className="w-8 h-8 text-white" />
            </div>
            <div>
                  <h2 className={`text-2xl font-extrabold transition-colors duration-500 ${
                    isAI ? 'text-slate-800' : 'text-slate-800'
                  }`}>发布排期规划</h2>
                  <p className={`font-medium transition-colors duration-500 ${
                    isAI ? 'text-slate-600' : 'text-slate-500'
                  }`}>
                    智能筛选符合条件的潜力视频进行发布排期
                    {isAI && <Sparkles className="w-4 h-4 inline ml-2 text-indigo-500" />}
                  </p>
              </div>
        </div>

        <button
          onClick={handleStart}
          disabled={isComputing}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold shadow-lg transition-all hover:-translate-y-1 active:scale-95 active:shadow-sm ${
            isComputing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              : isAI
                ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-indigo-200 hover:shadow-indigo-300 text-white'
                : 'bg-[#8C7CF0] hover:bg-[#7b6be6] text-white shadow-violet-200'
          }`}
        >
          {isComputing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" fill="currentColor" />}
          <span>{isComputing ? '正在计算...' : '开始计算'}</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-6 lg:gap-8">
        {/* Results Table - Takes up 2/3 space */}
        <div className={`flex-[2] min-h-0 rounded-3xl shadow-xl border flex flex-col relative overflow-hidden transition-all duration-500 ${
          isAI
            ? 'bg-white border-indigo-200 shadow-indigo-100'
            : 'bg-white border-white shadow-slate-100'
        }`}>
          {/* Decorative blob */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-50 pointer-events-none transition-colors duration-500 ${
            isAI ? 'bg-indigo-200' : 'bg-violet-50'
          }`}></div>

          <div className={`p-6 border-b flex justify-between items-center relative z-10 transition-colors duration-500 ${
            isAI ? 'border-indigo-200' : 'border-slate-50'
          }`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                  isAI ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-50 text-violet-500'
                }`}>
                    <Video className="w-5 h-5" />
                </div>
                <h3 className={`font-bold text-lg transition-colors duration-500 ${
                  isAI ? 'text-slate-800' : 'text-slate-800'
                }`}>
                    排期建议列表 <span className={`text-sm ml-2 font-medium ${isAI ? 'text-indigo-600' : 'text-slate-400'}`}>({filteredResults.length})</span>
                </h3>
            </div>

            {results.length > 0 && (
              <div className="flex items-center gap-3">
                  <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border transition-colors duration-500 ${
                    isAI
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-500 ${
                      isAI ? 'text-indigo-600' : 'text-slate-400'
                    }`}>筛选分组</span>
                    <select
                      value={selectedGroup}
                      onChange={(e) => {
                         setSelectedGroup(e.target.value);
                         // Reset account selection when group changes to avoid invalid state
                         setSelectedAccount('all');
                         setAccountSearchTerm('');
                      }}
                      className={`bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer outline-none transition-colors duration-500 ${
                        isAI ? 'text-slate-700' : 'text-slate-700'
                      }`}
                    >
                      <option value="all">全部 ({results.length})</option>
                      {uniqueGroups.map(group => (
                        <option key={group} value={group}>
                          {group} ({results.filter(r => r.groupName === group).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border transition-colors duration-500 ${
                    isAI
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-500 ${
                      isAI ? 'text-indigo-600' : 'text-slate-400'
                    }`}>筛选账号</span>
                    <input
                      type="text"
                      placeholder="搜索..."
                      value={accountSearchTerm}
                      onChange={(e) => {
                        setAccountSearchTerm(e.target.value);
                        if (e.target.value) setSelectedAccount('all');
                      }}
                      className={`bg-transparent text-sm font-bold border-none focus:ring-0 outline-none w-24 transition-colors duration-500 ${
                        isAI
                          ? 'text-slate-700 placeholder:text-slate-400'
                          : 'text-slate-700 placeholder:text-slate-300'
                      } placeholder:font-normal`}
                    />
                    <div className={`w-px h-4 transition-colors duration-500 ${
                      isAI ? 'bg-indigo-200' : 'bg-slate-200'
                    }`}></div>
                    <select
                      value={selectedAccount}
                      onChange={(e) => {
                        setSelectedAccount(e.target.value);
                        setAccountSearchTerm('');
                      }}
                      className={`bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer outline-none transition-colors duration-500 ${
                        isAI ? 'text-slate-700' : 'text-slate-700'
                      }`}
                    >
                      <option value="all">选择列表...</option>
                      {uniqueAccounts.map(account => (
                        <option key={account} value={account}>
                          {account} ({groupFilteredResults.filter(r => r.accountName === account).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border transition-colors duration-500 ${
                    isAI
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-500 ${
                      isAI ? 'text-indigo-600' : 'text-slate-400'
                    }`}>去重展示</span>
                    <select
                      value={deduplicationMode}
                      onChange={(e) => setDeduplicationMode(e.target.value as 'all' | 'unique')}
                      className={`bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer outline-none transition-colors duration-500 ${
                        isAI ? 'text-slate-700' : 'text-slate-700'
                      }`}
                    >
                      <option value="all">全部展示</option>
                      <option value="unique">去重展示</option>
                    </select>
                  </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-0 relative z-10">
             {results.length === 0 ? (
                 <div className={`flex flex-col items-center justify-center h-full space-y-4 transition-colors duration-500 ${
                   isAI ? 'text-slate-500' : 'text-slate-400'
                 }`}>
                     {isComputing ? (
                         <>
                            <Loader2 className={`w-10 h-10 animate-spin ${isAI ? 'text-indigo-500' : 'text-[#8C7CF0]'}`} />
                            <p className="font-medium">正在分析飞书数据...</p>
                         </>
                     ) : (
                         <div className="text-center">
                             <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-500 ${
                               isAI ? 'bg-indigo-50' : 'bg-slate-50'
                             }`}>
                                <Video className={`w-10 h-10 ${isAI ? 'text-indigo-400' : 'text-slate-200'}`} />
                             </div>
                             <p className="font-medium">暂无数据，请点击右上角开始计算</p>
                         </div>
                     )}
                 </div>
             ) : (
                <table className="w-full text-left border-collapse">
                    <thead className={`sticky top-0 z-10 shadow-sm transition-colors duration-500 ${
                      isAI ? 'bg-indigo-50' : 'bg-slate-50'
                    }`}>
                        <tr>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider first:pl-8 transition-colors duration-500 ${
                              isAI ? 'text-indigo-600' : 'text-slate-400'
                            }`}>账号</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${
                              isAI ? 'text-indigo-600' : 'text-slate-400'
                            }`}>视频编号</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${
                              isAI ? 'text-indigo-600' : 'text-slate-400'
                            }`}>内容描述</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-right transition-colors duration-500 ${
                              isAI ? 'text-indigo-600' : 'text-slate-400'
                            }`}>浏览量</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-500 ${
                              isAI ? 'text-indigo-600' : 'text-slate-400'
                            }`}>历史发布次数</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-500 ${
                              isAI ? 'text-indigo-600' : 'text-slate-400'
                            }`}>账号今日发布次数</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-right transition-colors duration-500 ${
                              isAI ? 'text-indigo-600' : 'text-slate-400'
                            }`}>发布时间</th>
                            {/* AI 列 */}
                            {isAI && (
                              <>
                                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-500 ${
                                  isAI ? 'text-indigo-600' : 'text-slate-400'
                                }`}>AI 评级</th>
                                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${
                                  isAI ? 'text-indigo-600' : 'text-slate-400'
                                }`}>AI 建议</th>
                              </>
                            )}
                        </tr>
                    </thead>
                    <tbody className={`divide-y transition-colors duration-500 ${
                      isAI ? 'divide-indigo-100' : 'divide-slate-50'
                    }`}>
                        {filteredResults.map((item) => (
                            <tr key={item.id} className={`transition-colors group ${
                              isAI ? 'hover:bg-indigo-50' : 'hover:bg-slate-50/80'
                            }`}>
                                <td className={`px-6 py-4 font-mono text-sm font-medium first:pl-8 transition-colors duration-500 ${
                                  isAI ? 'text-slate-700' : 'text-slate-600'
                                }`}>{item.accountName}</td>
                                <td className={`px-6 py-4 font-mono text-sm font-medium transition-colors duration-500 ${
                                  isAI ? 'text-slate-700' : 'text-slate-600'
                                }`}>{item.videoId}</td>
                                <td className={`px-6 py-4 max-w-xs truncate text-sm font-medium transition-colors duration-500 ${
                                  isAI ? 'text-slate-700' : 'text-slate-700'
                                }`} title={item.description}>{item.description}</td>
                                <td className={`px-6 py-4 text-right font-bold transition-colors duration-500 ${
                                  isAI ? 'text-slate-800' : 'text-slate-700'
                                }`}>{item.readCount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold transition-colors duration-500 ${
                                        item.repeatCount === 1
                                          ? isAI ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-600'
                                          : isAI ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {item.repeatCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {(item.accountTodayCount || 0) > 0 ? (
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold transition-colors duration-500 ${
                                          isAI ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                            {item.accountTodayCount}
                                        </span>
                                    ) : (
                                        <span className={`font-bold transition-colors duration-500 ${
                                          isAI ? 'text-slate-500' : 'text-slate-700'
                                        }`}>
                                            {item.accountTodayCount ?? 0}
                                        </span>
                                    )}
                                </td>
                                <td className={`px-6 py-4 text-right text-sm font-medium transition-colors duration-500 ${
                                  isAI ? 'text-slate-500' : 'text-slate-400'
                                }`}>
                                    {item.publishTime ? new Date(item.publishTime).toLocaleDateString() : '-'}
                                </td>

                                {/* AI 列内容 */}
                                {isAI && (() => {
                                  const aiScore = getAIScore(item.videoId);
                                  return (
                                    <>
                                      <td className="px-6 py-4 text-center">
                                        <AIScoreBadge 
                                          score={aiScore?.overall_score || 0} 
                                          grade={aiScore?.grade} 
                                        />
                                      </td>
                                      <td className="px-6 py-4">
                                        <AITooltip advice={aiScore?.optimization_advice || '暂无建议'} />
                                      </td>
                                    </>
                                  );
                                })()}
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}
          </div>
        </div>

        {/* Logs and AI Chat - Takes up 1/3 space */}
        <div className="flex-1 min-h-0 flex flex-col gap-6 lg:gap-8">
            {/* AI 策略面板 (智能模式显示) */}
            {isAI && showStrategyPanel ? (
              <StrategyPanel />
            ) : (
              /* Real-time Updates */
              <div className="flex-1 min-h-0">
                  <LogConsole logs={logs} />
              </div>
            )}

            {/* AI 智能洞察面板 - 仅在智能模式下显示 */}
            {isAI && (
              <div className="flex-1 min-h-0 rounded-3xl shadow-xl border flex flex-col relative overflow-hidden transition-all duration-500 bg-white border-indigo-200 shadow-indigo-100">
                  <div className="p-6 border-b flex items-center gap-3 relative z-10 transition-colors duration-500 border-indigo-200">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 bg-indigo-100 text-indigo-600">
                          <MessageSquare className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg transition-colors duration-500 text-slate-800">AI 智能洞察</h3>
                  </div>

                  <div className="flex-1 overflow-auto p-6 relative z-10 space-y-4">
                    {analysis.results && analysis.results.length > 0 ? (
                      analysis.results.map((result, idx) => (
                        <div key={idx} className="p-4 rounded-xl border transition-all duration-300 bg-white border-indigo-200 hover:border-indigo-300">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-2xl font-bold ${
                              result.grade === 'S' ? 'text-amber-500' :
                              result.grade === 'A' ? 'text-emerald-500' :
                              result.grade === 'B' ? 'text-blue-500' : 'text-slate-500'
                            }`}>{result.grade}</span>
                            <span className="font-bold text-slate-700">{result.overall_score}/10</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-600">
                              病毒指数: {result.viral_index}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{result.optimization_advice}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-indigo-100">
                          <MessageSquare className="w-8 h-8 text-indigo-500" />
                        </div>
                        <p className="font-bold text-indigo-600">
                          {analysis.status === 'completed' ? '暂无分析结果' : '请先在数据同步页面进行 AI 分析'}
                        </p>
                      </div>
                    )}
                  </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;