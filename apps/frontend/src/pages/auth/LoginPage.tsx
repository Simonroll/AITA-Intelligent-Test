import React from 'react';
import { GoogleSignIn } from '../../components/GoogleSignIn';

export const LoginPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '440px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.25rem 2rem', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h2 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Đăng nhập AITA</h2>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Hệ thống Đánh giá & Chấm mã nguồn Tự động
        </p>

        <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.75rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.1rem' }}>💡</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.5 }}>
              <strong>Xác thực tập trung Google SSO:</strong> Toàn bộ tài khoản Giảng viên và Sinh viên đăng nhập trực tiếp bằng tài khoản Google trường hoặc email đã được cấp trên hệ thống.
            </div>
          </div>
        </div>

        <GoogleSignIn />

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border, rgba(255,255,255,0.1))', fontSize: '0.8rem', color: '#64748b' }}>
          Hệ thống quản lý tài khoản nội bộ và không mở đăng ký tự do. Nếu tài khoản chưa có trong hệ thống, vui lòng liên hệ Giảng viên bộ môn hoặc Quản trị viên để được cấp quyền.
        </div>
      </div>
    </div>
  );
};
