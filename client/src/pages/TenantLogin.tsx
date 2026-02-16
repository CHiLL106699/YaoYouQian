import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocation } from 'wouter';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

const loginSchema = z.object({
  email: z.string().email({ message: '請輸入有效的電子郵件地址。' }),
  password: z.string().min(6, { message: '密碼至少需要 6 個字元。' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const TenantLogin: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, setLocation] = useLocation();
  const { setTenantInfo } = useTenant();

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      // 1. 使用 Supabase Auth 登入
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        // 翻譯 Supabase Auth 錯誤訊息
        const errorMap: Record<string, string> = {
          'Invalid login credentials': '電子郵件或密碼錯誤，請重新輸入',
          'Email not confirmed': '電子郵件尚未驗證，請聯繫管理員',
          'User not found': '找不到此帳號，請先註冊',
          'Too many requests': '登入嘗試次數過多，請稍後再試',
        };
        setError(errorMap[authError.message] || `登入失敗：${authError.message}`);
        return;
      }

      if (!authData.user) {
        setError('登入失敗');
        return;
      }

      // 2. 取得租戶資料（先用 auth_user_id，再用 owner_email）
      let tenantData = null;
      const { data: t1 } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('auth_user_id', authData.user.id)
        .single();
      tenantData = t1;
      if (!tenantData && authData.user.email) {
        const { data: t2 } = await supabase
          .from('tenants')
          .select('id, name')
          .eq('owner_email', authData.user.email)
          .single();
        tenantData = t2;
      }

      if (!tenantData) {
        setError('找不到租戶資料');
        return;
      }

      // 3. 更新 TenantContext
      setTenantInfo(tenantData.id, tenantData.name);

      // 4. 跳轉至管理後台
      setLocation('/tenant-dashboard');
    } catch (err: any) {
      console.error('登入錯誤:', err);
      setError(err.message || '登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] flex items-center justify-center p-4">
      {/* Logo */}
      <div className="absolute top-8 left-8">
        <a href="/" className="flex items-center space-x-3">
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663168407203/spIgglAyttHAwyzr.jpeg" 
            alt="YoCHiLLSAAS Logo" 
            className="h-12 w-12"
          />
          <span className="text-2xl font-bold text-gold">YoCHiLLSAAS</span>
        </a>
      </div>

      <Card className="w-full max-w-md bg-[#0a1929]/80 backdrop-blur-sm border-2 border-gold/30 shadow-2xl shadow-gold/20">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-gold">租戶登入</CardTitle>
          <CardDescription className="text-gray-300">輸入您的電子郵件和密碼以登入您的帳戶</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="email" className="text-gold font-semibold">電子郵件</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                disabled={loading}
                className="bg-[#0f2942]/60 border-gold/30 text-white placeholder:text-gray-400 focus:border-gold focus:ring-gold"
              />
              {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password" className="text-gold font-semibold">密碼</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={loading}
                className="bg-[#0f2942]/60 border-gold/30 text-white placeholder:text-gray-400 focus:border-gold focus:ring-gold"
              />
              {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
            </div>
            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-lg p-3">{error}</p>}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-gold to-[#b8860b] hover:from-[#b8860b] hover:to-gold text-[#0a1929] font-bold text-lg py-6 shadow-lg shadow-gold/30 transition-all duration-300" 
              disabled={loading}
            >
              {loading ? '登入中...' : '登入'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm space-y-2">
            <a href="/forgot-password" className="text-gold hover:text-[#b8860b] underline transition-colors">
              忘記密碼？
            </a>
          </div>
          <div className="mt-4 text-center text-sm text-gray-300">
            還沒有帳戶？{' '}
            <a href="/tenant-register" className="text-gold hover:text-[#b8860b] underline font-semibold transition-colors">
              註冊
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantLogin;
