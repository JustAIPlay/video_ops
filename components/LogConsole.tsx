import React, { useEffect, useRef } from 'react';
import { SyncLog } from '../types';
import { Check, AlertTriangle, Info, X, Clock } from 'lucide-react';

interface LogConsoleProps {
  logs: SyncLog[];
}

const LogConsole: React.FC<LogConsoleProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogStyle = (level: string) => {
    switch (level) {
      case 'success': 
        return {
            bg: 'bg-green-50',
            border: 'border-green-100',
            iconBg: 'bg-green-400',
            icon: <Check className="w-3 h-3 text-white" />,
            text: 'text-slate-700'
        };
      case 'error': 
        return {
            bg: 'bg-red-50',
            border: 'border-red-100',
            iconBg: 'bg-red-400',
            icon: <X className="w-3 h-3 text-white" />,
            text: 'text-red-800'
        };
      case 'warning': 
        return {
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            iconBg: 'bg-orange-400',
            icon: <AlertTriangle className="w-3 h-3 text-white" />,
            text: 'text-slate-700'
        };
      default: 
        return {
            bg: 'bg-white',
            border: 'border-slate-100',
            iconBg: 'bg-[#8C7CF0]',
            icon: <Info className="w-3 h-3 text-white" />,
            text: 'text-slate-600'
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm rounded-3xl border border-white shadow-xl shadow-slate-200/50 overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 border-b border-slate-100 flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <span className="text-sm font-bold text-slate-600 ml-2">实时动态</span>
        </div>
        <span className="px-2 py-1 bg-violet-50 text-violet-600 text-xs font-bold rounded-lg">{logs.length} 事件</span>
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto space-y-3 log-scroll"
      >
        {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                <Clock className="w-12 h-12 mb-2" />
                <span className="text-sm font-semibold">等待开始...</span>
            </div>
        )}
        
        {logs.map((log) => {
          const style = getLogStyle(log.level);
          return (
            <div key={log.id} className={`flex gap-4 p-4 rounded-2xl border ${style.bg} ${style.border} transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`mt-1 w-6 h-6 shrink-0 rounded-full ${style.iconBg} flex items-center justify-center shadow-sm`}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-sm font-bold ${style.text}`}>
                        {log.message}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {log.timestamp.toLocaleTimeString()}
                    </span>
                </div>
                {log.detail && (
                  <div className="text-xs text-slate-500 break-all leading-relaxed opacity-80 pl-1 border-l-2 border-slate-200/50">
                    {log.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogConsole;