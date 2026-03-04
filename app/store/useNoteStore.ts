// store/useNoteStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  type Note
} from '@/lib/api/notes';
import { getSessionUserId } from '@/lib/utils/session';

interface NoteState {
  notes: Note[];
  totalCount: number; // 总笔记数量，用于分页
  loading: boolean;
  error: string | null;
  fetchNotes: (page?: number, pageSize?: number, tagId?: string | null, searchKeyword?: string) => Promise<void>;
  saveNote: (title: string, content: unknown, tagId: string | null) => Promise<{ success: boolean; error?: string; note?: Note }>;
  updateNote: (noteId: string, title: string, content: unknown, tagId: string | null) => Promise<{ success: boolean; error?: string; note?: Note }>;
  deleteNote: (noteIds: string | string[]) => Promise<{ success: boolean; error?: string }>;
  clearNotes: () => void;
}

export const useNoteStore = create<NoteState>()(
  devtools((set, get) => ({
    notes: [],
    totalCount: 0,
    loading: false,
    error: null,

    fetchNotes: async (page = 1, pageSize = 6, tagId = null, searchKeyword = '') => {
      set({ loading: true, error: null });
      try {
        // 从 sessionStorage 获取当前标签页的用户 ID
        const userId = getSessionUserId();

        if (!userId) {
          set({ loading: false, error: '未登录' });
          return;
        }

        // 调用 API 层获取笔记列表
        const result = await fetchNotes({
          userId,
          page,
          pageSize,
          tagId,
          searchKeyword
        });

        set({
          notes: result.notes,
          totalCount: result.totalCount,
          loading: false,
          error: null
        });
      } catch (error: any) {
        console.error('fetchNotes error:', error);
        set({ error: error.message, loading: false });
      }
    },

    saveNote: async (title: string, content: any, tagId: string | null) => {
      set({ loading: true, error: null });
      try {
        // 从 sessionStorage 获取当前标签页的用户 ID
        const userId = getSessionUserId();

        if (!userId) {
          const msg = '未登录';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }

        // 调用 API 层创建笔记
        const newNote = await createNote({
          userId,
          title,
          content,
          tagId
        });

        // 添加成功，更新本地状态
        const currentNotes = get().notes;
        set({
          notes: [newNote, ...currentNotes],
          loading: false,
          error: null
        });
        
        return { success: true, note: newNote };
      } catch (error: any) {
        console.error('saveNote error:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
    },

    updateNote: async (noteId: string, title: string, content: any, tagId: string | null, ownerId?: string | null) => {
      set({ loading: true, error: null });
      try {
        // 从 sessionStorage 获取当前标签页的用户 ID

        const userId = ownerId || getSessionUserId();

        if (!userId) {
          const msg = '未登录';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }

        // 调用 API 层更新笔记
        const updatedNote = await updateNote({
          userId,
          noteId,
          title,
          content,
          tagId
        });

        // 更新成功，更新本地状态
        const currentNotes = get().notes;
        const updatedNotes = currentNotes.map(note =>
          note.id === noteId ? updatedNote : note
        );
        set({
          notes: updatedNotes,
          loading: false,
          error: null
        });
        
        return { success: true, note: updatedNote };
      } catch (error: any) {
        console.error('updateNote error:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
    },

    deleteNote: async (noteIds: string | string[]) => {
      set({ loading: true, error: null });
      try {
        // 从 sessionStorage 获取当前标签页的用户 ID
        const userId = getSessionUserId();

        if (!userId) {
          const msg = '未登录';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }

        // 调用 API 层删除笔记
        await deleteNote({
          userId,
          noteIds
        });

        // 删除成功，从本地状态中移除
        const idsToDelete = Array.isArray(noteIds) ? noteIds : [noteIds];
        const currentNotes = get().notes;
        set({
          notes: currentNotes.filter(note => !idsToDelete.includes(note.id)),
          loading: false,
          error: null
        });
        
        return { success: true };
      } catch (error: any) {
        console.error('deleteNote error:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
    },

    clearNotes: () => {
      set({ notes: [], loading: false, error: null });
    },
  }))
);
