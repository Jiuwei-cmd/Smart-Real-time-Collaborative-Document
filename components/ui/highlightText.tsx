/**
 * 高亮搜索关键词工具函数
 * 支持多词搜索、中文连续关键词拆分、智能部分匹配，将匹配的部分用 <mark> 标签包裹
 */

import { tokenizeSearchKeyword } from '../../lib/utils/tokenizer';

/**
 * 将文本中匹配搜索关键词的部分高亮显示
 * @param text - 要处理的文本
 * @param searchKeyword - 搜索关键词
 * @returns React节点数组，包含高亮的部分
 */
export function highlightText(text: string, searchKeyword: string): React.ReactNode[] {
  if (!searchKeyword || !searchKeyword.trim()) {
    return [text];
  }

  // 使用统一的分词函数
  const keywords = tokenizeSearchKeyword(searchKeyword);

  if (keywords.length === 0) {
    return [text];
  }

  // 创建正则表达式，匹配任意一个关键词（不区分大小写）
  const pattern = keywords
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // 转义特殊字符
    .join('|');
  
  const regex = new RegExp(`(${pattern})`, 'gi');

  // 分割文本并高亮匹配部分
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (!part) return null;
    
    // 检查当前部分是否匹配任意关键词
    const isMatch = keywords.some(
      keyword => part.toLowerCase() === keyword.toLowerCase()
    );

    if (isMatch) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-600 text-inherit font-medium px-0.5 rounded"
        >
          {part}
        </mark>
      );
    }
    return part;
  }).filter(Boolean);
}
