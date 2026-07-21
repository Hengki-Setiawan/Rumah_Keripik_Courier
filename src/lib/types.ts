export interface CourierDto {
  id: number;
  name: string;
  phone: string;
  vehicle: string | null;
  plat_no: string | null;
  is_active: boolean;
}

export interface CourierDeliveryItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CourierDeliveryDto {
  id: number;
  id_transaksi: string;
  kode_pesanan: string;
  status: 'Siap_Dikirim' | 'Dalam_Pengiriman' | 'Terkirim' | 'Gagal';
  customer_name: string;
  customer_phone: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  distance_km: string | null;
  notes: string | null;
  route_order: number | null;
  items: CourierDeliveryItem[];
}

export interface Waypoint {
  lat: number;
  lng: number;
  name: string;
  type: 'start' | 'destination' | 'current';
  id_transaksi?: string;
}

export interface RouteResponse {
  ok: boolean;
  waypoints: Waypoint[];
  total_deliveries: number;
}

export interface LoginData {
  phone: string;
  pin: string;
}

export interface CompleteData {
  proof_photo_url?: string;
  signature_url?: string;
  notes?: string;
}

export interface FailData {
  reason: string;
  proof_photo_url?: string;
  notes?: string;
}
