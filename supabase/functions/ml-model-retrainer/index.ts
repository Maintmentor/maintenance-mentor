export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: currentConfig } = await supabase
      .from('ml_model_configs')
      .select('*')
      .eq('model_name', 'advanced_image_quality')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const lastDate = currentConfig?.created_at || '2000-01-01';

    const { data: newFeedback, count } = await supabase
      .from('image_quality_feedback')
      .select('*', { count: 'exact' })
      .gte('created_at', lastDate)
      .not('edge_density', 'is', null);

    if (!count || count < 100) {
      return new Response(JSON.stringify({
        success: false,
        message: `Insufficient feedback: ${count}/100`,
        skipped: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Initialize weights
    let weights = {
      edgeDensity: currentConfig?.edge_density_weight || 0.15,
      sharpness: currentConfig?.sharpness_weight || 0.20,
      colorfulness: currentConfig?.colorfulness_weight || 0.10,
      contrast: currentConfig?.contrast_weight || 0.15,
      objectConfidence: currentConfig?.object_confidence_weight || 0.25,
      resolution: currentConfig?.resolution_weight || 0.10,
      centeredness: currentConfig?.centeredness_weight || 0.05,
      bias: currentConfig?.bias_weight || 0.5
    };

    const learningRate = 0.1;

    // Training with gradient descent
    for (let epoch = 0; epoch < 50; epoch++) {
      const gradients = Object.fromEntries(Object.keys(weights).map(k => [k, 0]));

      for (const sample of newFeedback || []) {
        const predicted = 
          weights.edgeDensity * (sample.edge_density || 0) +
          weights.sharpness * (sample.sharpness || 0) +
          weights.colorfulness * (sample.colorfulness || 0) +
          weights.contrast * (sample.contrast || 0) +
          weights.objectConfidence * (sample.object_confidence || 0) +
          weights.resolution * ((sample.image_resolution || 0) / 1000000) +
          weights.centeredness * (sample.centeredness || 0) +
          weights.bias;

        const actual = sample.feedback_type === 'positive' ? 1 : 0;
        const error = predicted - actual;

        gradients.edgeDensity += error * (sample.edge_density || 0);
        gradients.sharpness += error * (sample.sharpness || 0);
        gradients.colorfulness += error * (sample.colorfulness || 0);
        gradients.contrast += error * (sample.contrast || 0);
        gradients.objectConfidence += error * (sample.object_confidence || 0);
        gradients.resolution += error * ((sample.image_resolution || 0) / 1000000);
        gradients.centeredness += error * (sample.centeredness || 0);
        gradients.bias += error;
      }

      Object.keys(weights).forEach(key => {
        weights[key] -= (learningRate * gradients[key]) / count;
      });
    }

    // Validate
    let correct = 0;
    for (const sample of newFeedback || []) {
      const predicted = 
        weights.edgeDensity * (sample.edge_density || 0) +
        weights.sharpness * (sample.sharpness || 0) +
        weights.colorfulness * (sample.colorfulness || 0) +
        weights.contrast * (sample.contrast || 0) +
        weights.objectConfidence * (sample.object_confidence || 0) +
        weights.resolution * ((sample.image_resolution || 0) / 1000000) +
        weights.centeredness * (sample.centeredness || 0) +
        weights.bias;

      const predictedClass = predicted > 0.5 ? 'positive' : 'negative';
      if (predictedClass === sample.feedback_type) correct++;
    }

    const accuracy = correct / count;

    if (accuracy < 0.6) {
      return new Response(JSON.stringify({
        success: false,
        message: `Accuracy ${(accuracy * 100).toFixed(1)}% below 60%`,
        rejected: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase.from('ml_model_configs').insert({
      model_name: 'advanced_image_quality',
      model_version: `v${Date.now()}`,
      model_type: 'advanced_cv',
      accuracy,
      training_samples: count,
      edge_density_weight: weights.edgeDensity,
      sharpness_weight: weights.sharpness,
      colorfulness_weight: weights.colorfulness,
      contrast_weight: weights.contrast,
      object_confidence_weight: weights.objectConfidence,
      resolution_weight: weights.resolution,
      centeredness_weight: weights.centeredness,
      bias_weight: weights.bias,
      config: weights
    });

    return new Response(JSON.stringify({
      success: true,
      accuracy,
      weights,
      trainingCount: count
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
