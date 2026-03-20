// lib/syncService.ts
import { dbHelpers } from '@/lib/db/localDB';
import { toast } from 'sonner';
import { useNoteStore } from '@/app/store/useNoteStore';

/**
 * 同步服务
 * 负责在网络恢复时自动同步本地数据到云端
 */
export class SyncService {
  private static instance: SyncService;
  private isSyncing = false;

  private constructor() {}

  /**
   * 获取同步服务单例
   */
  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * 执行同步操作
   * 将本地待同步的笔记同步到云端
   */
  async sync() {
    if (this.isSyncing) {
      return { success: false, message: '同步正在进行中' };
    }

    this.isSyncing = true;

    try {
      // 1. 获取待同步的笔记
      const { notes: pendingNotes } = await dbHelpers.getPendingNotes();
      let syncedCount = 0;

      // 2. 使用 useNoteStore 的方法进行同步
      const { updateNote } = useNoteStore.getState();

      for (const note of pendingNotes) {
        try {
          
          // 解析笔记内容
          let editorContent;
          try {
            editorContent = JSON.parse(note.content);
          } catch (error) {
            console.error(`解析笔记内容失败 (${note.id}):`, error);
            continue;
          }

          // 调用 useNoteStore 的 updateNote 方法
          const result = await updateNote(note.id, note.title, editorContent, note.tag_id);

          if (result.success) {
            // 更新本地同步状态
            await dbHelpers.updateNoteSyncStatus(note.id, 'synced');
            syncedCount++;
          } else {
            console.error(`同步笔记失败 (${note.id}):`, result.error);
          }
        } catch (error) {
          console.error(`同步笔记时出错 (${note.id}):`, error);
        }
      }

      const totalSynced = syncedCount;
      if (totalSynced > 0) {
        toast.success(`数据同步成功`, {
          description: `已同步 ${totalSynced} 项更改到云端`
        });
      } else {
        console.log('同步完成，没有待同步数据');
      }

      return { success: true, syncedCount };
    } catch (error) {
      toast.error('数据同步失败', {
        description: '请检查网络连接后重试'
      });
      return { success: false, error };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 检查是否有待同步数据
   */
  async hasPendingSync(): Promise<boolean> {
    const { notes } = await dbHelpers.getPendingNotes();
    return notes.length > 0;
  }
}

/**
 * 导出同步服务单例
 */
export const syncService = SyncService.getInstance();
