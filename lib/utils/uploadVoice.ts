import { createClientSupabaseClient } from '@/lib/supabase/client';

export async function uploadVoice(blob: Blob, userId: string): Promise<string> {
  const supabase = createClientSupabaseClient();
  const fileName = `${userId}/${Date.now()}_voice.webm`;

  const { data, error } = await supabase.storage
    .from('voice')
    .upload(fileName, blob, {
      upsert: true,
      contentType: 'audio/webm',
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('voice')
    .getPublicUrl(data.path);

  return publicUrl;
}
