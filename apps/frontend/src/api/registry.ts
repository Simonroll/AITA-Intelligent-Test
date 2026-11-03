export interface RuntimeConfig {
  service_name: string;
  backend_url: string;
  status: 'ONLINE' | 'OFFLINE' | 'RECONNECTING';
  last_seen: string;
  updated_at?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SERVICE_NAME = 'aita-backend';

const CACHE_KEY = 'aita_runtime_config';
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

let memoryConfig: { data: RuntimeConfig; expiresAt: number } | null = null;
const statusListeners = new Set<(status: RuntimeConfig['status'], config: RuntimeConfig | null) => void>();

export function subscribeBackendStatus(listener: (status: RuntimeConfig['status'], config: RuntimeConfig | null) => void) {
  statusListeners.add(listener);
  if (memoryConfig?.data) {
    listener(memoryConfig.data.status, memoryConfig.data);
  }
  return () => { statusListeners.delete(listener); };
}

function notifyListeners(config: RuntimeConfig) {
  for (const listener of statusListeners) {
    try {
      listener(config.status, config);
    } catch {}
  }
}

export function invalidateConfigCache() {
  memoryConfig = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export async function fetchRuntimeConfig(force = false): Promise<RuntimeConfig> {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // In local dev, default to local proxy if no Supabase configured or local dev preferred
  if (isLocalhost && !import.meta.env.VITE_USE_REMOTE_BACKEND) {
    const localConfig: RuntimeConfig = {
      service_name: SERVICE_NAME,
      backend_url: window.location.origin, // calls '/api' on same origin via Vite proxy
      status: 'ONLINE',
      last_seen: new Date().toISOString(),
    };
    notifyListeners(localConfig);
    return localConfig;
  }

  const now = Date.now();
  if (!force && memoryConfig && memoryConfig.expiresAt > now) {
    return memoryConfig.data;
  }

  // Check sessionStorage
  if (!force) {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.expiresAt > now) {
          memoryConfig = parsed;
          notifyListeners(parsed.data);
          return parsed.data;
        }
      }
    } catch {}
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/runtime_config?service_name=eq.${encodeURIComponent(SERVICE_NAME)}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch runtime config: ${res.status}`);
    }

    const list = await res.json();
    const item = Array.isArray(list) ? list[0] : list;
    if (!item || !item.backend_url) {
      throw new Error('No valid backend configuration found in registry');
    }

    // Check if heartbeat is stale (> 2.5 minutes) while marked ONLINE
    const lastSeenTime = new Date(item.last_seen).getTime();
    let computedStatus: RuntimeConfig['status'] = item.status || 'OFFLINE';
    if (computedStatus === 'ONLINE' && (now - lastSeenTime > 150000)) {
      computedStatus = 'RECONNECTING';
    }

    const config: RuntimeConfig = {
      service_name: item.service_name,
      backend_url: item.backend_url.replace(/\/+$/, ''), // remove trailing slash
      status: computedStatus,
      last_seen: item.last_seen,
      updated_at: item.updated_at,
    };

    memoryConfig = { data: config, expiresAt: now + CACHE_TTL_MS };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(memoryConfig));
    } catch {}

    notifyListeners(config);
    return config;
  } catch (err: any) {
    console.warn('[RuntimeRegistry] Could not resolve dynamic backend URL, falling back to /api:', err.message);
    const fallback: RuntimeConfig = {
      service_name: SERVICE_NAME,
      backend_url: '',
      status: 'OFFLINE',
      last_seen: new Date().toISOString(),
    };
    notifyListeners(fallback);
    return fallback;
  }
}

export async function getBackendApiBaseUrl(): Promise<string> {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost && !import.meta.env.VITE_USE_REMOTE_BACKEND) {
    return '/api';
  }
  const config = await fetchRuntimeConfig();
  if (config.backend_url) {
    return `${config.backend_url}/api`;
  }
  return '/api';
}
