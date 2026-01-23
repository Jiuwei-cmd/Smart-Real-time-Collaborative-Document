// store/useTagsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  fetchTags, 
  createTag, 
  deleteTag,
  type Tag 
} from '@/lib/api/tags';
import { getSessionUserId } from '@/lib/utils/session';

interface TagsState {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  addTag: (value: string) => Promise<{ success: boolean; error?: string; tag?: Tag }>;
  deleteTag: (tagId: string) => Promise<{ success: boolean; error?: string }>;
  clearTags: () => void;
}

export const useTagsStore = create<TagsState>()(
  devtools((set, get) => ({
    tags: [],
    loading: false,
    error: null,

    fetchTags: async () => {
      set({ loading: true, error: null });
      try {
        // 从 sessionStorage 获取当前标签页的用户 ID
        const userId = getSessionUserId();

        if (!userId) {
          set({ loading: false, error: '未登录' });
          return;
        }

        // 调用 API 层获取标签
        const tags = await fetchTags(userId);

        console.log('Supabase fetchTags success:', tags);
        set({ tags, loading: false, error: null });
      } catch (error: any) {
        console.error('fetchTags error:', error);
        set({ error: error.message, loading: false });
      }
    },

    addTag: async (value: string) => {
      set({ loading: true, error: null });
      try {
        // 从 sessionStorage 获取当前标签页的用户 ID
        const userId = getSessionUserId();

        if (!userId) {
          const msg = '未登录';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }

        // 调用 API 层创建标签
        const newTag = await createTag({
          userId,
          value
        });

        console.log('Supabase addTag success:', newTag);
        
        // 添加成功，更新本地状态
        const currentTags = get().tags;
        set({
          tags: [...currentTags, newTag],
          loading: false,
          error: null
        });
        
        return { success: true, tag: newTag };
      } catch (error: any) {
        console.error('addTag error:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
    },

    deleteTag: async (tagId: string) => {
      set({ loading: true, error: null });
      try {
        // 从 sessionStorage 获取当前标签页的用户 ID
        const userId = getSessionUserId();

        if (!userId) {
          const msg = '未登录';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }

        // 调用 API 层删除标签
        await deleteTag({
          userId,
          tagId
        });

        console.log('Supabase deleteTag success');
        
        // 删除成功，从本地状态中移除
        const currentTags = get().tags;
        set({
          tags: currentTags.filter(tag => tag.id !== tagId),
          loading: false,
          error: null
        });
        
        return { success: true };
      } catch (error: any) {
        console.error('deleteTag error:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
    },

    clearTags: () => {
      set({ tags: [], loading: false, error: null });
    },
  }))
);
