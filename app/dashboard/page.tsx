// src/app/dashboard/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">欢迎, {user?.email}!</h1>
        <p>这是受保护的页面，只有登录用户可见。</p>
      </div>
    </div>
  );
}