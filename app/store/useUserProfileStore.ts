// store/useUserProfileStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createClientSupabaseClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  nickname?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (updates: { nickname?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  clearProfile: () => void;
}

export const useUserProfileStore = create<UserProfileState>()(
  devtools((set, get) => ({
    profile: null,
    loading: false,
    error: null,

    fetchUserProfile: async () => {
      set({ loading: true, error: null });
      try {
        const supabase = createClientSupabaseClient();

        // 1. 获取当前用户
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          set({ loading: false, error: '未登录' });
          return;
        }

        // 2. 查询 users 表
        const { data, error } = await supabase
          .from('users')
          .select('id, nickname, avatar_url, created_at, updated_at')
          .eq('id', user.id)
          .single();

        if (error) {
          // 如果是找不到记录，可能还没创建，不算严重错误，但这里视业务逻辑而定
          // 假设查不到就是空
          if (error.code === 'PGRST116') {
            const now = new Date().toISOString();
            set({ profile: { id: user.id, created_at: now, updated_at: now }, loading: false, error: null });
          } else {
            console.error('Supabase fetchUserProfile error:', error);
            set({ error: error.message, loading: false });
          }
        } else {
          console.log('Supabase fetchUserProfile success:', data);
          set({ profile: data, loading: false, error: null });
        }
      } catch (error: any) {
        console.error('fetchUserProfile error:', error);
        set({ error: error.message, loading: false });
      }
    },

    updateUserProfile: async ({ nickname, avatarUrl }) => {
      set({ loading: true, error: null });
      try {
        const supabase = createClientSupabaseClient();

        // 1. 获取当前用户
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          const msg = '未登录';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }

        // 2. Upsert 更新
        const updates = {
          id: user.id,
          nickname: nickname, // 如果是 undefined 不会覆盖吗？要注意 Supabase upsert 行为
          avatar_url: avatarUrl,
          // udpated_at: new Date().toISOString(), // 如果数据库有触发器自动更新可省略
        };

        // 过滤 undefined 值，避免覆盖成 null (如果不想覆盖)
        // 但这里我们希望是传入什么就更新什么。
        // 原 updateProfile.ts 逻辑:
        // nickname: nickname?.trim() || null,
        // avatar_url: avatarUrl || null,

        const payload: any = { id: user.id, updated_at: new Date().toISOString() };
        if (nickname !== undefined) payload.nickname = nickname?.trim() || null;
        if (avatarUrl !== undefined) payload.avatar_url = avatarUrl || null;

        const { data, error } = await supabase
          .from('users')
          .upsert(payload, { onConflict: 'id' })
          .select('id, nickname, avatar_url, created_at, updated_at')
          .single();

        if (error) {
          console.error('Supabase updateUserProfile error:', error);
          set({ error: error.message, loading: false });
          return { success: false, error: error.message };
        } else {
          // 更新成功，更新本地状态
          // 如果只是部分更新，最好合并旧状态
          const oldProfile = get().profile;
          set({
            profile: { ...oldProfile, ...data } as UserProfile,
            loading: false,
            error: null
          });
          return { success: true };
        }
      } catch (error: any) {
        console.error('updateUserProfile error:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
    },

    clearProfile: () => {
      set({ profile: null, loading: false, error: null });
    },
  }))
);
