import * as SecureStore from 'expo-secure-store';
import type { CourierDto } from './types';

const TOKEN_KEY = 'auth_token';
const COURIER_KEY = 'courier_data';

export async function saveToken(token: string) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token autentikasi tidak valid');
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(COURIER_KEY);
}

export async function saveCourierData(courier: CourierDto) {
  await SecureStore.setItemAsync(COURIER_KEY, JSON.stringify(courier));
}

export async function getCourierData<T>(): Promise<T | null> {
  const data = await SecureStore.getItemAsync(COURIER_KEY);
  return data ? JSON.parse(data) : null;
}
