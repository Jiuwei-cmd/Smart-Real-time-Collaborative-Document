/**
 * 搜索关键词分词工具
 * 用于智能拆分搜索关键词，支持中文、英文、数字混合
 */

/**
 * 检查字符串是否主要包含中文
 */
export function isChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

/**
 * 生成中文关键词的所有可能子串（1-10字）
 * 用于处理连续的中文关键词，如"人工智能机器人" -> ["人工", "智能", "人", "工", ...]
 */
export function generateChineseSubstrings(keyword: string): string[] {
  if (keyword.length < 1) return [];
  
  const substrings = new Set<string>();
  
  // 生成1-10字的子串，优先长度更长的
  const maxLen = Math.min(10, keyword.length);
  for (let len = maxLen; len >= 1; len--) {
    for (let i = 0; i <= keyword.length - len; i++) {
      substrings.add(keyword.substring(i, i + len));
    }
  }
  
  return Array.from(substrings);
}

/**
 * 智能分解关键词，处理字母+数字混合的情况
 * 例如 "webpack3" -> ["webpack3", "webpack", "3"]
 * 例如 "webpack13" -> ["webpack13", "webpack", "13", "1", "3"]
 */
export function smartTokenize(keyword: string): string[] {
  const tokens = new Set<string>();
  
  // 添加原始关键词
  tokens.add(keyword);
  
  // 如果包含字母和数字的混合
  const letterPart = keyword.replace(/[^a-zA-Z]/g, '');
  const numberPart = keyword.replace(/[^0-9]/g, '');
  
  if (letterPart && letterPart !== keyword) {
    tokens.add(letterPart);
  }
  
  if (numberPart && numberPart !== keyword) {
    tokens.add(numberPart);
    
    // 将数字部分拆分为单个数字（支持非连续匹配）
    // 例如 "13" -> ["1", "3"]
    if (numberPart.length > 1) {
      for (const digit of numberPart) {
        tokens.add(digit);
      }
    }
  }
  
  // 使用正则提取所有连续的字母、数字和中文片段
  const segments = keyword.match(/[a-zA-Z]+|[0-9]+|[\u4e00-\u9fa5]+/g) || [];
  segments.forEach(seg => {
    if (seg.length > 0) {
      tokens.add(seg);
      // 如果是中文片段，提取所有可能的子串
      if (isChinese(seg)) {
        generateChineseSubstrings(seg).forEach(sub => tokens.add(sub));
      }
    }
  });
  
  return Array.from(tokens);
}

/**
 * 统一的搜索关键词分词函数
 * @param searchKeyword - 用户输入的搜索关键词
 * @returns 分词后的tokens数组
 */
export function tokenizeSearchKeyword(searchKeyword: string): string[] {
  if (!searchKeyword || !searchKeyword.trim()) {
    return [];
  }

  const keywords = searchKeyword
    .trim()
    .split(/\s+/)
    .filter(k => k.length > 0)
    .flatMap(k => smartTokenize(k));

  // 按长度降序排序，优先匹配长词
  keywords.sort((a, b) => b.length - a.length);

  // 去重
  return Array.from(new Set(keywords));
}
