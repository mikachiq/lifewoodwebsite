import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { sendWorkflowEmail } from '../lib/email';

const router = Router();

router.get('/', async (_req, res) => {
  const now = new Date().toISOString();
  let checked = 0;
  let followUpsSent = 0;
  let markedInactive = 0;

  try {
    // ------------------------------------------------------------------
    // Step 1: Find applicants whose response_due_at has passed and are
    //         still in 'Screening Sent' status (not in talent pool).
    //         Action: send follow-up email, set follow_up_due_at = +2 days,
    //                 clear response_due_at.
    // ------------------------------------------------------------------
    const { data: overdueScreening, error: screeningErr } = await supabase
      .from('hr_applicants')
      .select('id, name, email, role')
      .eq('status', 'Screening Sent')
      .eq('talent_pool', false)
      .lt('response_due_at', now)
      .not('response_due_at', 'is', null);

    if (screeningErr) {
      console.error('[cron/sla] Error fetching overdue screening applicants:', screeningErr);
    } else if (overdueScreening && overdueScreening.length > 0) {
      checked += overdueScreening.length;

      for (const applicant of overdueScreening) {
        // Calculate follow_up_due_at = now + 2 days
        const followUpDue = new Date();
        followUpDue.setDate(followUpDue.getDate() + 2);

        try {
          await sendWorkflowEmail({
            templateKey: 'screening-follow-up',
            to: applicant.email,
            name: applicant.name,
            role: applicant.role,
          });
          followUpsSent++;
        } catch (emailErr) {
          console.error(
            `[cron/sla] Failed to send follow-up email to ${applicant.email}:`,
            emailErr
          );
        }

        const { error: updateErr } = await supabase
          .from('hr_applicants')
          .update({
            follow_up_due_at: followUpDue.toISOString(),
            response_due_at: null,
          })
          .eq('id', applicant.id);

        if (updateErr) {
          console.error(
            `[cron/sla] Failed to update follow_up_due_at for ${applicant.id}:`,
            updateErr
          );
        }
      }
    }

    // ------------------------------------------------------------------
    // Step 2: Find applicants whose follow_up_due_at has passed and are
    //         not in the talent pool.
    //         Action: send inactive email, then delete the record.
    // ------------------------------------------------------------------
    const { data: overdueFollowUp, error: followUpErr } = await supabase
      .from('hr_applicants')
      .select('id, name, email, role')
      .eq('talent_pool', false)
      .lt('follow_up_due_at', now)
      .not('follow_up_due_at', 'is', null);

    if (followUpErr) {
      console.error('[cron/sla] Error fetching overdue follow-up applicants:', followUpErr);
    } else if (overdueFollowUp && overdueFollowUp.length > 0) {
      checked += overdueFollowUp.length;

      for (const applicant of overdueFollowUp) {
        try {
          await sendWorkflowEmail({
            templateKey: 'inactive',
            to: applicant.email,
            name: applicant.name,
            role: applicant.role,
          });
        } catch (emailErr) {
          console.error(
            `[cron/sla] Failed to send inactive email to ${applicant.email}:`,
            emailErr
          );
        }

        const { error: deleteErr } = await supabase
          .from('hr_applicants')
          .delete()
          .eq('id', applicant.id);

        if (deleteErr) {
          console.error(
            `[cron/sla] Failed to delete inactive applicant ${applicant.id}:`,
            deleteErr
          );
        } else {
          markedInactive++;
        }
      }
    }

    return res.json({
      checked,
      followUpsSent,
      markedInactive,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/sla] Unexpected error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
