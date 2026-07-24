import { getToken } from './storage';

type MessageHandler = (data: unknown) => void;

const WS_URL = 'wss://rumah-keripik.vercel.app/api/courier/ws';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const handlers = new Map<string, Set<MessageHandler>>();
let intentionalClose = false;

export function connect() {
  if (ws?.readyState === WebSocket.OPEN) return;
  intentionalClose = false;
  getToken().then((token) => {
    if (!token) return;
    ws = new WebSocket(`${WS_URL}?token=${token}`);
    ws.onopen = () => { console.log('[WS] Connected'); };
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
    ws.onerror = () => { ws?.close(); };
  });
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connect(), 5000);
}

export function disconnect() {
  intentionalClose = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  ws?.close();
  ws = null;
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
