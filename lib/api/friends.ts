// lib/api/friends.ts
// 好友相关的 Supabase 数据库操作

import { createClientSupabaseClient } from '@/lib/supabase/client';
import { UserProfile } from './users';

/**
 * 搜索结果扩展类型（包含邮箱）
 */
export interface SearchedUser extends UserProfile {
  email?: string;
}

/**
 * 消息类型
 */
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  content_type: 'text' | 'image' | 'voice'; // 消息类型
  images?: string[]; // 图片 URL 数组（content_type='image' 时使用）
  created_at: string;
  is_read: boolean;
}

/**
 * 通过邮箱模糊搜索用户（支持部分匹配）
 * @param email - 用户邮箱地址（支持部分匹配）
 * @returns 匹配的用户列表（最多10个）
 */
export async function searchUserByEmail(email: string): Promise<SearchedUser[]> {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .rpc('search_user_by_email', { search_email: email.trim() });

    if (error) {
      console.error('RPC调用失败:', error);
      throw error;
    }

    // 返回用户数组，如果没有结果则返回空数组
    return data || [];
  } catch (error) {
    console.error('搜索用户失败:', error);
    throw error;
  }
}

export async function addFriend(currentUserId: string, targetUserId: string) {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('friends')
      .insert([{
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('添加好友失败:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('添加好友失败:', error);
    throw error;
  }
}



export interface FriendRequest {
  id: string; // 请求ID (friends表的主键，如果有的话，或者复合键)
  requester: UserProfile;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

/**
 * 获取当前用户收到的所有好友请求（包括已同意和已拒绝）
 * @param currentUserId - 当前用户ID
 * @returns 好友请求列表
 */
export async function getFriendRequestsReceived(currentUserId: string): Promise<FriendRequest[]> {
  const supabase = createClientSupabaseClient();

  try {
    // 使用 JOIN 查询一次性获取好友请求和请求人信息
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        requester_id,
        users!requester_id (
          id,
          nickname,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .eq('addressee_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取好友请求失败:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 转换数据格式
    const requests: FriendRequest[] = data
      .map((item) => {
        const user = Array.isArray(item.users) ? item.users[0] : item.users;
        if (!user) return null;
        
        return {
          id: item.id, // 假设 friends 表有 id 字段，如果没有可以使用 requester_id 作为唯一标识
          requester: user as UserProfile,
          status: item.status as 'pending' | 'accepted' | 'rejected',
          created_at: item.created_at
        };
      })
      .filter((item): item is FriendRequest => item !== null);

    return requests;
  } catch (error) {
    console.error('获取好友请求失败:', error);
    throw error;
  }
}

/**
 * 接受好友请求
 * @param currentUserId - 当前用户ID（接收方）
 * @param requesterId - 请求发送方ID
 */
export async function acceptFriendRequest(currentUserId: string, requesterId: string) {
  const supabase = createClientSupabaseClient();

  try {
    const { error } = await supabase
      .from('friends')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('addressee_id', currentUserId)
      .eq('requester_id', requesterId)
      .eq('status', 'pending');

    if (error) {
      console.error('接受好友请求失败:', error);
      throw error;
    }

    console.log('✅ 成功接受好友请求');
  } catch (error) {
    console.error('接受好友请求失败:', error);
    throw error;
  }
}

/**
 * 拒绝好友请求
 * @param currentUserId - 当前用户ID（接收方）
 * @param requesterId - 请求发送方ID
 */
export async function rejectFriendRequest(currentUserId: string, requesterId: string) {
  const supabase = createClientSupabaseClient();

  try {
    const { error } = await supabase
      .from('friends')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('addressee_id', currentUserId)
      .eq('requester_id', requesterId)
      .eq('status', 'pending');

    if (error) {
      console.error('拒绝好友请求失败:', error);
      throw error;
    }

    console.log('✅ 成功拒绝好友请求');
  } catch (error) {
    console.error('拒绝好友请求失败:', error);
    throw error;
  }
}

/**
 * 获取当前用户发送的待处理好友请求的接收方ID列表
 * @param currentUserId - 当前用户ID
 * @returns 接收方ID数组
 */
export async function getSentPendingRequests(currentUserId: string): Promise<string[]> {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('friends')
      .select('addressee_id')
      .eq('requester_id', currentUserId)
      .eq('status', 'pending');

    if (error) {
      console.error('获取已发送请求失败:', error);
      throw error;
    }

    return data.map(item => item.addressee_id);
  } catch (error) {
    console.error('获取已发送请求失败:', error);
    throw error;
  }
}

/**
 * 获取当前用户的好友列表（已接受的好友）
 * @param currentUserId - 当前用户ID
 * @returns 好友用户信息数组
 */
export async function getAcceptedFriends(currentUserId: string): Promise<UserProfile[]> {
  const supabase = createClientSupabaseClient();

  try {
    // 查询当前用户作为请求发送方的好友关系
    const { data: asRequester, error: requesterError } = await supabase
      .from('friends')
      .select(`
        addressee_id,
        users!addressee_id (
          id,
          nickname,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .eq('requester_id', currentUserId)
      .eq('status', 'accepted');

    if (requesterError) {
      console.error('获取好友列表失败（作为请求方）:', requesterError);
      throw requesterError;
    }

    // 查询当前用户作为接收方的好友关系
    const { data: asAddressee, error: addresseeError } = await supabase
      .from('friends')
      .select(`
        requester_id,
        users!requester_id (
          id,
          nickname,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .eq('addressee_id', currentUserId)
      .eq('status', 'accepted');

    if (addresseeError) {
      console.error('获取好友列表失败（作为接收方）:', addresseeError);
      throw addresseeError;
    }

    // 合并两个查询结果
    const allFriends: UserProfile[] = [];

    // 提取作为请求方的好友
    if (asRequester && asRequester.length > 0) {
      const friends = asRequester
        .map((item) => {
          const user = Array.isArray(item.users) ? item.users[0] : item.users;
          return user as UserProfile | null;
        })
        .filter((user): user is UserProfile => user !== null);
      allFriends.push(...friends);
    }

    // 提取作为接收方的好友
    if (asAddressee && asAddressee.length > 0) {
      const friends = asAddressee
        .map((item) => {
          const user = Array.isArray(item.users) ? item.users[0] : item.users;
          return user as UserProfile | null;
        })
        .filter((user): user is UserProfile => user !== null);
      allFriends.push(...friends);
    }


    return allFriends;
  } catch (error) {
    console.error('获取好友列表失败:', error);
    throw error;
  }
}

/**
 * 订阅好友请求的 Realtime 更新
 * @param currentUserId - 当前用户ID
 * @param onNewRequest - 收到新请求时的回调函数
 * @returns 返回取消订阅的函数
 */
export function subscribeFriendRequests(
  currentUserId: string,
  onNewRequest: (request: { requester_id: string; addressee_id: string; status: string }) => void
) {
  const supabase = createClientSupabaseClient();

  // 订阅 friends 表的变化
  const channel = supabase
    .channel('friend-requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `addressee_id=eq.${currentUserId}`
      },
      (payload) => {
        console.log('📨 收到新的好友请求:', payload);
        onNewRequest(payload.new as { requester_id: string; addressee_id: string; status: string });
      }
    )
    .subscribe();

  // 返回取消订阅的函数
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 订阅好友请求响应的 Realtime 更新（当发送的请求被接受或拒绝时）
 * @param currentUserId - 当前用户ID
 * @param onRequestAccepted - 请求被接受时的回调
 * @param onRequestRejected - 请求被拒绝时的回调
 * @returns 返回取消订阅的函数
 */
export function subscribeFriendRequestResponses(
  currentUserId: string,
  onRequestAccepted: (request: { requester_id: string; addressee_id: string; status: string }) => void,
  onRequestRejected: (request: { requester_id: string; addressee_id: string; status: string }) => void
) {
  const supabase = createClientSupabaseClient();

  // 订阅 friends 表的 UPDATE 事件
  const channel = supabase
    .channel('friend-request-responses')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `requester_id=eq.${currentUserId}`
      },
      (payload) => {
        const newStatus = (payload.new as { status: string }).status;

        console.log('📬 好友请求状态更新:', { new: newStatus });

        // 直接根据新状态触发回调
        if (newStatus === 'accepted') {
          onRequestAccepted(payload.new as { requester_id: string; addressee_id: string; status: string });
        } else if (newStatus === 'rejected') {
          onRequestRejected(payload.new as { requester_id: string; addressee_id: string; status: string });
        }
      }
    )
    .subscribe();

  // 返回取消订阅的函数
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 根据用户ID获取用户信息
 * @param userId - 用户ID
 * @returns 用户信息
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nickname, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

// 发送一条私聊消息
export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  contentType: 'text' | 'image' | 'voice' = 'text',
  images?: string[]
) {
  const supabase = createClientSupabaseClient();

  // 图片消息：将图片 URL 数组序列化到 content，不需要额外加列
  const finalContent = contentType === 'image' && images && images.length > 0
    ? JSON.stringify(images)
    : content.trim();

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: finalContent,
      content_type: contentType,
    });

  if (error) {
    console.error('发送失败:', error);
    throw error;
  }
}

/**
 * 获取与指定用户的聊天历史
 * @param currentUserId - 当前用户ID
 * @param friendId - 好友ID
 * @returns 消息列表（按时间升序）
 */
export async function getMessages(
  currentUserId: string,
  friendId: string
): Promise<Message[]> {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取消息失败:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('获取消息失败:', error);
    throw error;
  }
}

/**
 * 订阅与指定用户的实时消息
 * @param currentUserId - 当前用户ID
 * @param friendId - 好友ID
 * @param onNewMessage - 收到新消息时的回调
 * @returns 返回取消订阅的函数
 */
export function subscribeMessages(
  currentUserId: string,
  friendId: string,
  onNewMessage: (message: Message) => void
) {
  const supabase = createClientSupabaseClient();

  // 订阅 messages 表的 INSERT 事件
  const channel = supabase
    .channel(`messages-${currentUserId}-${friendId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        // 只过滤发送方,接收方在回调中验证
        filter: `sender_id=eq.${friendId}`
      },
      (payload) => {
        const message = payload.new as Message;
        // 验证消息是否发送给当前用户
        if (message.receiver_id === currentUserId) {
          console.log('💬 收到新消息:', payload);
          onNewMessage(message);
        }
      }
    )
    .subscribe();

  // 返回取消订阅的函数
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 订阅所有发送给当前用户的消息（用于全局通知）
 * @param currentUserId - 当前用户ID
 * @param onNewMessage - 收到新消息时的回调
 * @returns 返回取消订阅的函数
 */
export function subscribeAllMessages(
  currentUserId: string,
  onNewMessage: (message: Message) => void
) {
  const supabase = createClientSupabaseClient();

  // 订阅 messages 表的 INSERT 事件,只监听接收方为当前用户的消息
  const channel = supabase
    .channel(`all-messages-${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`
      },
      (payload) => {
        const message = payload.new as Message;
        console.log('💬 收到新消息（全局）:', payload);
        onNewMessage(message);
      }
    )
    .subscribe();

  // 返回取消订阅的函数
  return () => {
    supabase.removeChannel(channel);
  };
}