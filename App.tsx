import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SyncView from './components/SyncView';
import SettingsView from './components/SettingsView';
import { AppConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { Calendar } from 'lucide-react';

const STORAGE_KEY = 'JIKE_OPS_CONFIG_V1';

const SchedulePlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
       <Calendar className="w-10 h-10 text-slate-300" />
    </div>
    <h2 className="text-2xl font-bold text-slate-600 mb-2">发布排期</h2>
    <p className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-full">Under Construction...</p>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sync' | 'settings' | 'schedule'>('sync');
  
  // Initialize config from localStorage or fallback to default
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error("Failed to load configuration from storage:", error);
    }
    return DEFAULT_CONFIG;
  });

  const persistConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error("Failed to save configuration:", error);
    }
  };

  const handleConfigSave = (newConfig: AppConfig) => {
    persistConfig(newConfig);
    alert("配置保存成功！");
    setActiveTab('sync');
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'sync' && <SyncView config={config} />}
      {activeTab === 'settings' && <SettingsView config={config} onSave={handleConfigSave} />}
      {activeTab === 'schedule' && <SchedulePlaceholder />}
    </Layout>
  );
};

export default App;