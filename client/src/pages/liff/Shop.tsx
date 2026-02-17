/**
 * LIFF 線上商城 — 商品分類、列表、詳情、購物車、結帳
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, ShoppingCart, Plus, Minus, ArrowLeft, Package, Trash2 } from 'lucide-react';

interface CartItem { productId: number; name: string; price: number; quantity: number; imageUrl: string | null; }

function ShopContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [view, setView] = useState<'list' | 'detail' | 'cart' | 'done'>('list');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');

  const productsQuery = trpc.line.liffShop.getProducts.useQuery({ tenantId, limit: 50 });
  const productDetailQuery = trpc.line.liffShop.getProduct.useQuery(
    { id: selectedProductId || 0, tenantId },
    { enabled: !!selectedProductId && view === 'detail' }
  );
  const createOrderMutation = trpc.line.liffShop.createOrder.useMutation();

  const addToCart = (product: { id: number; name: string; price: string; imageUrl: string | null }) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: Number(product.price), quantity: 1, imageUrl: product.imageUrl }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = async () => {
    try {
      await createOrderMutation.mutateAsync({
        tenantId, lineUserId: profile.userId,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: shippingAddress || undefined,
      });
      setCart([]);
      setView('done');
    } catch (e: unknown) {
      alert(`下單失敗: ${(e as Error).message}`);
    }
  };

  if (view === 'done') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Package className="h-16 w-16 text-[#06C755] mb-4" />
        <h2 className="text-xl font-bold mb-2">訂單已送出！</h2>
        <p className="text-gray-500 text-sm text-center">我們將透過 LINE 通知您訂單狀態</p>
        <Button className="mt-6 bg-[#06C755] hover:bg-[#05a847] text-white" onClick={() => setView('list')}>繼續購物</Button>
      </div>
    );
  }

  if (view === 'cart') {
    return (
      <div className="p-4 pb-24">
        <button onClick={() => setView('list')} className="flex items-center text-sm text-gray-500 mb-3"><ArrowLeft className="h-4 w-4 mr-1" /> 繼續購物</button>
        <h2 className="text-lg font-bold mb-4">購物車</h2>
        {cart.length === 0 ? (
          <p className="text-center text-gray-400 py-8">購物車是空的</p>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <Card key={item.productId}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover rounded-lg" /> : <Package className="h-6 w-6 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-[#06C755] font-bold">NT${item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="mt-4 space-y-3">
              <Input placeholder="配送地址（選填）" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>合計</span><span className="text-[#06C755]">NT${totalAmount}</span>
              </div>
              <Button className="w-full h-12 bg-[#06C755] hover:bg-[#05a847] text-white text-base font-bold"
                disabled={createOrderMutation.isPending} onClick={handleCheckout}>
                {createOrderMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : '確認結帳'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedProductId) {
    const product = productDetailQuery.data;
    return (
      <div className="p-4 pb-24">
        <button onClick={() => setView('list')} className="flex items-center text-sm text-gray-500 mb-3"><ArrowLeft className="h-4 w-4 mr-1" /> 返回</button>
        {productDetailQuery.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
        ) : product ? (
          <div className="space-y-4">
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package className="h-16 w-16 text-gray-300" />}
            </div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-2xl font-bold text-[#06C755]">NT${product.price}</p>
            {product.description && <p className="text-sm text-gray-500">{product.description}</p>}
            <p className="text-xs text-gray-400">庫存: {product.stock}</p>
            <Button className="w-full h-12 bg-[#06C755] hover:bg-[#05a847] text-white text-base font-bold"
              disabled={product.stock <= 0}
              onClick={() => { addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl }); setView('list'); }}>
              {product.stock <= 0 ? '已售完' : '加入購物車'}
            </Button>
          </div>
        ) : <p className="text-center text-gray-400 py-8">商品不存在</p>}
      </div>
    );
  }

  // Product List
  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">商品列表</h2>
        <Button variant="outline" size="sm" className="relative" onClick={() => setView('cart')}>
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 && <Badge className="absolute -top-2 -right-2 bg-[#06C755] text-white text-[10px] h-5 w-5 flex items-center justify-center p-0">{totalItems}</Badge>}
        </Button>
      </div>
      {productsQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(productsQuery.data?.products || []).map(p => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedProductId(p.id); setView('detail'); }}>
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="h-8 w-8 text-gray-300" />}
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-bold text-[#06C755]">NT${p.price}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); addToCart({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl }); }}>
                      <Plus className="h-4 w-4 text-[#06C755]" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(productsQuery.data?.products || []).length === 0 && <p className="col-span-2 text-center text-gray-400 py-8">暫無商品</p>}
        </div>
      )}
    </div>
  );
}

export default function LiffShop() {
  return <LiffLayout title="線上商城">{(props) => <ShopContent {...props} />}</LiffLayout>;
}
