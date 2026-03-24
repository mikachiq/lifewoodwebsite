import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.0.0/mod.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildHtml(name: string, bodyText: string, badge: string, meta: { label: string; value: string; color?: string }[]): string {
  const bodyHtml = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" style="color:#133020;font-weight:600;">${url}</a>`)
    .split('\n')
    .map(line => {
      if (line.trim() === '') {
        return `<div style="height:18px;"></div>`;
      }
      if (line.trim().startsWith('- ')) {
        return `<li style="margin:0 0 8px;color:#2a4a3a;font-size:13px;line-height:1.7;">${line.trim().slice(2)}</li>`;
      }
      return `<p style="margin:0 0 14px;color:#2a4a3a;font-size:13px;line-height:1.7;">${line}</p>`;
    })
    .join('');

  const metaRows = meta.map(({ label, value, color }) => `
    <tr style="border-top:1px solid #d7e4dc;">
      <td style="padding:6px 12px;font-size:12px;color:#537161;font-weight:500;">${label}</td>
      <td style="padding:6px 12px;font-size:12px;font-weight:700;text-align:left;color:${color || '#1a2e1a'};">${value}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f0ebe0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe0;padding:16px;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);border:2px solid #133020;">

  <!-- Header -->
  <tr><td style="background:#f0ebe0;padding:14px 32px;text-align:center;border-bottom:1px solid #cddfd4;">
    <img src="https://rqerjpkpvwtofpraqibh.supabase.co/storage/v1/object/public/project-attachments/logo.png"
      alt="Lifewood" height="32" style="height:32px;display:block;margin:0 auto 2px;"/>
    <p style="margin:0;font-size:9px;font-weight:600;color:#1a3a2a;letter-spacing:4px;text-transform:uppercase;">Data Technology</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:20px 32px 16px;">
    ${badge ? `<div style="margin-bottom:12px;"><span style="display:inline-block;background:#1a3a2a;color:#ffffff;font-size:10px;font-weight:800;padding:4px 14px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">${badge}</span></div>` : ''}
    <p style="margin:0 0 10px;font-size:14px;color:#1a2e1a;font-weight:500;">Dear <strong>${name}</strong>,</p>
    <div style="margin-bottom:10px;">${bodyHtml}</div>
    ${meta.length > 0 ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #cddfd4;border-radius:6px;overflow:hidden;margin-top:12px;">${metaRows}</table>` : ''}
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f7f4ef;padding:10px 32px;text-align:center;border-top:1px solid #cddfd4;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#1a3a2a;">Lifewood Data Technology</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 6px;"><tr>
      <td style="padding:0 5px;"><a href="https://www.instagram.com/lifewood_official/" style="font-size:11px;color:#1a3a2a;font-weight:700;text-decoration:none;">Instagram</a></td>
      <td style="padding:0 5px;color:#9fb2a6;">|</td>
      <td style="padding:0 5px;"><a href="https://www.facebook.com/LifewoodPH" style="font-size:11px;color:#1a3a2a;font-weight:700;text-decoration:none;">Facebook</a></td>
      <td style="padding:0 5px;color:#9fb2a6;">|</td>
      <td style="padding:0 5px;"><a href="https://www.youtube.com/@LifewoodDataTechnology" style="font-size:11px;color:#1a3a2a;font-weight:700;text-decoration:none;">YouTube</a></td>
      <td style="padding:0 5px;color:#9fb2a6;">|</td>
      <td style="padding:0 5px;"><a href="https://www.linkedin.com/company/lifewood-data-technology-ltd." style="font-size:11px;color:#1a3a2a;font-weight:700;text-decoration:none;">LinkedIn</a></td>
    </tr></table>
    <p style="margin:0 0 2px;font-size:11px;color:#537161;">
      <a href="mailto:l1f3wood.hr@gmail.com" style="color:#1a3a2a;text-decoration:none;font-weight:600;">l1f3wood.hr@gmail.com</a>
    </p>
    <p style="margin:2px 0 0;font-size:10px;color:#537161;">&copy; 2026 Lifewood &mdash; All Rights Reserved</p>
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
    const { to, name, subject, body, badge, meta } = await req.json();

    if (!to || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const gmailUser = Deno.env.get('GMAIL_USER')!;
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD')!;
    const emailFrom = Deno.env.get('EMAIL_FROM') || gmailUser;
    const html = buildHtml(name || to, body, badge || 'Message from Lifewood', meta || [])
      .replace(/\n\s*/g, '');

    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPass,
        },
      },
    });

    await client.send({
      from: `Lifewood <${emailFrom}>`,
      to,
      subject: subject || 'A message from Lifewood',
      html,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
