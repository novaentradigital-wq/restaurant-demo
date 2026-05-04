// Socket.IO ve event tablosunda kullanılan olay tip sözleşmesi.
// Bunlar üretici/tüketici (NestJS API ↔ Next.js client) arasında paylaşılır.

export type SocketEventName =
  | "table.status_changed"
  | "call.created"
  | "call.acknowledged"
  | "call.resolved"
  | "order.created"
  | "order.updated"
  | "order.cancelled"
  | "order_item.status_changed"
  | "session.opened"
  | "session.closed";

export interface TableStatusChangedPayload {
  tableId: string;
  status:
    | "EMPTY"
    | "OCCUPIED"
    | "CALL_WAITER"
    | "BILL_REQUESTED"
    | "READY_TO_SERVE"
    | "RESERVED";
}

export interface CallCreatedPayload {
  callId: string;
  tableId: string;
  type: "WAITER" | "BILL" | "WATER" | "OTHER";
  paymentHint?: "CASH" | "CARD" | "TRANSFER" | "OTHER";
  createdAt: string;
}

export interface OrderItemStatusChangedPayload {
  orderItemId: string;
  orderId: string;
  station: "KITCHEN" | "BAR";
  status: "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
}

/** Bir tenant'ın bir restoranı için socket odası adı: tenant:<id>:restaurant:<id> */
export function restaurantRoom(tenantId: string, restaurantId: string): string {
  return `tenant:${tenantId}:restaurant:${restaurantId}`;
}

/** Bir masa için ayrı oda — yalnız o masa ile ilgili olaylar */
export function tableRoom(tenantId: string, tableId: string): string {
  return `tenant:${tenantId}:table:${tableId}`;
}
