import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { supabase } from '../lib/supabase';

const router = Router();

// ---------------------------------------------------------------------------
// Multer — memory storage, file type validation
// ---------------------------------------------------------------------------

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      ALLOWED_MIMETYPES.includes(file.mimetype) &&
      ALLOWED_EXTENSIONS.includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and DOC files are accepted.'));
    }
  },
});

// ---------------------------------------------------------------------------
// GET /api/public/positions
// ---------------------------------------------------------------------------

router.get('/positions', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('hr_positions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[public/positions] Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data ?? []);
  } catch (err) {
    console.error('[public/positions] Unexpected error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /api/public/applications
// ---------------------------------------------------------------------------

router.post('/applications', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      role,
      resumePath,
      notes,
    } = req.body as {
      name?: string;
      email?: string;
      role?: string;
      resumePath?: string;
      notes?: string;
    };

    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: name, email, role' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const { data, error } = await supabase
      .from('hr_applicants')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim(),
        status: null, // awaits HR approval / pipeline start
        applied_date: new Date().toISOString(),
        resume_path: resumePath ?? null,
        notes: notes ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[public/applications] Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ ok: true, id: data.id });
  } catch (err) {
    console.error('[public/applications] Unexpected error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /api/public/uploads
// ---------------------------------------------------------------------------

router.post(
  '/uploads',
  (req: Request, res: Response, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: String(err) });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided.' });
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${crypto.randomUUID()}-${file.originalname.replace(/\s+/g, '_')}`;
      const bucketCandidates = ['resumes', 'application-attachments'] as const;

      for (const bucket of bucketCandidates) {
        const storagePath = bucket === 'resumes' ? `resumes/${uniqueName}` : uniqueName;
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(data.path);

          return res.status(201).json({ path: data.path, url: publicUrl, bucket });
        }

        const msg = error.message ?? '';
        const missingBucket =
          msg.includes('Bucket not found') ||
          msg.includes('not found') ||
          error.statusCode === '404';

        if (missingBucket) {
          console.warn(`[public/uploads] Bucket "${bucket}" not available, trying next option.`, error);
          continue;
        }

        console.error(`[public/uploads] Supabase storage error on bucket "${bucket}":`, error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'No upload bucket is configured. Create "resumes" or use "application-attachments".',
      });
    } catch (err) {
      console.error('[public/uploads] Unexpected error:', err);
      return res.status(500).json({ error: String(err) });
    }
  }
);

export default router;
