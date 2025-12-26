import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ==================== 类型定义 ====================

type OperationMode = 'traditional' | 'ai';

type AnalysisLayer = 'content' | 'account' | 'global' | null;

type AnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'error';

interface AnalysisState {
  status: AnalysisStatus;
  currentLayer: AnalysisLayer;
  progress: number;
  taskId: string | null;
  error: string | null;
  message: string;
}

interface AppContextType {
  // 模式状态
  mode: OperationMode;
  setMode: (mode: OperationMode) => void;
  toggleMode: () => void;

  // 分析状态
  analysis: AnalysisState;
  setAnalysis: (state: Partial<AnalysisState>) => void;
  resetAnalysis: () => void;
}

// ==================== Context ====================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==================== Provider ====================

interface AppProviderProps {
  children: ReactNode;
}

const MODE_STORAGE_KEY = 'VIDEO_OPS_MODE_V1';

export function AppProvider({ children }: AppProviderProps) {
  // 从 localStorage 恢复模式，默认为传统模式
  const [mode, setModeState] = useState<OperationMode>(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === 'ai' || saved === 'traditional') {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load mode from storage:', e);
    }
    return 'traditional';
  });

  // 分析状态
  const [analysis, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    currentLayer: null,
    progress: 0,
    taskId: null,
    error: null,
    message: '',
  });

  // ==================== 模式管理 ====================

  const setMode = useCallback((newMode: OperationMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, newMode);
    } catch (e) {
      console.error('Failed to save mode to storage:', e);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'traditional' ? 'ai' : 'traditional');
  }, [mode]);

  // ==================== 分析状态管理 ====================

  const setAnalysis = useCallback((partial: Partial<AnalysisState>) => {
    setAnalysisState(prev => ({ ...prev, ...partial }));
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysisState({
      status: 'idle',
      currentLayer: null,
      progress: 0,
      taskId: null,
      error: null,
      message: '',
    });
  }, []);

  // ==================== Context Value ====================

  const value: AppContextType = {
    mode,
    setMode,
    toggleMode,
    analysis,
    setAnalysis,
    resetAnalysis,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ==================== Hook ====================

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
