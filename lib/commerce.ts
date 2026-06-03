// Commerce(유통) 데이터 어댑터. 지금은 셀러 API 미연동 → 샘플(lib/seed.ts) 반환.
// 추후 스마트스토어/쿠팡/11번가/자사몰 셀러 API 또는 엑셀 업로드로 live 전환.
import type { CommerceOrder, ShippingInfo, InventoryItem, SalesDay, StockStatus } from "./types";
import { sampleOrders, sampleShipping, sampleInventory, sampleSales } from "./seed";

export function commerceConfigured(): boolean {
  return !!process.env.COMMERCE_API_KEY; // 셀러 API 연동 시 true (현재 false)
}

export async function listOrders(): Promise<CommerceOrder[]> {
  return sampleOrders;
}
export async function listShipping(): Promise<ShippingInfo[]> {
  return sampleShipping;
}
export async function listInventory(): Promise<InventoryItem[]> {
  return sampleInventory;
}
export async function listSales(): Promise<SalesDay[]> {
  return sampleSales;
}

/** 안전재고 대비 재고상태 (화면/알림에서 사용). */
export function stockStatus(it: InventoryItem): StockStatus {
  if (it.stock <= 0) return "품절";
  if (it.stock < it.safetyStock) return "부족";
  return "정상";
}
