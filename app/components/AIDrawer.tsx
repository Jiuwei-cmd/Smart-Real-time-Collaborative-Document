'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Sparkle } from "lucide-react";

interface AIDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIDrawer({ open, onOpenChange }: AIDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full rounded-none border-l shadow-2xl">
        <DrawerHeader className="border-b">
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
          {/* 占位内容 */}
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full"></div>
              <Sparkle className="relative w-16 h-16 text-zinc-200 dark:text-zinc-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium">准备就绪</h3>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                AI 聊天功能正在开发中，很快您就可以与您的笔记进行对话了。
              </p>
            </div>
          </div>
        </div>

        {/* 底部输入框占位 */}
        <div className="p-4 border-t bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="w-full h-10 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center px-4 text-sm text-muted-foreground italic">
            发送消息...
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
