import { Router } from 'express';
import { sendWorkflowEmail } from '../lib/email';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const {
      templateKey,
      to,
      name,
      role,
      customBody,
      interviewDate,
      meetLink,
      reason,
    } = req.body as {
      templateKey: string;
      to: string;
      name: string;
      role: string;
      customBody?: string;
      interviewDate?: string;
      meetLink?: string;
      reason?: string;
    };

    if (!templateKey || !to || !name || !role) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: templateKey, to, name, role' });
    }

    const validKeys = [
      'screening-link',
      'screening-reject',
      'interview-schedule',
      'talent-pool',
      'hired',
    ];

    if (!validKeys.includes(templateKey)) {
      return res.status(400).json({
        error: `Invalid templateKey. Must be one of: ${validKeys.join(', ')}`,
      });
    }

    await sendWorkflowEmail({
      templateKey: templateKey as Parameters<typeof sendWorkflowEmail>[0]['templateKey'],
      to,
      name,
      role,
      customBody,
      interviewDate,
      meetLink,
      reason,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[workflow] email error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
