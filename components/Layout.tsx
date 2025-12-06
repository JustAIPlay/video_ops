import React from 'react';
import { LayoutDashboard, RefreshCcw, Settings, Zap, Database, Sparkles, Calendar } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'sync' | 'settings' | 'schedule';
  onTabChange: (tab: 'sync' | 'settings' | 'schedule') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="flex h-screen bg-[#FDFBFF] text-slate-600 overflow-hidden">
      {/* Sidebar - Column 1 */}
      <aside className="w-24 lg:w-64 bg-white/80 backdrop-blur-xl border-r border-violet-100 flex flex-col z-20 transition-all duration-300">
        <div className="p-6 flex items-center gap-3 justify-center lg:justify-start">
          <div className="w-10 h-10 bg-gradient-to-br from-[#8C7CF0] to-[#C6B9FF] rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200 transform rotate-3">
            <Zap className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-extrabold text-xl tracking-tight text-slate-800">大航海运营助手</h1>
            <p className="text-[10px] font-bold text-[#8C7CF0] uppercase tracking-widest">Video Ops</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-4 mt-8">
          <button
            onClick={() => onTabChange('sync')}
            className={`group w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
              activeTab === 'sync'
                ? 'bg-[#8C7CF0] text-white shadow-xl shadow-violet-200 translate-x-1'
                : 'text-slate-500 hover:bg-violet-50 hover:text-[#8C7CF0]'
            }`}
          >
            <RefreshCcw className={`w-6 h-6 transition-transform ${activeTab === 'sync' ? 'scale-110' : 'group-hover:rotate-180'}`} />
            <span className="hidden lg:block font-bold">数据同步</span>
          </button>

          <button
            onClick={() => onTabChange('schedule')}
            className={`group w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
              activeTab === 'schedule'
                ? 'bg-[#8C7CF0] text-white shadow-xl shadow-violet-200 translate-x-1'
                : 'text-slate-500 hover:bg-violet-50 hover:text-[#8C7CF0]'
            }`}
          >
            <Calendar className={`w-6 h-6 transition-transform ${activeTab === 'schedule' ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="hidden lg:block font-bold">发布排期</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`group w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
              activeTab === 'settings'
                ? 'bg-[#8C7CF0] text-white shadow-xl shadow-violet-200 translate-x-1'
                : 'text-slate-500 hover:bg-violet-50 hover:text-[#8C7CF0]'
            }`}
          >
            <Settings className="w-6 h-6 transition-transform group-hover:rotate-45" />
            <span className="hidden lg:block font-bold">系统配置</span>
          </button>
        </nav>

        <div className="p-6 mt-auto">
            <div className="bg-gradient-to-br from-violet-50 to-white p-4 rounded-2xl border border-violet-100 hidden lg:block relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#C6B9FF] rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#8C7CF0] mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>PRO 版本</span>
                </div>
                <div className="text-xs text-slate-400">v1.0.0 </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background blobs for soft atmosphere */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-violet-50/50 to-transparent -z-10 pointer-events-none"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-40 -z-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-40 -z-10"></div>
        
        {children}
      </main>
    </div>
  );
};

export default Layout;