/**
 * CampaignExecution.tsx
 * 執行行銷活動 — 步驟式流程：選標籤 → 預覽受眾 → 選模板 → 合規檢查 → 確認發送
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import ComplianceChecker from '@/components/ComplianceChecker';
import {
  Rocket, Tag, Users, FileText, ShieldCheck, Send,
  ChevronRight, ChevronLeft, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { step: 1 as Step, label: '選擇標籤', icon: Tag },
  { step: 2 as Step, label: '預覽受眾', icon: Users },
  { step: 3 as Step, label: '選擇模板', icon: FileText },
  { step: 4 as Step, label: '合規檢查', icon: ShieldCheck },
  { step: 5 as Step, label: '確認發送', icon: Send },
];

export default function CampaignExecution() {
  const { tenantId } = useTenant();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Queries
  const { data: tags } = trpc.smartTag.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const { data: audience } = trpc.smartTag.previewAudience.useQuery(
    { tenantId: tenantId!, tagIds: selectedTagIds },
    { enabled: !!tenantId && selectedTagIds.length > 0 && currentStep >= 2 }
  );

  const { data: templates } = trpc.campaignTemplate.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId && currentStep >= 3 }
  );

  const selectedTemplate = templates?.find((t: any) => t.id === selectedTemplateId);

  // Get content text for compliance check
  const getContentText = (): string => {
    if (!selectedTemplate) return '';
    const content = selectedTemplate.content as any;
    if (selectedTemplate.message_type === 'text') {
      return content?.text || (typeof content === 'string' ? content : JSON.stringify(content));
    }
    if (selectedTemplate.message_type === 'flex') {
      return content?.altText || JSON.stringify(content);
    }
    return JSON.stringify(content);
  };

  // Compliance check
  const { data: complianceResult } = trpc.compliance.checkContent.useMutation();

  // Execute
  const executeMutation = trpc.campaignExecution.execute.useMutation({
    onSuccess: (data) => {
      setExecutionResult(data);
      toast.success(`行銷活動發送完成！成功 ${data.sentCount} / ${data.targetCount}`);
    },
    onError: (err) => toast.error(`發送失敗：${err.message}`),
  });

  // Execution history
  const { data: executionHistory } = trpc.campaignExecution.list.useQuery(
    { tenantId: tenantId!, page: 1, limit: 10 },
    { enabled: !!tenantId }
  );

  const toggleTag = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return selectedTagIds.length > 0;
      case 2: return (audience?.count || 0) > 0;
      case 3: return selectedTemplateId !== null;
      case 4: return true;
      case 5: return !executeMutation.isPending;
      default: return false;
    }
  };

  const handleExecute = () => {
    if (!tenantId || !selectedTemplateId || selectedTagIds.length === 0) return;
    executeMutation.mutate({
      tenantId,
      templateId: selectedTemplateId,
      tagIds: selectedTagIds,
    });
  };

  const resetAll = () => {
    setCurrentStep(1);
    setSelectedTagIds([]);
    setSelectedTemplateId(null);
    setExecutionResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Rocket className="h-6 w-6" />執行行銷活動
        </h1>
        {executionResult && (
          <Button variant="outline" onClick={resetAll}>建立新活動</Button>
        )}
      </div>

      {/* Step indicator */}
      {!executionResult && (
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <div key={s.step} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isCompleted ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Step content */}
      {!executionResult && (
        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Select tags */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">步驟 1：選擇目標標籤</h3>
                <p className="text-muted-foreground text-sm">選擇一個或多個標籤來定義目標受眾</p>
                {!tags?.length ? (
                  <p className="text-center py-8 text-muted-foreground">尚未建立任何標籤，請先前往「智能標籤管理」建立標籤</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: any) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          selectedTagIds.includes(tag.id)
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || '#6366f1' }} />
                        <span className="text-sm font-medium">{tag.tag_name}</span>
                        <Badge variant="outline" className="text-xs">{tag.customerCount}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                {selectedTagIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">已選擇 {selectedTagIds.length} 個標籤</p>
                )}
              </div>
            )}

            {/* Step 2: Preview audience */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">步驟 2：預覽受眾</h3>
                {!audience ? (
                  <p className="text-center py-8 text-muted-foreground">載入中...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-3xl font-bold">{audience.count}</p>
                        <p className="text-sm text-muted-foreground mt-1">目標客戶數</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-3xl font-bold">{audience.lineReachable}</p>
                        <p className="text-sm text-muted-foreground mt-1">可觸達（LINE）</p>
                      </div>
                    </div>
                    {audience.customers?.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>姓名</TableHead>
                            <TableHead>電話</TableHead>
                            <TableHead>LINE</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {audience.customers.slice(0, 10).map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell>{c.name}</TableCell>
                              <TableCell>{c.phone || '-'}</TableCell>
                              <TableCell>
                                {c.line_user_id ? (
                                  <Badge variant="default" className="text-xs">已綁定</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">未綁定</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {audience.count > 10 && (
                      <p className="text-sm text-muted-foreground text-center">顯示前 10 筆，共 {audience.count} 人</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Select template */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">步驟 3：選擇行銷模板</h3>
                {!templates?.length ? (
                  <p className="text-center py-8 text-muted-foreground">尚未建立任何模板，請先前往「行銷模板管理」建立模板</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((tpl: any) => (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`text-left p-4 rounded-lg border transition-all ${
                          selectedTemplateId === tpl.id
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tpl.template_name}</span>
                          <Badge variant="outline">{tpl.message_type}</Badge>
                        </div>
                        {tpl.category && <p className="text-xs text-muted-foreground mt-1">{tpl.category}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Compliance check */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">步驟 4：醫療法規合規檢查</h3>
                <p className="text-muted-foreground text-sm">系統將自動掃描模板內容，檢查是否包含違反醫療廣告法規的用語</p>
                <ComplianceChecker content={getContentText()} readOnly showInput={false} />
              </div>
            )}

            {/* Step 5: Confirm & send */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">步驟 5：確認發送</h3>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">目標標籤</span>
                    <span>{selectedTagIds.length} 個</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">目標受眾</span>
                    <span>{audience?.count || 0} 人（LINE 可觸達 {audience?.lineReachable || 0} 人）</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">使用模板</span>
                    <span>{selectedTemplate?.template_name || '-'}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleExecute}
                  disabled={executeMutation.isPending}
                >
                  {executeMutation.isPending ? (
                    <>發送中...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />確認發送</>
                  )}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((currentStep - 1) as Step)}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />上一步
              </Button>
              {currentStep < 5 && (
                <Button
                  onClick={() => setCurrentStep((currentStep + 1) as Step)}
                  disabled={!canProceed()}
                >
                  下一步<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution result */}
      {executionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {executionResult.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : executionResult.status === 'partial' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              發送結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{executionResult.targetCount}</p>
                <p className="text-sm text-muted-foreground">目標人數</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{executionResult.sentCount}</p>
                <p className="text-sm text-muted-foreground">成功發送</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{executionResult.failedCount}</p>
                <p className="text-sm text-muted-foreground">發送失敗</p>
              </div>
            </div>
            {executionResult.errors?.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">錯誤詳情：</p>
                {executionResult.errors.map((err: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution history */}
      <Card>
        <CardHeader>
          <CardTitle>近期執行記錄</CardTitle>
          <CardDescription>最近 10 筆行銷活動執行記錄</CardDescription>
        </CardHeader>
        <CardContent>
          {!executionHistory?.executions?.length ? (
            <p className="text-center py-8 text-muted-foreground">尚無執行記錄</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>執行時間</TableHead>
                  <TableHead>目標人數</TableHead>
                  <TableHead>成功發送</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionHistory.executions.map((exec: any) => (
                  <TableRow key={exec.id}>
                    <TableCell>{exec.executed_at ? new Date(exec.executed_at).toLocaleString('zh-TW') : '-'}</TableCell>
                    <TableCell>{exec.target_count}</TableCell>
                    <TableCell>{exec.sent_count}</TableCell>
                    <TableCell>
                      <Badge variant={
                        exec.status === 'completed' ? 'default' :
                        exec.status === 'partial' ? 'secondary' :
                        exec.status === 'processing' ? 'outline' : 'destructive'
                      }>
                        {exec.status === 'completed' ? '已完成' :
                         exec.status === 'partial' ? '部分成功' :
                         exec.status === 'processing' ? '處理中' : '失敗'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
