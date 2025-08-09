"use client";

import { useState } from "react";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, placeholder = "Message Brett...", isLoading = false, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSendMessage && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Clear the contentEditable div
      const editableDiv = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
      if (editableDiv) {
        editableDiv.textContent = "";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-8 pt-2 pb-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative rounded-3xl p-3 transition-all duration-200 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'focus-within:border-gray-500'
        }`} style={{ backgroundColor: '#17181A', border: '1px solid #2a2b2e' }}>
          <div className="flex-1 min-h-[85px] flex flex-col">
            <div 
              contentEditable={!disabled}
              suppressContentEditableWarning
              onInput={(e) => {
                if (!disabled) {
                  const target = e.target as HTMLDivElement;
                  setMessage(target.textContent || "");
                }
              }}
              onKeyDown={(e) => {
                if (!disabled && e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className={`w-full bg-transparent border-none outline-none text-base leading-relaxed min-h-[24px] max-h-[140px] overflow-y-auto resize-none pr-12 pl-1 pt-1 ${
                disabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-100'
              }`}
              style={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
              data-placeholder={disabled ? "Connect Twitter to chat..." : placeholder}
            />
            {!message && (
              <div className="absolute top-4 left-4 pointer-events-none text-gray-400 text-base">
                {placeholder}
              </div>
            )}
          </div>
          

          {/* Bottom Right Send Button */}
          <div className="absolute bottom-4 right-4">
            <button
              type="submit"
              disabled={!message.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                message.trim() 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                width="16" 
                height="16" 
                className="text-white"
              >
                <path d="M13 7.414V19a1 1 0 1 1-2 0V7.414l-3.293 3.293a1 1 0 0 1-1.414-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L13 7.414z" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
