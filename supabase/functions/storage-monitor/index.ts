import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;

    const alerts = [];
    const metrics = [];

    for (const bucket of buckets) {
      // Get bucket files
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 1000 });
      
      if (filesError) continue;

      // Calculate metrics
      const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const fileCount = files.length;
      const avgFileSize = fileCount > 0 ? Math.round(totalSize / fileCount) : 0;
      const maxFileSize = Math.max(...files.map(f => f.metadata?.size || 0));
      
      // Assume 5GB capacity per bucket for demo
      const capacityLimit = 5 * 1024 * 1024 * 1024; // 5GB in bytes
      const capacityPercentage = (totalSize / capacityLimit) * 100;

      // Store metrics
      const { error: metricsError } = await supabase
        .from('storage_metrics')
        .insert({
          bucket_name: bucket.name,
          total_size: totalSize,
          file_count: fileCount,
          avg_file_size: avgFileSize,
          max_file_size: maxFileSize,
          capacity_percentage: capacityPercentage
        });

      metrics.push({
        bucket: bucket.name,
        totalSize,
        fileCount,
        capacityPercentage
      });

      // Check for capacity alert (80% threshold)
      if (capacityPercentage >= 80) {
        const severity = capacityPercentage >= 95 ? 'critical' : 
                        capacityPercentage >= 90 ? 'high' : 'medium';
        
        alerts.push({
          alert_type: 'capacity',
          bucket_name: bucket.name,
          severity,
          title: `Storage Capacity Alert: ${bucket.name}`,
          message: `Bucket ${bucket.name} is at ${capacityPercentage.toFixed(1)}% capacity`,
          metadata: { capacityPercentage, totalSize, fileCount }
        });
      }

      // Check for unusual upload patterns
      const recentMetrics = await supabase
        .from('storage_metrics')
        .select('*')
        .eq('bucket_name', bucket.name)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentMetrics.data && recentMetrics.data.length > 1) {
        const avgRecentSize = recentMetrics.data.reduce((sum, m) => sum + m.total_size, 0) / recentMetrics.data.length;
        const growthRate = ((totalSize - avgRecentSize) / avgRecentSize) * 100;

        if (growthRate > 50) {
          alerts.push({
            alert_type: 'unusual_pattern',
            bucket_name: bucket.name,
            severity: growthRate > 100 ? 'high' : 'medium',
            title: `Unusual Upload Pattern: ${bucket.name}`,
            message: `Bucket ${bucket.name} has grown ${growthRate.toFixed(1)}% in the last 7 days`,
            metadata: { growthRate, currentSize: totalSize, avgSize: avgRecentSize }
          });
        }
      }

      // Check for stale files (6+ months)
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const staleFiles = files.filter(f => 
        f.updated_at && new Date(f.updated_at) < sixMonthsAgo
      );

      if (staleFiles.length > 10) {
        const staleSize = staleFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
        
        alerts.push({
          alert_type: 'stale_files',
          bucket_name: bucket.name,
          severity: 'low',
          title: `Stale Files Detected: ${bucket.name}`,
          message: `${staleFiles.length} files haven't been accessed in 6+ months (${(staleSize / 1024 / 1024).toFixed(1)}MB)`,
          metadata: { staleCount: staleFiles.length, staleSize }
        });
      }
    }

    // Insert alerts
    if (alerts.length > 0) {
      const { error: alertsError } = await supabase
        .from('storage_alerts')
        .insert(alerts);
      
      if (alertsError) console.error('Error inserting alerts:', alertsError);
    }

    return new Response(JSON.stringify({
      success: true,
      metrics,
      alertsCreated: alerts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Storage monitor error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});