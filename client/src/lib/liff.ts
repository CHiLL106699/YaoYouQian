import liff from '@line/liff';

export interface LiffProfile {
  displayName: string;
  userId: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * 初始化 LIFF SDK
 * @param liffId LIFF ID
 * @returns 是否初始化成功
 */
export async function initLiff(liffId: string): Promise<boolean> {
  try {
    await liff.init({ liffId });
    
    // 如果未登入，自動導向登入頁面
    if (!liff.isLoggedIn()) {
      liff.login();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('LIFF 初始化失敗:', error);
    throw error;
  }
}

/**
 * 取得 LINE 使用者資料
 * @returns 使用者資料
 */
export async function getLiffProfile(): Promise<LiffProfile> {
  try {
    const profile = await liff.getProfile();
    return {
      displayName: profile.displayName,
      userId: profile.userId,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage
    };
  } catch (error) {
    console.error('取得使用者資料失敗:', error);
    throw error;
  }
}

/**
 * 關閉 LIFF 視窗
 */
export function closeLiffWindow(): void {
  if (liff.isInClient()) {
    liff.closeWindow();
  } else {
    window.close();
  }
}

/**
 * 檢查是否在 LINE 應用程式內
 * @returns 是否在 LINE 應用程式內
 */
export function isInLineApp(): boolean {
  return liff.isInClient();
}

/**
 * 取得 LINE Access Token
 * @returns Access Token
 */
export function getAccessToken(): string | null {
  try {
    return liff.getAccessToken();
  } catch (error) {
    console.error('取得 Access Token 失敗:', error);
    return null;
  }
}

/**
 * 登出 LINE
 */
export function logout(): void {
  liff.logout();
}
