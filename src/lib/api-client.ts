import { getToken, removeToken } from './storage';
import type { CourierDeliveryDto, Waypoint, CourierDto, CompleteData, FailData } from './types';
import { enqueueRequest, processQueue } from './offline-queue';

const BASE_URL = 'https://rumah-keripik.vercel.app';

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
  } catch {
    await processQueue();
    const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    await enqueueRequest(path, options.method || 'GET', parsedBody, token);
    throw new Error('NETWORK_ERROR');
  }

  if (res.status === 401) {
    await removeToken();
    throw new Error('UNAUTHORIZED');
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error('NETWORK_ERROR');
  }

  if (!data.ok) {
    throw new Error(String(data.error || 'Request failed'));
  }

  return data as T;
}

export async function login(phone: string, pin: string) {
  return request<{ token: string; courier: CourierDto }>(
    '/api/courier/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
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
