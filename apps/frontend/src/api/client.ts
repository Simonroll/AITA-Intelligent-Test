import { getBackendApiBaseUrl, invalidateConfigCache, fetchRuntimeConfig } from './registry';

export interface ApiResult<T = any> { success: boolean; data?: T; message?: string; details?: unknown }
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const apiBase = await getBackendApiBaseUrl();

    const headers = new Headers({ 'X-AITA-Request': '1' });
    const token = localStorage.getItem('aita_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    refreshInFlight = fetch(apiBase + '/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers,
      signal: controller.signal,
    }).then(async response => {
      clearTimeout(timeout);
      if (!response.ok) return false;
      const result = await response.json();
      if (result.data?.token) localStorage.setItem('aita_token', result.data.token);
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

    // Non-JSON response (e.g. HTML error 502/530 from Cloudflare or Vercel proxy)
    const text = await response.text();
    invalidateConfigCache();
    await fetchRuntimeConfig(true);
    return {
      success: false,
      message: response.status >= 500
        ? `Lỗi kết nối máy chủ [${response.status}]. Đang kiểm tra lại trạng thái Backend...`
        : `Phản hồi không hợp lệ từ máy chủ: ${text.slice(0, 80)}`,
    };
  } catch (error: any) {
    clearTimeout(timeout);
    invalidateConfigCache();
    const config = await fetchRuntimeConfig(true);
    if (config.status === 'OFFLINE') {
      return {
        success: false,
        message: 'Máy chủ Backend hiện đang tắt (OFFLINE).',
      };
    }
    return {
      success: false,
      message: error.name === 'AbortError'
        ? 'Hết thời gian chờ phản hồi từ máy chủ (cổng 5000).'
        : (error.message || 'Không thể kết nối máy chủ.'),
    };
  }
}
