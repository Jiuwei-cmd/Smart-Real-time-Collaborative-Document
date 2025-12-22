'use client';

import { useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Controller, useForm } from 'react-hook-form'

import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"



interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  const {
    control,
    handleSubmit,
    getValues,
    reset,
  } = useForm<AuthFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur', // 失去焦点时触发校验
  });

  useEffect(() => {
    reset()
  }, [isLogin, reset]);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      if (error) {
        alert(`登录失败: ${error.message}`);
        setIsLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`, // 可选：用于邮箱验证
        },
      });
      if (error) {
        alert(`注册失败: ${error.message}`);
        setIsLoading(false);
      } else {
        alert('注册成功！请查收验证邮件。');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{isLogin ? '登录' : '注册'}</CardTitle>
            <CardDescription className='mb-4'>
              {isLogin ? '欢迎回来，请登录您的账户' : '创建一个新账户'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: '邮箱是必填项',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '请输入有效的邮箱地址'
                  }
                }}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="email">邮箱</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="请输入邮箱"
                      autoComplete="email"
                      className={fieldState.invalid ? 'border-red-500 focus:ring-red-500' : ''}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: '密码是必填项',
                  minLength: {
                    value: 6,
                    message: '密码长度不能少于6个字符'
                  }
                }}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="password">密码</FieldLabel>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="请输入密码"
                      autoComplete="current-password"
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

            {!isLogin && (
              <FieldGroup>
                <Controller
                  name="confirmPassword"
                  control={control}
                  rules={{
                    required: '请再次输入密码',
                    validate: (value) => {
                      if (value !== getValues('password')) {
                        return '两次输入的密码不一致';
                      }
                      return true;
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">确认密码</FieldLabel>
                      <Input
                        {...field}
                        id="confirmPassword"
                        type="password"
                        aria-invalid={fieldState.invalid}
                        placeholder="请输入确认密码"
                        autoComplete="current-password"
                        className={fieldState.invalid ? 'border-red-500 focus:ring-red-500' : ''}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>)}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full mt-6 bg-black text-white hover:bg-gray-800 hover:cursor-pointer"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? '登录中...' : '注册中...'}
                </>
              ) : (
                isLogin ? '登录' : '注册'
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              variant="link"
              className="w-full hover:cursor-pointer"
            >
              {isLogin ? '还没有账户？立即注册' : '已有账号？去登录'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}