import React, { useState } from 'react';
import { GoogleSignIn } from '../../components/GoogleSignIn';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [demoError, setDemoError] = useState('');
  const demoAccounts = [
    { label: 'Admin Test', key: 'admin', email: 'admin.test@fpt.edu.vn' },
    { label: 'Lecturer Test', key: 'lecturer', email: 'lecturer.test@fpt.edu.vn' },
    { label: 'Student Test', key: 'student', email: 'student.test@fpt.edu.vn' },
  ];
  const loginDemo = async (key: string, email: string) => {
    setBusyEmail(email);
    setDemoError('');
    const result = await apiRequest('/auth/demo-login', {
      method: 'POST', body: JSON.stringify({ account: key }),
    });
    setBusyEmail(null);
    if (!result.success || !result.data) {
      setDemoError(result.message || 'Không thể đăng nhập tài khoản demo. Hãy seed tài khoản demo trước.');
      return;
    }
    login(result.data.token, result.data.user);
    navigate(result.data.user.role === 'ADMIN' ? '/admin' : result.data.user.role === 'LECTURER' ? '/lecturer' : '/student', { replace: true });
  };

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

        {import.meta.env.DEV && (
          <section aria-label="Đăng nhập nhanh tài khoản demo" style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border, rgba(255,255,255,0.1))', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 .35rem' }}>Đăng nhập nhanh (Demo local)</h3>
            <p style={{ color: '#94a3b8', fontSize: '.8rem', margin: '0 0 .8rem' }}>Chỉ hiện trong môi trường demo local. Bấm tài khoản để vào nhanh.</p>
            {demoError && <p role="alert" style={{ color: '#f87171', fontSize: '.85rem' }}>{demoError}</p>}
            <div style={{ display: 'grid', gap: '.5rem' }}>
              {demoAccounts.map(account => (
                <button key={account.email} type="button" className="btn btn-secondary" disabled={busyEmail !== null}
                  onClick={() => void loginDemo(account.key, account.email)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                  <span>{busyEmail === account.email ? 'Đang đăng nhập…' : account.label}</span>
                  <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>{account.email}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border, rgba(255,255,255,0.1))', fontSize: '0.8rem', color: '#64748b' }}>
          Hệ thống quản lý tài khoản nội bộ và không mở đăng ký tự do. Nếu tài khoản chưa có trong hệ thống, vui lòng liên hệ Giảng viên bộ môn hoặc Quản trị viên để được cấp quyền.
        </div>
      </div>
    </div>
  );
};
