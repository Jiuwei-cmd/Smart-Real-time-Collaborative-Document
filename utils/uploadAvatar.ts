// utils/uploadAvatar.ts
import { createClientSupabaseClient } from '@/lib/supabase/client';

export async function uploadAvatar(file: File, userId: string) {
  console.log('file', file, userId);
  const supabase = createClientSupabaseClient();
  const safeFileName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 替换非法字符为 _
    .toLowerCase(); // 转小写（可选）

  const fileName = `${userId}/${Date.now()}_${safeFileName}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true, // 覆盖同名文件
    });

  if (error) throw error;

  // 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return publicUrl;
}