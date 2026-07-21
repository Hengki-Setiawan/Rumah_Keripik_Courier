import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const COURIER_KEY = 'courier_data';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(COURIER_KEY);
}

export async function saveCourierData(courier: object) {
  await SecureStore.setItemAsync(COURIER_KEY, JSON.stringify(courier));
}

export async function getCourierData<T>(): Promise<T | null> {
  const data = await SecureStore.getItemAsync(COURIER_KEY);
  return data ? JSON.parse(data) : null;
}
