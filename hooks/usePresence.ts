// hooks/usePresence.ts
// 在线状态自定义 Hook

import { useEffect, useState, useCallback } from 'react';
import { subscribePresence } from '@/lib/api/presence';

/**
 * 在线状态 Hook
 * @param userId - 当前用户ID
 * @returns 在线用户集合和检查函数
 */
export function usePresence(userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // 订阅在线状态
  useEffect(() => {
    if (!userId) return;

    console.log('🔌 初始化 Presence 订阅');

    // 订阅 presence
    const unsubscribe = subscribePresence(userId, (users) => {
      setOnlineUsers(users);
    });

    // 清理函数
    return () => {
      console.log('🔌 清理 Presence 订阅');
      unsubscribe();
    };
  }, [userId]);

  // 检查某个用户是否在线
  const isOnline = useCallback(
    (checkUserId: string): boolean => {
      return onlineUsers.has(checkUserId);
    },
    [onlineUsers]
  );

  return {
    onlineUsers,
    isOnline,
  };
}
