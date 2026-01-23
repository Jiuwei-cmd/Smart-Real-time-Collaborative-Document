// lib/api/shares.ts
// 笔记分享相关的 Supabase 数据库操作

import { createClientSupabaseClient } from '@/lib/supabase/client';

/**
 * 分享文档给好友
 * @param documentId - 文档ID
 * @param sharedId - 分享给的好友ID
 * @param ownerId - 文档所有者ID
 * @returns 分享记录
 */
export async function shareDocument(documentId: string, sharedId: string, ownerId: string) {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('document_shares')
      .insert({
        document_id: documentId,
        shared_id: sharedId,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error) {
      console.error('分享文档失败:', error);
      throw error;
    }

    console.log('✅ 成功分享文档');
    return data;
  } catch (error) {
    console.error('分享文档失败:', error);
    throw error;
  }
}

/**
 * 获取文档的所有分享记录
 * @param documentId - 文档ID
 * @returns 分享记录列表
 */
export async function getDocumentShares(documentId: string) {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', documentId);

    if (error) {
      console.error('获取分享记录失败:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('获取分享记录失败:', error);
    throw error;
  }
}

/**
 * 取消文档分享
 * @param documentId - 文档ID
 * @param sharedId - 好友ID
 */
export async function unshareDocument(documentId: string, sharedId: string) {
  const supabase = createClientSupabaseClient();

  try {
    const { error } = await supabase
      .from('document_shares')
      .delete()
      .eq('document_id', documentId)
      .eq('shared_id', sharedId);

    if (error) {
      console.error('取消分享失败:', error);
      throw error;
    }

    console.log('✅ 成功取消分享');
  } catch (error) {
    console.error('取消分享失败:', error);
    throw error;
  }
}

/**
 * 获取分享给我的文档列表（包含笔记和分享者信息）
 * @param userId - 当前用户ID
 * @returns 分享给我的文档列表，包含笔记标题和分享者信息
 */
export async function getSharedWithMe(userId: string) {
  const supabase = createClientSupabaseClient();

  try {
    // 使用关联查询一次性获取分享记录、笔记信息和分享者信息
    const { data, error } = await supabase
      .from('document_shares')
      .select(`
        id,
        document_id,
        owner_id,
        shared_id,
        created_at,
        notes:document_id (
          title
        ),
        user_profiles:owner_id (
          nickname
        )
      `)
      .eq('shared_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取分享列表失败:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('获取分享列表失败:', error);
    throw error;
  }
}

/**
 * 订阅笔记分享通知
 * @param userId - 当前用户ID
 * @param onNewShare - 收到新分享时的回调
 * @returns 返回取消订阅的函数
 */
export function subscribeDocumentShares(
  userId: string,
  onNewShare: (share: {
    id: string;
    document_id: string;
    shared_id: string;
    owner_id: string;
    created_at: string;
  }) => void
) {
  const supabase = createClientSupabaseClient();

  // 订阅 document_shares 表的 INSERT 事件
  const channel = supabase
    .channel(`document-shares-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'document_shares',
        filter: `shared_id=eq.${userId}`
      },
      (payload) => {
        console.log('📨 收到新的笔记分享:', payload);
        onNewShare(payload.new as {
          id: string;
          document_id: string;
          shared_id: string;
          owner_id: string;
          created_at: string;
        });
      }
    )
    .subscribe();

  // 返回取消订阅的函数
  return () => {
    supabase.removeChannel(channel);
  };
}
