const fs = require('fs');
const path = 'd:\\GitHub\\swp\\apps\\frontend\\src\\pages\\lecturer\\ExamSubmissionsPage.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Fix score column: show manualScore prominently
const scoreOld = `                       <td style={{ fontWeight: 600, fontSize: '1.05rem', color: '#34d399' }}>
                        {sub.totalScore} pts
                       </td>`;
const scoreNew = `                       <td style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                        {(sub as any).manualScore != null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ color: '#60a5fa' }}>
                              {(sub as any).manualScore} pts
                              <span style={{ fontSize: '0.7rem', background: '#1e40af', color: '#93c5fd', borderRadius: '0.25rem', padding: '0 0.35rem', marginLeft: '0.35rem', fontWeight: 700 }}>GV chấm</span>
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'line-through' }}>{sub.totalScore} pts sandbox</span>
                          </div>
                        ) : (
                          <span style={{ color: '#34d399' }}>{sub.totalScore} pts</span>
                        )}
                       </td>`;

// 2. Fix action link: "Review & Chấm lại"
const linkOld = `                           <Link to={\`/student/submissions/\${sub.id}\`} className="btn btn-secondary btn-sm">
                             Xem chi tiết
                           </Link>`;
const linkNew = `                           <Link to={\`/student/submissions/\${sub.id}\`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                             Review &amp; Chấm lại
                           </Link>`;

if (content.includes('Xem chi tiết')) {
  content = content.replace(
    /\s*<Link to=\{`\/student\/submissions\/\$\{sub\.id\}`\} className="btn btn-secondary btn-sm">\s*Xem chi tiết\s*<\/Link>/,
    `\n                           <Link to={\`/student/submissions/\${sub.id}\`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                             Review &amp; Ch\u1ea5m l\u1ea1i
                           </Link>`
  );
  console.log('✅ Link "Xem chi tiết" -> "Review & Chấm lại" patched');
} else {
  console.log('⚠️  "Xem chi tiết" not found, link already patched or different');
}

// Patch score column
const scoreRegex = /(<td style=\{\{ fontWeight: 600, fontSize: '1\.05rem', color: '#34d399' \}\}>\s*\{sub\.totalScore\} pts\s*<\/td>)/;
if (scoreRegex.test(content)) {
  content = content.replace(scoreRegex, `<td style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                        {(sub as any).manualScore != null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ color: '#60a5fa' }}>
                              {(sub as any).manualScore} pts
                              <span style={{ fontSize: '0.7rem', background: '#1e40af', color: '#93c5fd', borderRadius: '0.25rem', padding: '0 0.35rem', marginLeft: '0.35rem', fontWeight: 700 }}>GV ch\u1ea5m</span>
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'line-through' }}>{sub.totalScore} pts sandbox</span>
                          </div>
                        ) : (
                          <span style={{ color: '#34d399' }}>{sub.totalScore} pts</span>
                        )}
                       </td>`);
  console.log('✅ Score column patched to show manualScore');
} else {
  console.log('⚠️  Score column regex not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done.');

