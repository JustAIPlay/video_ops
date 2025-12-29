// components/ReviewView/ChatInput.tsx
// Phase 3: 每日复盘会议功能 - 聊天输入框组件

import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isAI: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = '输入消息...',
  isAI
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`shrink-0 p-4 border-t transition-all duration-500 ${
      isAI ? 'border-indigo-100 bg-white/80' : 'border-slate-100 bg-white/80'
    }`}>
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className={`flex-1 relative transition-all duration-300 ${
          disabled ? 'opacity-50' : ''
        }`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
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
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={`p-3 rounded-xl transition-all duration-300 ${
            disabled || !input.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : isAI
              ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:scale-105'
              : 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:scale-105'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* 提示文字 */}
      {!disabled && (
        <div className="text-center mt-2">
          <p className={`text-xs transition-colors duration-500 ${
            isAI ? 'text-indigo-400' : 'text-slate-400'
          }`}>
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
