import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SyncView from './components/SyncView';
import SettingsView from './components/SettingsView';
import ScheduleView from './components/ScheduleView';
import { ReviewView } from './components/ReviewView';
import { AppConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { Calendar } from 'lucide-react';
import { AppProvider } from './contexts/AppContext';
import './styles/theme-ai.css';

const STORAGE_KEY = 'JIKE_OPS_CONFIG_V1';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sync' | 'settings' | 'schedule' | 'review'>('sync');

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
      {activeTab === 'schedule' && <ScheduleView config={config} />}
      {activeTab === 'review' && <ReviewView />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;