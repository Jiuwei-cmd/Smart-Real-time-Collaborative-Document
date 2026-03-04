'use client';
import { useEffect } from 'react';
import { ThemeToggle } from '@/components/editor/plugins/ThemeToggle';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Bell, MessageCircle, UserPlus, Smile, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 EmojiPicker 以避免 SSR 问题
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
import { useUserStore } from '../store/useUserStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { useUserProfileStore } from '../store/useUserProfileStore';
import { addFriend, searchUserByEmail, getFriendRequestsReceived, acceptFriendRequest, rejectFriendRequest, getAcceptedFriends, subscribeFriendRequests, subscribeFriendRequestResponses, getUserById, sendMessage, getMessages, subscribeMessages, subscribeAllMessages, getSentPendingRequests, Message, FriendRequest } from '@/lib/api/friends';

// ... existing code ...
import { UserProfile } from '@/lib/api/users';
import { subscribeDocumentShares, getSharedWithMe } from '@/lib/api/shares';
import { usePresence } from '@/hooks/usePresence';
import { createPortal } from 'react-dom';
import { DrawingCanvas } from '@/components/ui/DrawingCanvas';
// import html2canvas from 'html2canvas';
import { domToCanvas } from 'modern-screenshot';
import { env } from 'process';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  // const [user, setUser] = useState<any>(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [friends, setFriends] = useState<UserProfile[]>([]); // 好友列表
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<{ id: string; email?: string; nickname?: string; avatar_url?: string; created_at?: string; updated_at?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [searchedEmail, setSearchedEmail] = useState(''); // 用于显示在错误提示中
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [processingAcceptedRequestId, setProcessingAcceptedRequestId] = useState<string | null>(null); // 正在处理的请求ID
  const [processingRejectedRequestId, setProcessingRejectedRequestId] = useState<string | null>(null); // 正在处理的请求ID
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]); // 好友请求列表
  const [messages, setMessages] = useState<Message[]>([]); // 当前聊天的消息列表
  const [messageInput, setMessageInput] = useState(''); // 消息输入框
  const messagesEndRef = useRef<HTMLDivElement>(null); // 消息列表底部引用
  const [processingFriendRequestId, setProcessingFriendRequestId] = useState<string | null>(null); // 正在处理的请求ID（发送请求）
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set()); // 已发送请求的用户ID集合
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // 表情选择器显示状态
  const [isSelecting, setIsSelecting] = useState(false); // 截图选择状态
  const [rect, setRect] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false); // 画笔功能启用状态
  const [drawingColor, setDrawingColor] = useState('#ff0000'); // 画笔颜色，默认红色
  
  // 文字提取结果弹窗状态
  const [isTextExtractDialogOpen, setIsTextExtractDialogOpen] = useState(false);
  const [extractedImage, setExtractedImage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  
  // 分享给我的笔记列表
  interface SharedNoteItem {
    shareId: string;
    documentId: string;
    ownerId: string;
    ownerName: string;
    noteTitle: string;
    createdAt: string;
  }
  const [sharedNotes, setSharedNotes] = useState<SharedNoteItem[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  
  const user = useUserStore((state) => state.user);
  const profile = useUserProfileStore((state) => state.profile);
  const fetchUserProfile = useUserProfileStore((state) => state.fetchUserProfile);

  // 在线状态检测
  const { isOnline } = usePresence(profile?.id);

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 获取好友请求
  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (profile?.id) {
        try {
          const requests = await getFriendRequestsReceived(profile.id);
          console.log(requests)
          setFriendRequests(requests);
        } catch (error) {
          console.error('获取好友请求失败:', error);
        }
      }
    };

    fetchFriendRequests();
  }, [profile?.id, isNotificationDrawerOpen]);

  // 获取分享给我的笔记列表
  useEffect(() => {
    const fetchSharedNotes = async () => {
      if (profile?.id && isNotificationDrawerOpen) {
        setIsLoadingShares(true);
        try {
          const shares = await getSharedWithMe(profile.id);
          
          // 直接映射数据，不需要额外查询
          const notesData: SharedNoteItem[] = shares.map((share) => ({
            shareId: share.id,
            documentId: share.document_id,
            ownerId: share.owner_id,
            ownerName: (share.user_profiles as any)?.nickname || '未知用户',
            noteTitle: (share.notes as any)?.title || '未命名笔记',
            createdAt: share.created_at,
          }));
          
          setSharedNotes(notesData);
        } catch (error) {
          console.error('获取分享笔记列表失败:', error);
        } finally {
          setIsLoadingShares(false);
        }
      }
    };

    fetchSharedNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isNotificationDrawerOpen]);

  // 获取好友列表
  useEffect(() => {
    const fetchFriends = async () => {
      if (profile?.id && isChatDrawerOpen) {
        try {
          const friendsList = await getAcceptedFriends(profile.id);
          setFriends(friendsList);
          // 如果有好友且没有选中，默认选中第一个
          if (friendsList.length > 0 && !selectedFriend) {
            setSelectedFriend(friendsList[0].id);
          }
        } catch (error) {
          console.error('获取好友列表失败:', error);
        }
      }
    };

    fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isChatDrawerOpen]);

  // Realtime 订阅好友请求
  useEffect(() => {
    if (!profile?.id) return;

    const unsubscribe = subscribeFriendRequests(profile.id, async (newRequest) => {
      try {
        // 获取请求发送人的信息
        const requests = await getFriendRequestsReceived(profile.id);
        setFriendRequests(requests);
        
        // 显示 toast 通知
        const request = requests.find(r => r.requester.id === newRequest.requester_id);
        toast.success('新好友请求', {
          description: `${request?.requester.nickname || '未知用户'} 想要添加您为好友`,
          duration: 5000,
        });
        
        console.log('✅ 已更新好友请求列表');
      } catch (error) {
        console.error('处理新好友请求失败:', error);
        toast.error('接收好友请求失败', {
          description: '请刷新页面重试',
        });
      }
    });

    // 组件卸载时取消订阅
    return () => {
      unsubscribe();
    };
  }, [profile?.id]);

  // 订阅好友发送消息响应（全局，用于在抽屉关闭时显示通知）
  useEffect(() => {
    if (!profile?.id) return;

    const unsubscribe = subscribeAllMessages(profile.id, async (newMessage) => {
      // 只在抽屉关闭时显示通知
      if (!isChatDrawerOpen) {
        try {
          // 获取发送者信息
          const sender = await getUserById(newMessage.sender_id);
          toast.info('新消息', {
            description: `${sender?.nickname || '好友'}: ${newMessage.content}`,
            duration: 5000,
          });
        } catch (error) {
          console.error('获取发送者信息失败:', error);
          // 如果获取失败，仍然显示消息通知
          toast.info('新消息', {
            description: newMessage.content,
            duration: 5000,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.id, isChatDrawerOpen]);

  // 订阅笔记分享通知
  useEffect(() => {
    if (!profile?.id) return;

    const unsubscribe = subscribeDocumentShares(profile.id, async (newShare) => {
      try {
        // 获取分享者信息
        const sharer = await getUserById(newShare.owner_id);
        
        // 显示 toast 通知
        toast.info('收到新的笔记分享', {
          description: `${sharer?.nickname || '好友'} 分享了一篇笔记给你`,
          duration: 5000,
        });
      } catch (error) {
        console.error('处理笔记分享通知失败:', error);
        // 如果获取失败，仍然显示通知
        toast.info('收到新的笔记分享', {
          description: '有人分享了笔记给你',
          duration: 5000,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.id]);

  // Realtime 订阅好友请求响应（自己发送的请求被接受或拒绝）
  useEffect(() => {
    if (!profile?.id) return;

    const unsubscribe = subscribeFriendRequestResponses(
      profile.id,
      // 请求被接受
      async (acceptedRequest) => {
        try {
          const addressee = await getUserById(acceptedRequest.addressee_id);
          toast.success('好友请求已通过', {
            description: `${addressee?.nickname || '未知用户'} 接受了您的好友请求`,
            duration: 5000,
          });
          // 刷新好友列表
          if (isChatDrawerOpen) {
            const friendsList = await getAcceptedFriends(profile.id);
            setFriends(friendsList);
          }
        } catch (error) {
          console.error('处理好友请求接受通知失败:', error);
        }
      },
      // 请求被拒绝
      async (rejectedRequest) => {
        try {
          const addressee = await getUserById(rejectedRequest.addressee_id);
          toast.error('好友请求被拒绝', {
            description: `${addressee?.nickname || '未知用户'} 拒绝了您的好友请求`,
            duration: 5000,
          });
        } catch (error) {
          console.error('处理好友请求拒绝通知失败:', error);
        }
      }
    );

    // 组件卸载时取消订阅
    return () => {
      unsubscribe();
    };
  }, [profile?.id, isChatDrawerOpen]);

  // 加载聊天消息历史
  useEffect(() => {
    const loadMessages = async () => {
      if (profile?.id && selectedFriend) {
        try {
          const msgs = await getMessages(profile.id, selectedFriend);
          setMessages(msgs);
        } catch (error) {
          console.error('加载消息失败:', error);
        }
      } else {
        setMessages([]);
      }
    };

    loadMessages();
  }, [profile?.id, selectedFriend]);

  // Realtime 订阅聊天消息
  useEffect(() => {
    if (!profile?.id || !selectedFriend) return;

    const unsubscribe = subscribeMessages(profile.id, selectedFriend, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.id, selectedFriend]);

  // 自动滚动到消息列表底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!profile?.id || !selectedFriend || !messageInput.trim()) return;

    try {
      await sendMessage(profile.id, selectedFriend, messageInput);
      // 添加到本地消息列表（乐观更新）
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(), // 临时ID
          sender_id: profile.id,
          receiver_id: selectedFriend,
          content: messageInput,
          created_at: new Date().toISOString(),
          is_read: false,
        },
      ]);
      setMessageInput(''); // 清空输入框
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送失败', {
        description: '请重试',
      });
    }
  };

  // 退出登录处理函数
  const onClickLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  // 1. 开始截图模式
  // const startScreenshot = () => setIsSelecting(true);
  // 1. 定义 Ref 来存储坐标，这样监听器永远能拿到最新值
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [showControls, setShowControls] = useState(false);
  const controlPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSelecting) {
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('overflow');
      return;
    }

    document.body.style.setProperty('cursor', 'crosshair', 'important');
    // 禁止页面滚动
    document.body.style.setProperty('overflow', 'hidden', 'important');

    // 拦截滚轮事件，彻底阻止滚动
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    // 拦截触摸滑动（移动端）
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('wheel', onWheel, { capture: true, passive: false });
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });

    const onMouseDown = (e: MouseEvent) => {

      if (controlPanelRef.current?.contains(e.target as Node)) {
      return;
    }

    // 如果控制面板已显示（已经有选区），则不处理新的截图选择
    if(showControls){
      // 只有在画笔模式未启用时才直接返回，启用时由 DrawingCanvas 处理
      if (!isDrawingEnabled) {
        return;
      }
      // 如果画笔模式已启用，也返回，让 DrawingCanvas 处理事件
      return;
    }
    
      e.stopImmediatePropagation();
      isDraggingRef.current = true; // 更新 Ref
      setShowControls(false);
      
      const { clientX, clientY } = e;
      startPosRef.current = { x: clientX, y: clientY }; // 记录起点到 Ref
      
      // 初始化 UI 上的矩形
      setRect({ left: clientX, top: clientY, width: 0, height: 0 });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.stopImmediatePropagation();

      const currentX = e.clientX;
      const currentY = e.clientY;
      const startX = startPosRef.current.x;
      const startY = startPosRef.current.y;

      // 自动处理反向拖拽（从右往左或从下往上）
      setRect({
        left: Math.min(startX, currentX),
        top: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY),
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.stopImmediatePropagation();
      isDraggingRef.current = false;
      setShowControls(true);
      // 绘制完选区后恢复默认鼠标样式
      document.body.style.removeProperty('cursor');
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setRect({ left: 0, top: 0, width: 0, height: 0 });
        setIsSelecting(false);
        setIsDrawingEnabled(false); // 重置画笔状态
        setShowControls(false); // 重置控制面板状态
        setDrawingColor('#ff0000'); // 重置颜色为红色
      }
    };

    // 绑定监听器
    window.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('mouseup', onMouseUp, true);
    window.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('touchmove', onTouchMove, true);
    };
  }, [isSelecting, showControls, isDrawingEnabled]); // 添加所有在 effect 中使用的状态

  // ========== 公共方法：截取选区，返回 { dataUrl, base64 } ==========
  const captureSelectedArea = async (): Promise<{ dataUrl: string; base64: string } | null> => {
    // 1. 先保存画笔涂鸦层（必须在 setShowControls(false) 之前，否则组件卸载后拿不到）
    const drawingCanvas = document.querySelector<HTMLCanvasElement>('[data-drawing-canvas="true"]');
    const savedDrawingCanvas = document.createElement('canvas');
    if (drawingCanvas) {
      savedDrawingCanvas.width = drawingCanvas.width;
      savedDrawingCanvas.height = drawingCanvas.height;
      savedDrawingCanvas.getContext('2d')?.drawImage(drawingCanvas, 0, 0);
    }

    // 2. 隐藏工具栏，避免截图截到按钮
    setShowControls(false);

    // 3. 截取整个页面
    const fullCanvas = await domToCanvas(document.body, {
      scale: window.devicePixelRatio,
      features: { restoreScrollPosition: true },
    });

    // 4. 裁剪到选区
    const { left, top, width, height } = rect;
    const dpr = window.devicePixelRatio || 1;
    const cropTop = top + window.scrollY;
    const cropLeft = left + window.scrollX;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = width * dpr;
    croppedCanvas.height = height * dpr;
    const ctx = croppedCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      fullCanvas,
      cropLeft * dpr, cropTop * dpr, width * dpr, height * dpr,
      0, 0, width * dpr, height * dpr
    );

    // 5. 叠加画笔涂鸦层
    if (drawingCanvas) {
      ctx.drawImage(savedDrawingCanvas, 0, 0, width * dpr, height * dpr);
    }

    const dataUrl = croppedCanvas.toDataURL('image/png');
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    return { dataUrl, base64 };
  };

  // ========== 完成截图：截取选区并下载 ==========
  const handleSaveScreenshot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await captureSelectedArea();
      if (result) {
        const link = document.createElement('a');
        link.href = result.dataUrl;
        link.download = `screenshot_${Date.now()}.png`;
        link.click();
      }
    } catch (error) {
      console.error('截图失败:', error);
      setShowControls(true);
    } finally {
      setIsSelecting(false);
      setRect({ left: 0, top: 0, width: 0, height: 0 });
      setIsDrawingEnabled(false);
      setShowControls(false);
      setDrawingColor('#ff0000');
    }
  };


  // ========== 提取文字：截取选区 → 弹窗展示结果 ==========
  const handleExtractText = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await captureSelectedArea();
      if (!result) return;
      
      // 1. 设置状态并打开面板
      setExtractedImage(result.dataUrl);
      setExtractedText('');
      setIsExtracting(true);
      setIsTextExtractDialogOpen(true);

      // 2. 隐藏截图相关控制层并恢复正常的UI
      setIsSelecting(false);
      setRect({ left: 0, top: 0, width: 0, height: 0 });
      setIsDrawingEnabled(false);
      setShowControls(false);
      setDrawingColor('#ff0000');

      // 3. 调用 API 获取文字
      const response = await fetch('/api/recognize-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data: result.base64 }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '识别失败');
      }
      const { content: text } = await response.json();
      setExtractedText(text);

    } catch (error) {
      console.error('提取文字失败:', error);
      // 如果出错，就在文本框里显示错误信息
      setExtractedText('提取文字失败，请检查 API Key 是否配置正确或刷新重试。');
    } finally {
      setIsExtracting(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <AlertDialog open={isLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>你确定要退出登录吗?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsLogoutDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white" onClick={onClickLogout}>确认退出</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 提取文字对话框 */}
      <Dialog open={isTextExtractDialogOpen} onOpenChange={setIsTextExtractDialogOpen}>
        <DialogContent 
          className="flex flex-col p-6 transition-all duration-300"
          style={{
            maxWidth: rect.width > rect.height ? '1000px' : '800px',
            width: '90vw',
            height: rect.height > rect.width ? '85vh' : '70vh'
          }}
        >
          <DialogHeader>
            <DialogTitle>提取结果</DialogTitle>
          </DialogHeader>
          <div className={`flex flex-1 gap-4 overflow-hidden mt-4 ${rect.height > rect.width * 1.5 ? 'flex-row' : 'flex-col md:flex-row'}`}>
            {/* 存放图片 */}
            <div className={`border rounded-md flex items-center justify-center bg-muted/30 overflow-hidden relative ${rect.height > rect.width * 1.5 ? 'w-1/2' : 'flex-1'}`}>
              {extractedImage && (
                <img src={extractedImage} alt="Extracted" className="max-w-full max-h-full object-contain" />
              )}
            </div>
            {/* 右侧文字 */}
            <div className={`border rounded-md relative flex flex-col ${rect.height > rect.width * 1.5 ? 'w-1/2' : 'flex-1'}`}>
              {isExtracting ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <svg className="h-8 w-8 animate-spin mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>正在识别中...</span>
                </div>
              ) : (
                <>
                  <textarea 
                    className="flex-1 w-full p-4 resize-none border-none focus:outline-none bg-transparent"
                    value={extractedText}
                    readOnly
                  />
                  <div className="absolute right-4 bottom-4">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(extractedText);
                        toast.success('已复制到剪贴板');
                      }}
                    >
                      复制文字
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加好友对话框 */}
      <Dialog open={isAddFriendDialogOpen} onOpenChange={setIsAddFriendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加好友</DialogTitle>
            <DialogDescription>
              输入好友的邮箱地址来发送好友请求
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 搜索框 */}
            <div className="flex flex-row gap-2">
              <Input
                ref={emailInputRef}
                placeholder="请输入好友的邮箱地址"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && emailInputRef.current?.value.trim()) {
                    // 按回车键搜索
                    (e.currentTarget.nextElementSibling as HTMLButtonElement)?.click();
                  }
                }}
              />
              <Button
                type="button"
                onClick={async () => {
                  const email = emailInputRef.current?.value.trim() || '';
                  if (email) {
                    setIsSearching(true);
                    setSearchNotFound(false);
                    setShowSearchResult(false);
                    setSearchedEmail(email);
                    try {
                      const ids = await getSentPendingRequests(profile!.id);
                      setSentRequestIds(new Set(ids));
                      const users = await searchUserByEmail(email);
                      console.log(users);
                      if (users && users.length > 0) {
                        // TODO: 暂时只显示第一个结果，后续需要改为显示列表
                        setSearchedUsers(users);
                        setShowSearchResult(true);
                        setSearchNotFound(false);
                      } else {
                        setSearchNotFound(true);
                        setShowSearchResult(false);
                      }
                    } catch (error) {
                      console.error('搜索用户失败:', error);
                      setSearchNotFound(true);
                      setShowSearchResult(false);
                    } finally {
                      setIsSearching(false);
                    }
                  }
                }}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    搜索中...
                  </>
                ) : (
                  '搜索'
                )}
              </Button>
            </div>

            {/* 未找到用户提示 */}
            {searchNotFound && (
              <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/10">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-destructive mb-1">未找到该用户</h4>
                    <p className="text-xs text-muted-foreground">
                      无法找到邮箱为 <span className="font-medium">{searchedEmail}</span> 的用户，请检查邮箱地址是否正确。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 搜索结果展示 - 多个用户列表 */}
            {showSearchResult && searchedUsers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground px-1">
                  找到 {searchedUsers.length} 个匹配结果
                </p>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {searchedUsers.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center gap-3">
                        {/* 头像 */}
                        {user.avatar_url ? (
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {(user.nickname || user.email)?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-semibold">
                              {(user.nickname || user.email)?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        
                        {/* 用户信息 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {user.nickname || '未命名用户'}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email || '无邮箱信息'}
                          </p>
                        </div>
                        
                        {/* 添加按钮 */}

                        {user.id !== profile?.id && (() => {
                          // 检查是否已经是好友
                          const isAlreadyFriend = friends.some(friend => friend.id === user.id);
                          // 检查是否已发送请求
                          const isRequestSent = sentRequestIds.has(user.id);
                          
                          if (isAlreadyFriend) {
                            return (
                              <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted rounded-md">
                                已添加
                              </div>
                            );
                          }

                          if (isRequestSent) {
                            return (
                              <div className="px-3 py-1.5 text-xs text-green-600 bg-green-50 rounded-md border border-green-200">
                                已发送
                              </div>
                            );
                          }
                          
                          return (
                            <Button
                              size="sm"
                              disabled={processingFriendRequestId === user.id}
                              onClick={async () => {
                                if (!profile?.id) return;
                                setProcessingFriendRequestId(user.id);
                                try {
                                  await addFriend(profile.id, user.id);
                                  setSentRequestIds(prev => new Set(prev).add(user.id));
                                } catch (error) {
                                  console.error('添加好友失败:', error);
                                  toast.error('发送请求失败，请重试');
                                } finally {
                                  setProcessingFriendRequestId(null);
                                }
                              }}
                            >
                              {processingFriendRequestId === user.id ? '发送中...' : '添加'}
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 顶部导航栏 */}
      <header className="w-full p-4 border-b border-border">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <h1 className="text-xl font-bold">{profile?.nickname || user?.email || '用户'} - 你的个人文档中心</h1>
          <div className='flex items-center gap-2'>
            {/* 添加好友按钮 */}
            <button 
              onClick={async () => {
                setIsAddFriendDialogOpen(true);
                if (emailInputRef.current) emailInputRef.current.value = '';
                setShowSearchResult(false);
                setSearchedUsers([]);
                setSearchNotFound(false);
                
                // 加载好友列表（用于检查是否已添加）
                if (profile?.id && friends.length === 0) {
                  try {
                    const friendsList = await getAcceptedFriends(profile.id);
                    setFriends(friendsList);
                  } catch (error) {
                    console.error('加载好友列表失败:', error);
                  }
                }
              }}
              className="relative p-2 rounded-lg hover:bg-accent transition-colors group"
              title="添加好友"
            >
              <UserPlus className="h-4 w-4 text-black dark:text-white transition-colors" />
            </button>
            
            {/* 消息通知 Badge */}
            <button 
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="relative p-2 rounded-lg hover:bg-accent transition-colors group"
            >
              <Bell className="h-4 w-4 text-black dark:text-white transition-colors" />
              {/* 未读消息数量徽章 */}
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 min-w-[10px] flex items-center justify-center p-0 px-1 text-xs font-semibold rounded-full"
              >
                3
              </Badge>
            </button>
            
            {/* 好友/聊天 Badge */}
            <button 
              onClick={() => setIsChatDrawerOpen(true)}
              className="relative p-2 rounded-lg hover:bg-accent transition-colors group"
            >
              <MessageCircle className="h-4 w-4 text-black dark:text-white transition-colors" />
              {/* 未读消息数量徽章 - 使用脉冲动画 */}
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 min-w-[10px] flex items-center justify-center p-0 px-1 text-xs font-semibold rounded-full animate-pulse"
              >
                5
              </Badge>
            </button>
            
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className='mr-2 cursor-pointer'>
                  {/* <AvatarImage src={user?.user_metadata?.avatar_url || ''} /> */}
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-52 bg-popover text-popover-foreground shadow-lg' align="end">
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className='mr-2 h-4 w-4' />
                  设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)} className="text-red-600">
                  <LogOut className='mr-2 h-4 w-4' />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 消息通知抽屉 */}
      <Drawer open={isNotificationDrawerOpen} onOpenChange={setIsNotificationDrawerOpen} direction="left">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>消息通知</DrawerTitle>
            <DrawerDescription>查看所有系统通知和消息提醒</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* 笔记分享通知 */}
            {isLoadingShares ? (
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : sharedNotes.length > 0 ? (
              sharedNotes.map((note) => (
                <div key={note.shareId} className="p-3 border rounded-lg bg-card">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">笔记协作邀请</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {note.ownerName} 分享了「{note.noteTitle}」给你
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      router.push(`/dashboard/notes?id=${note.documentId}&ownerName=${encodeURIComponent(note.ownerName)}&ownerId=${note.ownerId}`);
                      setIsNotificationDrawerOpen(false);
                    }}
                  >
                    查看笔记
                  </Button>
                </div>
              ))
            ) : null}
            {/* 动态显示好友请求 */}
            {friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <div key={request.id} className="p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    {request.requester.avatar_url ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.requester.avatar_url} />
                        <AvatarFallback>
                          {request.requester.nickname?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold">
                          {request.requester.nickname?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <h4 className="font-semibold">{request.requester.nickname || '未知用户'}</h4>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-muted-foreground">{request.status === 'pending' ? '想要添加您为好友' : request.status === 'accepted' ? '已成为好友' : '已拒绝该请求'}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className={`flex-1 ${request.status === 'pending' ? 'bg-green-600 hover:bg-green-700' : 'bg-muted text-muted-foreground hover:bg-muted'}`}
                      disabled={request.status !== 'pending' || processingAcceptedRequestId === request.requester.id}
                      onClick={async () => {
                        if (!profile?.id) return;
                        setProcessingAcceptedRequestId(request.requester.id);
                        try {
                          await acceptFriendRequest(profile.id, request.requester.id);
                          // 刷新好友请求列表
                          const requests = await getFriendRequestsReceived(profile.id);
                          setFriendRequests(requests);
                          // 刷新好友列表
                          const friendsList = await getAcceptedFriends(profile.id);
                          setFriends(friendsList);
                        } catch (error) {
                          console.error('接受好友请求失败:', error);
                        } finally {
                          setProcessingAcceptedRequestId(null);
                        }
                      }}
                    >
                      {request.status === 'accepted' ? '已同意' : request.status === 'pending' && processingAcceptedRequestId === request.requester.id ? '处理中...' : '同意'}
                    </Button>
                    <Button
                      size="sm"
                      className={`flex-1 ${request.status === 'pending' ? 'bg-red-600 hover:bg-red-700' : 'bg-muted text-muted-foreground hover:bg-muted'}`}
                      disabled={request.status !== 'pending' || processingRejectedRequestId === request.requester.id}
                      onClick={async () => {
                        if (!profile?.id) return;
                        setProcessingRejectedRequestId(request.requester.id);
                        try {
                          await rejectFriendRequest(profile.id, request.requester.id);
                          // 刷新好友请求列表
                          const requests = await getFriendRequestsReceived(profile.id);
                          setFriendRequests(requests);
                        } catch (error) {
                          console.error('拒绝好友请求失败:', error);
                        } finally {
                          setProcessingRejectedRequestId(null);
                        }
                      }}
                    >
                      {request.status === 'rejected' ? '已拒绝' : request.status === 'pending' && processingRejectedRequestId === request.requester.id ? '处理中...' : '拒绝'}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">暂无好友请求</p>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* 好友聊天抽屉 */}
      <Drawer open={isChatDrawerOpen} onOpenChange={setIsChatDrawerOpen} direction="left" dismissible={!isSelecting}>
        <DrawerContent drawerWidth="data-[vaul-drawer-direction=left]:w-[85%] data-[vaul-drawer-direction=left]:sm:max-w-4xl">
          {/* {isSelecting && (
            <div className="absolute inset-0 z-[100] bg-transparent cursor-crosshair" />
          )} */}
          <DrawerHeader>
            <DrawerTitle>好友与聊天</DrawerTitle>
            <DrawerDescription>与好友交流，查看聊天记录</DrawerDescription>
          </DrawerHeader>
          
          {/* 左右分栏布局 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧好友列表 */}
            <div className="w-80 h-full border-r flex-shrink-0 overflow-y-auto p-4 space-y-3">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend.id)}
                    className={`w-full p-4 flex items-center gap-3 rounded-lg border transition-all ${
                      selectedFriend === friend.id ? 'bg-accent border-border' : 'bg-background border-border hover:bg-accent/50'
                    }`}
                  >
                    {friend.avatar_url ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback>
                          {friend.nickname?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold">
                          {friend.nickname?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <h4 className="font-semibold text-sm truncate">{friend.nickname || '未知用户'}</h4>
                      <div className="flex items-center gap-1.5">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            isOnline(friend.id) 
                              ? 'bg-green-500 animate-pulse' 
                              : 'bg-gray-300'
                          }`}
                        />
                        <p className="text-xs text-muted-foreground truncate">
                          {isOnline(friend.id) ? '在线' : '离线'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">暂无好友</p>
                </div>
              )}
            </div>

            {/* 右侧聊天内容区域 */}
            <div className="flex-1 flex flex-col h-full">
              {selectedFriend ? (
                (() => {
                  const friend = friends.find(f => f.id === selectedFriend);
                  if (!friend) return null;
                  
                  return (
                    <div className="h-full p-4 flex flex-col">
                      {/* 聊天消息区域 */}
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4 ">
                        {messages.length > 0 ? (
                          <>
                            {messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`px-4 py-2 rounded-lg max-w-[70%] ${
                                    msg.sender_id === profile?.id
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-accent'
                                  }`}
                                >
                                  <p className="text-sm">{msg.content}</p>
                                  <span className={`text-xs ${msg.sender_id === profile?.id ? 'opacity-80' : 'text-muted-foreground'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString('zh-CN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {/* 滚动锚点 */}
                            <div ref={messagesEndRef} />
                          </>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <p className="text-sm text-muted-foreground">
                              暂无聊天记录，开始聊天吧！
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* 输入区域 */}
                      <div className="relative pt-2 border-t">
                        {/* 表情选择器 */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-full mb-2 left-0 z-50">
                            <EmojiPicker
                              onEmojiClick={(emojiData) => {
                                setMessageInput((prev) => prev + emojiData.emoji);
                                setShowEmojiPicker(false);
                              }}
                              width={350}
                              height={400}
                            />
                          </div>
                        )}
                        
                        {/* 工具栏 */}
                        <div className="flex items-center gap-1 py-2 px-1">
                          {/* 表情按钮 */}
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-lg hover:bg-accent transition-colors ${showEmojiPicker ? 'bg-accent' : ''}`}
                            title="表情"
                          >
                            <Smile className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                          </button>
                          
                          {/* 截图按钮 */}
                          <button
                            type="button"
                            onClick={() => setIsSelecting(true)}
                            className="p-2 rounded-lg hover:bg-accent transition-colors"
                            title="截图"
                          >
                            <Scissors className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                          </button>
                          
                          {/* 右侧占位符，用于后续添加更多工具 */}
                          <div className="flex-1"></div>
                        </div>
                        
                        {/* 输入框 */}
                        <div className="px-1">
                          <textarea 
                            placeholder="输入消息..." 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
                          />
                        </div>
                        
                        {/* 发送按钮 */}
                        <div className="flex justify-end px-1 pb-2 pt-2">
                          <button 
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            发送
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {friends.length > 0 ? '请选择一个好友开始聊天' : '暂无好友'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 左侧导航栏 - 桌面版 */}
      {/* <aside className="hidden md:flex flex-col w-24 lg:w-64 border-r border-border p-4"> */}

      {/* 导航菜单 */}
      {/* <nav className="flex flex-col gap-4 flex-1">
          <Button variant="ghost" className="justify-start">
            <Home className="mr-2 h-5 w-2" />
            <span className="hidden lg:inline">主页</span>
          </Button>

          <Button variant="ghost" className="justify-start">
            <Plus className="mr-2 h-5 w-2" />
            <span className="hidden lg:inline">新建笔记</span>
          </Button>

          <Button variant="ghost" className="justify-start">
            <Search className="mr-2 h-5 w-2" />
            <span className="hidden lg:inline">搜索</span>
          </Button>

          <Button variant="ghost" className="justify-start mt-auto">
            <Settings className="mr-2 h-5 w-2" />
            <span className="hidden lg:inline">设置</span>
          </Button>
        </nav>
      </aside> */}

      {/* 主内容区域 */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* 截图遮罩层 */}
      {isSelecting && createPortal(
        <div className="fixed inset-0 z-[999]">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg z-[1001]">
            <p className="text-sm text-foreground">
              按 <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> 键退出截图模式
            </p>
          </div>
          {/* 显眼的选区框 */}
          <div style={{
            position: 'absolute',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            border: '2px dashed #fff',
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', // 外部黑色半透明遮罩
            // pointerEvents: 'none' // 不阻挡鼠标事件
          }} />

          {showControls && (
            <DrawingCanvas
              rect={rect} 
              isEnabled={isDrawingEnabled} 
              color={drawingColor}
            />
          )}
          
          {/* 截图选区框下方的操作按钮 */}
          {(showControls && rect.width > 20 && rect.height > 20) && (
            <div
             ref={controlPanelRef}
             style={{
              position: 'absolute',
              left: rect.left + rect.width,
              top: rect.top + rect.height + 12,
              transform: 'translateX(-100%)', // 向左平移自身宽度，实现右对齐
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'flex-end', // 内部元素右对齐
              pointerEvents: 'auto', // 【重要】强制按钮区接收交互
              zIndex: 1000001
            }}>
              {/* 第一行：操作按钮 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* 提取文字按钮 */}
                <button 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                  onClick={handleExtractText}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  提取文字
                </button>
                <button 
                  className={`px-4 py-2 text-white rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
                    isDrawingEnabled 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDrawingEnabled) {
                      setIsDrawingEnabled(true);
                    }
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  画笔模式
                </button>
                {/* 完成截屏按钮 */}
                <button 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                  onClick={(e) => handleSaveScreenshot(e)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  完成
                </button>
              </div>
              
              {/* 第二行：颜色选择器 - 只在画笔模式启用时显示 */}
              {isDrawingEnabled && (
                <div className="flex items-center gap-2 px-3 py-2 mr-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-fit">
                  {[
                    { color: '#ff0000', name: '红色' },
                    { color: '#00ff00', name: '绿色' },
                    { color: '#0000ff', name: '蓝色' },
                    { color: '#ffff00', name: '黄色' },
                    { color: '#ff00ff', name: '紫色' },
                    { color: '#000000', name: '黑色' },
                    { color: '#ffffff', name: '白色' },
                  ].map((item) => (
                    <button
                      key={item.color}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrawingColor(item.color);
                      }}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        drawingColor === item.color 
                          ? 'border-blue-500 scale-110' 
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: item.color }}
                      title={item.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}