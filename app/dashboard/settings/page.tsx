'use client'

// app/dashboard/settings/page.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClientSupabaseClient } from '@/lib/supabase/client';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // 退出登录处理函数
  const onClickLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="container mx-auto px-4">
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
      {/* 返回按钮 */}
      <div className="flex items-center">
        <Button onClick={() => router.push('/dashboard')} variant="link" className="mb-7 p-1 rounded-md hover:bg-gray-100 transition-colors">
          <ArrowLeft width={48} height={48} className="mr-2" />
        </Button>
        <h1 className="text-3xl font-bold mb-8">账户设置</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-8">
        {/* 左侧卡片 - 用户信息 */}
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-bold">
                  2
                </div>
                <button className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full hover:bg-primary/90 transition-colors">
                  <Upload className="h-4 w-4" />
                </button>
              </div>
              <p className="text-lg font-medium mt-4">2625659302@qq.com</p>
              <p className="text-sm text-gray-500 mt-1">用户ID: 055778e9-cf56-4ea9-8de5-df1f1a715090</p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">注册时间:</span>
                <span className="text-sm">2025/12/18 19:08:34</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">最后登录:</span>
                <span className="text-sm">2025/12/24 19:00:47</span>
              </div>
            </div>

            <Button onClick={() => setIsLogoutDialogOpen(true)} variant="destructive" className="w-full">
              退出登录
            </Button>
          </CardContent>
        </Card>

        {/* 右侧卡片 - 设置表单 */}
        <Card className="md:col-span-4">
          <CardContent className="pt-6">
            {/* 个人信息 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">个人信息</h2>
              <p className="text-sm text-gray-500 mb-4">更新您的账户信息</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">昵称</Label>
                  <Input id="nickname" placeholder="输入您的昵称" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" value="2625659302@qq.com" readOnly className="bg-gray-50" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mb-2"></div>

            {/* 密码设置 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">密码设置</h2>
              <p className="text-sm text-gray-500 mb-4">留空则保持当前密码不变</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input id="new-password" type="password" value="" placeholder="请输入新密码" className="bg-gray-50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <Input id="confirm-password" type="password" placeholder="再次输入新密码" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mb-2"></div>

            {/* 头像设置 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">头像设置</h2>
              <p className="text-sm text-gray-500 mb-4">点击头像即可更换</p>
            </div>

            <div className="border-t pt-6 mb-6"></div>

            {/* 主题设置 */}
            {/* <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">主题设置</h2>
              <p className="text-sm text-gray-500 mb-4">选择您喜欢的主题风格</p>

              <div className="space-y-2">
                <Select defaultValue="light">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择主题" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">浅色主题</SelectItem>
                    <SelectItem value="dark">深色主题</SelectItem>
                    <SelectItem value="system">跟随系统</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div> */}

            {/* 保存按钮 */}
            <Button className="w-full">保存设置</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}