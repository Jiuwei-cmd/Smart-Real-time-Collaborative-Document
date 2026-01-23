// lib/api/tags.ts
// 标签相关的 Supabase 数据库操作

import { createClientSupabaseClient } from '@/lib/supabase/client';

// 定义可用的标签颜色（与 Tailwind CSS 类名匹配）
const TAG_COLORS = [
  'blue',    // bg-blue-100 text-blue-800
  'green',   // bg-green-100 text-green-800
  'red',     // bg-red-100 text-red-800
  'yellow',  // bg-yellow-100 text-yellow-800
  'purple',  // bg-purple-100 text-purple-800
  'pink',    // bg-pink-100 text-pink-800
  'indigo',  // bg-indigo-100 text-indigo-800
  'teal',    // bg-teal-100 text-teal-800
  'orange',  // bg-orange-100 text-orange-800
  'cyan',    // bg-cyan-100 text-cyan-800
];

/**
 * 随机选择一个标签颜色
 * @returns 颜色字符串
 */
export function getRandomColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

/**
 * 标签类型定义
 */
export interface Tag {
  id: string;
  user_id: string;
  value: string;
  color: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

/**
 * 获取用户的所有标签（不包括已删除的）
 * @param userId - 用户 ID
 * @returns 标签数组
 * @throws 如果数据库查询失败
 */
export async function fetchTags(userId: string): Promise<Tag[]> {
  const supabase = createClientSupabaseClient();

  // 查询 tags 表，只获取未删除的标签
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * 创建新标签参数
 */
export interface CreateTagParams {
  userId: string;
  value: string;
}

/**
 * 创建新标签
 * @param params - 创建参数
 * @returns 新创建的标签
 * @throws 如果数据库插入失败
 */
export async function createTag(params: CreateTagParams): Promise<Tag> {
  const { userId, value } = params;
  const supabase = createClientSupabaseClient();

  // 准备新标签数据
  const now = new Date().toISOString();
  const newTag = {
    user_id: userId,
    value: value.trim(),
    color: getRandomColor(), // 随机分配颜色
    created_at: now,
    updated_at: now,
    is_deleted: false,
  };

  // 插入到数据库
  const { data, error } = await supabase
    .from('tags')
    .insert([newTag])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 删除标签参数
 */
export interface DeleteTagParams {
  userId: string;
  tagId: string;
}

/**
 * 软删除标签（设置 is_deleted = true）
 * @param params - 删除参数
 * @throws 如果数据库更新失败
 */
export async function deleteTag(params: DeleteTagParams): Promise<void> {
  const { userId, tagId } = params;
  const supabase = createClientSupabaseClient();

  // 软删除标签
  const { error } = await supabase
    .from('tags')
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', tagId)
    .eq('user_id', userId); // 确保只能删除自己的标签

  if (error) {
    throw error;
  }
}
