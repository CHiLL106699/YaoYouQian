/**
 * YoCHiLLSAAS - Landing Page (Optimized)
 * 深藍底燙金字質感介面 + 滾動動畫 + 客戶見證
 */

import { Link } from 'wouter';
import { Building2, Users, ShoppingCart, Palette, Shield, CreditCard, Sparkles, ArrowRight, Calendar, TrendingUp, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: '預約管理',
      description: '完整的預約排程、改期申請、批次審核功能',
      highlights: ['彈性時段設定', '自動衝突檢測', 'LINE 通知提醒'],
      color: 'text-blue-400',
      screenshot: 'https://private-us-east-1.manuscdn.com/sessionFile/Vla0Wzk4KC1d0jMdUK4e16/sandbox/kZEDRLT24gvA2GifrDSbkk-img-1_1770876226000_na1fn_ZmVhdHVyZS1ib29raW5nLW1hbmFnZW1lbnQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVmxhMFd6azRLQzFkMGpNZFVLNGUxNi9zYW5kYm94L2taRURSTFQyNGd2QTJHaWZyRFNia2staW1nLTFfMTc3MDg3NjIyNjAwMF9uYTFmbl9abVZoZEhWeVpTMWliMjlyYVc1bkxXMWhibUZuWlcxbGJuUS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=i9QYYvp~OGHytJxJBS8CYjWmMN7sIj3Jq0pGTM9sIES87BMvCFVVEyzCOl~tS30rhizf6fQDfeYz-5bLexunME7Ypoou8kraMO7c6iw6xRKFlReKblNAPwZU2Vf2WUDOV8FvVrA8a-LmD0~PkyjMM2p~cVN2ez1M2V7~Q6DaI2zAhJSETNdro67H4zwUD6ksiyaJi7uSnT75DRA2qOO9X0gLtTRaKIP6MeEvsqN2cq4IR6SANIitThdtvAiTgEn3Wx66Nj3YPWIsiOXJF3RNIuU242ibEzUBFJArefyuE-2n7HwrnffRxhDS~13ErU0hKS2ipMNU8~6-KQbkw50lZQ__',
    },
    {
      icon: Users,
      title: '客戶管理',
      description: '完整的客戶資料、會員等級、標籤分類',
      highlights: ['客戶標籤分類', '會員等級制度', '推薦獎勵計畫'],
      color: 'text-purple-400',
      screenshot: 'https://private-us-east-1.manuscdn.com/sessionFile/Vla0Wzk4KC1d0jMdUK4e16/sandbox/kZEDRLT24gvA2GifrDSbkk-img-2_1770876235000_na1fn_ZmVhdHVyZS1jdXN0b21lci1tYW5hZ2VtZW50.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVmxhMFd6azRLQzFkMGpNZFVLNGUxNi9zYW5kYm94L2taRURSTFQyNGd2QTJHaWZyRFNia2staW1nLTJfMTc3MDg3NjIzNTAwMF9uYTFmbl9abVZoZEhWeVpTMWpkWE4wYjIxbGNpMXRZVzVoWjJWdFpXNTAucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=J0i5MR1VEEzJ-x4HXOv2nG8dZ84m47C-MBZKkKIxw4cSrUHcrPoSkJoV2r9NW4jCgj3qBWNEoog8p74vJjTKJtQ2LZskkmYl39dpe00rC3LcKkDfZg~D54pjKDFrVM08SL7aTMq0FZbVA~JnQ1uhvxwo7D8h-rKAg5Ktp5xL~j6o5EBHnAEqf9vFpneWJpWYUyfCJIRpxcIpzaImEPr2NDef3w3WA4XqOZcZDIWOiPUvsAaOU2w6v2VEtgWW8~mIPBpc6bf8QmzZKYGoEIrPM4thmYBaZwAlE-VKCkX1h2ZZKThWoss41BKD9e6ETUKCLE-cKZqHAPO~ghDtMLzWtA__',
    },
    {
      icon: TrendingUp,
      title: '商城功能',
      description: '商品管理、訂單處理、優惠券系統',
      highlights: ['商品庫存管理', '優惠券發放', 'LINE Pay 整合'],
      color: 'text-green-400',
      screenshot: 'https://private-us-east-1.manuscdn.com/sessionFile/Vla0Wzk4KC1d0jMdUK4e16/sandbox/kZEDRLT24gvA2GifrDSbkk-img-3_1770876235000_na1fn_ZmVhdHVyZS1zaG9wLW1hbmFnZW1lbnQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVmxhMFd6azRLQzFkMGpNZFVLNGUxNi9zYW5kYm94L2taRURSTFQyNGd2QTJHaWZyRFNia2staW1nLTNfMTc3MDg3NjIzNTAwMF9uYTFmbl9abVZoZEhWeVpTMXphRzl3TFcxaGJtRm5aVzFsYm5RLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=VPQJy6Y-qqnPmKVvH9j66ruzvRFuU1LsJxNsFe~oZebGFlkqxm3dTtlboa9Z6x7cFASsrV9kLoxWNLcH0LFIb8wcV5QkSGBwVttiUkzLPBwDal5SODRDF7A8A4sSnnRfQqgP3u1-qs9mHQCShnovIi2B4V3HeeQsVSDVHRzrHFtqDrqQjeOaqdusYdln57YuXB7I12GpLRdxsfJEkzfiwlxL1zsFlfueBIa9OpHAe8ajKNieXpG8FniLgqwB~3uzVosf70A4WjzjbantDKN-xMwB1HfOGcjNcNb3ntmPYIfm4BIONSoUUXA2Nj9ls4U0B3lGBjCm~NCvFM5k80UNUQ__',
    },
    {
      icon: Settings,
      title: '白標化設定',
      description: '自訂品牌、配色、網域名稱',
      highlights: ['自訂 Logo 與配色', '獨立網域綁定', '客製化主題'],
      color: 'text-orange-400',
      screenshot: 'https://private-us-east-1.manuscdn.com/sessionFile/Vla0Wzk4KC1d0jMdUK4e16/sandbox/kZEDRLT24gvA2GifrDSbkk-img-4_1770876219000_na1fn_ZmVhdHVyZS13aGl0ZS1sYWJlbA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVmxhMFd6azRLQzFkMGpNZFVLNGUxNi9zYW5kYm94L2taRURSTFQyNGd2QTJHaWZyRFNia2staW1nLTRfMTc3MDg3NjIxOTAwMF9uYTFmbl9abVZoZEhWeVpTMTNhR2wwWlMxc1lXSmxiQS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=L2NH7IHCJ00OnQ9OMvluazp58rTIz~1ADOIjenPs3d7VnxnZgYP~f2khX-MPV79gmaD5kW7YB8aON1kqPk1cSJJndB07ROSYzgH66jVQ2HwncVQiBIq3HKvQuurE0l3ytI2iNqskHfZzvksK9IJYm85fSxIk9vHNiZEJbDcjwTz0rItPU-A1rJA1y-bQ6Qs3xmwygwEkHOERI2AwZb7kUrKjrtjixzKyAF2ErBDIhryeN03T-bA5vsYOZRny2haFD11iEQIVQuoUfY4W1q9JrIpJXGaiT5xQAkHwhMsRkNJUr~8uyqCqPXGOiOR36LtdnQrq45t0zr-awycFbxC2sQ__',
    },
    {
      icon: Shield,
      title: '資料隔離',
      description: '多租戶架構，資料完全隔離',
      highlights: ['Tenant ID 嚴格過濾', '獨立資料空間', '企業級安全'],
      color: 'text-red-400',
      screenshot: 'https://private-us-east-1.manuscdn.com/sessionFile/Vla0Wzk4KC1d0jMdUK4e16/sandbox/kZEDRLT24gvA2GifrDSbkk-img-5_1770876235000_na1fn_ZmVhdHVyZS1kYXRhLWlzb2xhdGlvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVmxhMFd6azRLQzFkMGpNZFVLNGUxNi9zYW5kYm94L2taRURSTFQyNGd2QTJHaWZyRFNia2staW1nLTVfMTc3MDg3NjIzNTAwMF9uYTFmbl9abVZoZEhWeVpTMWtZWFJoTFdsemIyeGhkR2x2YmcucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=vMK-1ljGnA9VZ~8yiBZ7nMUUaUxcLH8FnfCnPvqow3mOX8DlZrJp4i8HGF1gkNNpWTXpsyNoWknOKC7n-u314Z53C-M3y-LpKYMr8p9z6ebOHEd1ovaYf78r-lEswJVHtGIwAKcWSezo80Jm5v2kH3c8~aIYpdapDg7cyoioL-S7txjxlFzMDXtANJRvwtczg1s5KQbENzaEpDfhdHWeP6YIX9MRwJzvYnu1wE2Q0Ej7VcggRI4mYi43UuZKHV73~w15aV43lRv3wS11YPpUBC1HPa6bulnAf9tHCg3QICj2vsar3MSjkbf18YQcTXq0sJCjO2gKRwzihi6cojfkRA__',
    },
    {
      icon: CreditCard,
      title: '訂閱管理',
      description: '彈性方案、自動續約、付款整合',
      highlights: ['多種訂閱方案', '自動扣款提醒', '金流整合'],
      color: 'text-indigo-400',
      screenshot: 'https://private-us-east-1.manuscdn.com/sessionFile/Vla0Wzk4KC1d0jMdUK4e16/sandbox/wPkRzJuzhuP7ILpi4hpCUl-img-1_1770876294000_na1fn_ZmVhdHVyZS1zdWJzY3JpcHRpb24tbWFuYWdlbWVudA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVmxhMFd6azRLQzFkMGpNZFVLNGUxNi9zYW5kYm94L3dQa1J6SnV6aHVQN0lMcGk0aHBDVWwtaW1nLTFfMTc3MDg3NjI5NDAwMF9uYTFmbl9abVZoZEhWeVpTMXpkV0p6WTNKcGNIUnBiMjR0YldGdVlXZGxiV1Z1ZEEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=i~aFJewVonynbeLz87e9XnPcgOgsIyjdfhKPkUAnvVeO564E3BkrDByj012b0znQhl6b8I0jzjghmlt1p2yHNQS1HFzlWhvdIoMBikMMt5kWl77hu7z2AHbhkG2tA2655kf8s5jDqoRwUNRsKiF3MnvyIZeYd4k8hXbPX0RP1x4MPk2z3siLiOJQljmeoKMvTzlglBIkmXQVNYVTL7S05CqherJWzND~o~0eeKGII-73RILDuOapZH8XEgZA~R2knlWAacY0Gnb4wmtv1HEDEZwOEh6mEfNgY4ETr-Ww8VMQkdqVjnN4D3n-wklHupzqchKMqCvOc0~kIjX0xxLFOQ__',
    },
  ];

  // 客戶見證已移除（醫療法規遵循）

  const pricingPlans = [
    {
      name: '基礎版',
      price: 'NT$ 999',
      period: '/月',
      description: '適合個人工作室或小型診所',
      features: [
        '最多 100 筆預約/月',
        '1 個管理員帳號',
        '基礎報表',
        'LINE 通知整合',
        '客戶管理',
        '預約排程',
      ],
      highlighted: false,
    },
    {
      name: '專業版',
      price: 'NT$ 2,999',
      period: '/月',
      description: '適合中型企業或連鎖品牌',
      features: [
        '最多 500 筆預約/月',
        '5 個管理員帳號',
        '進階報表與統計',
        'LINE 通知整合',
        '白標化功能',
        '會員等級制度',
        '優惠券系統',
        '商城功能',
      ],
      highlighted: true,
    },
    {
      name: '企業版',
      price: 'NT$ 9,999',
      period: '/月',
      description: '適合大型企業或多分店管理',
      features: [
        '無限預約',
        '無限管理員帳號',
        '完整報表與數據分析',
        'LINE 通知整合',
        '白標化功能',
        '專屬客服',
        'API 整合',
        '客製化開發',
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663168407203/ONHMCAXhoLhRedWt.jpg" 
                alt="FLOS 曜診所 Logo" 
                className="w-12 h-12 object-contain bg-white rounded-lg p-1"
              />
              <h1 className="text-2xl font-bold text-gold">曜友仟管理雲</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/super-admin-login">
                <Button className="btn-gold">
                  管理後台
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">多租戶預約管理系統</span>
            </div>
            
            <div className="flex items-center justify-center gap-6 mb-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663168407203/ONHMCAXhoLhRedWt.jpg" 
                alt="曜友仟管理雲 Logo" 
                className="h-32 w-auto drop-shadow-2xl bg-white rounded-2xl p-4"
              />
              <span className="text-3xl font-bold text-white/40">
                ×
              </span>
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663168407203/spIgglA.jpg" 
                alt="YoCHiLL" 
                className="h-16 w-auto drop-shadow-lg opacity-80"
              />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in leading-tight" style={{ animationDelay: '0.1s' }}>
              <span className="text-gold">曜友仟管理雲</span>
              <br />
              <span className="text-foreground">專業預約管理解決方案</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in max-w-3xl mx-auto leading-relaxed" style={{ animationDelay: '0.2s' }}>
              專為美容診所、健身房、諮詢服務等預約型商家打造的完整解決方案
              <br />
              <span className="text-primary font-semibold">14 天免費試用，無需信用卡</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link href="/tenant-register">
                <Button size="lg" className="btn-gold text-lg px-8 py-6 shadow-lg hover:shadow-2xl transition-shadow">
                  免費試用 14 天
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/tenant-login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10">
                  租戶登入
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>無需信用卡</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>隨時取消</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>資料安全保障</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-primary border-primary">核心功能</Badge>
            <h3 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gold">完整的功能模組</span>
            </h3>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              從預約管理到客戶經營，一站式解決您的所有需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="luxury-card animate-fade-in overflow-hidden group hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Feature Screenshot */}
                <div className="relative h-56 overflow-hidden border-b border-border">
                  <img 
                    src={feature.screenshot} 
                    alt={`${feature.title} 截圖`}
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-gold-solid text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 客戶見證 Section 已移除（醫療法規遵循） */}

      {/* Pricing Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-primary border-primary">訂閱方案</Badge>
            <h3 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gold">選擇適合您的方案</span>
            </h3>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              所有方案均享有 14 天免費試用，試用期間可隨時取消
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`luxury-card animate-fade-in ${plan.highlighted ? 'border-primary shadow-2xl scale-105' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">最受歡迎</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-gold-solid">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/tenant-register">
                    <Button 
                      className={`w-full ${plan.highlighted ? 'btn-gold' : ''}`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      開始使用
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-gold">準備好開始了嗎？</span>
            </h3>
            <p className="text-xl text-muted-foreground mb-8">
              立即註冊，開始您的 14 天免費試用，無需信用卡
            </p>
            <Link href="/tenant-register">
              <Button size="lg" className="btn-gold text-lg px-12 py-6 shadow-2xl">
                免費試用 14 天
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">© 2026 YoCHiLLSAAS. All rights reserved.</p>
            <p className="text-sm">專業預約管理解決方案</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
