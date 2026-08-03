import { getToken, removeToken } from './storage';
import type { CourierDeliveryDto, Waypoint, CourierDto, CompleteData, FailData } from './types';
import { enqueueRequest, processQueue } from './offline-queue';
import { logError, logWarn } from './logger';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rumah-keripik.vercel.app';

async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let token: string | null = null;
  if (requireAuth) {
    token = await getToken();
    if (!token) {
      throw new Error('NO_TOKEN');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    logWarn(`[API] ${options.method || 'GET'} ${path} network failed — offline queue used`);
    await processQueue();
    const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    await enqueueRequest(path, options.method || 'GET', parsedBody, token);
    throw new Error('NETWORK_ERROR');
  }

  if (res.status === 401) {
    logWarn(`[API] ${options.method || 'GET'} ${path} -> 401 UNAUTHORIZED`);
    await removeToken();
    throw new Error('UNAUTHORIZED');
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    logError(`[API] ${options.method || 'GET'} ${path} -> ${res.status} invalid JSON response`);
    throw new Error('NETWORK_ERROR');
  }

  if (!data.ok) {
    logError(`[API] ${options.method || 'GET'} ${path} -> ${res.status} ${String(data.error || 'Request failed')}`);
    throw new Error(String(data.error || 'Request failed'));
  }

  return data as T;
}

export async function login(pin: string) {
  return request<{ token?: string; accessToken?: string; refreshToken?: string; courier: CourierDto }>(
    '/api/courier/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ pin }),
    },
    false
  );
}

export async function getProfile() {
  return request<{ courier: CourierDto }>('/api/courier/auth/me');
}

export async function getTodayDeliveries() {
  return request<{ deliveries: CourierDeliveryDto[] }>(
    '/api/courier/deliveries/today'
  );
}

export async function startDelivery(deliveryId: number) {
  return request<{ ok: boolean }>(
    `/api/courier/deliveries/${deliveryId}/start`,
    { method: 'POST', body: JSON.stringify({ delivery_id: deliveryId }) }
  );
}

export async function completeDelivery(deliveryId: number, data: CompleteData) {
  return request<{ ok: boolean }>(
    `/api/courier/deliveries/${deliveryId}/complete`,
    { method: 'POST', body: JSON.stringify({ delivery_id: deliveryId, ...data }) }
  );
}

export async function failDelivery(deliveryId: number, data: FailData) {
  return request<{ ok: boolean }>(
    `/api/courier/deliveries/${deliveryId}/fail`,
    { method: 'POST', body: JSON.stringify({ delivery_id: deliveryId, ...data }) }
  );
}

export async function sendLocationBatch(locations: Array<{ lat: number; lng: number; accuracy?: number; speed?: number; timestamp: number }>) {
  return request<{ ok: boolean }>(
    '/api/courier/location/batch',
    { method: 'POST', body: JSON.stringify({ locations }) }
  );
}

export async function getTodayRoute() {
  return request<{ waypoints: Waypoint[]; total_deliveries: number }>(
    '/api/courier/route/today'
  );
}

export async function respondToOffer(assignmentId: number, action: 'accept' | 'reject') {
  return request<{ ok: boolean; action: string }>(
    '/api/courier/offers/respond',
    { method: 'POST', body: JSON.stringify({ assignmentId, action }) }
  );
}

export async function bindDevice(deviceId: string) {
  return request<{ ok: boolean; deviceBound: boolean }>(
    '/api/courier/device',
    { method: 'POST', body: JSON.stringify({ action: 'bind', deviceId }) }
  );
}

export async function unboundDevice() {
  return request<{ ok: boolean; deviceUnbound: boolean }>(
    '/api/courier/device',
    { method: 'POST', body: JSON.stringify({ action: 'unbind' }) }
  );
}

export async function verifyDeviceBinding(deviceId: string) {
  return request<{ ok: boolean; bound: boolean }>(
    '/api/courier/device',
    { method: 'POST', body: JSON.stringify({ action: 'verify', deviceId }) }
  );
}

export async function clockInCourier(lat?: number, lng?: number) {
  return request<{ ok: boolean; data: { shiftId: number; clockInAt: string } }>(
    '/api/courier/shift/clock-in',
    { method: 'POST', body: JSON.stringify({ lat, lng }) }
  );
}

export async function clockOutCourier(lat?: number, lng?: number) {
  return request<{ ok: boolean; data: { shiftId: number; clockInAt: string; clockOutAt: string; totalDeliveries: number } }>(
    '/api/courier/shift/clock-out',
    { method: 'POST', body: JSON.stringify({ lat, lng }) }
  );
}

export async function getNotifications(limit?: number) {
  return request<{ ok: boolean; data: { notifications: Notification[]; unreadCount: number } }>(
    `/api/courier/notifications${limit ? `?limit=${limit}` : ''}`
  );
}

export async function markNotificationRead(notificationId?: number) {
  return request<{ ok: boolean }>(
    '/api/courier/notifications',
    { method: 'PATCH', body: JSON.stringify(notificationId ? { notificationId } : { markAllRead: true }) }
  );
}

export async function getStats(period?: string) {
  return request<{ ok: boolean; data: { totalAssigned: number; totalCompleted: number; totalFailed: number; onTimeRate: number; totalDistanceKm: number; incidentCount: number; score: number; rank: number; totalCouriers: number; completionRate: number } }>(
    `/api/courier/stats/me${period ? `?period=${period}` : ''}`
  );
}

export async function reportIncident(data: { type: string; severity?: string; description?: string; lat?: string; lng?: string; deliveryId?: number; photoUrl?: string }) {
  return request<{ ok: boolean }>(
    '/api/courier/incidents',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function getEarnings(period?: string) {
  return request<{
    ok: boolean;
    earnings: Array<{ baseFee: number; bonusAmount: number; status: string; createdAt: string; orderId: string }>;
    summary: { totalConfirmed: number; pendingTotal: number; deliveryCount: number; period: string };
  }>(`/api/courier/earnings${period ? `?period=${period}` : ''}`);
}

export async function getDeliveryHistory(limit = 50, offset = 0, status?: string) {
  return request<{
    ok: boolean;
    deliveries: CourierDeliveryDto[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }>(`/api/courier/deliveries/history?limit=${limit}&offset=${offset}${status ? `&status=${status}` : ''}`);
}

export async function registerPushToken(expoPushToken: string, platform?: string) {
  return request<{ ok: boolean }>(
    '/api/courier/push-tokens',
    { method: 'POST', body: JSON.stringify({ expoPushToken, platform }) }
  );
}
