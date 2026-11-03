import { getBackendApiBaseUrl, invalidateConfigCache, fetchRuntimeConfig } from './registry';

export interface ApiResult<T = any> { success: boolean; data?: T; message?: string; details?: unknown }
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const apiBase = await getBackendApiBaseUrl();

    const headers = new Headers({ 'X-AITA-Request': '1', 'Content-Type': 'application/json' });
    const token = localStorage.getItem('aita_token');
    const refreshToken = localStorage.getItem('aita_refresh_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    refreshInFlight = fetch(apiBase + '/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    }).then(async response => {
      clearTimeout(timeout);
      if (!response.ok) return false;
      const result = await response.json();
      if (result.data?.token) localStorage.setItem('aita_token', result.data.token);
      if (result.data?.refreshToken) localStorage.setItem('aita_refresh_token', result.data.refreshToken);
      if (result.data?.user) window.dispatchEvent(new CustomEvent('aita-session-refreshed', { detail: result.data }));
      return true;
    }).catch(() => false).finally(() => {
      clearTimeout(timeout);
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(options.headers);
  headers.set('X-AITA-Request', '1');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  // Support Cross-Origin Token authentication (Vercel -> trycloudflare.com)
  const token = localStorage.getItem('aita_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const isAiReview = endpoint.startsWith('/ai/');
  const timeoutMs = isAiReview ? 120000 : options.body instanceof FormData ? 60000 : 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const execute = async (baseUrl: string) => {
    return fetch(baseUrl + endpoint, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || controller.signal,
    });
  };

  try {
    let apiBase = await getBackendApiBaseUrl();
    let response: Response;

    try {
      response = await execute(apiBase);
    } catch (networkError: any) {
      // If network fails (e.g. Tunnel changed or stopped), bust cache and re-check once
      invalidateConfigCache();
      const freshConfig = await fetchRuntimeConfig(true);
      if (freshConfig.status === 'OFFLINE') {
        clearTimeout(timeout);
        return {
          success: false,
          message: 'Máy chủ Backend AITA hiện đang tắt (OFFLINE). Vui lòng đợi máy chủ khởi động lại.',
        };
      }
      const newApiBase = freshConfig.backend_url ? `${freshConfig.backend_url}/api` : '/api';
      if (newApiBase !== apiBase && freshConfig.status === 'ONLINE') {
        // Retry with fresh discovered URL
        response = await execute(newApiBase);
      } else {
        throw networkError;
      }
    }

    clearTimeout(timeout);
    const authEntry = /^\/auth\/(login|register|google|refresh|logout)(\/|$)/.test(endpoint);
    if (response.status === 401 && !authEntry) {
      if (await refreshSession()) response = await execute(await getBackendApiBaseUrl());
      if (response.status === 401) window.dispatchEvent(new Event('aita-session-expired'));
    }

    // Safely parse JSON
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const result = await response.json();
      return response.ok ? result : { success: false, message: result.message || 'Yêu cầu thất bại.', details: result.details };
    }

    // Handle Blob/Attachment responses (e.g. Excel exports, ZIP downloads)
    if (contentType.includes('application/octet-stream') || contentType.includes('application/zip') || contentType.includes('vnd.openxmlformats')) {
      const blob = await response.blob();
      return response.ok ? { success: true, data: blob as any } : { success: false, message: 'Tải tệp tin thất bại.' };
    }

    // If unexpected response (HTML error page from proxy or tunnel)
    const text = await response.text();
    if (!response.ok) {
      return { success: false, message: `Lỗi kết nối (${response.status}): Không thể kết nối tới Backend AITA.` };
    }
    return { success: true, data: text as any };
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') return { success: false, message: 'Yêu cầu vượt quá thời gian chờ (15s).' };
    return { success: false, message: 'Không thể kết nối đến máy chủ Backend AITA. Vui lòng kiểm tra lại kết nối mạng.' };
  }
}
