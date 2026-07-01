import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamically import the Express app — inside try/catch so any module-level
    // crash (missing deps, bad env vars) is surfaced as a JSON error.
    const { default: app } = await import('../server');

    // Reconstruct the original URL path from the Vercel rewrite query parameter
    if (req.url) {
      try {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathParam = urlObj.searchParams.get('path');
        if (pathParam) {
          urlObj.searchParams.delete('path');
          const search = urlObj.search;
          req.url = `/api/${pathParam}${search}`;
        }
      } catch (e) {
        console.error('Failed to parse URL in Vercel handler:', e);
      }
    }

    await new Promise<void>((resolve, reject) => {
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
    console.error('Vercel handler top-level error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: err?.message || 'Internal server error',
        stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
      });
    }
  }
}
