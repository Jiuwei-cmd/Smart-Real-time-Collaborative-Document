import { createClientSupabaseClient } from '@/lib/supabase/client';

export async function uploadImage(file: File | Blob, userId: string, fileNamePrefix?: string) {
  const supabase = createClientSupabaseClient();
  const safeFileName = file instanceof File 
    ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase() 
    : `${fileNamePrefix || 'screenshot'}.png`;

  const fileName = `${userId}/${Date.now()}_${safeFileName}`;

  const { data, error } = await supabase.storage
    .from('image')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type || 'image/png',
    });

  if (error) throw error;

  // 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('image')
    .getPublicUrl(data.path);

  return publicUrl;
}
