// store/useUserProfileStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  fetchUserProfile, 
  updateUserProfile,
  type UserProfile 
} from '@/lib/api/users';
import { getSessionUserId } from '@/lib/utils/session';

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
        // 从 sessionStorage 获取当前标签页的用户 ID
        const userId = getSessionUserId();

        if (!userId) {
          set({ loading: false, error: '未登录' });
          return;
        }

        // 调用 API 层获取用户资料
        const profile = await fetchUserProfile(userId);
        
        console.log('Supabase fetchUserProfile success:', profile);
        set({ profile, loading: false, error: null });
      } catch (error: any) {
        console.error('fetchUserProfile error:', error);
        set({ error: error.message, loading: false });
      }
    },

    updateUserProfile: async ({ nickname, avatarUrl }) => {
      set({ loading: true, error: null });
      try {
        // 从 sessionStorage 获取当前标签页的用户 ID
        const userId = getSessionUserId();

        if (!userId) {
          const msg = '未登录';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }

        // 调用 API 层更新用户资料
        const updatedProfile = await updateUserProfile({
          userId,
          nickname,
          avatarUrl
        });

        console.log('Supabase updateUserProfile success:', updatedProfile);
        
        // 更新本地状态（合并旧状态）
        const oldProfile = get().profile;
        set({
          profile: { ...oldProfile, ...updatedProfile } as UserProfile,
          loading: false,
          error: null
        });
        
        return { success: true };
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
