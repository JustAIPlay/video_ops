import React from 'react';
import { LayoutDashboard, RefreshCcw, Settings, Zap, Database, Sparkles, Calendar } from 'lucide-react';
import { ModeSwitcher } from './ModeSwitcher';
import { useAppContext } from '../contexts/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'sync' | 'settings' | 'schedule';
  onTabChange: (tab: 'sync' | 'settings' | 'schedule') => void;
}

const LayoutContent: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { mode } = useAppContext();
  const isAI = mode === 'ai';

  return (
    <div className={`flex h-screen text-slate-600 overflow-hidden transition-colors duration-500 ${
      isAI ? 'bg-slate-50' : 'bg-[#FDFBFF]'
    }`}>
      {/* Sidebar - Column 1 */}
      <aside className={`w-24 lg:w-64 backdrop-blur-xl border-r flex flex-col z-20 transition-all duration-500 ${
        isAI
          ? 'bg-white/90 border-indigo-200'
          : 'bg-white/80 border-violet-100'
      }`}>
        <div className="p-6 flex items-center gap-3 justify-center lg:justify-start">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transform rotate-3 transition-all duration-500 ${
            isAI
              ? 'bg-gradient-to-br from-indigo-400 to-violet-400 shadow-md shadow-indigo-200'
              : 'bg-gradient-to-br from-[#8C7CF0] to-[#C6B9FF] shadow-lg shadow-violet-200'
          }`}>
            <Zap className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div className="hidden lg:block">
            <h1 className={`font-extrabold text-xl tracking-tight transition-colors duration-500 ${
              isAI ? 'text-slate-800' : 'text-slate-800'
            }`}>大航海运营助手</h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
              isAI ? 'text-indigo-500' : 'text-[#8C7CF0]'
            }`}>Video Ops</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-4 mt-8">
          <button
            onClick={() => onTabChange('sync')}
            className={`group w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
              activeTab === 'sync'
                ? isAI
                  ? 'bg-indigo-500 text-white shadow-md translate-x-1'
                  : 'bg-[#8C7CF0] text-white shadow-xl shadow-violet-200 translate-x-1'
                : isAI
                  ? 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-500'
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
                ? isAI
                  ? 'bg-indigo-500 text-white shadow-md translate-x-1'
                  : 'bg-[#8C7CF0] text-white shadow-xl shadow-violet-200 translate-x-1'
                : isAI
                  ? 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-500'
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
                ? isAI
                  ? 'bg-indigo-500 text-white shadow-md translate-x-1'
                  : 'bg-[#8C7CF0] text-white shadow-xl shadow-violet-200 translate-x-1'
                : isAI
                  ? 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-500'
                  : 'text-slate-500 hover:bg-violet-50 hover:text-[#8C7CF0]'
            }`}
          >
            <Settings className="w-6 h-6 transition-transform group-hover:rotate-45" />
            <span className="hidden lg:block font-bold">系统配置</span>
          </button>
        </nav>

        {/* 模式切换器 + 版本信息 */}
        <div className="p-6 mt-auto space-y-4">
          {/* 模式切换器 */}
          <ModeSwitcher />

          {/* 版本信息卡片 */}
          <div className={`p-4 rounded-2xl border hidden lg:block relative overflow-hidden group transition-all duration-500 ${
            isAI
              ? 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200'
              : 'bg-gradient-to-br from-violet-50 to-white border-violet-100'
          }`}>
            {/* 装饰背景 */}
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 blur-xl ${
              isAI ? 'bg-indigo-300' : 'bg-[#C6B9FF]'
            }`}></div>

            {/* 标题和图标 */}
            <div className="relative z-10">
              <div className={`flex items-center gap-2 mb-3 transition-colors duration-500 ${
                isAI ? 'text-indigo-600' : 'text-[#8C7CF0]'
              }`}>
                <Sparkles className={`w-4 h-4 ${isAI && 'animate-pulse'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">运营助手</span>
              </div>

              {/* 版本号 */}
              <div className={`text-xs font-medium transition-colors duration-500 ${
                isAI ? 'text-slate-600' : 'text-slate-500'
              }`}>
                Version 2.0.0 {isAI && <span className="ml-2 text-indigo-600">✨ AI 模式</span>}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background blobs for soft atmosphere */}
        {!isAI && (
          <>
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-violet-50/50 to-transparent -z-10 pointer-events-none"></div>
            <div className="absolute top-20 right-20 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-40 -z-10 animate-pulse"></div>
            <div className="absolute top-40 left-40 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-40 -z-10"></div>
          </>
        )}

        {/* AI 模式背景特效 */}
        {isAI && (
          <>
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/30 to-transparent -z-10 pointer-events-none"></div>
            <div className="absolute top-20 right-20 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-30 -z-10"></div>
            <div className="absolute bottom-32 left-32 w-64 h-64 bg-violet-100 rounded-full blur-3xl opacity-20 -z-10"></div>
          </>
        )}

        {children}
      </main>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <LayoutContent {...props} />
  );
};

export default Layout;