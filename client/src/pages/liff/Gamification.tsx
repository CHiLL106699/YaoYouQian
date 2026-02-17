/**
 * LIFF 遊戲化行銷頁面
 * 一番賞 (Ichiban Kuji) 抽獎 & 拉霸機 (Slot Machine)
 */
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, Gift, Loader2, Info, Trophy, Star, RotateCw } from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  type: "ichiban_kuji" | "slot_machine";
  status: string;
  description: string | null;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "春季美白大抽獎", type: "ichiban_kuji", status: "active", description: "消費滿 3000 即可抽獎一次！" },
  { id: 2, name: "幸運拉霸機", type: "slot_machine", status: "active", description: "每日一次免費拉霸機會！" },
];

const SLOT_SYMBOLS = ["🌸", "💎", "⭐", "🎁", "💰", "❤️"];
const PRIZE_RESULTS = [
  { name: "玻尿酸療程折價券 NT$500", isWin: true },
  { name: "免費膠原蛋白面膜乙盒", isWin: true },
  null, // No win
  { name: "美白導入療程 8 折券", isWin: true },
  null,
  null,
];

export default function LiffGamification() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{ isWin: boolean; prizeName: string | null } | null>(null);

  // Slot machine state
  const [slotReels, setSlotReels] = useState(["🌸", "🌸", "🌸"]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const spinIntervals = useRef<(NodeJS.Timeout | null)[]>([null, null, null]);

  const handleIchibanDraw = useCallback(() => {
    setIsPlaying(true);
    setResult(null);
    // Simulate draw animation
    setTimeout(() => {
      const prize = PRIZE_RESULTS[Math.floor(Math.random() * PRIZE_RESULTS.length)];
      setResult(prize ? { isWin: true, prizeName: prize.name } : { isWin: false, prizeName: null });
      setIsPlaying(false);
    }, 2000);
  }, []);

  const handleSlotSpin = useCallback(() => {
    setIsPlaying(true);
    setResult(null);
    setSpinning([true, true, true]);

    // Spin each reel
    for (let i = 0; i < 3; i++) {
      spinIntervals.current[i] = setInterval(() => {
        setSlotReels(prev => {
          const next = [...prev];
          next[i] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
          return next;
        });
      }, 100);
    }

    // Stop reels sequentially
    const finalSymbols = [
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    ];

    [800, 1400, 2000].forEach((delay, i) => {
      setTimeout(() => {
        if (spinIntervals.current[i]) clearInterval(spinIntervals.current[i]!);
        setSlotReels(prev => { const next = [...prev]; next[i] = finalSymbols[i]; return next; });
        setSpinning(prev => { const next = [...prev]; next[i] = false; return next; });

        if (i === 2) {
          const allSame = finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2];
          const twoSame = finalSymbols[0] === finalSymbols[1] || finalSymbols[1] === finalSymbols[2] || finalSymbols[0] === finalSymbols[2];
          if (allSame) {
            setResult({ isWin: true, prizeName: "大獎！療程折價券 NT$1000" });
          } else if (twoSame) {
            setResult({ isWin: true, prizeName: "小獎！保養品折價券 NT$200" });
          } else {
            setResult({ isWin: false, prizeName: null });
          }
          setIsPlaying(false);
        }
      }, delay);
    });
  }, []);

  useEffect(() => {
    return () => {
      spinIntervals.current.forEach(interval => { if (interval) clearInterval(interval); });
    };
  }, []);

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4 text-amber-400">
        <Info className="h-12 w-12" />
        <p className="mt-4 text-lg font-semibold">無效的頁面連結</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] to-[#2a1020] p-4">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-amber-400" />
        <h1 className="text-xl font-bold text-amber-400">幸運抽獎</h1>
      </div>

      {/* Campaign List */}
      {!selectedCampaign && (
        <div className="space-y-3">
          {MOCK_CAMPAIGNS.filter(c => c.status === "active").map(campaign => (
            <Card
              key={campaign.id}
              className="bg-gradient-to-r from-amber-900/30 to-red-900/30 border-amber-400/30 cursor-pointer hover:from-amber-900/50 hover:to-red-900/50 transition-all"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center flex-shrink-0">
                  {campaign.type === "ichiban_kuji" ? (
                    <Gift className="h-7 w-7 text-white" />
                  ) : (
                    <Star className="h-7 w-7 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold">{campaign.name}</h3>
                    <Badge className="bg-green-500/20 text-green-300 text-xs">進行中</Badge>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{campaign.description}</p>
                  <Badge className="mt-2 bg-amber-500/20 text-amber-300 text-xs">
                    {campaign.type === "ichiban_kuji" ? "一番賞" : "拉霸機"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ichiban Kuji Game */}
      {selectedCampaign?.type === "ichiban_kuji" && (
        <div className="flex flex-col items-center">
          <Button variant="ghost" className="self-start text-amber-400 mb-4" onClick={() => { setSelectedCampaign(null); setResult(null); }}>
            ← 返回
          </Button>
          <h2 className="text-2xl font-bold text-amber-400 mb-2">{selectedCampaign.name}</h2>
          <p className="text-gray-400 text-sm mb-8">{selectedCampaign.description}</p>

          <div className="relative w-48 h-48 mb-8">
            <div className={`w-full h-full rounded-2xl bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 transition-transform duration-300 ${isPlaying ? "animate-pulse scale-110" : "hover:scale-105"}`}>
              {isPlaying ? (
                <Loader2 className="h-16 w-16 text-white animate-spin" />
              ) : (
                <Gift className="h-16 w-16 text-white" />
              )}
            </div>
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-bold text-lg px-12 py-6 rounded-full shadow-lg"
            disabled={isPlaying}
            onClick={handleIchibanDraw}
          >
            {isPlaying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Gift className="h-5 w-5 mr-2" />}
            {isPlaying ? "抽獎中..." : "立即抽獎"}
          </Button>
        </div>
      )}

      {/* Slot Machine Game */}
      {selectedCampaign?.type === "slot_machine" && (
        <div className="flex flex-col items-center">
          <Button variant="ghost" className="self-start text-amber-400 mb-4" onClick={() => { setSelectedCampaign(null); setResult(null); }}>
            ← 返回
          </Button>
          <h2 className="text-2xl font-bold text-amber-400 mb-2">{selectedCampaign.name}</h2>
          <p className="text-gray-400 text-sm mb-8">{selectedCampaign.description}</p>

          {/* Slot Machine */}
          <div className="bg-gradient-to-b from-amber-900/50 to-red-900/50 rounded-2xl p-6 border-2 border-amber-400/50 shadow-2xl mb-8">
            <div className="flex gap-3">
              {slotReels.map((symbol, i) => (
                <div
                  key={i}
                  className={`w-20 h-24 bg-white/10 rounded-xl flex items-center justify-center text-4xl border-2 border-amber-400/30 ${spinning[i] ? "animate-bounce" : ""}`}
                >
                  {symbol}
                </div>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-bold text-lg px-12 py-6 rounded-full shadow-lg"
            disabled={isPlaying}
            onClick={handleSlotSpin}
          >
            {isPlaying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <RotateCw className="h-5 w-5 mr-2" />}
            {isPlaying ? "轉動中..." : "拉霸！"}
          </Button>
        </div>
      )}

      {/* Result Dialog */}
      <Dialog open={!!result} onOpenChange={() => setResult(null)}>
        <DialogContent className="bg-[#1a0a0a] border-amber-400/30 text-white max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className={result?.isWin ? "text-amber-400" : "text-gray-400"}>
              {result?.isWin ? "🎉 恭喜中獎！" : "😢 再接再厲"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {result?.isWin ? (
              <>
                <Trophy className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                <p className="text-lg font-bold text-amber-300">{result.prizeName}</p>
                <p className="text-sm text-gray-400 mt-2">獎品將自動加入您的票券中</p>
              </>
            ) : (
              <>
                <Gift className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">很可惜沒有中獎，下次再來！</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black" onClick={() => setResult(null)}>
              確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
