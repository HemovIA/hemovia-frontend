import type { Allocation, Order, Page, RouteInfo, Transport } from "./domain";
import type { Client } from "./ui";
export type StoredRoute = { distanceKm: number; estimatedDurationSeconds: number; coordinates: number[][] };
export type RequestDetail = { request: Order; allocations: { id: string; status: string; createdAt: string; bags: {id:string; status:string}[]; route: StoredRoute | null; transportId: string | null }[] };
export type TransportDetail = { transport: Transport; route: StoredRoute | null; bloodBagIds: string[] };
export function adaptRoute(route: StoredRoute | null): RouteInfo | undefined {
  return route ? { distanceKm: route.distanceKm, estimatedDurationSeconds: route.estimatedDurationSeconds, geometry: { coordinates: route.coordinates } } : undefined;
}
export function latestAllocation(detail: RequestDetail) {
  const sorted = [...detail.allocations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return sorted.find((item) => item.status !== "CANCELLED") || sorted[0];
}
export function adaptRequest(detail: RequestDetail, transport?: Transport): Order {
  const allocation = latestAllocation(detail);
  const route = allocation && adaptRoute(allocation.route);
  return { ...detail.request, allocation: allocation && route ? { id: allocation.id, requestId: detail.request.id, status: allocation.status as Allocation["status"], bloodBagIds: allocation.bags.map((bag) => bag.id), route } : undefined, transport };
}
export async function allPages<T>(call: Client, path: string): Promise<T[]> {
  const result: T[] = [];
  for (let page = 0; ; page++) {
    const data = await call<Page<T>>(`${path}?page=${page}&size=100`);
    result.push(...data.content);
    if (page + 1 >= data.totalPages) return result;
  }
}
