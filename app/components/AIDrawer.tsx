'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, TextStreamChatTransport } from "ai";
import { Sparkle, PlusCircle, History, Plus, Mic, Send, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AIDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIDrawer({ open, onOpenChange }: AIDrawerProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // 1. 适配 AI SDK 6.0 全新 Transport 架构 (完美匹配后端的 TextStream 协议)
  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: {
        sessionId: activeSessionId,
      },
      // 利用自定义 fetch 拦截响应头，获取持久化的 Session ID
      fetch: async (url, init) => {
        const res = await fetch(url, init);
        const sessionId = res.headers.get("X-Session-Id");
        if (sessionId) {
          setActiveSessionId(sessionId);
          localStorage.setItem("ai_session_id", sessionId);
        }
        return res;
      },
    }),
  });

  // 状态机判定：submitted 或 streaming 均代表正在请求/思考中
  const isLoading = status === 'submitted' || status === 'streaming';

  // 2. 自动调整文本框高度逻辑
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // 3. 提交发送逻辑
  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const textToSend = inputValue;
    setInputValue(""); // 发送前清空输入框，保持良好交互体验

    await sendMessage({
      text: textToSend,
    });
  };

  // 4. 处理回车键直接发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full rounded-none border-l shadow-2xl sm:max-w-[1200px] w-[90vw]" drawerWidth="sm:max-w-[1200px]">
        <div className="flex h-full overflow-hidden">
          {/* 左侧：历史对话列表 */}
          <aside className="w-64 border-r bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col shrink-0">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <History className="w-4 h-4" />
                历史记录
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* 模拟历史记录项 */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border shadow-sm text-sm cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all">
                <p className="font-medium truncate">如何使用 AI 优化笔记？</p>
                <p className="text-xs text-muted-foreground mt-1">12:30 PM</p>
              </div>
              <div className="p-3 rounded-xl text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all">
                <p className="font-medium truncate text-zinc-600 dark:text-zinc-400">关于 Supabase 的集成建议</p>
                <p className="text-xs text-muted-foreground mt-1">昨天</p>
              </div>
            </div>
          </aside>

          {/* 右侧：聊天主界面 */}
          <main className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
            <DrawerHeader className="border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Sparkle className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                </div>
                <div className="text-left">
                  <DrawerTitle className="text-lg">AI 助手</DrawerTitle>
                  <DrawerDescription>
                    由大模型驱动的智能笔记助手
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            
            {/* 消息展示区域 */}
            <div className="flex-1 p-6 overflow-y-auto">
              {messages.length === 0 ? (
                /* 初始空状态占位内容 */
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full"></div>
                    <Sparkle className="relative w-16 h-16 text-zinc-200 dark:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">你好，我是小艺</h3>
                    <p className="text-sm text-muted-foreground max-w-[240px]">
                      很高兴为您服务，你可以给我说您的需要。
                    </p>
                  </div>
                </div>
              ) : (
                /* 真实对话列表 */
                <div className="space-y-6 max-w-4xl mx-auto pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5 shadow-sm">
                          <Sparkle className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl p-4 text-sm max-w-[82%] leading-relaxed shadow-sm ${
                          message.role === 'user'
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-none font-medium'
                            : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none overflow-x-auto'
                        }`}
                      >
                        {(() => {
                          const textContent = message.parts 
                            ? message.parts.filter((part) => part.type === 'text').map((part) => part.text).join('')
                            : (message as any).content || (message as any).text || "";

                          if (message.role === 'user') {
                            return <div className="whitespace-pre-wrap">{textContent}</div>;
                          }
                          return <MarkdownRenderer content={textContent} />;
                        })()}
                      </div>
                      {message.role === 'user' && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shrink-0 mt-0.5 text-xs font-semibold shadow-sm">
                          我
                        </div>
                      )}
                    </div>
                  ))}
                  {/* AI 思考中加载状态 */}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-3 justify-start items-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 shadow-sm">
                        <Sparkle className="w-4 h-4 animate-spin text-zinc-500" />
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-sm text-zinc-500 rounded-bl-none animate-pulse">
                        小艺正在思考中...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 底部输入框 - 表单包装以支持 onSubmit */}
            <div className="p-4 bg-white dark:bg-zinc-950 shrink-0 border-t border-zinc-100 dark:border-zinc-900">
              <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
                <div className="relative bg-zinc-100/60 dark:bg-zinc-900/60 rounded-[24px] transition-all focus-within:bg-zinc-100 dark:focus-within:bg-zinc-900 border border-transparent focus-within:border-zinc-200 dark:focus-within:border-zinc-800 shadow-sm">
                  <div className="p-4 pb-0">
                    <textarea
                      ref={textareaRef}
                      placeholder="深度分析需求并解答，你需要什么帮助？"
                      className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none text-sm min-h-[40px] max-h-[120px] py-2 placeholder:text-zinc-500 overflow-y-auto transition-[height] duration-100"
                      rows={1}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800">
                        <ScanLine className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800">
                        <Mic className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        type="submit"
                        size="icon" 
                        className={`h-9 w-9 rounded-full transition-all duration-300 ml-1 ${
                          inputValue.trim() && !isLoading
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm hover:opacity-90" 
                          : "bg-transparent text-zinc-400 opacity-50 cursor-not-allowed"
                        }`}
                        disabled={!inputValue.trim() || isLoading}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-center text-zinc-400 mt-3">
                  AI 助手可能会产生错误，请验证其回答。
                </p>
              </form>
            </div>
          </main>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
