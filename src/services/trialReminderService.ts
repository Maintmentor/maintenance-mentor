import { supabase } from '@/lib/supabase';

export const checkAndSendTrialReminders = async () => {
  try {
    // Get all active trial users
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, trial_ends_at, trial_reminder_day5_sent, trial_reminder_day7_sent')
      .eq('subscription_status', 'trial')
      .not('trial_ends_at', 'is', null);

    if (error) throw error;

    const now = new Date();
    const remindersToSend = [];

    for (const profile of profiles || []) {
      const trialEnd = new Date(profile.trial_ends_at);
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send day 5 reminder (2 days remaining)
      if (daysRemaining === 2 && !profile.trial_reminder_day5_sent) {
        remindersToSend.push({
          userId: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          daysRemaining: 2,
          trialEndDate: profile.trial_ends_at,
          reminderType: 'day5'
        });
      }

      // Send day 7 reminder (last day)
      if (daysRemaining === 0 && !profile.trial_reminder_day7_sent) {
        remindersToSend.push({
          userId: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          daysRemaining: 0,
          trialEndDate: profile.trial_ends_at,
          reminderType: 'day7'
        });
      }
    }

    // Send reminders
    for (const reminder of remindersToSend) {
      try {
        const { error: emailError } = await supabase.functions.invoke('trial-reminder-email', {
          body: reminder
        });

        if (!emailError) {
          // Mark as sent
          const updateField = reminder.reminderType === 'day5' 
            ? { trial_reminder_day5_sent: true, trial_reminder_day5_sent_at: new Date().toISOString() }
            : { trial_reminder_day7_sent: true, trial_reminder_day7_sent_at: new Date().toISOString() };

          await supabase
            .from('profiles')
            .update(updateField)
            .eq('id', reminder.userId);
        }
      } catch (err) {
        console.error(`Failed to send reminder to ${reminder.email}:`, err);
      }
    }

    return { success: true, remindersSent: remindersToSend.length };
  } catch (error) {
    console.error('Error checking trial reminders:', error);
    return { success: false, error };
  }
};
