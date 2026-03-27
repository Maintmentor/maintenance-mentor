# Deployment Notification Setup Guide

## Overview
Configure automated notifications for CI/CD pipeline events including deployments, failures, and rollbacks.

## Notification Channels

### 1. Slack Notifications

#### Setup Slack Webhook

1. **Create Slack App:**
   - Go to https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - Name: "Deployment Notifications"
   - Select your workspace

2. **Enable Incoming Webhooks:**
   - Go to "Incoming Webhooks" in left menu
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Select channel (e.g., #deployments)
   - Copy webhook URL

3. **Add to GitHub Secrets:**
   ```
   Name: SLACK_WEBHOOK_URL
   Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
   ```

4. **Test Webhook:**
   ```bash
   curl -X POST -H 'Content-Type: application/json' \
     -d '{"text":"Test deployment notification"}' \
     YOUR_WEBHOOK_URL
   ```

#### Customize Slack Messages

Edit `.github/workflows/deploy-edge-functions.yml`:

```yaml
- name: Send Slack Notification
  run: |
    curl -X POST $SLACK_WEBHOOK_URL \
      -H 'Content-Type: application/json' \
      -d '{
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "🚀 Deployment Successful"
            }
          },
          {
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": "*Environment:*\n${{ github.event.inputs.environment }}"
              },
              {
                "type": "mrkdwn",
                "text": "*Deployed by:*\n${{ github.actor }}"
              }
            ]
          }
        ]
      }'
```

### 2. Email Notifications (SendGrid)

#### Setup SendGrid

1. **Create SendGrid Account:**
   - Sign up at https://sendgrid.com
   - Verify your email domain

2. **Generate API Key:**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "GitHub Actions"
   - Permissions: "Full Access"
   - Copy the key (shown only once!)

3. **Add to GitHub Secrets:**
   ```
   Name: SENDGRID_API_KEY
   Value: SG.xxxxxxxxxxxxxxxxxxxxx
   Name: NOTIFICATION_EMAIL
   Value: devops@yourcompany.com
   ```

4. **Verify Sender:**
   - Go to Settings → Sender Authentication
   - Add and verify your sender email

#### Email Templates

Create dynamic email templates:

```javascript
const emailTemplate = {
  personalizations: [{
    to: [{ email: process.env.NOTIFICATION_EMAIL }],
    dynamic_template_data: {
      environment: 'production',
      deployment_id: '12345',
      deployed_by: 'john.doe',
      status: 'success',
      functions: ['repair-diagnostic', 'health-check'],
      timestamp: new Date().toISOString()
    }
  }],
  from: { email: 'noreply@yourcompany.com', name: 'Deployment Bot' },
  template_id: 'd-xxxxxxxxxxxxxxxxxxxxx'
};
```

### 3. Discord Notifications

#### Setup Discord Webhook

1. **Create Webhook:**
   - Open Discord server
   - Go to Server Settings → Integrations
   - Click "Create Webhook"
   - Name: "Deployment Bot"
   - Select channel
   - Copy webhook URL

2. **Add to Workflow:**
   ```yaml
   - name: Send Discord Notification
     env:
       DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_URL }}
     run: |
       curl -X POST $DISCORD_WEBHOOK \
         -H "Content-Type: application/json" \
         -d '{
           "embeds": [{
             "title": "Deployment Successful",
             "color": 3066993,
             "fields": [
               {
                 "name": "Environment",
                 "value": "'${{ github.event.inputs.environment }}'",
                 "inline": true
               }
             ],
             "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
           }]
         }'
   ```

### 4. Microsoft Teams Notifications

#### Setup Teams Webhook

1. **Create Incoming Webhook:**
   - Open Teams channel
   - Click ⋯ → Connectors
   - Search "Incoming Webhook"
   - Configure and name it
   - Copy webhook URL

2. **Add to Workflow:**
   ```yaml
   - name: Send Teams Notification
     env:
       TEAMS_WEBHOOK: ${{ secrets.TEAMS_WEBHOOK_URL }}
     run: |
       curl -X POST $TEAMS_WEBHOOK \
         -H "Content-Type: application/json" \
         -d '{
           "@type": "MessageCard",
           "@context": "https://schema.org/extensions",
           "summary": "Deployment Notification",
           "themeColor": "0078D7",
           "title": "Deployment Successful",
           "sections": [{
             "facts": [
               {
                 "name": "Environment",
                 "value": "'${{ github.event.inputs.environment }}'"
               }
             ]
           }]
         }'
   ```

## Notification Events

### Configure When to Send Notifications

```yaml
# .github/workflows/deploy-edge-functions.yml

jobs:
  notify:
    runs-on: ubuntu-latest
    needs: [deploy, health-check]
    if: always() # Run regardless of previous job status
    steps:
      - name: Determine Status
        id: status
        run: |
          if [ "${{ needs.deploy.result }}" = "success" ]; then
            echo "status=success" >> $GITHUB_OUTPUT
            echo "emoji=✅" >> $GITHUB_OUTPUT
            echo "color=good" >> $GITHUB_OUTPUT
          elif [ "${{ needs.deploy.result }}" = "failure" ]; then
            echo "status=failed" >> $GITHUB_OUTPUT
            echo "emoji=❌" >> $GITHUB_OUTPUT
            echo "color=danger" >> $GITHUB_OUTPUT
          else
            echo "status=cancelled" >> $GITHUB_OUTPUT
            echo "emoji=⚠️" >> $GITHUB_OUTPUT
            echo "color=warning" >> $GITHUB_OUTPUT
          fi
```

### Event Types

1. **Deployment Started**
2. **Deployment Successful**
3. **Deployment Failed**
4. **Health Check Failed**
5. **Rollback Initiated**
6. **Rollback Completed**
7. **Tests Failed**
8. **Security Issues Found**

## Advanced Notification Features

### 1. Conditional Notifications

Only notify on production deployments:
```yaml
- name: Send Notification
  if: github.event.inputs.environment == 'production'
  run: # notification logic
```

### 2. Rate Limiting

Prevent notification spam:
```yaml
- name: Check Last Notification
  id: rate_limit
  run: |
    LAST_NOTIF=$(curl -s "https://api.github.com/repos/${{ github.repository }}/actions/runs" \
      -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
      | jq -r '.workflow_runs[0].created_at')
    
    SECONDS_SINCE=$(($(date +%s) - $(date -d "$LAST_NOTIF" +%s)))
    if [ $SECONDS_SINCE -lt 300 ]; then
      echo "skip=true" >> $GITHUB_OUTPUT
    fi

- name: Send Notification
  if: steps.rate_limit.outputs.skip != 'true'
  run: # notification logic
```

### 3. Rich Notifications

Include deployment metrics:
```javascript
const metrics = {
  deployment_time: '2m 34s',
  functions_deployed: 5,
  tests_passed: 42,
  code_coverage: '87%',
  performance_score: 95
};
```

### 4. Notification Groups

Group related notifications:
```yaml
env:
  SLACK_THREAD_TS: ${{ steps.initial_message.outputs.thread_ts }}

- name: Send Thread Reply
  run: |
    curl -X POST $SLACK_WEBHOOK_URL \
      -H 'Content-Type: application/json' \
      -d '{
        "thread_ts": "'$SLACK_THREAD_TS'",
        "text": "Health checks completed successfully"
      }'
```

## Testing Notifications

### Test Script

Create `test-notifications.sh`:
```bash
#!/bin/bash

# Test Slack
echo "Testing Slack..."
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test notification from CI/CD pipeline"}'

# Test Email
echo "Testing Email..."
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "'$NOTIFICATION_EMAIL'"}]}],
    "from": {"email": "test@example.com"},
    "subject": "Test Notification",
    "content": [{"type": "text/plain", "value": "Test"}]
  }'

echo "Notifications tested!"
```

## Troubleshooting

### Notifications Not Sending

1. **Check Secrets:**
   ```bash
   gh secret list
   ```

2. **Verify Webhook URLs:**
   - Test with curl
   - Check for URL expiration
   - Verify channel permissions

3. **Check Workflow Logs:**
   - Go to Actions tab
   - Click on workflow run
   - Expand notification step

### Formatting Issues

1. **Slack:** Use Block Kit Builder: https://app.slack.com/block-kit-builder
2. **Discord:** Use Embed Visualizer: https://autocode.com/tools/discord/embed-builder/
3. **Teams:** Use Card Playground: https://messagecardplayground.azurewebsites.net/

## Security Best Practices

1. **Never commit webhook URLs or API keys**
2. **Use GitHub Secrets for sensitive data**
3. **Rotate API keys regularly**
4. **Limit webhook permissions**
5. **Use environment-specific webhooks**
6. **Implement rate limiting**
7. **Validate webhook signatures when possible**