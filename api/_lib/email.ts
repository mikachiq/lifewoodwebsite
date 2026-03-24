import nodemailer from 'nodemailer';

type TemplateKey =
  | 'screening-link'
  | 'screening-reject'
  | 'screening-follow-up'
  | 'interview-schedule'
  | 'talent-pool'
  | 'inactive'
  | 'hired';

const WRAPPER = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f4efe6; font-family: Arial, Helvetica, sans-serif; padding: 10px 6px; color: #203228; }
  .wrap { max-width: 455px; margin: 0 auto; }
  .card { background: #ffffff; border: 1px solid #29463a; border-radius: 8px; overflow: hidden; }
  .logo-area { padding: 22px 24px 16px; text-align: center; background: #f4efe3; border-bottom: 1px solid #d5dfd6; }
  .logo-row { display: inline-flex; align-items: center; gap: 5px; }
  .logo-flame { display: inline-block; width: 8px; height: 18px; background: linear-gradient(180deg, #f6b23a 0%, #e28a1f 100%); border-radius: 8px 8px 8px 0; transform: rotate(12deg); }
  .logo-name { font-size: 18px; font-weight: 800; color: #0f4d3f; letter-spacing: -0.4px; }
  .logo-sub { font-size: 10px; font-weight: 500; letter-spacing: 0.35em; text-transform: uppercase; color: #203228; margin-top: 8px; }
  .body { padding: 18px 26px 14px; color: #203228; }
  .badge { display: inline-block; background: #234f3b; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px; margin-bottom: 12px; }
  .greeting { font-size: 14px; font-weight: 700; color: #203228; margin-bottom: 10px; }
  .text { font-size: 13px; line-height: 1.55; color: #31433a; margin-bottom: 8px; }
  .btn { display: inline-block; background: #0f4d3f; color: #ffffff !important; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 700; font-size: 13px; margin: 4px 0 12px; }
  .details { width: 100%; border-collapse: collapse; border: 1px solid #cfdccf; border-radius: 5px; margin: 14px 0 12px; }
  .dlabel { padding: 11px 14px; font-size: 13px; color: #4d6a5b; width: 38%; border-bottom: 1px solid #d9e3da; }
  .dvalue { padding: 11px 14px; font-size: 13px; font-weight: 700; color: #203228; text-align: left; border-bottom: 1px solid #d9e3da; }
  .dvalue.green { color: #0f6d58; }
  .dvalue.amber { color: #de940e; }
  tr:last-child .dlabel, tr:last-child .dvalue { border-bottom: none; }
  .footer { background: #f4efe6; border-top: 1px solid #d5dfd6; padding: 10px 24px 12px; text-align: center; }
  .ft-title { font-size: 13px; font-weight: 700; color: #203228; margin-bottom: 8px; }
  .ft-links { font-size: 12px; color: #4f6659; margin-bottom: 8px; }
  .ft-links a { color: #4f6659; text-decoration: none; margin: 0 5px; }
  .ft-email { font-size: 12px; color: #31433a; margin-bottom: 8px; }
  .ft-copy { font-size: 10px; color: #87988e; }
</style>
</head>
<body>
<div class="wrap"><div class="card">
  <div class="logo-area">
    <div class="logo-row">
      <span class="logo-flame"></span>
      <span class="logo-name">lifewood</span>
    </div>
    <div class="logo-sub">Data Technology</div>
  </div>
  <div class="body">{{BODY_CONTENT}}</div>
  <div class="footer">
    <p class="ft-title">Lifewood Data Technology</p>
    <p class="ft-links">
      <a href="#">Instagram</a> |
      <a href="#">Facebook</a> |
      <a href="#">YouTube</a> |
      <a href="#">LinkedIn</a>
    </p>
    <p class="ft-email">l1f3wood.hr@gmail.com</p>
    <p class="ft-copy">&copy; 2026 Lifewood &mdash; All Rights Reserved</p>
  </div>
</div></div>
<div style="display:none;max-height:0px;overflow:hidden;mso-hide:all;">{{UNIQUE_ID}}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
</body></html>`;

function today(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getBodyContent(
  templateKey: TemplateKey,
  vars: { name: string; role: string; reason: string; body: string; interviewDate: string; meetLink: string }
): string {
  switch (templateKey) {
    case 'screening-link':
      return `
<span class="badge">Pre-Screening Assessment</span>
<p class="greeting">Dear ${vars.name},</p>
<p class="text">Thank you for reaching out to Lifewood regarding the <strong>${vars.role}</strong> position.</p>
<p class="text">We have reviewed your application and would like to invite you to complete the AI screening assessment as the next step in the process.</p>
<p class="text">Please complete the assessment at your earliest convenience using the link below. It should take approximately 15–20 minutes.</p>
<a href="https://lifewoodph-ai-interviewer.vercel.app/" class="btn">Start AI Screening &rarr;</a>
<table class="details" cellpadding="0" cellspacing="0">
  <tr><td class="dlabel">Position</td><td class="dvalue">${vars.role}</td></tr>
  <tr><td class="dlabel">Date Sent</td><td class="dvalue">${today()}</td></tr>
</table>
<p class="text">Please complete this within <strong>2 business days</strong> to keep your application active. We look forward to hearing from you.</p>`;

    case 'screening-reject':
      return `
<span class="badge">Application Update</span>
<p class="greeting">Dear ${vars.name},</p>
<p class="text">Thank you for reaching out to Lifewood regarding the <strong>${vars.role}</strong> position and for the time you invested in your application.</p>
<p class="text">After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
<p class="text">${vars.reason}</p>
<table class="details" cellpadding="0" cellspacing="0">
  <tr><td class="dlabel">Position</td><td class="dvalue">${vars.role}</td></tr>
  <tr><td class="dlabel">Date</td><td class="dvalue">${today()}</td></tr>
</table>
<p class="text">We appreciate the effort you put into your application and wish you all the best in your future endeavors.</p>`;

    case 'screening-follow-up':
      return `
<span class="badge">Screening Reminder</span>
<p class="greeting">Dear ${vars.name},</p>
<p class="text">This is a friendly reminder that you have a pending AI screening assessment for the <strong>${vars.role}</strong> position at Lifewood.</p>
<p class="text">Please complete the assessment as soon as possible using the link below.</p>
<a href="https://lifewoodph-ai-interviewer.vercel.app/" class="btn">Complete AI Screening &rarr;</a>
<table class="details" cellpadding="0" cellspacing="0">
  <tr><td class="dlabel">Position</td><td class="dvalue">${vars.role}</td></tr>
  <tr><td class="dlabel">Date</td><td class="dvalue">${today()}</td></tr>
</table>
<p class="text">If we do not hear back, your application may be marked as inactive. Please reach out if you have any questions.</p>`;

    case 'interview-schedule':
      return `
<span class="badge">Interview Invitation</span>
<p class="greeting">Dear ${vars.name},</p>
${vars.body ? `<p class="text">${vars.body}</p>` : ''}
<p class="text">Please review the interview details below.</p>
<table class="details" cellpadding="0" cellspacing="0">
  <tr><td class="dlabel">Position</td><td class="dvalue">${vars.role}</td></tr>
  <tr><td class="dlabel">Date &amp; Time</td><td class="dvalue">${vars.interviewDate || 'To be confirmed'}</td></tr>
  <tr><td class="dlabel">Meeting Link</td><td class="dvalue"><a href="${vars.meetLink}" style="color:#046241;font-weight:700;">${vars.meetLink || '—'}</a></td></tr>
</table>
<p class="text">Best regards,<br>The Lifewood HR Team</p>`;

    case 'talent-pool':
      return `
<span class="badge">Talent Pool</span>
<p class="greeting">Dear ${vars.name},</p>
<p class="text">${vars.body}</p>
<table class="details" cellpadding="0" cellspacing="0">
  <tr><td class="dlabel">Position</td><td class="dvalue">${vars.role}</td></tr>
  <tr><td class="dlabel">Date</td><td class="dvalue">${today()}</td></tr>
</table>
<p class="text">We appreciate your interest in Lifewood and will be in touch when a suitable opportunity arises.</p>`;

    case 'inactive':
      return `
<span class="badge">Application Status</span>
<p class="greeting">Dear ${vars.name},</p>
<p class="text">We noticed we haven't heard back from you regarding your application for the <strong>${vars.role}</strong> position at Lifewood.</p>
<p class="text">Your application has been marked as <strong>inactive</strong> due to no response within the allotted timeframe.</p>
<table class="details" cellpadding="0" cellspacing="0">
  <tr><td class="dlabel">Position</td><td class="dvalue">${vars.role}</td></tr>
  <tr><td class="dlabel">Date</td><td class="dvalue">${today()}</td></tr>
</table>
<p class="text">If you remain interested in opportunities at Lifewood, we welcome you to reapply in the future. Thank you for your interest, and we wish you the best.</p>`;

    case 'hired':
      return `
<span class="badge">Offer Extended</span>
<p class="greeting">Dear ${vars.name},</p>
<p class="text">We are absolutely thrilled to extend this offer to you! After a thorough evaluation, you have been selected for the <strong>${vars.role}</strong> position at Lifewood.</p>
<p class="text">We have discussed the details of your role and are confident that you will be a tremendous addition to our team.</p>
<p class="text">Our HR team will be reaching out shortly with your onboarding details and next steps. We look forward to speaking with you soon.</p>
<table class="details" cellpadding="0" cellspacing="0">
  <tr><td class="dlabel">Position</td><td class="dvalue">${vars.role}</td></tr>
  <tr><td class="dlabel">Date</td><td class="dvalue">${today()}</td></tr>
</table>
<p class="text">Welcome to the Lifewood family! We are excited to have you on board and look forward to achieving great things together.</p>`;

    default:
      return '';
  }
}

function getSubject(templateKey: TemplateKey, role: string): string {
  switch (templateKey) {
    case 'screening-link':      return `Next Step: Pre-Assessment for ${role} at Lifewood`;
    case 'screening-reject':    return `Your Application for ${role} at Lifewood`;
    case 'screening-follow-up': return `Reminder: Complete Your AI Screening — ${role} at Lifewood`;
    case 'interview-schedule':  return `Interview Scheduled — ${role} at Lifewood`;
    case 'talent-pool':         return `Update on Your Lifewood Application — ${role}`;
    case 'inactive':            return `Your Lifewood Application Has Been Marked Inactive — ${role}`;
    case 'hired':               return `Congratulations! You've Been Hired — ${role} at Lifewood`;
    default:                    return `Update from Lifewood HR`;
  }
}

function buildEmailHtml(templateKey: TemplateKey, vars: { name: string; role: string; reason: string; body: string; interviewDate: string; meetLink: string }): string {
  return WRAPPER
    .replace('{{BODY_CONTENT}}', getBodyContent(templateKey, vars))
    .replace('{{UNIQUE_ID}}', `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
}

function buildPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&rarr;/g, '→')
    .replace(/&mdash;/g, '—').replace(/&copy;/g, '©')
    .replace(/\n{3,}/g, '\n\n').trim();
}

const ACRONYMS = new Set(['ai', 'hr', 'it', 'qa', 'ui', 'ux', 'nlp', 'ml']);

export async function sendWorkflowEmail(opts: {
  templateKey: TemplateKey;
  to: string;
  name: string;
  role: string;
  customBody?: string;
  interviewDate?: string;
  meetLink?: string;
  reason?: string;
}): Promise<void> {
  const {
    templateKey, to, name, role, customBody,
    interviewDate = '',
    meetLink = process.env.DEFAULT_MEET_LINK || '',
    reason = 'We selected another candidate whose profile is more aligned with the current role requirements.',
  } = opts;

  let body = customBody ?? '';
  if (!body && templateKey === 'interview-schedule') {
    body = 'Congratulations on passing the initial screening! We would like to set an interview with you. Please note that if you do not join within 10 minutes of the scheduled time, we will consider your application as inactive.';
  }
  if (!body && templateKey === 'talent-pool') {
    body = "Thank you for your interest in Lifewood. While we don't have an immediate opening that matches your profile right now, we'd like to keep you in our talent pool for future opportunities.";
  }

  const cleanRole = role
    .split('-')
    .reduce((parts: string[], part: string) => {
      if (parts.length > 0 && /^[a-z0-9]{4,8}$/.test(part) && parts.length >= 2) return parts;
      return [...parts, part];
    }, [])
    .map((p: string) => ACRONYMS.has(p.toLowerCase()) ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  const cleanName = name.replace(/\S+/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const cleanBody = body.replace(/\n/g, '<br>');

  const vars = { name: cleanName, role: cleanRole, reason, body: cleanBody, interviewDate, meetLink };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const html = buildEmailHtml(templateKey, vars);
  const text = buildPlainText(html);
  const subject = getSubject(templateKey, cleanRole);

  await transporter.sendMail({
    from: `"Lifewood HR" <${process.env.GMAIL_USER}>`,
    to, subject, text, html,
  });
}
