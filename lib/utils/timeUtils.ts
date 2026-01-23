/**
 * 将 Supabase 的 UTC timestamp 转换为北京时间
 */
export function utcToBeijingTime(dateString: string): Date {
  // Supabase timestamp 是 UTC 时间，需要加 'Z' 标识
  const utcDate = new Date(dateString + 'Z');
  
  // 加上 8 小时转换为北京时间
  const beijingDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
  
  return beijingDate;
}

/**
 * 格式化相对时间显示
 * - 小于1小时：显示"xx分钟前"
 * - 1-24小时：显示"xx小时前"
 * - 超过24小时：显示"xxxx年xx月xx日"
 */
export function formatRelativeTime(dateString: string): string {
  const beijingDate = utcToBeijingTime(dateString);
  
  // 获取当前北京时间
  const now = new Date();
  const nowBeijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  
  // 计算时间差（毫秒）
  const diffMs = nowBeijing.getTime() - beijingDate.getTime();
  
  // 转换为分钟
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // 小于1小时
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }
  
  // 转换为小时
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  // 1-24小时
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  
  // 超过24小时，显示完整日期
  const year = beijingDate.getUTCFullYear();
  const month = beijingDate.getUTCMonth() + 1;
  const day = beijingDate.getUTCDate();
  
  return `${year}年${month}月${day}日`;
}

/**
 * 格式化为标准日期时间字符串（YYYY-MM-DD HH:mm）
 */
export function formatDateTime(dateString: string): string {
  const beijingDate = utcToBeijingTime(dateString);
  
  const year = beijingDate.getUTCFullYear();
  const month = String(beijingDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getUTCDate()).padStart(2, '0');
  const hour = String(beijingDate.getUTCHours()).padStart(2, '0');
  const minute = String(beijingDate.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
