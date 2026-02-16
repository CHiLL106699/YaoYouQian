#!/bin/bash

# 建立簡化版的前端頁面（先建立基本架構，後續可擴充）

# ShopOrders
cat > ShopOrders.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function ShopOrders() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.shop.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">商城訂單</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>訂單編號</TableHead>
              <TableHead>客戶</TableHead>
              <TableHead>金額</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>{order.customer_id}</TableCell>
                <TableCell>NT$ {order.total_amount}</TableCell>
                <TableCell>{order.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# AftercareRecords
cat > AftercareRecords.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function AftercareRecords() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.aftercare.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">術後照護記錄</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客戶</TableHead>
              <TableHead>照護日期</TableHead>
              <TableHead>照護類型</TableHead>
              <TableHead>需追蹤</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((record: any) => (
              <TableRow key={record.id}>
                <TableCell>{record.customer_id}</TableCell>
                <TableCell>{new Date(record.care_date).toLocaleDateString()}</TableCell>
                <TableCell>{record.care_type}</TableCell>
                <TableCell>{record.follow_up_required ? '是' : '否'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# MemberLevels
cat > MemberLevels.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function MemberLevels() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.memberLevel.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">會員等級管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>等級名稱</TableHead>
              <TableHead>最低積分</TableHead>
              <TableHead>折扣比例</TableHead>
              <TableHead>權益</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((level: any) => (
              <TableRow key={level.id}>
                <TableCell>{level.level_name}</TableCell>
                <TableCell>{level.min_points}</TableCell>
                <TableCell>{level.discount_percentage}%</TableCell>
                <TableCell>{level.benefits || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# CouponManagement
cat > CouponManagement.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function CouponManagement() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.coupon.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">優惠券管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>優惠券代碼</TableHead>
              <TableHead>折扣類型</TableHead>
              <TableHead>折扣值</TableHead>
              <TableHead>有效期限</TableHead>
              <TableHead>使用次數</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((coupon: any) => (
              <TableRow key={coupon.id}>
                <TableCell>{coupon.code}</TableCell>
                <TableCell>{coupon.discount_type}</TableCell>
                <TableCell>{coupon.discount_value}</TableCell>
                <TableCell>{new Date(coupon.valid_until).toLocaleDateString()}</TableCell>
                <TableCell>{coupon.usage_count} / {coupon.usage_limit || '∞'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# ReferralProgram
cat > ReferralProgram.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function ReferralProgram() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.referral.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">推薦獎勵計畫</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>推薦人</TableHead>
              <TableHead>被推薦人</TableHead>
              <TableHead>獎勵積分</TableHead>
              <TableHead>獎勵金額</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((referral: any) => (
              <TableRow key={referral.id}>
                <TableCell>{referral.referrer_id}</TableCell>
                <TableCell>{referral.referred_id}</TableCell>
                <TableCell>{referral.reward_points}</TableCell>
                <TableCell>NT$ {referral.reward_amount || 0}</TableCell>
                <TableCell>{referral.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# MemberPromotions
cat > MemberPromotions.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function MemberPromotions() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.memberPromo.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">會員促銷活動</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>活動標題</TableHead>
              <TableHead>促銷類型</TableHead>
              <TableHead>折扣值</TableHead>
              <TableHead>有效期限</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((promo: any) => (
              <TableRow key={promo.id}>
                <TableCell>{promo.title}</TableCell>
                <TableCell>{promo.promo_type}</TableCell>
                <TableCell>{promo.discount_value}</TableCell>
                <TableCell>{new Date(promo.valid_until).toLocaleDateString()}</TableCell>
                <TableCell>{promo.is_active ? '啟用' : '停用'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# PaymentMethods
cat > PaymentMethods.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function PaymentMethods() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.paymentMethod.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">付款方式管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>付款方式名稱</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((method: any) => (
              <TableRow key={method.id}>
                <TableCell>{method.method_name}</TableCell>
                <TableCell>{method.method_type}</TableCell>
                <TableCell>{method.is_active ? '啟用' : '停用'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# CustomerTags
cat > CustomerTags.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function CustomerTags() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.customerTag.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">客戶標籤管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客戶 ID</TableHead>
              <TableHead>標籤名稱</TableHead>
              <TableHead>建立日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((tag: any) => (
              <TableRow key={tag.id}>
                <TableCell>{tag.customer_id}</TableCell>
                <TableCell>{tag.tag_name}</TableCell>
                <TableCell>{new Date(tag.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# ErrorLogs
cat > ErrorLogs.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function ErrorLogs() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.errorLog.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">系統錯誤日誌</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>錯誤類型</TableHead>
              <TableHead>錯誤訊息</TableHead>
              <TableHead>發生時間</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell>{log.error_type}</TableCell>
                <TableCell className="max-w-md truncate">{log.error_message}</TableCell>
                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

# TimeSlotTemplates
cat > TimeSlotTemplates.tsx << 'EOF'
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function TimeSlotTemplates() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.timeSlotTemplate.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">時段模板管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模板名稱</TableHead>
              <TableHead>時段數量</TableHead>
              <TableHead>建立日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((template: any) => (
              <TableRow key={template.id}>
                <TableCell>{template.template_name || '未命名'}</TableCell>
                <TableCell>{template.slot_count || 0}</TableCell>
                <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
EOF

echo "✅ 已建立 10 個前端頁面"
