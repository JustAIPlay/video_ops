import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { Play, Loader2, Calendar, Users, Rocket, CloudRain, ToggleLeft, ToggleRight, CheckCircle2, Sparkles, Terminal } from 'lucide-react';
import { SyncLog, AppConfig, AccountData } from '../types';
import { fetchPostStatistics } from '../services/jikeService';
import { syncVideoToFeishu, mapVideoToFeishuFields, getExistingRecordsMap } from '../services/feishuService';
import LogConsole from './LogConsole';
import { useAppContext } from '../contexts/AppContext';
import { analyzeVideoContent, writeScoresToFeishu, VideoItem } from '../services/aiAnalysisService';

interface SyncViewProps {
  config: AppConfig;
}

const SyncView: React.FC<SyncViewProps> = ({ config }) => {
  const { mode, analysis, setAnalysis } = useAppContext();
  const isAI = mode === 'ai';

  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [useMock, setUseMock] = useState(false);

  // AI 分析终端状态
  const [showAITerminal, setShowAITerminal] = useState(false);
  const messagesRef = useRef<string[]>([]);
  const [messageUpdateTrigger, setMessageUpdateTrigger] = useState(0);
  
  // Filters
  const [userIds, setUserIds] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const addLog = (level: SyncLog['level'], message: string, detail?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      level,
      message,
      detail
    }]);
  };

  // Helper to allow UI to repaint
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


  // 辅助函数：写入飞书
  const writeScoresToFeishuAsync = async (scores: any[], accountsData: AccountData[]) => {
    try {
      // 从配置中获取第一个账号的飞书凭证
      if (accountsData.length === 0) {
        addTerminalMessage('⚠️ 没有账号数据，跳过飞书写入');
        return;
      }

      const firstAccount = accountsData[0];
      const mappingKey = firstAccount.group_name || firstAccount.username;
      const targetConfig = config.accountTableMapping[mappingKey];

      if (!targetConfig) {
        addTerminalMessage('⚠️ 未配置飞书映射，跳过写入');
        return;
      }

      // 获取飞书凭证
      const feishuConfig = (config as any).feishuConfig || {};
      const appId = feishuConfig.appId || '';
      const appSecret = feishuConfig.appSecret || '';

      if (!appId || !appSecret) {
        addTerminalMessage('⚠️ 未配置飞书凭证，跳过写入');
        return;
      }

      // 调用写入 API
      const result = await writeScoresToFeishu({
        app_id: appId,
        app_secret: appSecret,
        app_token: targetConfig.baseToken,
        table_id: targetConfig.tableId,
        scores: scores
      });

      if (result.status === 'success') {
        addTerminalMessage(`✅ 成功写入飞书 ${result.data?.success || 0} 条记录`);
      } else {
        addTerminalMessage(`⚠️ 飞书写入失败: ${result.message}`);
      }
    } catch (error) {
      console.error('[Feishu Write] 写入失败:', error);
      addTerminalMessage('⚠️ 飞书写入异常，请查看控制台');
    }
  };

  // ============ AI 智能分析函数 ============
  const triggerAIAnalysis = async (accountsData: AccountData[]) => {
    // 重置消息
    messagesRef.current = [];
    setMessageUpdateTrigger(0);

    // 显示遮罩
    setShowAITerminal(true);
    setAnalysis({ status: 'analyzing', currentLayer: 'content', progress: 0, message: '正在启动AI分析...' });

    try {
      // 添加终端消息
      const addTerminalMessage = (msg: string) => {
        messagesRef.current.push(msg);
        setMessageUpdateTrigger(prev => prev + 1);
      };

      addTerminalMessage('正在连接AI分析引擎...');

      // 收集所有视频数据
      const allVideos: VideoItem[] = [];
      for (const account of accountsData) {
        for (const video of account.videos) {
          allVideos.push({
            video_id: `${account.username}_${video.createTime}`,
            title: video.name,
            description: video.name,
            views: 0, // 可以从 video 中获取实际数据
            account_name: account.username,
            group_name: account.group_name || '',
          });
        }
      }

      addTerminalMessage(`提取到 ${allVideos.length} 个视频样本`);

      // 调用后端 AI 分析 API
      addTerminalMessage('正在分析内容质量评分...');
      setAnalysis({ status: 'analyzing', currentLayer: 'content', progress: 50, message: 'AI 分析中...' });

      const response = await analyzeVideoContent(allVideos);

      if (response.status === 'success' && response.results) {
        addTerminalMessage('分析完成！');
        addTerminalMessage(`✅ 成功分析 ${response.results.length} 个视频`);

        // 保存结果到 context，供 ScheduleView 使用
        setAnalysis({
          status: 'completed',
          currentLayer: null,
          progress: 100,
          message: '分析完成',
          taskId: `ai-${Date.now()}`,
          results: response.results
        });

        console.log('[AI Analysis] 分析结果已保存到 context:', response.results);

        // 写入飞书（如果有配置）
        addTerminalMessage('正在将分析结果写入飞书...');
        await writeScoresToFeishuAsync(response.results, accountsData);
      } else {
        addTerminalMessage('⚠️ 分析失败: ' + response.message);
        setAnalysis({
          status: 'error',
          currentLayer: null,
          progress: 0,
          message: '分析失败',
          results: []
        });
      }

      await sleep(800);
      // 关闭遮罩
      setShowAITerminal(false);

    } catch (error) {
      console.error('[AI Analysis] 分析失败:', error);
      messagesRef.current.push('❌ AI 分析失败: ' + (error as Error).message);
      setMessageUpdateTrigger(prev => prev + 1);

      await sleep(2000);
      setShowAITerminal(false);
      setAnalysis({
        status: 'error',
        currentLayer: null,
        progress: 0,
        message: '分析失败',
        results: []
      });
    }
  };

  // ============ AI 终端遮罩组件 ============
  // 主遮罩组件 - 只在 showAITerminal 变化时渲染
  const AITerminalOverlay = useMemo(() => {
    // 闭包捕获当前的 ref 值
    const currentMessages = messagesRef.current;

    return showAITerminal ? (
      <div className="ai-hud-overlay">
        <div className="ai-hud-content">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">AI 智能分析引擎</h3>
              <p className="text-indigo-600 text-sm">正在深度分析您的视频数据...</p>
            </div>
          </div>

          <div className="terminal-code-scroll h-64 overflow-y-auto">
            {currentMessages.map((msg, i) => (
              <div key={i} className="mb-1">
                <span className="text-emerald-400">$</span> {msg}
              </div>
            ))}
            {currentMessages.length > 0 && (
              <div className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1" />
            )}
          </div>

          <div className="mt-6">
            <div className="ai-progress-bar">
              <div className="ai-progress-fill" style={{ width: `${analysis.progress || 0}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-indigo-600">
              <span>{analysis.message || '初始化...'}</span>
              <span>{analysis.progress || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    ) : null;
  }, [showAITerminal, messageUpdateTrigger, analysis.progress, analysis.message]);

  const handleStartSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setLogs([]); // Clear previous logs
    
    addLog('info', '开始同步流程...');
    
    try {
      // 1. Fetch Data
      addLog('info', `正在连接${useMock ? '模拟' : '本地'}大航海 API 服务...`, useMock ? '模拟延迟' : '端点: /sph/api/post_statistics');
      
      // Smart Filter Logic:
      // If input contains only digits/commas/spaces, treat as ID(s) and pass to API.
      // Otherwise (e.g. names), fetch ALL data (pass undefined) and filter locally.
      const inputStr = (userIds || '').trim();
      const isIdQuery = inputStr && /^[\d,\s]+$/.test(inputStr);
      const apiUserIds = isIdQuery ? inputStr : undefined;

      if (inputStr && !isIdQuery) {
          addLog('info', `检测到名称搜索: "${inputStr}"`, '将获取全部数据后进行本地筛选...');
      }

      let accountsData: AccountData[] = [];
      try {
        accountsData = await fetchPostStatistics({
          userIds: apiUserIds,
          startTime: dateRange.start || undefined,
          endTime: dateRange.end || undefined,
          useMock
        });

        // Apply Local Name Filter
        if (inputStr && !isIdQuery) {
            const keyword = inputStr.toLowerCase();
            const beforeCount = accountsData.length;
            accountsData = accountsData.filter(acc => 
                acc.username.toLowerCase().includes(keyword) || 
                (acc.group_name && acc.group_name.toLowerCase().includes(keyword))
            );
            addLog('success', `成功获取数据，并按名称筛选: "${inputStr}"`, `从 ${beforeCount} 条记录中匹配到 ${accountsData.length} 个账号`);
        } else {
            addLog('success', `成功获取 ${accountsData.length} 个账号的数据。`);
        }

      } catch (err: any) {
        addLog('error', '获取大航海 API 数据失败。', err.message);
        if (!useMock) {
          addLog('warning', '提示: 请确保本地服务运行在 127.0.0.1:9802 或启用“模拟模式”进行测试。');
        }
        setIsSyncing(false);
        return;
      }

      // 2. Process & Sync
      let totalProcessed = 0;
      let totalUpdated = 0;
      let totalCreated = 0;

      for (const account of accountsData) {
        // Use group_name if available for mapping, otherwise use username
        // This ensures if 'group_name' is present, we use the config for that group
        const mappingKey = account.group_name || account.username;
        const displayName = account.group_name ? `${account.username} (分组: ${account.group_name})` : account.username;

        addLog('info', `处理账号: ${displayName}`, `ID: ${account.user_id}`);
        
        // Find target config
        const targetConfig = config.accountTableMapping[mappingKey];
        
        if (!targetConfig) {
             addLog('warning', `[跳过] 账号/分组 "${mappingKey}" 未配置飞书表格映射`, '请在系统配置中添加路由策略');
             continue;
        }

        const targetTable = targetConfig.tableId;
        addLog('info', `目标飞书数据表: ${targetTable} (Base: ${targetConfig.baseToken})`);

        // Optimization: Pre-fetch existing records for this account within the time range of videos
        // This avoids 1 search request per video, reducing API calls significantly.
        let existingRecordsMap = new Map<number, Array<{ id: string, desc: string }>>();
        if (account.videos.length > 0) {
            const timestamps = account.videos.map(v => v.create_time ? v.create_time * 1000 : new Date(v.createTime).getTime());
            // Widen range by 1 minute to handle minute-truncation mismatches
            const minTime = Math.min(...timestamps) - 60000;
            const maxTime = Math.max(...timestamps) + 60000;
            
            addLog('info', `正在检查已有数据...`, `时间范围: ${new Date(minTime).toLocaleDateString()} - ${new Date(maxTime).toLocaleDateString()}`);
            existingRecordsMap = await getExistingRecordsMap(config, mappingKey, account.username, minTime, maxTime);
            addLog('info', `发现 ${existingRecordsMap.size} 条已有记录，将进行更新而非重复创建。`);
        }

        // Batch processing configuration
        const BATCH_SIZE = 5; // Process 5 videos in parallel to speed up while respecting rate limits
        const videoBatches = [];
        for (let i = 0; i < account.videos.length; i += BATCH_SIZE) {
            videoBatches.push(account.videos.slice(i, i + BATCH_SIZE));
        }

        for (const batch of videoBatches) {
            // Small pause before each batch to let UI update
            await sleep(50);

            const promises = batch.map(video => {
                // Check if this video already exists
                const rawPubTime = video.create_time ? video.create_time * 1000 : new Date(video.createTime).getTime();
                // Floor to minute to match Feishu's precision
                const matchPubTime = Math.floor(rawPubTime / 60000) * 60000; 
                
                // Match using minute bucket
                const candidates = existingRecordsMap.get(matchPubTime);
                let existingId: string | undefined;

                if (candidates) {
                    // Strict match: Time + Content Description (video.name)
                    // This handles cases where multiple videos exist in the same minute, or ensures content integrity
                    const match = candidates.find(c => c.desc === video.name);
                    if (match) {
                        existingId = match.id;
                    }
                }

                // Debug: Log timestamp comparison
                console.log(`[Time Check] Video: "${video.name}"`);
                console.log(`   -> Local Raw: ${rawPubTime} (${new Date(rawPubTime).toLocaleString()})`);
                console.log(`   -> Match Key: ${matchPubTime} (${new Date(matchPubTime).toLocaleString()})`);
                
                if (existingId) {
                     console.log(`   -> MATCH FOUND! ID: ${existingId}`);
                } else if (candidates) {
                     console.log(`   -> Time matched but Content Description mismatch. Treating as NEW record.`);
                     console.log(`      Feishu Records in this minute: ${JSON.stringify(candidates.map(c => c.desc))}`);
                } else if (existingRecordsMap.size > 0) {
                     console.log(`   -> No exact minute match. Available keys in range:`);
                     let matchCount = 0;
                     for (const [cachedTime, _] of existingRecordsMap.entries()) {
                        if (matchCount < 3 && Math.abs(cachedTime - matchPubTime) < 120000) {
                             console.log(`      Feishu Key: ${cachedTime} | Diff: ${cachedTime - matchPubTime}ms`);
                             matchCount++;
                        }
                     }
                }

                return syncVideoToFeishu(
                    video, 
                    mappingKey, 
                    config, 
                    (msg) => {}, 
                    account.username,
                    account.group_name,
                    existingId // Pass the ID if found
                ).then(result => ({ video, result }));
            });

            const results = await Promise.all(promises);

            for (const { video, result } of results) {
                if (result === 'created') {
                    totalCreated++;
                    addLog('success', `[新增] ${video.name.substring(0, 30)}...`, `同步至表 ${targetTable}`);
                } else if (result === 'updated') {
                    totalUpdated++;
                    addLog('info', `[更新] ${video.name.substring(0, 30)}...`, `刷新数据于表 ${targetTable}`);
                } else if (result === 'skipped') {
                    addLog('warning', `[跳过] ${video.name.substring(0, 30)}...`, '配置缺失');
                } else {
                    addLog('error', `[失败] ${video.name.substring(0, 30)}...`);
                }
                totalProcessed++;
                // Allow UI to update after each log entry
                await sleep(20);
            }
        }
      }

      addLog('success', '同步完成。', `已处理: ${totalProcessed} | 新增: ${totalCreated} | 更新: ${totalUpdated}`);

      // ============ AI 智能模式拦截器 ============
      if (isAI) {
        addLog('info', '🤖 AI 智能模式已激活，开始分析数据...');
        await triggerAIAnalysis(accountsData);
      }

    } catch (e: any) {
      console.error("[DEBUG] SyncView: Fatal Error", e);
      addLog('error', '同步执行期间发生严重错误。', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`flex flex-col h-full p-4 lg:p-8 gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full relative transition-all duration-500 ${
      isAI ? 'ai-mode-container' : ''
    }`}>
      {/* AI 终端遮罩 */}
      {AITerminalOverlay}

      {/* Top Header Card */}
      <div className={`shrink-0 flex flex-col md:flex-row justify-between items-center rounded-3xl p-6 shadow-xl border transition-all duration-500 ${
        isAI
          ? 'bg-white border-indigo-200 shadow-indigo-100'
          : 'bg-white border-white shadow-slate-100'
      }`}>
        <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#FFD166] to-[#F78C6B] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 rotate-6 transform transition-transform hover:rotate-12">
                <Rocket className="w-8 h-8 text-white" fill="white" />
            </div>
            <div>
                <h2 className={`text-2xl font-extrabold transition-colors duration-500 ${
                  isAI ? 'text-slate-800' : 'text-slate-800'
                }`}>开始您的任务</h2>
                <p className={`font-medium transition-colors duration-500 ${
                  isAI ? 'text-slate-600' : 'text-slate-500'
                }`}>同步大航海的视频号数据 {isAI && <Sparkles className="w-4 h-4 inline ml-2 text-indigo-500" />}</p>
            </div>
        </div>

        <div className={`flex items-center gap-6 px-6 py-3 rounded-2xl border transition-all duration-500 ${
          isAI
            ? 'bg-indigo-50 border-indigo-200'
            : 'bg-slate-50 border-slate-100'
        }`}>
             <label className="flex items-center gap-3 cursor-pointer select-none">
                <span className={`text-sm font-bold transition-colors ${!useMock ? 'text-slate-400' : 'text-[#8C7CF0]'}`}>模拟数据</span>
                <div onClick={() => setUseMock(!useMock)} className="relative">
                    {useMock 
                        ? <ToggleRight className="w-10 h-10 text-[#8C7CF0] transition-all" fill="currentColor" fillOpacity={0.2} />
                        : <ToggleLeft className="w-10 h-10 text-slate-300 transition-all" />
                    }
                </div>
                <span className={`text-sm font-bold transition-colors ${useMock ? 'text-slate-400' : 'text-slate-700'}`}>真实接口</span>
            </label>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-6 lg:gap-8">
        
        {/* Left Column: Controls (Col 2) */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6 shrink-0">

          {/* Card 1: Filters - 隐藏在AI模式下 */}
          {!isAI && (
            <div className={`p-6 rounded-3xl shadow-xl border relative overflow-hidden transition-all duration-500 ${
              isAI
                ? 'bg-white border-indigo-200 shadow-indigo-100'
                : 'bg-white border-white shadow-slate-100'
            }`}>
               {/* Decorative blob */}
               <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl opacity-80 pointer-events-none transition-colors duration-500 ${
                 isAI ? 'bg-indigo-200' : 'bg-violet-50'
               }`}></div>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                  isAI ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-50 text-blue-500'
                }`}>
                    <Users className="w-5 h-5" />
                </div>
                <h3 className={`font-bold text-lg transition-colors duration-500 ${
                  isAI ? 'text-slate-800' : 'text-slate-800'
                }`}>账号筛选</h3>
              </div>

              <div className="space-y-3 relative z-10">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors duration-500 ${
                  isAI ? 'text-indigo-600' : 'text-slate-400'
                }`}>视频号账号</label>
                <input
                  type="text"
                  placeholder="（留空则全选）"
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  className={`w-full px-4 py-3 border-none rounded-xl font-medium transition-all duration-500 outline-none ${
                    isAI
                      ? 'bg-indigo-50 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 focus:bg-white'
                      : 'bg-slate-50 text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-[#8C7CF0] focus:bg-white'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Card 2: Date Range - 隐藏在AI模式下 */}
          {!isAI && (
            <div className={`p-6 rounded-3xl shadow-xl border relative overflow-hidden transition-all duration-500 ${
              isAI
                ? 'bg-white border-indigo-200 shadow-indigo-100'
                : 'bg-white border-white shadow-slate-100'
            }`}>
              {/* Decorative blob */}
              <div className={`absolute -left-10 bottom-0 w-32 h-32 rounded-full blur-2xl opacity-80 pointer-events-none transition-colors duration-500 ${
                isAI ? 'bg-violet-200' : 'bg-pink-50'
              }`}></div>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                  isAI ? 'bg-violet-100 text-violet-600' : 'bg-pink-50 text-pink-500'
                }`}>
                    <Calendar className="w-5 h-5" />
                </div>
                <h3 className={`font-bold text-lg transition-colors duration-500 ${
                  isAI ? 'text-slate-800' : 'text-slate-800'
                }`}>时间范围</h3>
              </div>

              <div className="space-y-5 relative z-10">
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors duration-500 ${
                    isAI ? 'text-indigo-600' : 'text-slate-400'
                  }`}>开始日期</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                    className={`w-full px-4 py-3 border-none rounded-xl font-medium transition-all duration-500 outline-none ${
                      isAI
                        ? 'bg-indigo-50 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 focus:bg-white'
                        : 'bg-slate-50 text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-[#8C7CF0] focus:bg-white'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors duration-500 ${
                    isAI ? 'text-indigo-600' : 'text-slate-400'
                  }`}>结束日期</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                    className={`w-full px-4 py-3 border-none rounded-xl font-medium transition-all duration-500 outline-none ${
                      isAI
                        ? 'bg-indigo-50 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 focus:bg-white'
                        : 'bg-slate-50 text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-[#8C7CF0] focus:bg-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleStartSync}
            disabled={isSyncing}
            className={`group relative overflow-hidden w-full py-5 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 ${
            isSyncing
                ? 'bg-slate-300 shadow-none cursor-not-allowed'
                : isAI
                  ? 'bg-gradient-to-r from-indigo-400 to-violet-400 shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1'
                  : 'bg-gradient-to-r from-[#8C7CF0] to-[#C6B9FF] shadow-[#8C7CF0]/30 hover:shadow-[#8C7CF0]/50 hover:-translate-y-1'
            }`}
          >
            {/* Button Shine Effect */}
            {!isSyncing && <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]"></div>}
            
            {isSyncing ? (
                <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>正在同步中...{isAI && ' (AI分析将在同步完成后启动)'}</span>
                </>
            ) : (
                <>
                    <Play className="w-6 h-6 fill-current" />
                    <span>立即开始同步</span>
                </>
            )}
          </button>
        </div>

        {/* Right Column: Logs (Col 3) */}
        <div className="flex-1 min-w-0 h-[500px] xl:h-auto">
          <LogConsole logs={logs} />
        </div>
      </div>

      {/* AI 分析完成提示 */}
      {isAI && analysis.status === 'completed' && (
        <div className={`rounded-2xl p-4 border transition-all duration-500 ${
          isAI
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-emerald-800">AI 分析完成！</span>
            <span className="text-sm ml-2 text-emerald-600">
              智能分析已生成优化建议，请在发布排期页面查看
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncView;