import { storage } from './storage';
import { API_URL } from './config';
import { triggerSessionExpired } from './sessionStore';

export interface Batch {
  id: number;
  item_id: number;
  clinic_id: number;
  price: number;
  expiry_date: string | null;
  quantity: number;
  condition_status: string;
  created_at: string;
}

export interface Item {
  id: number;
  clinic_id: number;
  barcode: string | null;
  internal_id: string | null;
  name: string;
  manufacturer: string;
  category: string;
  condition_status: string;
  price: number;
  expiry_date: string | null;
  quantity: number;
  total_quantity_received: number;
  total_price: number;
  batches: Batch[];
}

export interface RestockRequest {
  id: number;
  clinic_id: number;
  item_id: number;
  item_name: string;
  category: string;
  requested_quantity: number;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'out_for_delivery' | 'delivered';
  admin_note: string | null;
  requested_at: string;
  approved_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  current_stock: number;
  unit_price: number;
}

export interface Notification {
  id: number;
  type: 'approved' | 'rejected' | 'shipped';
  message: string;
  restock_request_id: number | null;
  is_read: 0 | 1;
  created_at: string;
}

export interface Transaction {
  id: number;
  clinic_id: number;
  item_id: number;
  item_name: string;
  type: 'add' | 'use';
  quantity: number;
  unit_price: number;
  notes: string | null;
  created_at: string;
}

async function getToken(): Promise<string | null> {
  return storage.get<string>('auth_token');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch (_) {}
  if (res.status === 401) {
    triggerSessionExpired();
    throw new Error(data?.error || 'Unauthorized');
  }
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data as T;
}

export const api = {
  getInventory: () => request<{ items: Item[] }>('GET', '/inventory'),

  checkBarcode: (barcode: string) =>
    request<{ exists: boolean; items: Item[] }>('GET', `/inventory/check/${encodeURIComponent(barcode)}`),

  searchItems: (q: string) =>
    request<{ items: Item[] }>('GET', `/inventory/search?q=${encodeURIComponent(q)}`),

  getItemBatches: (itemId: number) =>
    request<{ batches: Batch[] }>('GET', `/inventory/${itemId}/batches`),

  addItem: (data: {
    name: string;
    manufacturer?: string;
    category: string;
    condition?: string;
    price: number;
    expiryDate?: string;
    quantity: number;
    barcode?: string;
  }) => request<{ item: Item }>('POST', '/items/manual', data),

  useItem: (itemId: number, quantity: number, notes?: string, batchId?: number) =>
    request<{ success: boolean; remaining: number }>('POST', '/inventory/use', { itemId, quantity, notes, batchId }),

  addStock: (
    itemId: number,
    quantity: number,
    options?: { notes?: string; price?: number; expiryDate?: string; batchId?: number; conditionStatus?: string }
  ) =>
    request<{ success: boolean; newQuantity: number }>('POST', '/inventory/add-stock', {
      itemId,
      quantity,
      ...options,
    }),

  getTransactions: () =>
    request<{ transactions: Transaction[] }>('GET', '/inventory/transactions'),

  createRestockRequest: (data: { itemId: number; requestedQuantity: number; notes?: string }) =>
    request<{ request: RestockRequest }>('POST', '/restock/request', data),

  getRestockRequests: () => request<{ requests: RestockRequest[] }>('GET', '/restock/status'),

  getNotifications: () =>
    request<{ notifications: Notification[] }>('GET', '/notifications'),

  markNotificationsRead: () =>
    request<{ ok: boolean }>('PUT', '/notifications/read'),

  deleteNotification: (id: number) =>
    request<{ ok: boolean }>('DELETE', `/notifications/${id}`),

  clearAllNotifications: () =>
    request<{ ok: boolean }>('DELETE', '/notifications'),

  confirmDelivery: (data: {
    requestId: number;
    price: number;
    expiryDate?: string;
    conditionStatus?: string;
    restockDate?: string;
  }) => request<{ request: RestockRequest }>('POST', '/restock/confirm-delivery', data),
};
