import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

interface TenantContextType {
  tenantId: number | null;
  tenantName: string | null;
  loading: boolean;
  setTenantId: (id: number) => void;
  setTenantInfo: (id: number, name: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('tenantId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [tenantName, setTenantName] = useState<string | null>(() => {
    return localStorage.getItem('tenantName');
  });
  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  // 使用 tRPC 後端查詢租戶資訊（安全：不直接讀取 tenants 表）
  const tenantQuery = trpc.tenant.getByAuthUser.useQuery(
    { authUserId: authUserId!, email: authEmail || undefined },
    { enabled: !!authUserId && !tenantId }
  );

  // 取得當前 Supabase Auth User
  useEffect(() => {
    const fetchUser = async () => {
      if (tenantId) {
        setLoading(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthUserId(user.id);
          setAuthEmail(user.email || null);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('取得使用者資訊失敗:', error);
        setLoading(false);
      }
    };
    fetchUser();
  }, [tenantId]);

  // 當 tRPC 查詢結果返回時更新 context
  useEffect(() => {
    if (tenantQuery.data) {
      setTenantIdState(tenantQuery.data.id);
      setTenantName(tenantQuery.data.name);
      localStorage.setItem('tenantId', String(tenantQuery.data.id));
      localStorage.setItem('tenantName', tenantQuery.data.name);
      setLoading(false);
    } else if (tenantQuery.isError || (tenantQuery.isFetched && !tenantQuery.data)) {
      setLoading(false);
    }
  }, [tenantQuery.data, tenantQuery.isError, tenantQuery.isFetched]);

  const setTenantId = (id: number) => {
    setTenantIdState(id);
    localStorage.setItem('tenantId', String(id));
  };

  const setTenantInfo = (id: number, name: string) => {
    setTenantIdState(id);
    setTenantName(name);
    localStorage.setItem('tenantId', String(id));
    localStorage.setItem('tenantName', name);
  };

  return (
    <TenantContext.Provider value={{ tenantId, tenantName, loading, setTenantId, setTenantInfo }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
