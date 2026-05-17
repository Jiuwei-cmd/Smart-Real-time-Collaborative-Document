'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Sparkle, PlusCircle, History, Plus, Mic, Send, ScanLine, Loader2, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useUserStore } from "@/app/store/useUserStore";
import { fetchAISessions, fetchAIMessages, AISession } from "@/lib/api/messageAI";
import { fetchNotes, Note } from "@/lib/api/notes";
import { formatSessionTime } from "@/lib/utils/timeUtils";

interface AIDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIDrawer({ open, onOpenChange }: AIDrawerProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // 新增：用户状态与会话列表状态
  const { user } = useUserStore();
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [sessions, setSessions] = useState<AISession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // 文档引用状态
  const [mentionQuery, setMentionQuery] = useState<{ query: string, index: number } | null>(null);
  const [mentionedDocs, setMentionedDocs] = useState<{ id: string; title: string }[]>([]);
  const [searchedDocs, setSearchedDocs] = useState<Note[]>([]);
  const [isSearchingDocs, setIsSearchingDocs] = useState(false);
  const [debouncedSearchQuery] = useDebounce(mentionQuery?.query || "", 300);
  const isMentioning = mentionQuery !== null;

  // 监听 @ 搜索
  useEffect(() => {
    if (!isMentioning || !user?.id) {
      setSearchedDocs([]);
      return;
    }
    
    let isMounted = true;
    const searchDocs = async () => {
      setIsSearchingDocs(true);
      try {
        const result = await fetchNotes({
          userId: user.id,
          searchKeyword: debouncedSearchQuery,
          pageSize: 100
        });
        if (isMounted) {
          setSearchedDocs(result.notes);
        }
      } catch (err) {
        console.error("搜索文档失败:", err);
      } finally {
        if (isMounted) {
          setIsSearchingDocs(false);
        }
      }
    };
    
    searchDocs();
    
    return () => { isMounted = false; };
  }, [debouncedSearchQuery, isMentioning, user?.id]);

  // 处理文本输入
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    
    // 匹配末尾的 @ 后跟非空字符
    const match = textBeforeCursor.match(/@([^\s]*)$/);
    if (match) {
      setMentionQuery({ query: match[1], index: match.index! });
    } else {
      setMentionQuery(null);
    }
  };

  // 选择文档
  const handleSelectDoc = (doc: Note) => {
    if (!mentionQuery) return;
    
    // 移除触发搜索的 @ 字符串部分
    const newValue = 
      inputValue.substring(0, mentionQuery.index) + 
      inputValue.substring(mentionQuery.index + mentionQuery.query.length + 1);
      
    setInputValue(newValue);
    setMentionQuery(null);
    
    if (!mentionedDocs.find(d => d.id === doc.id)) {
      setMentionedDocs([...mentionedDocs, { id: doc.id, title: doc.title }]);
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 1. 适配 AI SDK 6.0 全新 Transport 架构 (完美匹配后端的 TextStream 协议)
  const { messages, sendMessage, status, setMessages } = useChat({
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
          // 惰性创建新会话成功后，突破 useChat 陈旧闭包，实时拉取左侧列表以展示新会话
          if (userRef.current?.id) {
            fetchAISessions(userRef.current.id).then(data => setSessions(data));
          }
        }
        return res;
      },
    }),
  });

  // 状态机判定：submitted 或 streaming 均代表正在请求/思考中
  const isLoading = status === 'submitted' || status === 'streaming';

  // 2. 加载左侧历史会话列表
  const loadSessions = async () => {
    if (!user?.id) return;
    setLoadingSessions(true);
    try {
      const data = await fetchAISessions(user.id);
      setSessions(data);
      
      // 自动选中逻辑：优先 localStorage 中记录的 ID，否则选中最近一条
      const savedSessionId = localStorage.getItem("ai_session_id");
      if (!activeSessionId) {
        if (savedSessionId && data.some(s => s.id === savedSessionId)) {
          setActiveSessionId(savedSessionId);
        } else if (data.length > 0) {
          setActiveSessionId(data[0].id);
          localStorage.setItem("ai_session_id", data[0].id);
        }
      }
    } catch (err) {
      console.error("加载会话列表失败:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // 当 Drawer 打开或登录用户变化时，拉取会话列表
  useEffect(() => {
    if (open && user?.id) {
      loadSessions();
    }
  }, [open, user?.id]);

  // 3. 当 activeSessionId 改变时，自动拉取对应历史消息并注入到 useChat 中
  useEffect(() => {
    async function loadHistoryMessages() {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }
      try {
        const historyData = await fetchAIMessages(activeSessionId);
        const formattedMessages = historyData.map(msg => ({
          id: msg.id, 
          role: msg.role, 
          content: msg.content,
          parts: [{ type: "text", text: msg.content }],
        }));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("拉取历史消息记录失败:", err);
      }
    }
    if (open) {
      loadHistoryMessages();
    }
  }, [activeSessionId, open, setMessages]);

  // 4. 新建对话逻辑
  const handleNewSession = () => {
    setActiveSessionId(null);
    localStorage.removeItem("ai_session_id");
    setMessages([]); // 清空主界面聊天气泡，等待惰性创建
  };

  // 自动调整文本框高度逻辑
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // 当消息更新时自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [messages]);

  // 提交发送逻辑
  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputValue.trim() && mentionedDocs.length === 0) || isLoading) return;

    let textToSend = inputValue.trim();
    const activeDocIds = mentionedDocs.map(doc => doc.id);

    // 将引用的文档信息拼接到文本中，以便在聊天界面和历史记录中展示
    if (mentionedDocs.length > 0) {
      const docTags = mentionedDocs.map(d => `📄 ${d.title}`).join('  ');
      if (textToSend) {
        textToSend = `${docTags}\n\n${textToSend}`;
      } else {
        textToSend = `${docTags}\n\n请分析以上文档`;
      }
    }

    setInputValue(""); // 发送前清空输入框，保持良好交互体验
    setMentionQuery(null);
    setMentionedDocs([]); // 清空已引用的文档

    await sendMessage({
      text: textToSend,
    }, {
      body: {
        sessionId: activeSessionId,
        documentIds: activeDocIds.length > 0 ? activeDocIds : undefined,
      }
    });
  };

  // 处理回车键直接发送
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
              <Button onClick={handleNewSession} variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-200/50 dark:hover:bg-zinc-800" title="新建会话">
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8 text-zinc-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>加载中...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 text-xs">
                  暂无历史记录
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        localStorage.setItem("ai_session_id", session.id);
                      }}
                      className={`p-3 rounded-xl text-sm cursor-pointer transition-all ${
                        isActive 
                          ? "bg-white dark:bg-zinc-800 border ring-1 ring-primary/20 shadow-sm font-medium text-zinc-900 dark:text-zinc-100" 
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <p className="font-medium truncate">{session.title || "新会话"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatSessionTime(session.created_at)}
                      </p>
                    </div>
                  );
                })
              )}
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
                  {/* 用于自动滚动的锚点 */}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              )}
            </div>

            {/* 底部输入框 - 表单包装以支持 onSubmit */}
            <div className="p-4 bg-white dark:bg-zinc-950 shrink-0 border-t border-zinc-100 dark:border-zinc-900">
              <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
                <div className="relative bg-zinc-100/60 dark:bg-zinc-900/60 rounded-[24px] transition-all focus-within:bg-zinc-100 dark:focus-within:bg-zinc-900 border border-transparent focus-within:border-zinc-200 dark:focus-within:border-zinc-800 shadow-sm">
                  {/* 文档引用选择列表 */}
                  {mentionQuery && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 max-h-60 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50">
                      {isSearchingDocs ? (
                        <div className="p-3 text-sm text-zinc-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> 搜索中...
                        </div>
                      ) : searchedDocs.length > 0 ? (
                        <div className="p-1">
                          {searchedDocs.map(doc => (
                            <div 
                              key={doc.id} 
                              className="px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-colors"
                              onClick={() => handleSelectDoc(doc)}
                            >
                              {/* <div className="w-5 h-5 flex items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                                <ScanLine className="w-3 h-3" />
                              </div> */}
                              <span className="truncate">{doc.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-sm text-zinc-500 text-center">
                          未找到相关文档
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 pb-0 flex flex-col gap-2">
                    {/* 已选中的文档标签 */}
                    {mentionedDocs.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-1">
                        {mentionedDocs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-md text-xs">
                            <FileText className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{doc.title}</span>
                            <button 
                              type="button"
                              onClick={() => setMentionedDocs(prev => prev.filter(d => d.id !== doc.id))}
                              className="ml-1 hover:text-red-500 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <textarea
                      ref={textareaRef}
                      placeholder="您可以询问任何问题， @文档 可以针对文档进行提问"
                      className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none text-sm min-h-[40px] max-h-[120px] py-2 placeholder:text-zinc-500 overflow-y-auto transition-[height] duration-100"
                      rows={1}
                      value={inputValue}
                      onChange={handleInputChange}
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
                          (inputValue.trim() || mentionedDocs.length > 0) && !isLoading
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm hover:opacity-90" 
                          : "bg-transparent text-zinc-400 opacity-50 cursor-not-allowed"
                        }`}
                        disabled={(!inputValue.trim() && mentionedDocs.length === 0) || isLoading}
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
