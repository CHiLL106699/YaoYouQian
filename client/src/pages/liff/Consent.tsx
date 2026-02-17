/**
 * LIFF 同意書簽署 — 顯示內容、簽名板、提交
 */
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { closeLiffWindow } from '@/lib/liff';
import { Loader2, CheckCircle, FileText, Eraser } from 'lucide-react';

function ConsentContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [step, setStep] = useState<'list' | 'sign' | 'done'>('list');
  const [selectedForm, setSelectedForm] = useState<{ id: number; title: string; content: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const formsQuery = trpc.consentForm.list.useQuery({ tenantId, page: 1, pageSize: 20 });
  const signMutation = trpc.consentForm.update.useMutation();

  // Canvas drawing
  useEffect(() => {
    if (step === 'sign' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [step]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { const { x, y } = getPos(e); ctx.beginPath(); ctx.moveTo(x, y); }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { const { x, y } = getPos(e); ctx.lineTo(x, y); ctx.stroke(); setHasSigned(true); }
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); setHasSigned(false); }
    }
  };

  const handleSubmit = async () => {
    if (!selectedForm || !canvasRef.current) return;
    const signatureData = canvasRef.current.toDataURL('image/png');
    try {
      await signMutation.mutateAsync({
        id: selectedForm.id,
        tenantId,
        signatureData,
      });
      setStep('done');
    } catch (e: any) {
      alert(`簽署失敗: ${e.message}`);
    }
  };

  if (step === 'done') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <CheckCircle className="h-16 w-16 text-[#06C755] mb-4" />
        <h2 className="text-xl font-bold mb-2">簽署完成！</h2>
        <p className="text-gray-500 text-sm text-center">同意書已成功提交</p>
        <Button className="mt-6 bg-[#06C755] hover:bg-[#05a847] text-white" onClick={() => closeLiffWindow()}>關閉</Button>
      </div>
    );
  }

  if (step === 'sign' && selectedForm) {
    return (
      <div className="p-4 pb-24">
        <h2 className="text-lg font-bold mb-3">{selectedForm.title || '同意書'}</h2>
        <Card className="mb-4">
          <CardContent className="p-4 text-sm text-gray-600 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
            {selectedForm.content || '同意書內容載入中...'}
          </CardContent>
        </Card>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">請在下方簽名</p>
            <Button variant="ghost" size="sm" onClick={clearCanvas}><Eraser className="h-4 w-4 mr-1" /> 清除</Button>
          </div>
          <canvas ref={canvasRef} className="w-full h-40 bg-white border-2 border-dashed border-gray-300 rounded-xl touch-none"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        </div>
        <Button className="w-full h-12 bg-[#06C755] hover:bg-[#05a847] text-white text-base font-bold"
          disabled={!hasSigned || signMutation.isPending} onClick={handleSubmit}>
          {signMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : '確認簽署'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-[#06C755]" /> 同意書簽署
      </h2>
      {formsQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
      ) : (formsQuery.data?.forms || []).length === 0 ? (
        <p className="text-center text-gray-400 py-8">暫無待簽署的同意書</p>
      ) : (
        <div className="space-y-3">
          {(formsQuery.data?.forms || []).map((form: any) => (
            <Card key={form.id} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => { setSelectedForm({ id: form.id, title: form.form_type || '同意書', content: form.content || '' }); setStep('sign'); }}>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-8 w-8 text-[#06C755] flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{form.form_type || '同意書'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{form.created_at ? new Date(form.created_at).toLocaleDateString('zh-TW') : ''}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LiffConsent() {
  return <LiffLayout title="同意書簽署">{(props) => <ConsentContent {...props} />}</LiffLayout>;
}
