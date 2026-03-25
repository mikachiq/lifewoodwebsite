import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  return res.json({ ts: new Date().toISOString() });
});

export default router;
