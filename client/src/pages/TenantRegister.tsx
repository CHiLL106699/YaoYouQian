import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: '基礎版', price: 'NT$ 999/月', features: ['最多 100 筆預約/月', '1 個管理員帳號', '基礎報表'] },
  { id: 'professional', name: '專業版', price: 'NT$ 2,999/月', features: ['最多 500 筆預約/月', '5 個管理員帳號', '進階報表', '白標化功能'] },
  { id: 'enterprise', name: '企業版', price: 'NT$ 9,999/月', features: ['無限預約', '無限管理員帳號', '完整報表', '白標化功能', '專屬客服'] },
];

const TenantRegister: React.FC = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'enterprise'>('professional');
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = trpc.tenant.register.useMutation();

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedPlan) newErrors.plan = '請選擇訂閱方案';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = '請輸入公司名稱';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = '請輸入聯絡人姓名';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = '請輸入有效的 Email';
    if (formData.password.length < 8) newErrors.password = '密碼至少需要 8 個字元';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = '密碼不一致';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    try {
      // 使用 tRPC Router 處理所有註冊邏輯（後端）
      const result = await registerMutation.mutateAsync({
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        password: formData.password,
        subscriptionPlan: selectedPlan,
      });

      alert(result.message);
      setLocation('/tenant-login');
    } catch (error: unknown) {
      console.error('註冊錯誤:', error);
      setErrors({ submit: (error as Error).message || '註冊失敗，請稍後再試' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl bg-[#0a1929]/80 backdrop-blur-md border-2 border-gold/30">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gold">租戶註冊</CardTitle>
          <CardDescription className="text-center text-lg text-gray-300">
            開始您的 14 天免費試用，無需信用卡
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold mb-4 block text-gold">選擇訂閱方案</Label>
                <RadioGroup value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as 'basic' | 'professional' | 'enterprise')} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div key={plan.id} className="relative">
                      <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                      <Label
                        htmlFor={plan.id}
                        className="flex flex-col p-6 border-2 rounded-lg cursor-pointer transition-all bg-[#0a1929]/60 backdrop-blur-sm border-gold/30 peer-checked:border-gold peer-checked:bg-gold/10 hover:border-gold/60 hover:bg-gold/5"
                      >
                        <span className="text-xl font-bold mb-2 text-gold">{plan.name}</span>
                        <span className="text-2xl font-bold text-gold mb-4">{plan.price}</span>
                        <ul className="space-y-2 text-sm text-gray-300">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center">
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.plan && <p className="text-red-500 text-sm mt-2">{errors.plan}</p>}
              </div>
              <Alert className="bg-gold/10 border-gold/30">
                <AlertDescription className="text-gray-300">
                  ✨ 所有方案均享有 <strong className="text-gold">14 天免費試用</strong>，試用期間可隨時取消
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyName" className="text-gray-300">公司名稱 *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="請輸入公司名稱"
                />
                {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <Label htmlFor="contactPerson" className="text-gray-300">聯絡人姓名 *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="請輸入聯絡人姓名"
                />
                {errors.contactPerson && <p className="text-red-500 text-sm mt-1">{errors.contactPerson}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="請輸入 Email"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-300">密碼 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="至少 8 個字元"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-300">確認密碼 *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="再次輸入密碼"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
              {errors.submit && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              上一步
            </Button>
          )}
          {step === 1 && (
            <Button onClick={handleNext} className="ml-auto">
              下一步
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleSubmit} className="ml-auto">
              {/* {registerMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
              完成註冊
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TenantRegister;
