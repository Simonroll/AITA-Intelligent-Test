import { ErrorRequestHandler, NextFunction, RequestHandler, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function asyncRoute(handler: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => { Promise.resolve(handler(req, res, next)).catch(next); };
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof HttpError || (error && typeof error.status === 'number' && error.message)) {
    res.status(error.status || 500).json({ success: false, message: error.message, details: error.details });
    return;
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ success: false, message: 'File vượt giới hạn tải lên (Excel 10 MiB, ZIP 25 MiB).' });
    return;
  }
  if (error.code?.startsWith('LIMIT_')) {
    res.status(400).json({ success: false, message: 'Chỉ gửi một file ở trường file và các trường cấu hình được hỗ trợ.' });
    return;
  }
  if (error.code === 'P2002') {
    res.status(409).json({ success: false, message: 'Dữ liệu đã tồn tại. Vui lòng kiểm tra và thử lại.' });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ success: false, message: 'JSON không hợp lệ.' });
    return;
  }

  const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} - Error: ${error.stack || error.message || error}\n`;
  console.error('[API]', logEntry);
  try {
    fs.appendFileSync(path.resolve(__dirname, '../../api-error.log'), logEntry);
  } catch {}

  res.status(500).json({
    success: false,
    message: error.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
    details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  });
};
