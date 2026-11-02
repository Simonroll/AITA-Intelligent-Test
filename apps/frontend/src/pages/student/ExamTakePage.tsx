import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { MarkdownPreview } from '../../components/MarkdownPreview';
import { useAuth } from '../../contexts/AuthContext';

const isGithubRepositoryUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      ['github.com', 'www.github.com'].includes(url.hostname.toLowerCase()) &&
      url.pathname.split('/').filter(Boolean).length >= 2
    );
  } catch {
    return false;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getTimeRemaining = (endTimeStr: string) => {
  const diff = new Date(endTimeStr).getTime() - Date.now();
  if (diff <= 0) return { expired: true, text: 'Đã hết hạn nộp bài' };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return { expired: false, text: `Còn ${days} ngày ${hours} giờ` };
  if (hours > 0) return { expired: false, text: `Còn ${hours} giờ ${minutes} phút` };
  return { expired: false, text: `Còn ${minutes} phút` };
};

const downloadFile = (filename: string, content: string, mimeType = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getStarterTemplate = (language: string, title: string) => {
  switch (language) {
    case 'PYTHON':
      return {
        filename: 'main.py',
        content: `"""
Bài thi: ${title}
Ngôn ngữ: Python 3
Hướng dẫn:
- Đọc dữ liệu từ Standard Input (sys.stdin)
- In kết quả ra Standard Output (print)
"""

import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Cài đặt giải thuật tại đây
    pass

if __name__ == '__main__':
    solve()
`,
      };
    case 'JAVA':
      return {
        filename: 'Main.java',
        content: `/*
 * Bài thi: ${title}
 * Ngôn ngữ: Java 17
 * Hướng dẫn:
 * - Đọc dữ liệu từ Standard Input (System.in)
 * - In kết quả ra Standard Output (System.out)
 * - Tên lớp chính mặc định: Main
 */

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Cài đặt giải thuật tại đây
        
        scanner.close();
    }
}
`,
      };
    case 'CSHARP':
    default:
      return {
        filename: 'Program.cs',
        content: `/*
 * Bài thi: ${title}
 * Ngôn ngữ: C# .NET 8
 * Hướng dẫn:
 * - Đọc dữ liệu từ Console.ReadLine()
 * - In kết quả ra Console.WriteLine()
 */

using System;

class Program
{
    static void Main(string[] args)
    {
        // Cài đặt giải thuật tại đây
    }
}
`,
      };
  }
};

const buildMarkdownExport = (exam: any) => {
  let md = `# [AITA] ${exam.title}\n\n`;
  md += `## THÔNG SỐ BÀI THI\n`;
  md += `- Ngôn ngữ: ${exam.allowedLanguage === 'PYTHON' ? 'Python 3' : exam.allowedLanguage === 'JAVA' ? 'Java 17' : 'C# .NET 8'}\n`;
  md += `- Hình thức: ${exam.examType === 'GROUP' ? 'Bài tập nhóm' : 'Bài thi cá nhân'}\n`;
  md += `- Thời gian chạy tối đa (CPU): ${exam.timeLimitMs} ms\n`;
  md += `- Giới hạn bộ nhớ (RAM): ${exam.memoryLimitMb} MiB\n`;
  md += `- Thời gian mở đề: ${new Date(exam.startTime).toLocaleString('vi-VN')}\n`;
  md += `- Hạn chót nộp bài: ${new Date(exam.endTime).toLocaleString('vi-VN')}\n\n`;
  md += `---\n\n`;
  md += `## NỘI DUNG ĐỀ BÀI & QUY ĐỊNH ĐÁNH GIÁ\n\n`;
  md += `${exam.descriptionMd}\n\n`;

  if (exam.testCases && exam.testCases.length > 0) {
    md += `---\n\n`;
    md += `## BỘ TEST CASES CÔNG KHAI\n\n`;
    exam.testCases.forEach((tc: any, index: number) => {
      md += `### Test case #${index + 1}\n\n`;
      md += `**Input (StdIn):**\n\`\`\`\n${tc.inputData}\n\`\`\`\n\n`;
      md += `**Output (StdOut):**\n\`\`\`\n${tc.expectedOutput}\n\`\`\`\n\n`;
      if (tc.explanation) {
        md += `*Ghi chú:* ${tc.explanation}\n\n`;
      }
    });
  }

  md += `---\n\n`;
  md += `## QUY ĐỊNH ĐÓNG GÓI BÀI LÀM\n`;
  if (exam.allowedLanguage === 'PYTHON') {
    md += `1. Nén toàn bộ tệp nguồn .py vào một tệp nén .zip (tối đa 25 MiB).\n`;
    md += `2. Điểm chạy chính (entrypoint) mặc định là main.py.\n`;
  } else if (exam.allowedLanguage === 'JAVA') {
    md += `1. Nén các tệp .java vào tệp .zip (tối đa 25 MiB).\n`;
    md += `2. Tên lớp chạy chính mặc định là Main (chứa public static void main).\n`;
  } else {
    md += `1. Nén các tệp .cs vào tệp .zip (tối đa 25 MiB).\n`;
  }
  md += `3. Chương trình phải đọc trực tiếp từ luồng nhập chuẩn (StdIn) và in ra luồng xuất chuẩn (StdOut).\n`;
  md += `4. Hệ thống thực thi trên môi trường Docker Sandbox biệt lập, cấm các hành vi truy cập mạng hoặc can thiệp hệ thống.\n`;

  return md;
};

export const ExamTakePage: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [entrypoint, setEntrypoint] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [myTeam, setMyTeam] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const [activeTab, setActiveTab] = useState<'problem' | 'cases' | 'guideline'>('problem');
  const [copiedIndex, setCopiedIndex] = useState<{ id: string; type: 'input' | 'output' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExam(null);
    setMyTeam(null);
    setLoadingTeam(false);
    setError('');

    void apiRequest('/exams/' + examId).then(res => {
      if (!res.success) {
        setError(res.message || 'Không tải được bài thi.');
        return;
      }
      setExam(res.data);
      if (res.data.examType === 'GROUP') {
        setLoadingTeam(true);
        void apiRequest('/exams/' + examId + '/my-team').then(teamRes => {
          setLoadingTeam(false);
          if (teamRes.success && teamRes.data) {
            setMyTeam(teamRes.data);
            setRepoUrl(teamRes.data.repoUrl || '');
          }
        });
      }
    });
  }, [examId]);

  const myMembership = myTeam?.members?.find((member: any) => member.studentId === user?.id);
  const isLeader = myMembership?.role === 'LEADER';
  const teamLeader = myTeam?.members?.find((member: any) => member.role === 'LEADER');

  const handleCopy = (text: string, id: string, type: 'input' | 'output') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex({ id, type });
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const handleDownloadExam = () => {
    if (!exam) return;
    const slug = exam.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `AITA-${slug || 'de-bai'}.md`;
    downloadFile(filename, buildMarkdownExport(exam), 'text/markdown;charset=utf-8');
  };

  const handleDownloadStarter = () => {
    if (!exam) return;
    const starter = getStarterTemplate(exam.allowedLanguage, exam.title);
    downloadFile(starter.filename, starter.content, 'text/plain;charset=utf-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.toLowerCase().endsWith('.zip')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Chỉ chấp nhận tệp có định dạng .zip');
      }
    }
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (exam?.examType === 'GROUP' && !isLeader) {
      setError('Chỉ trưởng nhóm mới có quyền nộp bài cho nhóm.');
      return;
    }
    const isGroupSubmission = exam?.examType === 'GROUP';
    if (isGroupSubmission && !isGithubRepositoryUrl(repoUrl.trim())) {
      setError('Nhóm chưa có repository GitHub hợp lệ. Vui lòng đăng ký repository tại trang Nhóm của tôi.');
      return;
    }
    if (!isGroupSubmission && (!file || !file.name.toLowerCase().endsWith('.zip'))) {
      setError('Vui lòng chọn tệp mã nguồn định dạng .zip.');
      return;
    }
    if (!isGroupSubmission && file && file.size > 25 * 1024 * 1024) {
      setError('Tệp ZIP vượt quá dung lượng tối đa 25 MiB.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = isGroupSubmission
      ? await apiRequest('/exams/' + examId + '/submissions/from-git', {
          method: 'POST',
          body: JSON.stringify({ repoUrl: repoUrl.trim(), entrypoint: entrypoint.trim() || undefined }),
        })
      : await apiRequest('/exams/' + examId + '/submissions', {
          method: 'POST',
          body: (() => {
            const body = new FormData();
            if (file) body.append('file', file);
            if (entrypoint.trim()) body.append('entrypoint', entrypoint.trim());
            return body;
          })(),
        });

    setSubmitting(false);
    if (res.success && res.data) {
      navigate('/student/submissions/' + res.data.id);
    } else {
      setError(res.message || 'Không thể gửi bài nộp. Vui lòng thử lại.');
    }
  }

  const remaining = exam ? getTimeRemaining(exam.endTime) : null;

  return (
    <div className="container page-exam-view" style={{ maxWidth: 1240, paddingBottom: '4rem' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
        <div>
          <Link
            to="/student"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Quay lại danh sách bài tập
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {exam ? exam.title : 'Chi tiết bài tập'}
            </h1>
            {exam && (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span className="badge badge-blue">
                  {exam.allowedLanguage === 'PYTHON' ? 'Python 3' : exam.allowedLanguage === 'JAVA' ? 'Java 17' : 'C# .NET 8'}
                </span>
                <span className={`badge ${exam.examType === 'GROUP' ? 'badge-yellow' : 'badge-green'}`}>
                  {exam.examType === 'GROUP' ? 'Bài tập nhóm' : 'Bài cá nhân'}
                </span>
                {remaining && (
                  <span className={`badge ${remaining.expired ? 'badge-red' : 'badge-purple'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {remaining.text}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Download Actions */}
        {exam && (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDownloadExam}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 500 }}
              title="Tải toàn bộ nội dung đề bài và hướng dẫn dạng Markdown"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Tải đề bài (.md)
            </button>
            <button
              type="button"
              onClick={handleDownloadStarter}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 500 }}
              title="Tải tệp mã nguồn mẫu khởi tạo theo ngôn ngữ của đề"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Tải mã nguồn mẫu ({exam.allowedLanguage === 'PYTHON' ? 'main.py' : exam.allowedLanguage === 'JAVA' ? 'Main.java' : 'Program.cs'})
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.1rem',
            borderRadius: 'var(--radius-control)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#fca5a5',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {!exam && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '1.75rem' }}>
          <div className="skeleton-box" style={{ minHeight: '440px', padding: '1.5rem' }}>
            <div className="skeleton-line" style={{ width: '40%', height: '1.8rem', marginBottom: '1.5rem' }} />
            <div className="skeleton-line" style={{ width: '90%', marginBottom: '0.75rem' }} />
            <div className="skeleton-line" style={{ width: '85%', marginBottom: '0.75rem' }} />
            <div className="skeleton-line" style={{ width: '60%', marginBottom: '2rem' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '120px' }} />
          </div>
          <div className="skeleton-box" style={{ minHeight: '440px', padding: '1.5rem' }}>
            <div className="skeleton-line" style={{ width: '50%', height: '1.5rem', marginBottom: '1.5rem' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '180px', marginBottom: '1rem' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '42px' }} />
          </div>
        </div>
      )}

      {/* Main Dual-Column Content */}
      {exam && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
          {/* LEFT COLUMN: Problem Details & Public Cases */}
          <div>
            {/* Technical Parameters Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                  Thời gian CPU
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>
                  {exam.timeLimitMs} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>ms</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  Bộ nhớ RAM
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#818cf8' }}>
                  {exam.memoryLimitMb} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>MiB</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Thang điểm
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399' }}>
                  10.0 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>điểm</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Hạn nộp
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: remaining?.expired ? '#f87171' : '#f59e0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {new Date(exam.endTime).toLocaleDateString('vi-VN')} {new Date(exam.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('problem')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'problem' ? '2px solid #38bdf8' : '2px solid transparent',
                  color: activeTab === 'problem' ? '#38bdf8' : 'var(--text-secondary)',
                  padding: '0.65rem 1rem',
                  fontWeight: activeTab === 'problem' ? 650 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Mô tả đề bài & Barem
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cases')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'cases' ? '2px solid #38bdf8' : '2px solid transparent',
                  color: activeTab === 'cases' ? '#38bdf8' : 'var(--text-secondary)',
                  padding: '0.65rem 1rem',
                  fontWeight: activeTab === 'cases' ? 650 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Test cases công khai
                {exam.testCases && (
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.75rem', padding: '0.1rem 0.45rem', borderRadius: '1rem', fontWeight: 600 }}>
                    {exam.testCases.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guideline')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'guideline' ? '2px solid #38bdf8' : '2px solid transparent',
                  color: activeTab === 'guideline' ? '#38bdf8' : 'var(--text-secondary)',
                  padding: '0.65rem 1rem',
                  fontWeight: activeTab === 'guideline' ? 650 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Quy định kỹ thuật
              </button>
            </div>

            {/* TAB 1: Markdown Content */}
            {activeTab === 'problem' && (
              <div className="card" style={{ padding: '1.75rem' }}>
                <MarkdownPreview content={exam.descriptionMd} />
              </div>
            )}

            {/* TAB 2: Public Test Cases */}
            {activeTab === 'cases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {exam.testCases && exam.testCases.length > 0 ? (
                  exam.testCases.map((tc: any, idx: number) => (
                    <div key={tc.id || idx} className="card" style={{ padding: '1.25rem', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
                          Ví dụ #{idx + 1}
                        </span>
                        {tc.scoreWeight && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Trọng số: {tc.scoreWeight} điểm
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                              Dữ liệu đầu vào (Input)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(tc.inputData, tc.id || String(idx), 'input')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              {copiedIndex?.id === (tc.id || String(idx)) && copiedIndex?.type === 'input' ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                  Đã chép
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                  Sao chép
                                </>
                              )}
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: '0.75rem', background: 'var(--surface-inset, #090d16)', borderRadius: 'var(--radius-control)', fontSize: '0.82rem', fontFamily: 'monospace', overflowX: 'auto', border: '1px solid var(--border)' }}>
                            {tc.inputData}
                          </pre>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                              Kết quả mong đợi (Output)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(tc.expectedOutput, tc.id || String(idx), 'output')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              {copiedIndex?.id === (tc.id || String(idx)) && copiedIndex?.type === 'output' ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                  Đã chép
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                  Sao chép
                                </>
                              )}
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: '0.75rem', background: 'var(--surface-inset, #090d16)', borderRadius: 'var(--radius-control)', fontSize: '0.82rem', fontFamily: 'monospace', overflowX: 'auto', border: '1px solid var(--border)' }}>
                            {tc.expectedOutput}
                          </pre>
                        </div>
                      </div>

                      {tc.explanation && (
                        <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          Ghi chú: {tc.explanation}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Bài thi chưa cấu hình test case công khai.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Guidelines */}
            {activeTab === 'guideline' && (
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                  Quy chuẩn nộp bài & Đánh giá tự động
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div style={{ background: 'var(--surface-inset)', padding: '1rem', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '0.35rem' }}>1. Quy cách nhập/xuất dữ liệu chuẩn (StdIn/StdOut):</strong>
                    Chương trình phải đọc dữ liệu từ bàn phím (Standard Input) và xuất kết quả ra màn hình (Standard Output). Nghiêm cấm in các thông báo tương tác như &quot;Nhap vao n:&quot; vì sẽ gây sai lệch khi so khớp chuỗi đầu ra.
                  </div>

                  <div style={{ background: 'var(--surface-inset)', padding: '1rem', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '0.35rem' }}>2. Cấu trúc tệp mã nguồn và Entrypoint:</strong>
                    {exam.allowedLanguage === 'PYTHON' && 'Đóng gói các tệp .py vào thư mục gốc của file ZIP. Tệp thực thi chính mặc định là main.py.'}
                    {exam.allowedLanguage === 'JAVA' && 'Đóng gói các tệp .java vào thư mục gốc của file ZIP. Lớp chứa hàm main() mặc định là Main.'}
                    {exam.allowedLanguage === 'CSHARP' && 'Đóng gói các tệp .cs vào thư mục gốc của file ZIP. C# biên dịch với .NET 8 SDK tự động.'}
                  </div>

                  <div style={{ background: 'var(--surface-inset)', padding: '1rem', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '0.35rem' }}>3. Cơ chế kiểm tra phi thuật toán qua AI Semantic Review:</strong>
                    Hệ thống sẽ tự động quét mã nguồn để đối soát các quy định của đề bài: tên hàm/lớp bắt buộc, phong cách Clean Code, và các thư viện bị cấm. Nếu đặt sai tên hàm được yêu cầu, điểm Clean Code sẽ bị trừ tương ứng.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Submission Portal */}
          <div>
            {exam.examType === 'GROUP' && loadingTeam ? (
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', padding: '2rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                <span>Đang tải thông tin nhóm làm bài...</span>
              </div>
            ) : exam.examType === 'GROUP' && !myTeam ? (
              <div className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Chưa được phân nhóm</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Đây là bài thi nhóm. Bạn cần tham gia một nhóm học tập trước khi nộp bài.
                </p>
                <Link to="/student/teams" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  Đến trang quản lý Nhóm
                </Link>
              </div>
            ) : exam.examType === 'GROUP' && !isLeader ? (
              <div className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', marginBottom: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Thành viên nhóm: {myTeam.name}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  Chỉ Trưởng nhóm (<strong style={{ color: '#f8fafc' }}>{teamLeader?.student?.fullName || 'Trưởng nhóm'}</strong>) mới có quyền nộp bài đại diện cho toàn bộ nhóm.
                </p>
                <div style={{ background: 'var(--surface-inset)', padding: '0.85rem', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Repository nhóm: <span style={{ color: '#60a5fa', wordBreak: 'break-all' }}>{repoUrl || 'Chưa đăng ký'}</span>
                </div>
              </div>
            ) : (
              <form className="card" onSubmit={submit} style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    {exam.examType === 'GROUP' ? 'Nộp bài từ GitHub' : 'Khu vực nộp bài'}
                  </h3>
                  <span className="badge badge-blue">
                    {exam.examType === 'GROUP' ? 'Git Sync' : 'Tệp nén .ZIP'}
                  </span>
                </div>

                {exam.examType === 'GROUP' ? (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      Hệ thống tự động đồng bộ mã nguồn trên nhánh mặc định của repository nhóm tại thời điểm bấm nộp.
                    </p>

                    <div className="form-group">
                      <label htmlFor="team-repository-url" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Địa chỉ GitHub Repository *
                      </label>
                      <input
                        id="team-repository-url"
                        className="form-control"
                        type="url"
                        value={repoUrl}
                        onChange={event => setRepoUrl(event.target.value)}
                        placeholder="https://github.com/organization/project"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Drag & Drop Upload Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: isDragging ? '2px dashed #38bdf8' : '2px dashed var(--border-strong, #3a4b64)',
                        background: isDragging ? 'rgba(56, 189, 248, 0.08)' : 'var(--surface-inset, #0d1522)',
                        borderRadius: 'var(--radius-control)',
                        padding: '1.75rem 1.25rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginBottom: '1rem',
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip,application/zip"
                        style={{ display: 'none' }}
                        onChange={event => {
                          const candidate = event.target.files?.[0];
                          if (candidate) {
                            if (candidate.name.toLowerCase().endsWith('.zip')) {
                              setFile(candidate);
                              setError('');
                            } else {
                              setError('Chỉ chấp nhận tệp có định dạng .zip');
                            }
                          }
                        }}
                      />

                      {file ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#f8fafc', wordBreak: 'break-all' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Kích thước: {formatFileSize(file.size)}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                            className="btn btn-ghost-danger btn-sm"
                            style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                          >
                            Chọn tệp khác
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                            Kéo thả tệp .ZIP bài làm vào đây
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            hoặc <span style={{ color: '#38bdf8', textDecoration: 'underline' }}>duyệt tệp từ máy tính</span> (Tối đa 25 MiB)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Entrypoint configuration */}
                {exam.allowedLanguage !== 'CSHARP' && (
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="entrypoint" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      {exam.allowedLanguage === 'JAVA' ? 'Tên lớp chạy chính (Entrypoint Class)' : 'Tên tệp chạy chính (Entrypoint File)'}
                    </label>
                    <input
                      id="entrypoint"
                      className="form-control"
                      value={entrypoint}
                      onChange={event => setEntrypoint(event.target.value)}
                      placeholder={exam.allowedLanguage === 'JAVA' ? 'Main hoặc school.Main' : 'main.py'}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                      {exam.allowedLanguage === 'JAVA'
                        ? 'Để trống nếu sử dụng lớp Main mặc định.'
                        : 'Hệ thống tự động tìm tệp main.py nếu để trống.'}
                    </small>
                  </div>
                )}

                {/* Pre-submission Checklist */}
                <div style={{ background: 'var(--surface-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Kiểm tra trước khi nộp:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Đã gỡ bỏ các thư mục rác (bin, obj, __pycache__, .git).
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Không in thông báo mời nhập liệu thừa vào luồng xuất.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Tuân thủ đúng tên hàm và các ràng buộc đặc thù của đề.
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={submitting || (exam.examType !== 'GROUP' && !file)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 650,
                    fontSize: '0.95rem',
                  }}
                >
                  {submitting ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Đang tải bài nộp lên sandbox...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Xác nhận nộp bài & Chấm tự động
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
