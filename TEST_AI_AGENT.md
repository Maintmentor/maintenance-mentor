# Test AI Agent - Quick Verification Guide

## 🧪 Quick Test in Browser Console

Open your app and paste this in the browser console:

```javascript
// Test the AI agent directly
async function testAIAgent() {
  const response = await fetch('https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: 'How do I fix a running toilet?',
      imageUrls: [],
      conversationId: null,
      userId: 'test-user'
    })
  });
  
  const data = await response.json();
  console.log('AI Agent Response:', data);
  
  if (data.success) {
    console.log('✅ AI Agent is working!');
    console.log('Answer:', data.answer);
  } else {
    console.log('❌ AI Agent error:', data.error);
  }
  
  return data;
}

// Run the test
testAIAgent();
```

## 📱 Test in the App

1. Navigate to the chat interface
2. Ask: "How do I fix a leaky faucet?"
3. You should see:
   - Loading indicator
   - AI response with numbered steps
   - Part recommendations (if applicable)

## 🔍 Check Function Status

```bash
# Check if function is running
curl -I https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic

# Should return: HTTP/2 200 or HTTP/2 405
```

## 📊 Expected Successful Response

```json
{
  "success": true,
  "isMaintenanceRelated": true,
  "answer": "Here's how to fix a running toilet:\n\n1. First, turn off the water supply...",
  "partImages": [...],
  "stepImages": [],
  "videos": [],
  "topic": "general"
}
```

## ❌ Common Error Responses

### Missing API Key
```json
{
  "success": false,
  "error": "OpenAI API key not configured"
}
```
**Fix:** Set OPENAI_API_KEY in Supabase secrets

### Invalid API Key
```json
{
  "success": false,
  "error": "OpenAI API error: 401 Unauthorized"
}
```
**Fix:** Check API key validity and credits

### Timeout
```json
{
  "success": false,
  "error": "Request timeout - please try again"
}
```
**Fix:** Normal for complex queries, retry

## ✅ Success Indicators

- [ ] Function returns `success: true`
- [ ] Answer contains helpful repair instructions
- [ ] No error messages in console
- [ ] Chat interface displays the response
- [ ] Response time under 10 seconds

## 🚀 Quick Fix If Not Working

```bash
# 1. Set OpenAI API key
npx supabase secrets set OPENAI_API_KEY=sk-...

# 2. Redeploy function
npx supabase functions deploy repair-diagnostic

# 3. Test
curl -X POST https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -d '{"question":"test","imageUrls":[]}'
```

## 📝 View Live Logs

Go to: https://app.supabase.com/project/kudlclzjfihbphehhiii/functions/repair-diagnostic/logs

Look for:
- "Calling OpenAI API..."
- "AI Response received"
- Any error messages