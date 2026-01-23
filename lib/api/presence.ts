// lib/api/presence.ts
// 在线状态管理 - 使用 Supabase Realtime Presence

import { createClientSupabaseClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Presence 状态类型
 */
export interface PresenceState {
  user_id: string;
  online_at: string;
}

/**
 * 订阅在线状态
 * @param userId - 当前用户ID
 * @param onPresenceChange - 在线用户变化时的回调
 * @returns 取消订阅函数
 */
export function subscribePresence(
  userId: string,
  onPresenceChange: (onlineUsers: Set<string>) => void
): () => void {
  const supabase = createClientSupabaseClient();
  
  // 创建一个全局的 presence channel
  const channel: RealtimeChannel = supabase.channel('online-users', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  // 订阅 presence 事件
  channel
    .on('presence', { event: 'sync' }, () => {
      // 获取当前所有在线用户
      const state = channel.presenceState<PresenceState>();
      const onlineUserIds = new Set<string>();
      
      // 遍历所有 presence 状态
      Object.values(state).forEach((presences) => {
        presences.forEach((presence) => {
          if (presence.user_id) {
            onlineUserIds.add(presence.user_id);
          }
        });
      });
      
      console.log('📊 在线用户数:', onlineUserIds.size);
      onPresenceChange(onlineUserIds);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('✅ 用户上线:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('❌ 用户离线:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('🔌 Presence channel 已连接');
        
        // 广播自己上线
        const presenceTrackStatus = await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
        
        console.log('📡 广播在线状态:', presenceTrackStatus);
      }
      
      if (status === 'CHANNEL_ERROR') {
        console.error('⚠️ Presence channel 连接错误');
      }
      
      if (status === 'TIMED_OUT') {
        console.error('⏱️ Presence channel 连接超时');
      }
    });

  // 返回清理函数
  return () => {
    console.log('🔌 断开 Presence 连接');
    channel.untrack();
    channel.unsubscribe();
  };
}
