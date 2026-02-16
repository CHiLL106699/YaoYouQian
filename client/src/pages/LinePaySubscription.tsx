import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

const LinePaySubscription: React.FC = () => {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'idle' | 'authorizing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // const authorizeSubscriptionMutation = trpc.subscription.authorizeLinePay.useMutation();

  useEffect(() => {
    // 檢查是否從 LINE Pay 回調返回
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transactionId');
    const regKey = urlParams.get('regKey');

    if (transactionId && regKey) {
      handleLinePayCallback(transactionId, regKey);
    }
  }, []);

  const handleLinePayCallback = async (transactionId: string, regKey: string) => {
    setStatus('authorizing');
    try {
      // await authorizeSubscriptionMutation.mutateAsync({ transactionId, regKey });
      console.log('LINE Pay 授權成功:', { transactionId, regKey });
      setStatus('success');
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'LINE Pay 授權失敗');
    }
  };

  const handleStartAuthorization = async () => {
    setStatus('authorizing');
    try {
      // 呼叫後端 API 取得 LINE Pay 授權 URL
      // const { authorizationUrl } = await authorizeSubscriptionMutation.mutateAsync({});
      const authorizationUrl = 'https://sandbox-web-pay.line.me/web/payment/wait?transactionId=MOCK_TRANSACTION_ID';
      console.log('導向 LINE Pay 授權頁面:', authorizationUrl);
      window.location.href = authorizationUrl;
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || '無法啟動 LINE Pay 授權流程');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">LINE Pay 訂閱授權</CardTitle>
          <CardDescription className="text-center">
            授權 LINE Pay 自動扣款以啟用訂閱服務
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <>
              <Alert>
                <AlertDescription>
                  <strong>授權說明：</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>首次授權不會立即扣款</li>
                    <li>14 天免費試用期結束後才開始扣款</li>
                    <li>每月自動扣款，可隨時取消</li>
                    <li>授權後可在訂閱管理頁面查看詳情</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">訂閱方案資訊</h3>
                <p className="text-sm text-gray-600">方案：專業版</p>
                <p className="text-sm text-gray-600">價格：NT$ 2,999/月</p>
                <p className="text-sm text-gray-600">試用期：14 天</p>
              </div>
            </>
          )}

          {status === 'authorizing' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-green-600 mb-4" />
              <p className="text-lg font-semibold">正在處理授權...</p>
              <p className="text-sm text-gray-600 mt-2">請稍候，不要關閉此頁面</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <p className="text-lg font-semibold text-green-700">授權成功！</p>
              <p className="text-sm text-gray-600 mt-2">正在導向儀表板...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="h-16 w-16 text-red-600 mb-4" />
              <p className="text-lg font-semibold text-red-700">授權失敗</p>
              <p className="text-sm text-gray-600 mt-2">{errorMessage}</p>
              <Button variant="outline" className="mt-4" onClick={() => setStatus('idle')}>
                重試
              </Button>
            </div>
          )}
        </CardContent>
        {status === 'idle' && (
          <CardFooter>
            <Button onClick={handleStartAuthorization} className="w-full bg-green-600 hover:bg-green-700">
              開始 LINE Pay 授權
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default LinePaySubscription;
