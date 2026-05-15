'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Sparkle, PlusCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";


interface AIDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIDrawer({ open, onOpenChange }: AIDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full rounded-none border-l shadow-2xl sm:max-w-[1000px] w-[90vw]" drawerWidth="sm:max-w-[1000px]">
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
          <main className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
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
            
            <div className="flex-1 p-6 overflow-y-auto">
              {/* 占位内容 - 保持不动 */}
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
            </div>

            {/* 底部输入框占位 */}
            <div className="p-4 border-t bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-4 text-sm text-muted-foreground shadow-sm">
                发送消息给小艺...
              </div>
            </div>
          </main>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
