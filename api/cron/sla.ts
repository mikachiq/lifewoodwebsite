import type { IncomingMessage, ServerResponse } from 'http';
import { supabase } from '../_lib/supabase.js';
import { sendWorkflowEmail } from '../_lib/email.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  const now = new Date().toISOString();
  let checked = 0, followUpsSent = 0, markedInactive = 0;

  try {
    const { data: overdueScreening } = await supabase
      .from('hr_applicants').select('id, name, email, role')
      .eq('status', 'Screening Sent').eq('talent_pool', false)
      .lt('response_due_at', now).not('response_due_at', 'is', null);

    if (overdueScreening?.length) {
      checked += overdueScreening.length;
      for (const a of overdueScreening) {
        try { await sendWorkflowEmail({ templateKey: 'screening-follow-up', to: a.email, name: a.name, role: a.role }); followUpsSent++; } catch { /* continue */ }
        const followUpDue = new Date(); followUpDue.setDate(followUpDue.getDate() + 2);
        await supabase.from('hr_applicants').update({ follow_up_due_at: followUpDue.toISOString(), response_due_at: null }).eq('id', a.id);
      }
    }

    const { data: overdueFollowUp } = await supabase
      .from('hr_applicants').select('id, name, email, role')
      .eq('talent_pool', false).lt('follow_up_due_at', now).not('follow_up_due_at', 'is', null);

    if (overdueFollowUp?.length) {
      checked += overdueFollowUp.length;
      for (const a of overdueFollowUp) {
        try { await sendWorkflowEmail({ templateKey: 'inactive', to: a.email, name: a.name, role: a.role }); } catch { /* continue */ }
        const { error } = await supabase.from('hr_applicants').delete().eq('id', a.id);
        if (!error) markedInactive++;
      }
    }

    res.writeHead(200);
    res.end(JSON.stringify({ checked, followUpsSent, markedInactive, ts: new Date().toISOString() }));
  } catch (err) {
    console.error('[api/cron/sla] error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: String(err) }));
  }
}
