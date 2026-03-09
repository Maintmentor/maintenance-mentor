-- Add email templates table if not exists
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  subject_template text NOT NULL,
  html_template text NOT NULL,
  text_template text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add email template for API key alerts
INSERT INTO email_templates (template_name, subject_template, html_template, is_active)
VALUES 
(
  'api_key_alert',
  '🚨 API Key Alert: {{totalInvalid}} Invalid Keys Detected',
  '<!DOCTYPE html>
<html>
<head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:#667eea;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}
.alert-box{background:white;border-left:4px solid #ef4444;padding:15px;margin:15px 0}
.key-item{background:#fff;padding:12px;margin:8px 0;border:1px solid #e5e7eb}
.action-button{background:#667eea;color:white;padding:12px 24px;text-decoration:none;border-radius:6px}
</style></head>
<body>
<div class="container">
  <div class="header"><h1>🚨 API Key Alert</h1></div>
  <div class="content">
    <p>{{totalInvalid}} API keys require attention:</p>
    <div class="alert-box">
      {{#each invalidKeys}}
      <div class="key-item">
        <strong>{{name}}</strong><br>
        Type: {{type}}<br>
        Health: {{healthScore}}%<br>
        {{#if error}}Error: {{error}}{{/if}}
      </div>
      {{/each}}
    </div>
    <a href="{{dashboardUrl}}" class="action-button">View Dashboard</a>
  </div>
</div>
</body>
</html>',
  true
)
ON CONFLICT (template_name) DO UPDATE SET
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  updated_at = now();
