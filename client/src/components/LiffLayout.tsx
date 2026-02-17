/**
 * LIFF 共用 Layout
 * LINE 風格手機優先響應式設計
 */
import React, { useEffect, useState, ReactNode } from 'react';
import { initLiff, getLiffProfile, type LiffProfile } from '../lib/liff';
import { Loader2 } from 'lucide-react';

const LIFF_ID = import.meta.env.VITE_LIFF_ID;
if (!LIFF_ID) {
  console.error('[LIFF] VITE_LIFF_ID 環境變數未設定');
}

interface LiffLayoutProps {
  children: (props: { profile: LiffProfile; tenantId: number }) => ReactNode;
  title?: string;
  showHeader?: boolean;
}

export default function LiffLayout({ children, title, showHeader = true }: LiffLayoutProps) {
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = (() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('tenantId');
    if (p) { const n = parseInt(p, 10); if (!isNaN(n) && n > 0) return n; }
    const env = import.meta.env.VITE_DEFAULT_TENANT_ID;
    if (env) { const n = parseInt(env, 10); if (!isNaN(n) && n > 0) return n; }
    return 1;
  })();

  useEffect(() => {
    const init = async () => {
      const timeout = setTimeout(() => { setError('連線逾時'); setLoading(false); }, 15000);
      try {
        const ok = await initLiff(LIFF_ID);
        clearTimeout(timeout);
        if (ok) {
          const p = await getLiffProfile();
          setProfile(p);
        } else {
          setError('LIFF 初始化失敗');
        }
      } catch (e: any) {
        clearTimeout(timeout);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#06C755]" />
        <p className="mt-3 text-sm text-gray-500">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl p-6 shadow-sm text-center max-w-sm w-full">
          <p className="text-red-500 font-medium">系統維護中</p>
          <p className="text-sm text-gray-400 mt-2">請稍後再試，或直接聯繫官方帳號</p>
          {window.location.search.includes('debug_mode=true') && (
            <p className="text-xs text-gray-300 mt-2 break-all">{error}</p>
          )}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-gray-500">無法取得使用者資訊</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {showHeader && title && (
        <div className="bg-[#06C755] text-white px-4 py-3 sticky top-0 z-50 shadow-sm">
          <h1 className="text-lg font-bold text-center">{title}</h1>
        </div>
      )}
      <div className="max-w-lg mx-auto">
        {children({ profile, tenantId })}
      </div>
    </div>
  );
}
