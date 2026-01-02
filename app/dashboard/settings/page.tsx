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
import { useEffect, useState } from 'react';
import { useUserStore } from '../../store/useUserStore';
// import { useActionState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { uploadAvatar } from '@/utils/uploadAvatar';
// import { updateProfile } from '@/actions/updateProfile';
import { useUserProfileStore } from '@/app/store/useUserProfileStore';
import { Controller, useForm } from 'react-hook-form'
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = useUserStore((state) => state.user);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // const [state, formAction] = useActionState(updateProfile, null);
  const updateUserProfile = useUserProfileStore((state) => state.updateUserProfile);
  const profile = useUserProfileStore((state) => state.profile);
  const profileLoading = useUserProfileStore((state) => state.loading);

  // 密码表单配置
  const {
    control,
    handleSubmit,
    getValues,
    reset,
  } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur', // 失去焦点时触发校验
  });

  // 更新密码处理函数
  const handleUpdatePassword = async (data: PasswordFormData) => {
    if (!user?.email) return;

    setIsLoading(true);

    try {
      // 先验证当前密码
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error('验证失败！', {
          description: '当前密码输入错误。',
          duration: 3000,
        });
        return;
      }

      // 更新密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        toast.error('更新失败！', {
          description: '密码更新失败，请重试。',
          duration: 3000,
        });
        return;
      }

      toast.success('更新成功！', {
        description: '您的密码已更新。',
        duration: 3000,
      });

      // 重置表单
      reset();
    } catch (error) {
      toast.error('操作失败！', {
        description: '请检查网络连接后重试。',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 退出登录处理函数
  const onClickLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 处理头像上传
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 先上传得到 URL
    const avatarUrl = await uploadAvatar(file, user?.id || '');
    console.log('avatarUrl', avatarUrl);

    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));

    // 调用 Store Method 更新用户头像
    const result = await updateUserProfile({ avatarUrl });
    if (result.error) {
      console.error('Failed to update avatar:', result.error);
      // Optional: Add toast notification here
    } else {
      console.log('Avatar updated successfully');
      toast.success('头像更新成功！', {
        description: '您的头像已更新。',
        duration: 3000,
      });
    }
    console.log('avatarUrl', avatarUrl);
  };

  // 保存设置处理函数
  const onClickSaveSettings = async () => {
    const nickname = (document.getElementById('nickname') as HTMLInputElement)?.value;
    const result = await updateUserProfile({ nickname });
    if (result.error) {
      console.error('Failed to update profile:', result.error);
      toast.error('更新失败！', {
        description: '请检查您的输入。',
        duration: 3000,
      });
    } else {
      console.log('Profile updated successfully');
      toast.success('更新成功！', {
        description: '您的昵称已更新。',
        duration: 3000,
      });
    }
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
                <img
                  src={preview || profile?.avatar_url || 'https://via.placeholder.com/96'}
                  alt="User avatar"
                  className="w-24 h-24 rounded-full bg-gray-200 object-cover"
                />
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                </label>
              </div>
              <p className="text-lg font-medium mt-4">{user?.email || '未知邮箱'}</p>
              <p className="text-sm text-gray-500 mt-1">用户ID: {user?.id || '未知'}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">个人信息</h2>
              <p className="text-sm text-gray-500 mb-4">更新您的账户信息</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">昵称</Label>
                  <Input id="nickname" placeholder="输入您的昵称" defaultValue={profile?.nickname || ''} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" value={user?.email || ''} readOnly className="bg-gray-50" />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">注册时间:</span>
                {/* <span className="text-sm">{user?.created_at || '未知'}</span> */}
                <span className="text-sm">{user?.created_at ? new Date(user?.created_at).toLocaleString() : '未知'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">最后登录:</span>
                <span className="text-sm">{user?.last_sign_in_at ? new Date(user?.last_sign_in_at).toLocaleString() : '未知'}</span>
              </div>
            </div>
            <Button
              className="w-full mb-4 bg-black text-white hover:bg-gray-800 hover:cursor-pointer"
              size="lg"
              disabled={profileLoading}
              onClick={() => onClickSaveSettings()}
            >
              {profileLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  正在保存...
                </>
              ) : (
                '保存设置'
              )}
            </Button>

            <Button onClick={() => setIsLogoutDialogOpen(true)} variant="destructive" className="w-full">
              退出登录
            </Button>
          </CardContent>
        </Card>

        {/* 右侧卡片 - 设置表单 */}
        <Card className="md:col-span-4">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(handleUpdatePassword)}>
              {/* 密码设置 */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">密码设置</h2>
                <p className="text-sm text-gray-500 mb-4">留空则保持当前密码不变</p>

                {/* 当前密码 */}
                <FieldGroup className="mb-4">
                  <Controller
                    name="currentPassword"
                    control={control}
                    rules={{
                      required: '当前密码是必填项',
                      minLength: {
                        value: 6,
                        message: '密码长度不能少于6个字符'
                      }
                    }}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="current-password">当前密码</FieldLabel>
                        <Input
                          {...field}
                          id="current-password"
                          type="password"
                          aria-invalid={fieldState.invalid}
                          placeholder="请输入当前密码"
                          className={fieldState.invalid ? 'border-red-500 focus:ring-red-500' : ''}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 新密码 */}
                  <FieldGroup>
                    <Controller
                      name="newPassword"
                      control={control}
                      rules={{
                        required: '新密码是必填项',
                        minLength: {
                          value: 6,
                          message: '密码长度不能少于6个字符'
                        }
                      }}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="new-password">新密码</FieldLabel>
                          <Input
                            {...field}
                            id="new-password"
                            type="password"
                            aria-invalid={fieldState.invalid}
                            placeholder="请输入新密码"
                            className={fieldState.invalid ? 'border-red-500 focus:ring-red-500' : ''}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  {/* 确认密码 */}
                  <FieldGroup>
                    <Controller
                      name="confirmPassword"
                      control={control}
                      rules={{
                        required: '请再次输入密码',
                        validate: (value) => {
                          if (value !== getValues('newPassword')) {
                            return '两次输入的密码不一致';
                          }
                          return true;
                        }
                      }}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="confirm-password">确认密码</FieldLabel>
                          <Input
                            {...field}
                            id="confirm-password"
                            type="password"
                            aria-invalid={fieldState.invalid}
                            placeholder="再次输入新密码"
                            className={fieldState.invalid ? 'border-red-500 focus:ring-red-500' : ''}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>
              </div>

              <div className="border-t pt-6 mb-2"></div>

              {/* 保存按钮 */}
              <Button
                type="submit"
                className="w-full mt-6 bg-black text-white hover:bg-gray-800 hover:cursor-pointer"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    正在修改...
                  </>
                ) : (
                  '确认修改'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}