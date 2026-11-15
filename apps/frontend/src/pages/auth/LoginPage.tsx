import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleSignIn } from '../../components/GoogleSignIn';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    setLoading(false);
    if (res.success && res.data) {
      login(res.data.token, res.data.user, res.data.refreshToken);
      navigate(
        res.data.user.role === 'ADMIN'
          ? '/admin'
          : res.data.user.role === 'LECTURER'
          ? '/lecturer'
          : '/student',
        { replace: true }
      );
    } else {
      setError(res.message || 'Email hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div
        className="card"
        style={{
          padding: '2.25rem 2rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 0.35rem 0', fontWeight: 700 }}>Đăng nhập AITA</h2>
          <p
            style={{
              margin: 0,
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '0.875rem',
            }}
          >
            Hệ thống Đánh giá & Chấm mã nguồn Tự động
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '0.65rem 0.85rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {/* 1. Standard Email & Password Form */}
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email FPT / FE</label>
            <input
              type="email"
              className="form-control"
              placeholder="Nhập email FPT / FE của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem', fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        {/* 2. Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0 1.25rem',
            color: 'var(--text-muted, #64748b)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border, rgba(255,255,255,0.1))' }} />
          <span style={{ padding: '0 0.75rem', letterSpacing: '0.05em' }}>HOẶC TIẾP TỤC VỚI</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border, rgba(255,255,255,0.1))' }} />
        </div>

        {/* 3. Google SSO */}
        <GoogleSignIn />

        {/* 4. Footer Note */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
            fontSize: '0.78rem',
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Hệ thống quản lý tài khoản nội bộ và không mở đăng ký tự do. Nếu tài khoản chưa có trong hệ thống, vui lòng liên hệ Giảng viên bộ môn hoặc Quản trị viên để được cấp quyền.
        </div>
      </div>
    </div>
  );
};
