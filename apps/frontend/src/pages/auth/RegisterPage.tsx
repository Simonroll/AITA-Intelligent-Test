import React from 'react';
import { Link } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '460px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <h2 style={{ marginBottom: '0.75rem', fontWeight: 700 }}>Tính năng đăng ký đã đóng</h2>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Hệ thống AITA quản lý người dùng theo danh sách lớp học và tài khoản được cấp phép bởi Quản trị viên và Giảng viên. Tính năng tự đăng ký mở hiện không còn khả dụng.
        </p>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border, rgba(255,255,255,0.1))', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.75rem', fontSize: '0.85rem', color: '#cbd5e1', textAlign: 'left' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Hướng dẫn tiếp cận:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.5 }}>
            <li><strong>Sinh viên:</strong> Được tự động thêm vào hệ thống khi Giảng viên import danh sách lớp học. Đăng nhập trực tiếp bằng Google email trường (@fpt.edu.vn / @fe.edu.vn).</li>
            <li><strong>Giảng viên:</strong> Được cấp tài khoản bởi Quản trị viên hệ thống.</li>
          </ul>
        </div>

        <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', textDecoration: 'none' }}>
          Đến trang Đăng nhập Google
        </Link>
      </div>
    </div>
  );
};
