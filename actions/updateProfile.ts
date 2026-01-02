'use server';

import { createServerSupabaseClient } from '../lib/supabase/server';
// import { revalidatePath } from 'next/cache';

/**
 * @deprecated This server action is being replaced by the client-side store method in `useUserProfileStore.ts`.
 * Please use `useUserProfileStore.getState().updateUserProfile` or similar instead.
 */
export async function updateProfile({
  nickname,
  avatarUrl,
}: {
  nickname?: string;
  avatarUrl?: string;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: '未登录' };
  }

  // 使用 upsert：存在则更新，不存在则插入
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        nickname: nickname?.trim() || null,
        avatar_url: avatarUrl || null,
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('Update profile error:', error);
    return { error: error.message };
  }

  return { success: true };
  // revalidatePath('/profile'); // 刷新页面数据
}