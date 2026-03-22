import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildHtml(name: string, bodyText: string, badge: string, meta: { label: string; value: string; color?: string }[]): string {
  const bodyHtml = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map(line => {
      if (line.trim() === '') return '<br/>';
      if (line.trim().startsWith('- ')) {
        return `<li style="margin:0 0 6px;color:#2a4a3a;font-size:14px;line-height:1.7;">${line.trim().slice(2)}</li>`;
      }
      return `<p style="margin:0 0 10px;color:#2a4a3a;font-size:14px;line-height:1.7;">${line}</p>`;
    })
    .join('');

  const metaRows = meta.map(({ label, value, color }) => `
    <tr style="border-top:1px solid #d7e4dc;">
      <td style="padding:10px 16px;font-size:13px;color:#537161;font-weight:500;">${label}</td>
      <td style="padding:10px 16px;font-size:13px;font-weight:700;text-align:right;color:${color || '#1a2e1a'};">${value}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f0ebe0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe0;padding:40px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);border:3px solid #1a3a2a;">

  <!-- Header -->
  <tr><td style="background:#f0ebe0;padding:32px 40px;text-align:center;border-bottom:1px solid #cddfd4;">
    <img src="https://rqerjpkpvwtofpraqibh.supabase.co/storage/v1/object/public/project-attachments/logo.png"
      alt="Lifewood" height="44" style="height:44px;display:block;margin:0 auto 6px;"/>
    <p style="margin:4px 0 0;font-size:10px;font-weight:600;color:#1a3a2a;letter-spacing:4px;text-transform:uppercase;">Data Technology</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:36px 40px 28px;">

    <!-- Badge -->
    ${badge ? `
    <div style="margin-bottom:24px;">
      <span style="display:inline-block;background:#1a3a2a;color:#ffffff;font-size:11px;font-weight:800;padding:6px 18px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">${badge}</span>
    </div>` : ''}

    <!-- Greeting -->
    <p style="margin:0 0 20px;font-size:16px;color:#1a2e1a;font-weight:500;">Dear <strong>${name}</strong>,</p>

    <!-- Content -->
    <div style="margin-bottom:20px;">${bodyHtml}</div>

    ${meta.length > 0 ? `
    <!-- Meta table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #cddfd4;border-radius:8px;overflow:hidden;margin-top:24px;">
      ${metaRows}
    </table>` : ''}

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f7f4ef;padding:20px 40px;text-align:center;border-top:1px solid #cddfd4;">
    <p style="margin:0 0 10px;font-size:13px;font-weight:800;color:#1a3a2a;">Lifewood Data Technology</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;"><tr>
      <td style="padding:0 8px;"><a href="https://www.instagram.com/lifewood_official/" style="font-size:12px;color:#1a3a2a;font-weight:700;text-decoration:none;">Instagram</a></td>
      <td style="padding:0 8px;color:#9fb2a6;">|</td>
      <td style="padding:0 8px;"><a href="https://www.facebook.com/LifewoodPH" style="font-size:12px;color:#1a3a2a;font-weight:700;text-decoration:none;">Facebook</a></td>
      <td style="padding:0 8px;color:#9fb2a6;">|</td>
      <td style="padding:0 8px;"><a href="https://www.youtube.com/@LifewoodDataTechnology" style="font-size:12px;color:#1a3a2a;font-weight:700;text-decoration:none;">YouTube</a></td>
      <td style="padding:0 8px;color:#9fb2a6;">|</td>
      <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/lifewood-data-technology-ltd." style="font-size:12px;color:#1a3a2a;font-weight:700;text-decoration:none;">LinkedIn</a></td>
    </tr></table>
    <p style="margin:0 0 4px;font-size:12px;color:#537161;">
      <a href="mailto:hr.lifewood@gmail.com" style="color:#1a3a2a;text-decoration:none;font-weight:600;">hr.lifewood@gmail.com</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#537161;">&copy; 2026 Lifewood &mdash; All Rights Reserved</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { to, name, subject, body, badge, meta, context, inquiry_id } = await req.json();

    if (!to || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const html = buildHtml(name || to, body, badge || 'Message from Lifewood', meta || []);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/simulated_emails`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        to,
        from: 'noreply@lifewoodph.com',
        subject: subject || 'A message from Lifewood',
        body,
        html,
        context: context || null,
        inquiry_id: inquiry_id || null,
      }),
    });

    const data = await insertRes.json();
    console.log('Simulated email saved:', insertRes.status, JSON.stringify(data));

    if (!insertRes.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: insertRes.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
