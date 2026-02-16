# API 對照表

## 需要實作的 9 個前端頁面

### 1. AftercareManagement.tsx ✅ (已存在，需修正)
- trpc.aftercare.list.useQuery({ tenantId, page?, pageSize? }) → { items, total, page, pageSize }
- trpc.aftercare.getById.useQuery({ id, tenantId }) → record
- trpc.aftercare.create.useMutation({ tenantId, data: Record<string,any> }) → record
- trpc.aftercare.update.useMutation({ id, tenantId, data: Record<string,any> }) → record
- trpc.aftercare.delete.useMutation({ id, tenantId }) → { success }
- **注意**: protectedProcedure，需要登入

### 2. WeightTrackingManagement.tsx ✅ (已存在，需修正)
- trpc.weightTracking.list.useQuery({ tenantId, page?, pageSize? }) → { items, total, page, pageSize }
- trpc.weightTracking.getById.useQuery({ id, tenantId }) → record
- trpc.weightTracking.create.useMutation({ tenantId, data: Record<string,any> }) → record
- trpc.weightTracking.update.useMutation({ id, tenantId, data: Record<string,any> }) → record
- trpc.weightTracking.delete.useMutation({ id, tenantId }) → { success }
- **注意**: protectedProcedure，需要登入

### 3. DoseCalculation.tsx ✅ (已存在，需修正)
- trpc.doseCalculation.calculate.useMutation({ tenantId, customerId, weight, productType, dosagePerKg? }) → { success, dosage, unit, weight, productType }
- trpc.doseCalculation.save.useMutation({ tenantId, customerId, weight, productType, dosage, notes? }) → { success }
- trpc.doseCalculation.getHistory.useQuery({ tenantId, customerId }) → records[]
- **注意**: publicProcedure

### 4. ApprovalQueue.tsx ❌ (需建立)
- trpc.approval.listPending.useQuery({ tenantId }) → approvals[]
- trpc.approval.approve.useMutation({ tenantId, approvalId, reviewedBy }) → { success }
- trpc.approval.reject.useMutation({ tenantId, approvalId, reviewedBy, reason }) → { success }
- **注意**: publicProcedure

### 5. RescheduleApproval.tsx ❌ (需建立)
- trpc.rescheduleApproval.listPending.useQuery({ tenantId }) → reschedules[]
- trpc.rescheduleApproval.approve.useMutation({ tenantId, rescheduleId, reviewedBy }) → { success }
- trpc.rescheduleApproval.reject.useMutation({ tenantId, rescheduleId, reviewedBy, reason }) → { success }
- **注意**: publicProcedure

### 6. SlotLimitsSettings.tsx ❌ (需建立)
- trpc.slotLimits.getByDate.useQuery({ tenantId, date }) → limits[]
- trpc.slotLimits.set.useMutation({ tenantId, date, time, maxCapacity }) → { success }
- trpc.slotLimits.delete.useMutation({ tenantId, date, time }) → { success }
- trpc.slotLimits.getBatchByDateRange.useQuery({ tenantId, startDate, endDate }) → limits[]
- **注意**: publicProcedure

### 7. MemberLevelManagement.tsx ❌ (需建立)
- trpc.memberLevel.list.useQuery({ tenantId, page?, pageSize? }) → { items, total, page, pageSize }
- trpc.memberLevel.getById.useQuery({ id, tenantId }) → record
- trpc.memberLevel.create.useMutation({ tenantId, data: Record<string,any> }) → record
- trpc.memberLevel.update.useMutation({ id, tenantId, data: Record<string,any> }) → record
- trpc.memberLevel.delete.useMutation({ id, tenantId }) → { success }
- **注意**: protectedProcedure

### 8. TimeSlotTemplateManagement.tsx ❌ (需建立)
- trpc.timeSlotTemplate.list.useQuery({ tenantId, page?, pageSize? }) → { items, total, page, pageSize }
- trpc.timeSlotTemplate.getById.useQuery({ id, tenantId }) → record
- trpc.timeSlotTemplate.create.useMutation({ tenantId, data: Record<string,any> }) → record
- trpc.timeSlotTemplate.update.useMutation({ id, tenantId, data: Record<string,any> }) → record
- trpc.timeSlotTemplate.delete.useMutation({ id, tenantId }) → { success }
- **注意**: protectedProcedure

### 9. AnalyticsDashboard.tsx ❌ (需建立)
- trpc.analytics.registrationTrend.useQuery({ tenantId, days? }) → [{ date, count }]
- trpc.analytics.sourceStatistics.useQuery({ tenantId }) → []
- trpc.analytics.revenueStats.useQuery({ tenantId, startDate?, endDate? }) → [{ date, totalRevenue, orderCount }]
- **注意**: publicProcedure
