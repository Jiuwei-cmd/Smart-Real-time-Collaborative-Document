// store/useTagsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createClientSupabaseClient } from '@/lib/supabase/client';

interface Tag {
    id: string;
    user_id: string;
    value: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

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
                const supabase = createClientSupabaseClient();

                // 1. 获取当前用户
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    set({ loading: false, error: '未登录' });
                    return;
                }

                // 2. 查询 tags 表，只获取未删除的标签
                const { data, error } = await supabase
                    .from('tags')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: true });

                if (error) {
                    console.error('Supabase fetchTags error:', error);
                    set({ error: error.message, loading: false });
                } else {
                    console.log('Supabase fetchTags success:', data);
                    set({ tags: data || [], loading: false, error: null });
                }
            } catch (error: any) {
                console.error('fetchTags error:', error);
                set({ error: error.message, loading: false });
            }
        },

        addTag: async (value: string) => {
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

                // 2. 插入新标签
                const now = new Date().toISOString();
                const newTag = {
                    user_id: user.id,
                    value: value.trim(),
                    created_at: now,
                    updated_at: now,
                    is_deleted: false,
                };

                const { data, error } = await supabase
                    .from('tags')
                    .insert([newTag])
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase addTag error:', error);
                    set({ error: error.message, loading: false });
                    return { success: false, error: error.message };
                } else {
                    // 添加成功，更新本地状态
                    const currentTags = get().tags;
                    set({
                        tags: [...currentTags, data],
                        loading: false,
                        error: null
                    });
                    return { success: true, tag: data };
                }
            } catch (error: any) {
                console.error('addTag error:', error);
                set({ error: error.message, loading: false });
                return { success: false, error: error.message };
            }
        },

        deleteTag: async (tagId: string) => {
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

                // 2. 软删除标签（设置 is_deleted = true）
                const { error } = await supabase
                    .from('tags')
                    .update({
                        is_deleted: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', tagId)
                    .eq('user_id', user.id); // 确保只能删除自己的标签

                if (error) {
                    console.error('Supabase deleteTag error:', error);
                    set({ error: error.message, loading: false });
                    return { success: false, error: error.message };
                } else {
                    // 删除成功，从本地状态中移除
                    const currentTags = get().tags;
                    set({
                        tags: currentTags.filter(tag => tag.id !== tagId),
                        loading: false,
                        error: null
                    });
                    return { success: true };
                }
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
