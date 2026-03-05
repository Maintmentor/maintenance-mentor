# Deployment Notification Examples

## Slack Notification Examples

### Success Notification
```json
{
  "attachments": [{
    "color": "good",
    "author_name": "GitHub Actions",
    "author_icon": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    "title": "✅ Edge Functions Deployed Successfully",
    "title_link": "https://github.com/YOUR_ORG/YOUR_REPO/actions/runs/123456",
    "fields": [
      {
        "title": "Environment",
        "value": "Production",
        "short": true
      },
      {
        "title": "Branch",
        "value": "main",
        "short": true
      },
      {
        "title": "Deployed By",
        "value": "@john.doe",
        "short": true
      },
      {
        "title": "Duration",
        "value": "2m 34s",
        "short": true
      },
      {
        "title": "Functions Deployed",
        "value": "• repair-diagnostic\n• health-check\n• contact-form-handler\n• image-cache-handler",
        "short": false
      },
      {
        "title": "Commit",
        "value": "<https://github.com/YOUR_ORG/YOUR_REPO/commit/abc123|abc123>: Fix AI agent timeout issue",
        "short": false
      }
    ],
    "footer": "Supabase Edge Functions",
    "footer_icon": "https://supabase.com/favicon.ico",
    "ts": 1704067200
  }]
}
```

### Failure Notification
```json
{
  "attachments": [{
    "color": "danger",
    "author_name": "GitHub Actions",
    "title": "❌ Deployment Failed",
    "title_link": "https://github.com/YOUR_ORG/YOUR_REPO/actions/runs/123456",
    "text": "The deployment to production has failed. Immediate attention required!",
    "fields": [
      {
        "title": "Failed Function",
        "value": "repair-diagnostic",
        "short": true
      },
      {
        "title": "Error",
        "value": "API key validation failed",
        "short": true
      },
      {
        "title": "Suggested Action",
        "value": "Check OPENAI_API_KEY in Supabase secrets",
        "short": false
      }
    ],
    "actions": [
      {
        "type": "button",
        "text": "View Logs",
        "url": "https://github.com/YOUR_ORG/YOUR_REPO/actions/runs/123456"
      },
      {
        "type": "button",
        "text": "Rollback",
        "url": "https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/rollback.yml",
        "style": "danger"
      }
    ],
    "footer": "GitHub Actions",
    "ts": 1704067200
  }]
}
```

### Rollback Notification
```json
{
  "attachments": [{
    "color": "warning",
    "author_name": "Rollback System",
    "title": "⚠️ Emergency Rollback Initiated",
    "fields": [
      {
        "title": "Reason",
        "value": "High error rate detected in production",
        "short": false
      },
      {
        "title": "Rolling Back To",
        "value": "Deployment #12345 (2 hours ago)",
        "short": false
      },
      {
        "title": "Initiated By",
        "value": "@jane.smith",
        "short": true
      },
      {
        "title": "Affected Functions",
        "value": "repair-diagnostic, image-cache-handler",
        "short": false
      }
    ],
    "footer": "Rollback System",
    "ts": 1704067200
  }]
}
```

## Email Notification Templates

### HTML Success Email
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; }
    .success { color: #10b981; }
    .error { color: #ef4444; }
    .warning { color: #f59e0b; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ Deployment Successful</h2>
    </div>
    <div class="content">
      <p>The edge functions have been successfully deployed to <strong>production</strong>.</p>
      
      <h3>Deployment Details:</h3>
      <div class="metric">
        <strong>Environment:</strong> Production
      </div>
      <div class="metric">
        <strong>Branch:</strong> main
      </div>
      <div class="metric">
        <strong>Deployed By:</strong> john.doe
      </div>
      <div class="metric">
        <strong>Duration:</strong> 2m 34s
      </div>
      
      <h3>Functions Deployed:</h3>
      <ul>
        <li>✓ repair-diagnostic</li>
        <li>✓ health-check</li>
        <li>✓ contact-form-handler</li>
        <li>✓ image-cache-handler</li>
      </ul>
      
      <h3>Health Check Results:</h3>
      <ul>
        <li class="success">✓ All functions responding normally</li>
        <li class="success">✓ Average response time: 145ms</li>
        <li class="success">✓ All API keys validated</li>
      </ul>
      
      <p>
        <a href="https://github.com/YOUR_ORG/YOUR_REPO/actions/runs/123456" 
           style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Deployment Details
        </a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from your CI/CD pipeline.</p>
      <p><a href="#">Unsubscribe</a> | <a href="#">Notification Settings</a></p>
    </div>
  </div>
</body>
</html>
```

### Plain Text Failure Email
```text
DEPLOYMENT FAILED - IMMEDIATE ACTION REQUIRED

Environment: Production
Time: 2024-01-01 15:30:45 UTC
Attempted By: john.doe

ERROR DETAILS:
- Function: repair-diagnostic
- Error: TypeError: Cannot read property 'apiKey' of undefined
- Location: index.ts:45
- Stage: Deployment validation

FAILED CHECKS:
✗ API key validation failed
✗ Function compilation error
✗ Health check timeout

SUGGESTED ACTIONS:
1. Check OPENAI_API_KEY is set in Supabase secrets
2. Review recent code changes in repair-diagnostic function
3. Check Supabase service status
4. Consider rolling back to previous deployment

LINKS:
- View Logs: https://github.com/YOUR_ORG/YOUR_REPO/actions/runs/123456
- Rollback: https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/rollback.yml
- Supabase Dashboard: https://app.supabase.com/project/YOUR_PROJECT_ID

---
This is an automated notification from your CI/CD pipeline.
```

## Discord Embed Examples

### Rich Embed Notification
```json
{
  "embeds": [{
    "title": "🚀 Deployment Complete",
    "description": "Edge functions have been successfully deployed",
    "color": 3066993,
    "thumbnail": {
      "url": "https://supabase.com/favicon.ico"
    },
    "fields": [
      {
        "name": "📦 Environment",
        "value": "Production",
        "inline": true
      },
      {
        "name": "🌿 Branch",
        "value": "`main`",
        "inline": true
      },
      {
        "name": "👤 Deployed By",
        "value": "john.doe",
        "inline": true
      },
      {
        "name": "⚡ Functions",
        "value": "```\n• repair-diagnostic\n• health-check\n• contact-form\n```",
        "inline": false
      },
      {
        "name": "📊 Metrics",
        "value": "Response Time: **145ms**\nSuccess Rate: **100%**",
        "inline": false
      }
    ],
    "footer": {
      "text": "GitHub Actions • Deployment #12345",
      "icon_url": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
    },
    "timestamp": "2024-01-01T15:30:45.000Z"
  }]
}
```

## Microsoft Teams Card Examples

### Adaptive Card Notification
```json
{
  "@type": "MessageCard",
  "@context": "https://schema.org/extensions",
  "summary": "Deployment Notification",
  "themeColor": "0078D7",
  "title": "✅ Edge Functions Deployed Successfully",
  "sections": [
    {
      "activityTitle": "Deployment #12345",
      "activitySubtitle": "Production Environment",
      "activityImage": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      "facts": [
        {
          "name": "Environment",
          "value": "Production"
        },
        {
          "name": "Branch",
          "value": "main"
        },
        {
          "name": "Deployed By",
          "value": "john.doe"
        },
        {
          "name": "Duration",
          "value": "2m 34s"
        }
      ]
    },
    {
      "title": "Functions Deployed",
      "text": "• repair-diagnostic\n• health-check\n• contact-form-handler\n• image-cache-handler"
    },
    {
      "title": "Health Check Results",
      "facts": [
        {
          "name": "Status",
          "value": "✅ All Healthy"
        },
        {
          "name": "Response Time",
          "value": "145ms average"
        }
      ]
    }
  ],
  "potentialAction": [
    {
      "@type": "OpenUri",
      "name": "View Deployment",
      "targets": [
        {
          "os": "default",
          "uri": "https://github.com/YOUR_ORG/YOUR_REPO/actions/runs/123456"
        }
      ]
    },
    {
      "@type": "OpenUri",
      "name": "View Logs",
      "targets": [
        {
          "os": "default",
          "uri": "https://app.supabase.com/project/YOUR_PROJECT_ID/functions"
        }
      ]
    }
  ]
}
```

## Custom Webhook Payloads

### Generic JSON Webhook
```json
{
  "event": "deployment.success",
  "timestamp": "2024-01-01T15:30:45.000Z",
  "data": {
    "deployment_id": "12345",
    "environment": "production",
    "branch": "main",
    "commit": {
      "sha": "abc123def456",
      "message": "Fix AI agent timeout issue",
      "author": "john.doe"
    },
    "functions": [
      {
        "name": "repair-diagnostic",
        "status": "deployed",
        "version": "1.2.3",
        "size": "2.4MB"
      }
    ],
    "metrics": {
      "deployment_duration": 154,
      "tests_passed": 42,
      "tests_failed": 0,
      "code_coverage": 87.5
    },
    "health_checks": {
      "status": "healthy",
      "response_time_ms": 145,
      "checks_passed": 4,
      "checks_failed": 0
    }
  },
  "links": {
    "deployment": "https://github.com/YOUR_ORG/YOUR_REPO/actions/runs/123456",
    "commit": "https://github.com/YOUR_ORG/YOUR_REPO/commit/abc123",
    "dashboard": "https://app.supabase.com/project/YOUR_PROJECT_ID"
  }
}
```

## Notification Aggregation

### Daily Summary Email
```html
<h2>Daily Deployment Summary</h2>
<p>Date: January 1, 2024</p>

<h3>📊 Statistics</h3>
<table>
  <tr><td>Total Deployments:</td><td>12</td></tr>
  <tr><td>Successful:</td><td>10 (83%)</td></tr>
  <tr><td>Failed:</td><td>2 (17%)</td></tr>
  <tr><td>Rollbacks:</td><td>1</td></tr>
  <tr><td>Average Duration:</td><td>2m 45s</td></tr>
</table>

<h3>🚀 Deployments by Environment</h3>
<ul>
  <li>Production: 3</li>
  <li>Staging: 9</li>
</ul>

<h3>👥 Most Active Deployers</h3>
<ol>
  <li>john.doe - 5 deployments</li>
  <li>jane.smith - 4 deployments</li>
  <li>bob.wilson - 3 deployments</li>
</ol>

<h3>⚠️ Issues Requiring Attention</h3>
<ul>
  <li>Failed deployment at 14:30 - repair-diagnostic function</li>
  <li>Slow response times detected in image-cache-handler</li>
</ul>
```