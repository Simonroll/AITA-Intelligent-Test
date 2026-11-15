import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            nonce?: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme?: string; size?: string; text?: string; width?: number; shape?: string }
          ) => void;
          prompt: (notification?: (notification: any) => void) => void;
        };
      };
    };
  }
}

const DEFAULT_CLIENT_ID = '693557069474-5h18j06aa0mbj9okrdch8g1m11aer1i6.apps.googleusercontent.com';

let googleScript: Promise<void> | undefined;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScript) {
    googleScript = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => {
          googleScript = undefined;
          reject(new Error('Không thể tải Google Identity SDK.'));
        });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        googleScript = undefined;
        script.remove();
        reject(new Error('Không thể tải Google Identity SDK.'));
      };
      document.head.appendChild(script);
    });
  }
  return googleScript;
}

export const GoogleSignIn: React.FC<{ password?: string }> = ({ password }) => {
  const container = useRef<HTMLDivElement>(null);
  const passwordRef = useRef(password);
  passwordRef.current = password;

  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    void (async () => {
      // 1. Fetch backend config or fallback to env / default
      let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
      let nonce: string | undefined;

      try {
        const config = await apiRequest<{ clientId: string | null; nonce: string | null }>('/auth/google/config');
        if (config.success && config.data?.clientId) {
          clientId = config.data.clientId;
          nonce = config.data.nonce || undefined;
        }
      } catch {
        // Continue with fallback client id
      }

      if (!active) return;

      try {
        await loadGoogle();
        if (!active || !container.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce,
          callback: async (response) => {
            if (!active) return;
            setBusy(true);
            setMessage('');
            const result = await apiRequest('/auth/google', {
              method: 'POST',
              body: JSON.stringify({
                credential: response.credential,
                nonce,
                password: passwordRef.current || undefined,
              }),
            });
            if (!active) return;
            setBusy(false);
            if (result.success && result.data) {
              login(result.data.token, result.data.user, result.data.refreshToken);
              navigate(result.data.user.role === 'STUDENT' ? '/student' : '/lecturer');
            } else {
              setMessage(result.message || 'Đăng nhập Google thất bại.');
              setRetry((v) => v + 1);
            }
          },
        });

        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 320,
          shape: 'rectangular',
        });

        // Check if Google GSI rendered an element
        setTimeout(() => {
          if (active && container.current && container.current.childElementCount > 0) {
            setGoogleReady(true);
          }
        }, 300);
      } catch (err: any) {
        console.warn('[GoogleSignIn] Could not render Google GSI button:', err?.message);
      }
    })();

    return () => {
      active = false;
    };
  }, [retry, login, navigate]);

  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setMessage(
            'Tên miền hiện tại chưa được cấp phép trong Google Cloud Console OAuth. Bạn vui lòng sử dụng biểu mẫu Đăng nhập phía trên.'
          );
        }
      });
    } else {
      setMessage('Không thể kết nối đến máy chủ Google Identity. Vui lòng thử lại sau.');
    }
  };

  return (
    <div
      style={{
        marginTop: '0.75rem',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Official Google GSI Button Container */}
      <div
        ref={container}
        style={{
          display: busy ? 'none' : 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      />

      {/* Fallback button if Google script is loading or blocked */}
      {!googleReady && !busy && (
        <button
          type="button"
          onClick={handleFallbackClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            width: '100%',
            maxWidth: '320px',
            padding: '0.6rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border, rgba(255,255,255,0.18))',
            background: 'rgba(255,255,255,0.06)',
            color: '#f8fafc',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Đăng nhập bằng Google</span>
        </button>
      )}

      {busy && <p style={{ color: 'var(--primary, #38bdf8)', fontSize: '0.875rem' }}>Đang xác thực Google...</p>}

      {message && (
        <div
          role="status"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            padding: '0.6rem 0.8rem',
            borderRadius: '0.4rem',
            marginTop: '0.75rem',
            fontSize: '0.85rem',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};
