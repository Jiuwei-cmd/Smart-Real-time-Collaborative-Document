/**
 * 将 Supabase 的 UTC timestamp 转换为北京时间
 */
export function utcToBeijingTime(dateString: string): Date {
  // 检查是否已经包含时区标识（Z 或者形如 +00:00）
  const hasTimeZone = dateString.endsWith('Z') || dateString.includes('+');
  const normalizedString = hasTimeZone ? dateString : dateString + 'Z';
  
  const utcDate = new Date(normalizedString);
  
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

/**
 * 格式化聊天消息时间（仿微信/QQ对话规范）
 * - 今天：14:30
 * - 昨天：昨天 14:30
 * - 近7天：星期三 14:30
 * - 今年：04-05 14:30
 * - 跨年：2023-04-05 14:30
 */
export function formatChatMessageTime(dateString: string): string {
  if (!dateString) return '';
  const date = utcToBeijingTime(dateString);
  const now = new Date();
  
  // 以当前浏览器时区（或者直接假定我们在通过 utcToBeijingTime 转好的绝对时间下进行比对）
  // 注意：utcToBeijingTime 返回的 Date 对象其实把北京时间当作了本地时区的时间值。
  // 为了确保"天"的比较准确，我们需要把 now 也偏移到北京时间（同前面的逻辑一样）
  const nowBeijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  
  // 取消时分秒，只比较天数
  const dateDay = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const nowDay = new Date(nowBeijing.getUTCFullYear(), nowBeijing.getUTCMonth(), nowBeijing.getUTCDate());
  
  const diffDays = Math.floor((nowDay.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24));
  
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const timeStr = `${hour}:${minute}`;
  
  if (diffDays === 0) {
    return timeStr; // 今天
  } else if (diffDays === 1) {
    return `昨天 ${timeStr}`; // 昨天
  } else if (diffDays > 1 && diffDays < 7) {
    // 星期几
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getUTCDay()];
    return `${weekday} ${timeStr}`;
  } else {
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    if (date.getUTCFullYear() === nowBeijing.getUTCFullYear()) {
      return `${month}-${day} ${timeStr}`; // 同一年
    } else {
      return `${date.getUTCFullYear()}-${month}-${day} ${timeStr}`; // 跨年
    }
  }
}
