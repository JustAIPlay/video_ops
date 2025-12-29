// components/ReviewView/AgentInput.tsx
// Phase 3: 每日复盘会议功能 - 带 @agent 提示的输入框组件

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { AGENT_STYLES } from './constants';
import type { AgentType } from '../../types/review';

interface AgentInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isAI: boolean;
  showSummaryButton?: boolean;
  onShowSummary?: () => void;
  showEndButton?: boolean;
  onEnd?: () => void;
}

// Agent 选项（用于下拉提示）
const AGENT_OPTIONS = [
  { type: 'analyst' as AgentType, name: '数据分析', keywords: ['analyst', '数据分析'] },
  { type: 'strategist' as AgentType, name: '排期策略', keywords: ['strategist', '排期策略'] },
  { type: 'hacker' as AgentType, name: '增长黑客', keywords: ['hacker', '增长黑客'] }
];

export const AgentInput: React.FC<AgentInputProps> = ({
  onSend,
  disabled = false,
  isAI,
  showSummaryButton = false,
  onShowSummary,
  showEndButton = false,
  onEnd
}) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchText, setSearchText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 过滤匹配的 Agent 选项
  const filteredAgents = AGENT_OPTIONS.filter(agent =>
    agent.keywords.some(kw => kw.toLowerCase().includes(searchText.toLowerCase()))
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // 获取光标位置
    const cursor = e.target.selectionStart;
    setCursorPosition(cursor);

    // 检查是否在输入 @ 符号
    const textBeforeCursor = value.substring(0, cursor);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setSearchText(atMatch[1]);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
      setSearchText('');
    }

    // 自适应高度
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredAgents.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredAgents.length) {
          selectAgent(filteredAgents[selectedIndex]);
        } else if (selectedIndex === -1 && input.trim()) {
          handleSend();
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  // 选择 Agent
  const selectAgent = (agent: typeof AGENT_OPTIONS[0]) => {
    const textBeforeCursor = input.substring(0, cursorPosition);
    const textAfterCursor = input.substring(cursorPosition);
    const newText = textBeforeCursor.replace(/@\w*$/, `@${agent.name} `) + textAfterCursor;

    setInput(newText);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // 聚焦并设置光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = cursorPosition - searchText.length - 1 + agent.name.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // 发送消息
  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
      setShowSuggestions(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 滚动选中项到可见区域
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const items = suggestionsRef.current.querySelectorAll('[role="option"]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="flex items-center gap-3 justify-center">
      {/* 输入框 + 发送按钮 */}
      <div className="flex-1 flex items-end gap-2 relative" ref={containerRef}>
        <div className={`flex-1 relative transition-all duration-300 ${disabled ? 'opacity-50' : ''}`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="@数据分析 提问..."
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-3 pr-12 rounded-2xl border resize-none transition-all duration-300 ${
              isAI
                ? 'border-indigo-200 bg-indigo-50/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                : 'border-slate-200 bg-slate-50/50 focus:border-slate-300 focus:ring-2 focus:ring-slate-100'
            } focus:outline-none`}
            style={{
              minHeight: '48px',
              maxHeight: '120px'
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={`rounded-xl transition-all duration-300 shrink-0 ${
            disabled || !input.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : isAI
              ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:scale-105'
              : 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:scale-105'
          }`}
          style={{
            height: '48px',
            width: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send className="w-5 h-5" />
        </button>

        {/* Agent 下拉提示 */}
        {showSuggestions && filteredAgents.length > 0 && (
          <div
            ref={suggestionsRef}
            className={`absolute bottom-full left-0 mb-2 w-64 rounded-xl shadow-2xl border overflow-hidden z-50 ${
              isAI
                ? 'bg-white border-indigo-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className={`p-2 text-xs font-medium border-b ${
              isAI ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
            }`}>
              选择要提问的 Agent
            </div>
            {filteredAgents.map((agent, index) => (
              <div
                key={agent.type}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => selectAgent(agent)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? isAI
                      ? 'bg-indigo-100'
                      : 'bg-slate-100'
                    : isAI
                    ? 'hover:bg-indigo-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  AGENT_STYLES[agent.type].colors.bg
                }`}>
                  <span className="text-sm">{AGENT_STYLES[agent.type].avatar}</span>
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    isAI ? 'text-slate-800' : 'text-slate-800'
                  }`}>
                    {agent.name}
                  </div>
                  <div className={`text-xs ${
                    isAI ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    @{agent.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 复盘会议总结按钮 */}
      {showSummaryButton && onShowSummary && (
        <button
          onClick={onShowSummary}
          className={`px-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shrink-0 ${
            isAI
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:scale-105'
              : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 hover:scale-105'
          }`}
          style={{ height: '48px' }}
        >
          <FileText className="w-5 h-5" />
          复盘会议总结
        </button>
      )}

      {/* 结束会议按钮 */}
      {showEndButton && onEnd && (
        <button
          onClick={onEnd}
          className="px-5 rounded-xl font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors shrink-0"
          style={{ height: '48px' }}
        >
          结束会议
        </button>
      )}
    </div>
  );
};

// 需要导入 FileText 图标
import { FileText } from 'lucide-react';

export default AgentInput;
