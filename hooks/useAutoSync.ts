// hooks/useAutoSync.ts
'use client';

import { useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncService } from '@/lib/utils/syncService';

/**
 * 自动同步 Hook
 * 监听网络状态变化，当网络恢复时自动同步本地数据到云端
 */
export const useAutoSync = () => {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    // 当网络状态变为在线时，检查并同步数据
    if (isOnline) {
      const syncData = async () => {
        const hasPending = await syncService.hasPendingSync();
        if (hasPending) {
          console.log('🔄 检测到待同步数据，开始同步...');
          await syncService.sync();
        }
      };

      // 延迟一点时间再同步，确保网络稳定
      const timeoutId = setTimeout(syncData, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline]);
};
