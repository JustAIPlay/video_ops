import React, { useState } from 'react';
import { Play, Loader2, Calendar, Users, Rocket, CloudRain, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';
import { SyncLog, AppConfig, AccountData } from '../types';
import { fetchPostStatistics } from '../services/jikeService';
import { syncVideoToFeishu, mapVideoToFeishuFields, getExistingRecordsMap } from '../services/feishuService';
import LogConsole from './LogConsole';

interface SyncViewProps {
  config: AppConfig;
}

const SyncView: React.FC<SyncViewProps> = ({ config }) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [useMock, setUseMock] = useState(false);
  
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

  const handleStartSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setLogs([]); // Clear previous logs
    
    addLog('info', '开始同步流程...');
    
    try {
      // 1. Fetch Data
      addLog('info', `正在连接${useMock ? '模拟' : '本地'}即刻 API 服务...`, useMock ? '模拟延迟' : '端点: /sph/api/post_statistics');
      
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
        addLog('error', '获取即刻 API 数据失败。', err.message);
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

    } catch (e: any) {
      console.error("[DEBUG] SyncView: Fatal Error", e);
      addLog('error', '同步执行期间发生严重错误。', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 lg:p-8 gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      {/* Top Header Card */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-center bg-white rounded-3xl p-6 shadow-xl shadow-slate-100 border border-white">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#FFD166] to-[#F78C6B] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 rotate-6 transform transition-transform hover:rotate-12">
                <Rocket className="w-8 h-8 text-white" fill="white" />
            </div>
            <div>
                <h2 className="text-2xl font-extrabold text-slate-800">开始您的任务</h2>
                <p className="text-slate-500 font-medium">同步即刻的视频号数据</p>
            </div>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
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
          
          {/* Card 1: Filters */}
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-100 border border-white relative overflow-hidden">
             {/* Decorative blob */}
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-violet-50 rounded-full blur-2xl opacity-80 pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">账号筛选</h3>
            </div>
            
            <div className="space-y-3 relative z-10">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">视频号账号</label>
              <input 
                type="text" 
                placeholder="（留空则全选）"
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-600 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[#8C7CF0] focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          {/* Card 2: Date Range */}
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-100 border border-white relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute -left-10 bottom-0 w-32 h-32 bg-pink-50 rounded-full blur-2xl opacity-80 pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">时间范围</h3>
            </div>

            <div className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">开始日期</label>
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-600 font-medium focus:ring-2 focus:ring-[#8C7CF0] focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">结束日期</label>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-600 font-medium focus:ring-2 focus:ring-[#8C7CF0] focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartSync}
            disabled={isSyncing}
            className={`group relative overflow-hidden w-full py-5 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 ${
            isSyncing 
                ? 'bg-slate-300 shadow-none cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#8C7CF0] to-[#C6B9FF] shadow-[#8C7CF0]/30 hover:shadow-[#8C7CF0]/50 hover:-translate-y-1'
            }`}
          >
            {/* Button Shine Effect */}
            {!isSyncing && <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]"></div>}
            
            {isSyncing ? (
                <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>正在同步中...</span>
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
    </div>
  );
};

export default SyncView;