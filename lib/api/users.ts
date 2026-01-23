// lib/api/users.ts
// 用户资料相关的 Supabase 数据库操作

import { createClientSupabaseClient } from '@/lib/supabase/client';

/**
 * 用户资料类型定义
 */
export interface UserProfile {
  id: string;
  nickname?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 获取用户资料
 * @param userId - 用户 ID
 * @returns 用户资料或 null（如果未找到）
 * @throws 如果数据库查询失败
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClientSupabaseClient();

  // 查询 users 表
  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    // 如果是找不到记录（PGRST116），返回默认资料
    if (error.code === 'PGRST116') {
      const now = new Date().toISOString();
      return { 
        id: userId, 
        created_at: now, 
        updated_at: now 
      };
    }
    // 其他错误抛出
    throw error;
  }

  return data;
}

/**
 * 更新用户资料参数
 */
export interface UpdateUserProfileParams {
  userId: string;
  nickname?: string;
  avatarUrl?: string;
}

/**
 * 更新用户资料（使用 upsert）
 * @param params - 更新参数
 * @returns 更新后的用户资料
 * @throws 如果数据库更新失败
 */
export async function updateUserProfile(params: UpdateUserProfileParams): Promise<UserProfile> {
  const { userId, nickname, avatarUrl } = params;
  const supabase = createClientSupabaseClient();

  // 准备更新数据
  const payload: Record<string, unknown> = { 
    id: userId, 
    updated_at: new Date().toISOString() 
  };

  // 只包含定义的字段
  if (nickname !== undefined) {
    payload.nickname = nickname?.trim() || null;
  }
  if (avatarUrl !== undefined) {
    payload.avatar_url = avatarUrl || null;
  }

  // Upsert 到数据库
  const { data, error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'id' })
    .select('id, nickname, avatar_url, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
