import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes (Proxy to Django in production)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Kaali Groups Ops Bridge is running',
      backend: 'Django (Production Ready in /backend folder)'
    });
  });

  // Mocking Django API responses for the preview
  // This ensures the UI works even if Django is not running in this environment
  app.get('/api/operations/summary', (req, res) => {
    res.json({
      cod_collected: 42500,
      petrol_expenses: 8240,
      labour_costs: 12800,
      net_profit: 21460
    });
  });

  // Proxy to Django if it's running (e.g. on port 8000)
  // This is for local development where you run both
  app.use('/api/django', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/django': '/api',
    },
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
