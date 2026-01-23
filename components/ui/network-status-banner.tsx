'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

/**
 * 网络状态横幅组件
 * 在页面顶部固定显示当前网络状态
 */
export function NetworkStatusBanner() {
  const isOnline = useNetworkStatus();

  return (
    <div className="fixed top-10 left-0 right-0 z-50 flex justify-center animate-in slide-in-from-top duration-300">

      {/* 离线状态 */}
      {!isOnline && (
        <Alert variant="destructive" className="w-auto max-w-fit border-red-500">
        <AlertCircleIcon />
        <AlertTitle>离线状态,数据将在网络恢复后自动同步</AlertTitle>
      </Alert>
      )}
    </div>
  );
}
