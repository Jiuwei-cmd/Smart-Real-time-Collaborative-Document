// lib/api/messageAI.ts
// AI 助手会话与消息相关的 Supabase 数据库操作

import { createClientSupabaseClient } from '@/lib/supabase/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
 * 获取当前用户的历史会话列表 (客户端调用)
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
 * 获取指定会话的历史消息记录 (客户端调用)
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
 * 删除指定的 AI 会话及其关联消息 (客户端调用)
 * @param sessionId - 会话 ID
 */
export async function deleteAISession(sessionId: string): Promise<void> {
  const supabase = createClientSupabaseClient();

  try {
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

/**
 * 获取当前登录用户 (服务端调用)
 * @returns 当前 User 对象或 null
 */
export async function getServerUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('获取服务端用户异常:', error);
    return null;
  }
}

/**
 * 创建新的 AI 会话 (服务端调用)
 * @param userId - 用户 ID
 * @param title - 会话标题
 * @returns 创建的会话对象
 */
export async function createAISession(userId: string, title: string): Promise<AISession> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('ai_sessions')
    .insert({
      user_id: userId,
      title: title.slice(0, 20), // 截取前20个字符作标题
    })
    .select()
    .single();

  if (error) {
    console.error('创建 AI 会话失败:', error);
    throw error;
  }

  console.log('Supabase createAISession success:', data.id);
  return data;
}

/**
 * 保存 AI 消息记录 (服务端调用)
 * @param sessionId - 会话 ID
 * @param role - 消息角色 ('user' | 'assistant')
 * @param content - 消息内容
 */
export async function saveAIMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('ai_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
    });

  if (error) {
    console.error(`保存 ${role} 消息失败:`, error);
    throw error;
  }

  console.log(`Supabase saveAIMessage success [${role}]`);
}


