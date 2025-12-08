import React, { useState } from 'react';
import { Play, Loader2, Video, AlertCircle, Activity, FileText, MessageSquare } from 'lucide-react';
import { AppConfig, ScheduleItem, SyncLog } from '../types';
import LogConsole from './LogConsole';
import { fetchScheduleData } from '../services/feishuService';

interface ScheduleViewProps {
  config: AppConfig;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ config }) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [results, setResults] = useState<ScheduleItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Compute unique groups for the filter dropdown
  const uniqueGroups = Array.from(new Set(results.map(r => r.groupName))).sort();

  // Filter results based on selected group
  const filteredResults = selectedGroup === 'all' 
    ? results 
    : results.filter(r => r.groupName === selectedGroup);

  const addLog = (level: SyncLog['level'], message: string, detail?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      level,
      message,
      detail
    }]);
  };

  const handleStart = async () => {
    if (isComputing) return;
    setIsComputing(true);
    setLogs([]);
    setResults([]);
    
    addLog('info', '开始排期计算...');

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
    <div className="flex flex-col h-full p-4 lg:p-8 gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
      {/* Top Header Card */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-center bg-white rounded-3xl p-6 shadow-xl shadow-slate-100 border border-white">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-16 h-16 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200 rotate-3 transform transition-transform hover:rotate-6">
                <Video className="w-8 h-8 text-white" />
            </div>
            <div>
                  <h2 className="text-2xl font-extrabold text-slate-800">发布排期规划</h2>
                  <p className="text-slate-500 font-medium">智能筛选符合条件的潜力视频进行发布排期</p>
              </div>
        </div>

        <button
          onClick={handleStart}
          disabled={isComputing}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold shadow-lg transition-all hover:-translate-y-1 active:scale-95 active:shadow-sm ${
            isComputing 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-[#8C7CF0] hover:bg-[#7b6be6] text-white shadow-violet-200'
          }`}
        >
          {isComputing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" fill="currentColor" />}
          <span>{isComputing ? '正在计算...' : '开始计算'}</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-6 lg:gap-8">
        {/* Results Table - Takes up 2/3 space */}
        <div className="flex-[2] min-h-0 bg-white rounded-3xl shadow-xl shadow-slate-100 border border-white flex flex-col relative overflow-hidden">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <div className="p-6 border-b border-slate-50 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                    排期建议列表 <span className="text-slate-400 text-sm ml-2 font-medium">({filteredResults.length})</span>
                </h3>
            </div>
            
            {results.length > 0 && (
              <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">筛选分组</span>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-700 border-none focus:ring-0 cursor-pointer outline-none"
                >
                  <option value="all">全部 ({results.length})</option>
                  {uniqueGroups.map(group => (
                    <option key={group} value={group}>
                      {group} ({results.filter(r => r.groupName === group).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-0 relative z-10">
             {results.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                     {isComputing ? (
                         <>
                            <Loader2 className="w-10 h-10 animate-spin text-[#8C7CF0]" />
                            <p className="font-medium">正在分析飞书数据...</p>
                         </>
                     ) : (
                         <div className="text-center">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Video className="w-10 h-10 text-slate-200" />
                             </div>
                             <p className="font-medium">暂无数据，请点击右上角开始计算</p>
                         </div>
                     )}
                 </div>
             ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider first:pl-8">视频编号</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">内容描述</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">浏览量</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">历史发布次数</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">账号今日发布次数</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right last:pr-8">发布时间</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredResults.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4 font-mono text-sm font-medium text-slate-600 first:pl-8">{item.videoId}</td>
                                <td className="px-6 py-4 max-w-xs truncate text-sm font-medium text-slate-700" title={item.description}>{item.description}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-700">{item.readCount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        item.repeatCount === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {item.repeatCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {(item.accountTodayCount || 0) > 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-600">
                                            {item.accountTodayCount}
                                        </span>
                                    ) : (
                                        <span className="text-slate-700 font-bold">
                                            {item.accountTodayCount ?? 0}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium text-slate-400 last:pr-8">
                                    {item.publishTime ? new Date(item.publishTime).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}
          </div>
        </div>

        {/* Logs and AI Chat - Takes up 1/3 space */}
        <div className="flex-1 min-h-0 flex flex-col gap-6 lg:gap-8">
            {/* Real-time Updates */}
            <div className="flex-1 min-h-0">
                <LogConsole logs={logs} />
            </div>

            {/* AI Chat */}
            <div className="flex-1 min-h-0 bg-white rounded-3xl shadow-xl shadow-slate-100 border border-white flex flex-col relative overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">AI 对话</h3>
                </div>
                
                <div className="flex-1 flex items-center justify-center relative z-10 bg-slate-50/50 m-6 rounded-2xl border-2 border-dashed border-slate-200">
                     <div className="text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="font-bold text-slate-400">开发中...</p>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;