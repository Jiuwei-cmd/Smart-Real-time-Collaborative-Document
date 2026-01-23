// lib/api/notes.ts
// 笔记相关的 Supabase 数据库操作

import { createClientSupabaseClient } from '@/lib/supabase/client';
import { tokenizeSearchKeyword } from '@/lib/utils/tokenizer';

/**
 * 笔记类型定义
 */
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string; // JSON string format
  tag_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  embedding?: number[] | null; // Aliyun text-embedding-v4 vector (1536 dimensions)
}

/**
 * 从笔记内容中提取纯文本用于生成 embedding
 * @param title - 笔记标题
 * @param content - 笔记内容 (Plate.js JSON 结构)
 * @returns 用于 embedding 的组合文本
 */
export function extractTextFromContent(title: string, content: unknown): string {
  const extractText = (node: unknown): string => {
    if (!node || typeof node !== 'object') return '';
    
    // Type guard: check if node has text property
    if ('text' in node && typeof node.text === 'string') {
      return node.text;
    }
    
    // Type guard: check if node has children property
    if ('children' in node && Array.isArray(node.children)) {
      return node.children.map(extractText).join(' ');
    }
    
    return '';
  };
  
  // Extract text from content array
  let contentText = '';
  if (Array.isArray(content)) {
    contentText = content.map(extractText).join('\n');
  } else if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        contentText = parsed.map(extractText).join('\n');
      }
    } catch {
      contentText = content;
    }
  }
  
  // Combine title and content
  return `${title}\n${contentText}`.trim();
}

/**
 * 使用阿里云 DashScope text-embedding-v4 API 生成 embedding
 * @param text - 要生成 embedding 的文本
 * @returns Embedding 向量 (1536 维) 或 null (如果失败)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch('/api/embedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      console.error('Embedding API error:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

/**
 * 通过 ID 获取单个笔记
 * @param noteId - 笔记 ID
 * @returns 笔记对象或 null（如果未找到或无权限）
 */
export async function fetchNoteById(noteId: string): Promise<Note | null> {
  const supabase = createClientSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error('获取笔记失败:', error);
      return null;
    }

    console.log('Supabase fetchNoteById success:', data);
    return data;
  } catch (error) {
    console.error('获取笔记失败:', error);
    return null;
  }
}

/**
 * 获取笔记列表参数
 */
export interface FetchNotesParams {
  userId: string;
  page?: number;
  pageSize?: number;
  tagId?: string | null;
  searchKeyword?: string;
}

/**
 * 获取笔记列表结果
 */
export interface FetchNotesResult {
  notes: Note[];
  totalCount: number;
}

/**
 * 获取笔记列表（支持分页、标签筛选和语义搜索）
 * @param params - 查询参数
 * @returns 笔记列表和总数
 * @throws 如果数据库查询失败
 */
export async function fetchNotes(params: FetchNotesParams): Promise<FetchNotesResult> {
  const {
    userId,
    page = 1,
    pageSize = 6,
    tagId = null,
    searchKeyword = ''
  } = params;

  const supabase = createClientSupabaseClient();

  // 如果有搜索关键词，使用 RPC 函数进行相似度搜索
  if (searchKeyword && searchKeyword.trim()) {
    // 对搜索关键词进行分词
    const tokens = tokenizeSearchKeyword(searchKeyword.trim());
    
    // 将搜索关键词转换成 embedding 向量用于语义搜索
    const searchEmbedding = await generateEmbedding(searchKeyword.trim());
    
    if (searchEmbedding) {
      console.log('Search embedding generated:', {
        searchKeyword: searchKeyword.trim(),
        embeddingDimensions: searchEmbedding.length
      });
    } else {
      console.warn('Failed to generate search embedding, will use keyword search only');
    }
    
    const { data, error } = await supabase.rpc('search_notes_with_similarity_tokens', {
      p_user_id: userId,
      p_search_tokens: tokens,
      p_search_embedding: searchEmbedding,
      p_tag_id: tagId,
      p_page: page,
      p_page_size: pageSize
    });

    if (error) {
      throw error;
    }

    // RPC 返回的数据包含 total_count
    const totalCount = data && data.length > 0 ? data[0].total_count : 0;
    // 移除 total_count 和 similarity_score 字段，转换为 Note 类型
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notes = (data || []).map(({ total_count, similarity_score, ...note }: any) => note) as Note[];
    
    console.log('Supabase tokenized search success:', {
      count: notes.length,
      totalCount,
      tagId,
      searchKeyword,
      tokens,
      topScore: data?.[0]?.similarity_score
    });
    
    return { notes, totalCount };
  }

  // 无搜索关键词时，使用常规查询
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('notes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_deleted', false);

  // 添加标签筛选
  if (tagId) {
    query = query.eq('tag_id', tagId);
  }

  // 按更新时间排序
  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  console.log('Supabase fetchNotes success:', {
    count: data?.length,
    totalCount: count,
    tagId
  });
  
  return {
    notes: data || [],
    totalCount: count || 0
  };
}

/**
 * 创建笔记参数
 */
export interface CreateNoteParams {
  userId: string;
  title: string;
  content: unknown;
  tagId: string | null;
}

/**
 * 创建新笔记
 * @param params - 创建参数
 * @returns 新创建的笔记
 * @throws 如果数据库插入失败
 */
export async function createNote(params: CreateNoteParams): Promise<Note> {
  const { userId, title, content, tagId } = params;
  const supabase = createClientSupabaseClient();

  // 将编辑器内容转换为 JSON 字符串
  const contentString = JSON.stringify(content);

  // 插入新笔记
  const now = new Date().toISOString();
  const newNote = {
    user_id: userId,
    title: title.trim(),
    content: contentString,
    tag_id: tagId === '全部标签' ? null : tagId,
    created_at: now,
    updated_at: now,
    is_deleted: false,
  };

  const { data, error } = await supabase
    .from('notes')
    .insert([newNote])
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log('Supabase saveNote success:', data);
  
  // 生成 embedding（异步，非阻塞）
  const textForEmbedding = extractTextFromContent(title.trim(), content);
  const embedding = await generateEmbedding(textForEmbedding);
  
  // 如果 embedding 生成成功，更新笔记
  if (embedding && data.id) {
    const { error: embeddingError } = await supabase
      .from('notes')
      .update({ embedding })
      .eq('id', data.id);
    
    if (embeddingError) {
      console.error('Failed to save embedding:', embeddingError);
    } else {
      console.log('Embedding saved successfully');
      // 更新本地数据
      data.embedding = embedding;
    }
  }
  
  return data;
}

/**
 * 更新笔记参数
 */
export interface UpdateNoteParams {
  userId: string;
  noteId: string;
  title: string;
  content: unknown;
  tagId: string | null;
}

/**
 * 更新笔记
 * @param params - 更新参数
 * @returns 更新后的笔记
 * @throws 如果数据库更新失败
 */
export async function updateNote(params: UpdateNoteParams): Promise<Note> {
  const { userId, noteId, title, content, tagId } = params;
  const supabase = createClientSupabaseClient();

  // 将编辑器内容转换为 JSON 字符串
  const contentString = JSON.stringify(content);

  // 生成新的 embedding
  const textForEmbedding = extractTextFromContent(title.trim(), content);
  const embedding = await generateEmbedding(textForEmbedding);

  // 更新笔记（包含 embedding）
  const updateData: {
    title: string;
    content: string;
    tag_id: string | null;
    updated_at: string;
    embedding?: number[];
  } = {
    title: title.trim(),
    content: contentString,
    tag_id: tagId === '全部标签' ? null : tagId,
    updated_at: new Date().toISOString()
  };
  
  // 如果 embedding 生成成功，添加到更新数据中
  if (embedding) {
    updateData.embedding = embedding;
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', noteId)
    .eq('user_id', userId) // 确保只能更新自己的笔记
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log('Supabase updateNote success:', data);
  if (embedding) {
    console.log('Embedding updated successfully');
  }
  
  return data;
}

/**
 * 删除笔记参数
 */
export interface DeleteNoteParams {
  userId: string;
  noteIds: string | string[];
}

/**
 * 软删除笔记（设置 is_deleted = true）
 * @param params - 删除参数
 * @throws 如果数据库更新失败
 */
export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  const { userId, noteIds } = params;
  const supabase = createClientSupabaseClient();

  // 将 noteIds 转换为数组（支持单个或多个）
  const idsToDelete = Array.isArray(noteIds) ? noteIds : [noteIds];

  if (idsToDelete.length === 0) {
    return;
  }

  // 软删除笔记（设置 is_deleted = true）
  const { error } = await supabase
    .from('notes')
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString()
    })
    .in('id', idsToDelete)
    .eq('user_id', userId); // 确保只能删除自己的笔记

  if (error) {
    throw error;
  }

  console.log('Supabase deleteNote success');
}
