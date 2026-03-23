import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import workflowRouter from './routes/workflow';
import cronRouter from './routes/cron';
import publicRouter from './routes/public';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date() });
});

// Routes
app.use('/api/email/workflow', workflowRouter);
app.use('/api/cron/sla', cronRouter);
app.use('/api/public', publicRouter);

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Lifewood HR API running on port ${PORT}`);
});

export default app;
