/**
 * ComplianceChecker.tsx
 * 即時合規檢查元件 — 輸入文字即時標記違規詞，紅/黃高亮
 */
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ComplianceCheckerProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  showInput?: boolean;
}

interface Violation {
  keyword: string;
  severity: 'warning' | 'blocked';
  positions: { start: number; end: number }[];
  regulationReference: string | null;
  description: string | null;
}

interface CheckResult {
  isCompliant: boolean;
  hasWarnings: boolean;
  hasBlocked: boolean;
  violations: Violation[];
  summary: string;
}

export default function ComplianceChecker({ content, onChange, readOnly = false, showInput = true }: ComplianceCheckerProps) {
  const [localContent, setLocalContent] = useState(content);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const checkMutation = trpc.compliance.checkContent.useMutation({
    onSuccess: (data) => setCheckResult(data),
  });

  // Debounced check
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  useEffect(() => {
    if (!localContent.trim()) {
      setCheckResult(null);
      return;
    }
    const timer = setTimeout(() => {
      checkMutation.mutate({ content: localContent });
    }, 500);
    return () => clearTimeout(timer);
  }, [localContent]);

  const handleChange = useCallback((value: string) => {
    setLocalContent(value);
    onChange?.(value);
  }, [onChange]);

  // Render highlighted text
  const renderHighlightedText = () => {
    if (!checkResult?.violations?.length || !localContent) {
      return <span>{localContent}</span>;
    }

    // Collect all positions with their severity
    const marks: { start: number; end: number; severity: 'warning' | 'blocked'; keyword: string }[] = [];
    checkResult.violations.forEach(v => {
      v.positions.forEach(p => {
        marks.push({ ...p, severity: v.severity, keyword: v.keyword });
      });
    });

    // Sort by start position
    marks.sort((a, b) => a.start - b.start);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    marks.forEach((mark, i) => {
      if (mark.start > lastIndex) {
        elements.push(<span key={`t-${i}`}>{localContent.slice(lastIndex, mark.start)}</span>);
      }
      if (mark.start >= lastIndex) {
        elements.push(
          <span
            key={`m-${i}`}
            className={`px-0.5 rounded font-medium ${
              mark.severity === 'blocked'
                ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}
            title={`${mark.severity === 'blocked' ? '禁止' : '警告'}：${mark.keyword}`}
          >
            {localContent.slice(mark.start, mark.end)}
          </span>
        );
        lastIndex = mark.end;
      }
    });

    if (lastIndex < localContent.length) {
      elements.push(<span key="tail">{localContent.slice(lastIndex)}</span>);
    }

    return elements;
  };

  return (
    <div className="space-y-3">
      {showInput && (
        <Textarea
          value={localContent}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="輸入推播內容以進行合規檢查..."
          rows={4}
          readOnly={readOnly}
        />
      )}

      {/* Highlighted preview */}
      {localContent && checkResult?.violations?.length ? (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">內容預覽（違規詞高亮）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {renderHighlightedText()}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Check result */}
      {checkResult && (
        <div className={`flex items-start gap-3 p-3 rounded-lg border ${
          checkResult.hasBlocked
            ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            : checkResult.hasWarnings
              ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
              : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
        }`}>
          {checkResult.hasBlocked ? (
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          ) : checkResult.hasWarnings ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-2">
            <p className={`text-sm font-medium ${
              checkResult.hasBlocked ? 'text-red-800 dark:text-red-200'
                : checkResult.hasWarnings ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-green-800 dark:text-green-200'
            }`}>
              {checkResult.summary}
            </p>
            {checkResult.violations.length > 0 && (
              <div className="space-y-1">
                {checkResult.violations.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant={v.severity === 'blocked' ? 'destructive' : 'secondary'} className="text-xs">
                      {v.severity === 'blocked' ? '禁止' : '警告'}
                    </Badge>
                    <span className="font-medium">「{v.keyword}」</span>
                    {v.regulationReference && (
                      <span className="text-muted-foreground text-xs">({v.regulationReference})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
