'use client';
import { useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from 'react';
import { useUserStore } from '../store/useUserStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useUserProfileStore } from '../store/useUserProfileStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  // const [user, setUser] = useState<any>(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const user = useUserStore((state) => state.user);
  const profile = useUserProfileStore((state) => state.profile);
  const fetchUserProfile = useUserProfileStore((state) => state.fetchUserProfile);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // 退出登录处理函数
  const onClickLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <AlertDialog open={isLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>你确定要退出登录吗?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsLogoutDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white" onClick={onClickLogout}>确认退出</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* 顶部导航栏 */}
      <header className="w-full p-4 border-b border-border">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <h1 className="text-xl font-bold">{profile?.nickname || user?.email || '用户'} - 你的笔记管理平台</h1>
          <div className='flex items-center gap-2'>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className='mr-2 cursor-pointer'>
                  {/* <AvatarImage src={user?.user_metadata?.avatar_url || ''} /> */}
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-52 bg-popover text-popover-foreground shadow-lg' align="end">
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className='mr-2 h-4 w-4' />
                  设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)} className="text-red-600">
                  <LogOut className='mr-2 h-4 w-4' />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 左侧导航栏 - 桌面版 */}
      {/* <aside className="hidden md:flex flex-col w-24 lg:w-64 border-r border-border p-4"> */}

      {/* 导航菜单 */}
      {/* <nav className="flex flex-col gap-4 flex-1">
          <Button variant="ghost" className="justify-start">
            <Home className="mr-2 h-5 w-2" />
            <span className="hidden lg:inline">主页</span>
          </Button>

          <Button variant="ghost" className="justify-start">
            <Plus className="mr-2 h-5 w-2" />
            <span className="hidden lg:inline">新建笔记</span>
          </Button>

          <Button variant="ghost" className="justify-start">
            <Search className="mr-2 h-5 w-2" />
            <span className="hidden lg:inline">搜索</span>
          </Button>

          <Button variant="ghost" className="justify-start mt-auto">
            <Settings className="mr-2 h-5 w-2" />
            <span className="hidden lg:inline">设置</span>
          </Button>
        </nav>
      </aside> */}

      {/* 主内容区域 */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}