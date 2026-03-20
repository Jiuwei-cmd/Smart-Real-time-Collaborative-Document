// lib/db/localDB.ts
import Dexie, { Table } from 'dexie';

/**
 * 本地笔记数据接口
 * 包含所有笔记字段及离线同步相关字段
 */
export interface LocalNote {
  // 基础字段 (来自 Supabase)
  id: string;
  user_id: string;
  title: string;
  content: string; // JSON 字符串格式的 Plate.js 编辑器内容
  tag_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  embedding?: number[] | null;
  
  // 离线同步相关字段
  offline_modified_at?: string;  // 最后本地修改时间 (ISO 8601 格式)
  sync_status: 'synced' | 'pending' | 'conflict'; // 同步状态
  last_sync_at?: string;         // 最后成功同步到服务器的时间
}



/**
 * 本地数据库类
 * 使用 Dexie 封装 IndexedDB 操作
 */
class LocalDatabase extends Dexie {
  // 笔记表
  notes!: Table<LocalNote, string>;

  constructor() {
    super('NotesAppDB');
    
    // 定义数据库版本和表结构
    this.version(1).stores({
      // notes 表索引：主键 id, 其他索引字段
      notes: 'id, user_id, tag_id, updated_at, sync_status, offline_modified_at'
    });
  }
}

/**
 * 导出单例数据库实例
 * 在整个应用中共享同一个数据库连接
 */
export const localDB = new LocalDatabase();

/**
 * 数据库操作辅助函数
 */
export const dbHelpers = {
  /**
   * 保存当前正在编辑的笔记到本地（离线编辑场景）
   * 进入笔记时调用一次，离线编辑时更新
   * @param note - 笔记数据
   * @param isPending - 是否标记为待同步（离线编辑时为true）
   */
  async saveCurrentEditingNote(note: Omit<LocalNote, 'sync_status'>, isPending = false) {
    try {
      await localDB.notes.put({
        ...note,
        sync_status: isPending ? 'pending' : 'synced',
        offline_modified_at: isPending ? new Date().toISOString() : undefined,
        last_sync_at: !isPending ? new Date().toISOString() : undefined
      });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },
  /**
   * 获取所有待同步的笔记（sync_status === 'pending'）
   */
  async getPendingNotes() {
    try {
      const notes = await localDB.notes
        .filter(note => note.sync_status === 'pending' && !note.is_deleted)
        .toArray();
      
      return { success: true, notes };
    } catch (error) {
      return { success: false, error, notes: [] };
    }
  },

  /**
   * 更新笔记同步状态
   * @param noteId - 笔记 ID
   * @param syncStatus - 新的同步状态
   */
  async updateNoteSyncStatus(noteId: string, syncStatus: LocalNote['sync_status']) {
    try {
      await localDB.notes.update(noteId, {
        sync_status: syncStatus,
        last_sync_at: syncStatus === 'synced' ? new Date().toISOString() : undefined
      });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },
};
