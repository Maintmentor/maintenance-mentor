import { supabase } from '@/lib/supabase';

export const activateFreeTrial = async (userId: string, numberOfBeds: number = 1) => {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'trial',
        trial_ends_at: trialEndDate.toISOString(),
        number_of_beds: numberOfBeds,
        bed_count: numberOfBeds,
        subscription_tier: 'trial'
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error activating trial:', error);
    return { data: null, error };
  }
};


export const checkTrialExpiration = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('trial_ends_at, subscription_status')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (profile.subscription_status === 'trial' && profile.trial_ends_at) {
      const trialEnd = new Date(profile.trial_ends_at);
      const now = new Date();

      if (now > trialEnd) {
        // Trial has expired, update status
        await supabase
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('id', userId);

        return { expired: true, daysRemaining: 0 };
      }

      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { expired: false, daysRemaining };
    }

    return { expired: false, daysRemaining: null };
  } catch (error) {
    console.error('Error checking trial expiration:', error);
    return { expired: false, daysRemaining: null, error };
  }
};
