import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocation } from 'wouter';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Shield } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: '請輸入有效的電子郵件地址。' }),
  password: z.string().min(8, { message: '密碼至少需要 8 個字元。' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

// 超級管理員帳號（實際應用中應從環境變數或資料庫取得）
const SUPER_ADMIN_EMAIL = 'admin@flower-saas.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2026'; // 僅供示範，實際應使用加密與環境變數

const SuperAdminLogin: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      // 驗證超級管理員帳號
      if (data.email === SUPER_ADMIN_EMAIL && data.password === SUPER_ADMIN_PASSWORD) {
        // 儲存登入狀態（實際應用中應使用 JWT 或 Session）
        sessionStorage.setItem('superAdminLoggedIn', 'true');
        setLocation('/super-admin/dashboard');
      } else {
        setError('帳號或密碼錯誤');
      }
    } catch (err: any) {
      console.error('登入錯誤:', err);
      setError(err.message || '登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">超級管理員登入</CardTitle>
          <CardDescription className="text-slate-400">
            僅限平台擁有者存取
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-300">電子郵件</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@flower-saas.com"
                {...register('email')}
                disabled={loading}
                className="bg-slate-800 border-slate-700 text-white"
              />
              {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-slate-300">密碼</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={loading}
                className="bg-slate-800 border-slate-700 text-white"
              />
              {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? '登入中...' : '登入'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminLogin;
