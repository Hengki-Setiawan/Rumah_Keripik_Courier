import { getToken } from './storage';

type MessageHandler = (data: unknown) => void;

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'wss://rumah-keripik.vercel.app/api/courier/ws';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const handlers = new Map<string, Set<MessageHandler>>();
let intentionalClose = false;

function getReconnectDelay(): number {
  const base = 1000;
  const maxDelay = 30000;
  const exponential = Math.min(base * Math.pow(2, reconnectAttempts), maxDelay);
  const jitter = exponential * 0.1 * Math.random();
  return Math.floor(exponential + jitter);
}

export function connect() {
  if (ws?.readyState === WebSocket.OPEN) return;
  intentionalClose = false;

  ws = new WebSocket(WS_URL);

  ws.onopen = async () => {
    reconnectAttempts = 0;
    const token = await getToken();
    if (token) {
      ws?.send(JSON.stringify({ type: 'auth', payload: { token } }));
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const hs = handlers.get(msg.type);
      if (hs) hs.forEach((h) => h(msg.payload));
    } catch { /* ignore parse errors */ }
  };

  ws.onclose = () => {
    ws = null;
    if (!intentionalClose) scheduleReconnect();
  };

  ws.onerror = () => {
    ws?.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay = getReconnectDelay();
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => connect(), delay);
}

export function disconnect() {
  intentionalClose = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  ws?.close();
  ws = null;
  reconnectAttempts = 0;
}

export function on(type: string, handler: MessageHandler) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type)!.add(handler);
  return () => handlers.get(type)?.delete(handler);
}

export function send(type: string, payload: unknown) {
  if (ws?.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
}

export function isConnected() {
  return ws?.readyState === WebSocket.OPEN;
}
