import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "../lib/supabase";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('請輸入有效的 Email 格式。');
      return;
    }

    if (!validatePassword(password)) {
      setError('密碼至少需要 6 個字元');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMap: Record<string, string> = {
          'Invalid login credentials': '電子郵件或密碼錯誤，請重新輸入',
          'Email not confirmed': '電子郵件尚未驗證',
          'Too many requests': '登入嘗試次數過多，請稍後再試',
        };
        setError(errorMap[error.message] || `登入失敗：${error.message}`);
      } else {
        // 登入成功，導向管理員儀表板
        window.location.href = "/admin/dashboard"; 
      }
    } catch (err: any) {
      setError(err.message);
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
          <CardTitle className="text-3xl font-bold text-gold">超級管理員登入</CardTitle>
          <CardDescription className="text-gray-300">僅限平台擁有者存取</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-gold font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#0f2942]/60 border-gold/30 text-white placeholder:text-gray-400 focus:border-gold focus:ring-gold"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-gold font-semibold">密碼</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0f2942]/60 border-gold/30 text-white placeholder:text-gray-400 focus:border-gold focus:ring-gold"
              />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
