// lib/api/messageAI.ts
// AI 助手会话与消息相关的 Supabase 数据库操作

import { createClientSupabaseClient } from '@/lib/supabase/client';

/**
 * AI 会话类型定义
 */
export interface AISession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

/**
 * AI 消息类型定义
 */
export interface AIMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * 获取当前用户的历史会话列表
 * @param userId - 当前登录用户的 ID
 * @returns 会话列表（按创建时间倒序排列）
 */
export async function fetchAISessions(userId: string): Promise<AISession[]> {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取历史会话列表失败:', error);
      throw error;
    }

    console.log('Supabase fetchAISessions success:', data?.length);
    return data || [];
  } catch (error) {
    console.error('获取历史会话列表异常:', error);
    return [];
  }
}

/**
 * 获取指定会话的历史消息记录
 * @param sessionId - 会话 ID
 * @returns 历史消息列表（按创建时间正序排列）
 */
export async function fetchAIMessages(sessionId: string): Promise<AIMessage[]> {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取历史消息记录失败:', error);
      throw error;
    }

    console.log('Supabase fetchAIMessages success:', data?.length);
    return data || [];
  } catch (error) {
    console.error('获取历史消息记录异常:', error);
    return [];
  }
}

/**
 * 删除指定的 AI 会话及其关联消息
 * @param sessionId - 会话 ID
 */
export async function deleteAISession(sessionId: string): Promise<void> {
  const supabase = createClientSupabaseClient();

  try {
    // Supabase 通常配置了级联删除(ON DELETE CASCADE)，删除 session 会自动删除关联的 messages
    const { error } = await supabase
      .from('ai_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('删除会话失败:', error);
      throw error;
    }

    console.log('Supabase deleteAISession success:', sessionId);
  } catch (error) {
    console.error('删除会话异常:', error);
    throw error;
  }
}
