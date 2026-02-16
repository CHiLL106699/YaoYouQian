import { useMemo } from 'react';

/**
 * LIFF 頁面專用的 tenantId hook
 * 從 URL 查詢參數解析 tenantId，若無則使用環境變數預設值
 */
export function useLiffTenant(): { tenantId: number } {
  const tenantId = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = urlParams.get('tenantId');
    if (paramValue) {
      const parsed = parseInt(paramValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    // fallback to env variable
    const envValue = import.meta.env.VITE_DEFAULT_TENANT_ID;
    if (envValue) {
      const parsed = parseInt(envValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    // 最終 fallback
    return 1;
  }, []);

  return { tenantId };
}
