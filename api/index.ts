import app from '../server';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await new Promise<void>((resolve, reject) => {
      // Ensure res.end signals completion
      const originalEnd = res.end.bind(res);
      (res as any).end = (...args: any[]) => {
        originalEnd(...args);
        resolve();
      };
      app(req as any, res as any, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', message: err?.message || 'Internal server error' });
    }
  }
}
