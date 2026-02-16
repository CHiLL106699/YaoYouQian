/**
 * LIFF 術後護理頁面 - 多租戶 SaaS 版本
 * 以 Accordion 方式展示各療程的術後護理須知
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, CheckCircle2, XCircle, Loader2, Info } from "lucide-react";

interface AftercareInstructions {
  dos?: string[];
  donts?: string[];
}

export default function LiffCare() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");

  const { data: aftercareContents, isLoading, error } = trpc.aftercareContent.list.useQuery(
    { tenantId: Number(tenantId) },
    { enabled: !!tenantId && !isNaN(Number(tenantId)) }
  );

  if (!tenantId || isNaN(Number(tenantId))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4 text-yellow-800">
        <Info className="h-12 w-12 text-yellow-500" />
        <p className="mt-4 text-lg font-semibold">無效的頁面連結</p>
        <p className="text-sm text-gray-600">請確認您是從診所提供的正確連結進入。</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-green-100 p-4 text-gray-600">
        <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
        <p className="mt-4 text-lg">載入中，請稍候...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4 text-red-600">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-lg font-semibold">讀取資料時發生錯誤</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!aftercareContents || aftercareContents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-green-100 p-4 text-gray-600">
        <Info className="h-12 w-12 text-teal-500" />
        <p className="mt-4 text-lg">目前沒有可用的術後護理資訊</p>
        <p className="text-sm text-gray-500">請洽詢您的診所服務人員</p>
      </div>
    );
  }

  // 處理 instructions：可能是 string[] 或 { dos, donts } 格式
  const parseInstructions = (raw: any): AftercareInstructions => {
    if (!raw) return {};
    if (Array.isArray(raw)) {
      return { dos: raw as string[], donts: [] };
    }
    if (typeof raw === "object" && (raw.dos || raw.donts)) {
      return raw as AftercareInstructions;
    }
    return {};
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-teal-50 to-green-100 p-4 sm:p-6">
      <header className="mb-6 flex items-center space-x-3">
        <Heart className="h-8 w-8 text-teal-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">術後護理須知</h1>
          <p className="text-sm text-gray-500">為了您最佳的恢復效果，請遵循以下建議</p>
        </div>
      </header>

      <main>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {aftercareContents.map((content: any, index: number) => {
            const instructions = parseInstructions(content.instructions);
            return (
              <AccordionItem value={`item-${index}`} key={content.id} className="border-none">
                <Card className="overflow-hidden rounded-xl shadow-sm bg-white/80 backdrop-blur-sm">
                  <AccordionTrigger className="p-4 hover:no-underline">
                    <CardHeader className="p-0 text-left">
                      <CardTitle className="text-lg text-teal-800">{content.treatment_name}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">{content.category || "一般護理"}</CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="space-y-4">
                      {content.description && (
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-2">護理說明</h3>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{content.description}</p>
                        </div>
                      )}

                      {instructions.dos && instructions.dos.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">您可以做</h4>
                          <ul className="space-y-2">
                            {instructions.dos.map((item: string, i: number) => (
                              <li key={i} className="flex items-start space-x-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {instructions.donts && instructions.donts.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2">請避免</h4>
                          <ul className="space-y-2">
                            {instructions.donts.map((item: string, i: number) => (
                              <li key={i} className="flex items-start space-x-2">
                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 如果 instructions 是純 string[] 格式，直接列出 */}
                      {Array.isArray(content.instructions) && typeof content.instructions[0] === "string" && (
                        <div>
                          <h4 className="font-semibold text-teal-700 mb-2">護理須知</h4>
                          <ul className="space-y-2">
                            {(content.instructions as string[]).map((item: string, i: number) => (
                              <li key={i} className="flex items-start space-x-2">
                                <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </main>
    </div>
  );
}
