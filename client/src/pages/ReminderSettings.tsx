/**
 * 預約提醒設定頁面
 * - 開關 24h / 2h 提醒
 * - 自訂提醒時間
 * - 預覽 Flex Message 卡片
 */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, Eye, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

/** Flex Message 預覽元件 */
function FlexMessagePreview({ reminderType, customerName, date, time }: {
  reminderType: "24h" | "2h" | "custom";
  customerName: string;
  date: string;
  time: string;
}) {
  const isUrgent = reminderType === "2h";
  const headerText = isUrgent ? "⏰ 預約即將開始" : "📅 預約提醒通知";
  const headerColor = isUrgent ? "bg-red-400" : "bg-teal-400";
  const subText = isUrgent
    ? "您的預約即將在 2 小時內開始，請準時到達！"
    : "溫馨提醒您明天有一個預約，請記得準時前往。";

  return (
    <div className="max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg border bg-card">
      <div className={`${headerColor} p-4`}>
        <p className="text-white font-bold text-lg">{headerText}</p>
        <p className="text-white/80 text-sm mt-1">曜友仟診所</p>
      </div>
      <div className="p-4 space-y-3">
        <p className="font-bold text-lg">{customerName} 您好</p>
        <p className="text-sm text-muted-foreground">{subText}</p>
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">日期</span>
            <span>{date || "2026-02-18"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">時間</span>
            <span>{time || "14:00"}</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className="text-xs text-muted-foreground text-center">
          如需取消或改期，請提前聯繫我們
        </p>
      </div>
    </div>
  );
}

export default function ReminderSettings() {
  const [enable24h, setEnable24h] = useState(true);
  const [enable2h, setEnable2h] = useState(true);
  const [customHours, setCustomHours] = useState("");
  const [previewType, setPreviewType] = useState<"24h" | "2h" | "custom">("24h");
  const [previewName, setPreviewName] = useState("王小明");
  const [previewDate, setPreviewDate] = useState("2026-02-18");
  const [previewTime, setPreviewTime] = useState("14:00");
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    toast.success("提醒設定已儲存");
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6" />
          預約提醒設定
        </h1>
        <p className="text-muted-foreground mt-1">
          設定自動發送 LINE 預約提醒的時機與內容
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 提醒開關設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              提醒時機
            </CardTitle>
            <CardDescription>設定自動提醒的觸發時間</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 24 小時提醒 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">24 小時前提醒</Label>
                <p className="text-sm text-muted-foreground">
                  預約前一天自動發送提醒
                </p>
              </div>
              <Switch checked={enable24h} onCheckedChange={setEnable24h} />
            </div>

            {/* 2 小時提醒 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">2 小時前提醒</Label>
                <p className="text-sm text-muted-foreground">
                  預約前 2 小時發送最後提醒
                </p>
              </div>
              <Switch checked={enable2h} onCheckedChange={setEnable2h} />
            </div>

            {/* 自訂時間 */}
            <div className="space-y-2">
              <Label className="text-base">自訂提醒時間（小時）</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="例如：48"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground self-center">小時前</span>
              </div>
              <p className="text-xs text-muted-foreground">
                留空表示不使用自訂提醒時間
              </p>
            </div>

            <Button onClick={handleSave} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              儲存設定
            </Button>
          </CardContent>
        </Card>

        {/* 提醒通道設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              通知通道
            </CardTitle>
            <CardDescription>設定提醒訊息的發送方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">LINE 訊息</p>
                  <p className="text-sm text-muted-foreground">透過 LINE Bot 發送 Flex Message</p>
                </div>
              </div>
              <Badge variant="default">啟用中</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border opacity-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">簡訊 (SMS)</p>
                  <p className="text-sm text-muted-foreground">透過簡訊發送提醒</p>
                </div>
              </div>
              <Badge variant="outline">即將推出</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border opacity-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Send className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">透過電子郵件發送提醒</p>
                </div>
              </div>
              <Badge variant="outline">即將推出</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flex Message 預覽 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Flex Message 預覽
          </CardTitle>
          <CardDescription>預覽客戶收到的 LINE 提醒訊息卡片</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 預覽參數 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>提醒類型</Label>
                <div className="flex gap-2">
                  <Button
                    variant={previewType === "24h" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewType("24h")}
                  >
                    24 小時前
                  </Button>
                  <Button
                    variant={previewType === "2h" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewType("2h")}
                  >
                    2 小時前
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>客戶姓名</Label>
                <Input value={previewName} onChange={(e) => setPreviewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>預約日期</Label>
                <Input type="date" value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>預約時間</Label>
                <Input type="time" value={previewTime} onChange={(e) => setPreviewTime(e.target.value)} />
              </div>
              <Button variant="outline" onClick={() => setShowPreview(true)} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                更新預覽
              </Button>
            </div>

            {/* 預覽卡片 */}
            <div className="flex items-center justify-center">
              <FlexMessagePreview
                reminderType={previewType}
                customerName={previewName}
                date={previewDate}
                time={previewTime}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
