/**
 * LIFF 線上商城頁面
 * 商品瀏覽、加入購物車、結帳
 */
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Minus, Package, Loader2, Search, Trash2 } from "lucide-react";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

// Mock products for now
const MOCK_PRODUCTS = [
  { id: 1, name: "玻尿酸精華液", description: "高濃度保濕精華", price: "1280", stock: 50, category: "保養品", imageUrl: null },
  { id: 2, name: "膠原蛋白面膜", description: "深層修護面膜 5入", price: "890", stock: 100, category: "保養品", imageUrl: null },
  { id: 3, name: "美白導入安瓶", description: "專業級美白安瓶", price: "2480", stock: 30, category: "療程加購", imageUrl: null },
  { id: 4, name: "術後修護霜", description: "醫美術後專用修護", price: "1680", stock: 45, category: "術後護理", imageUrl: null },
];

export default function LiffShop() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");

  const products = MOCK_PRODUCTS;
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: typeof MOCK_PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: Number(product.price), quantity: 1, imageUrl: product.imageUrl }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4 text-amber-400">
        <Package className="h-12 w-12" />
        <p className="mt-4 text-lg font-semibold">無效的頁面連結</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a1628]/95 backdrop-blur-sm border-b border-amber-400/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-amber-400">線上商城</h1>
          <Button variant="outline" size="sm" className="relative border-amber-400/50 text-amber-400" onClick={() => setShowCart(true)}>
            <ShoppingCart className="h-4 w-4 mr-1" />
            購物車
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5">{totalItems}</Badge>
            )}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜尋商品..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white/10 border-amber-400/30 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="bg-white/5 border-amber-400/20 overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-amber-400/10 to-amber-600/10 flex items-center justify-center">
              <Package className="h-12 w-12 text-amber-400/40" />
            </div>
            <CardContent className="p-3">
              <p className="text-white font-medium text-sm truncate">{product.name}</p>
              <p className="text-gray-400 text-xs mt-1 line-clamp-1">{product.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-amber-400 font-bold">NT${product.price}</span>
                <Button size="sm" className="h-7 bg-amber-500 hover:bg-amber-600 text-black text-xs" onClick={() => addToCart(product)}>
                  <Plus className="h-3 w-3 mr-0.5" /> 加入
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="bg-[#0f1d35] border-amber-400/30 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">購物車</DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8">購物車是空的</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-amber-400 text-sm">NT${item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-amber-400/30" onClick={() => updateQuantity(item.productId, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-amber-400/30" onClick={() => updateQuantity(item.productId, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => removeFromCart(item.productId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="flex-col gap-2">
            <div className="flex justify-between w-full text-lg">
              <span>合計</span>
              <span className="text-amber-400 font-bold">NT${totalAmount.toLocaleString()}</span>
            </div>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold" disabled={cart.length === 0}>
              前往結帳
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
