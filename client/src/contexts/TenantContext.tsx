import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    const fetchCurrentTenant = async () => {
      if (tenantId) {
        setLoading(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let { data: tenant } = await supabase
            .from('tenants')
            .select('id, name')
            .eq('auth_user_id', user.id)
            .single();
          if (!tenant && user.email) {
            const { data: tenantByEmail } = await supabase
              .from('tenants')
              .select('id, name')
              .eq('owner_email', user.email)
              .single();
            tenant = tenantByEmail;
          }
          if (tenant) {
            setTenantIdState(tenant.id);
            setTenantName(tenant.name);
            localStorage.setItem('tenantId', String(tenant.id));
            localStorage.setItem('tenantName', tenant.name);
          }
        }
      } catch (error) {
        console.error('取得租戶資訊失敗:', error);
      }
      setLoading(false);
    };
    fetchCurrentTenant();
  }, [tenantId]);

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
