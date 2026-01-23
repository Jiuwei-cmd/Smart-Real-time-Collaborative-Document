// lib/utils/session.ts
// SessionStorage 辅助函数，用于标签页级别的用户隔离

const SESSION_USER_ID_KEY = 'current_user_id';
const TAB_ID_KEY = '__tab_instance_id'; // 内部使用的标签页唯一标识符

/**
 * 生成唯一的标签页 ID
 */
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 初始化标签页会话
 * 检测 sessionStorage 是否被继承自父标签页，如果是则清除所有数据
 * 应该在应用启动时调用一次
 */
export function initializeTabSession(): void {
  if (typeof window === 'undefined') return;

  const existingTabId = sessionStorage.getItem(TAB_ID_KEY);

  if (existingTabId) {
    // 检测到已存在的 tabId，说明 sessionStorage 被继承了
    console.log('[Session] Detected inherited sessionStorage, clearing all session data');
    sessionStorage.clear();
  }

  // 设置新的标签页 ID（每个标签页都有唯一的 ID）
  const newTabId = generateTabId();
  sessionStorage.setItem(TAB_ID_KEY, newTabId);
  console.log('[Session] Initialized new tab session:', newTabId);
}

/**
 * 获取当前标签页的用户 ID
 */
export function getSessionUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SESSION_USER_ID_KEY);
}

/**
 * 设置当前标签页的用户 ID
 */
export function setSessionUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_USER_ID_KEY, userId);
}

/**
 * 清除当前标签页的用户 ID
 */
export function clearSessionUserId(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_USER_ID_KEY);
}
