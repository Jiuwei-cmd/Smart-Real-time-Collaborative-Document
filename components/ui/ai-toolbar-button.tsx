'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import { Sparkles } from 'lucide-react';
import { useEditorPlugin } from 'platejs/react';

import { cn } from '@/lib/utils';
import { ToolbarButton } from './toolbar';

export function AIToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { api } = useEditorPlugin(AIChatPlugin);

  return (
    <div className="relative flex items-center">
      {/* 左侧分隔线 */}
      <div className="h-6 w-px bg-gray-300 mr-1" />
      <ToolbarButton
        {...props}
        tooltip="AI 助手"
        className={cn(
          "hover:bg-gray-100 rounded-md",
          props.className
        )}
        onClick={() => {
          api.aiChat.show();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <Sparkles className="w-5 h-5 text-gray-700" />
      </ToolbarButton>
      {/* 右侧分隔线 */}
      <div className="h-6 w-px bg-gray-300 ml-1" />
    </div>
  );
}
