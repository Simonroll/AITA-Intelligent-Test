import React, { useEffect, useState } from 'react';
import { fetchRuntimeConfig, subscribeBackendStatus, RuntimeConfig } from '../api/registry';

export const BackendStatusBanner: React.FC = () => {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchRuntimeConfig().then(cfg => setConfig(cfg));

    // Subscribe to dynamic status changes
    const unsubscribe = subscribeBackendStatus((_status, latestConfig) => {
      setConfig(latestConfig);
    });

    // Background interval check every 30 seconds
    const interval = setInterval(() => {
      fetchRuntimeConfig();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const fresh = await fetchRuntimeConfig(true);
      setConfig(fresh);
    } finally {
      setChecking(false);
    }
  };

  if (!config || config.status === 'ONLINE') {
    return null;
  }

  const isOffline = config.status === 'OFFLINE';

  return (
    <div
      style={{
        background: isOffline ? '#7f1d1d' : '#78350f',
        color: '#fef2f2',
        borderBottom: `1px solid ${isOffline ? '#ef4444' : '#f59e0b'}`,
        padding: '0.6rem 1rem',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1rem' }}>{isOffline ? '🔴' : '🟡'}</span>
        <span>
          <strong>{isOffline ? 'Hệ thống Backend hiện đang TẮT:' : 'Đang kết nối lại Backend:'}</strong>{' '}
          {isOffline
            ? 'Máy chủ chấm bài và API tại máy local chưa được khởi động. Vui lòng bật máy chủ để tiếp tục.'
            : 'Đang tự động phát hiện đường hầm Tunnel mới...'}
        </span>
      </div>
      <button
        onClick={handleManualCheck}
        disabled={checking}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          color: '#fff',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          cursor: checking ? 'not-allowed' : 'pointer',
          fontSize: '0.8rem',
        }}
      >
        {checking ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
      </button>
    </div>
  );
};
