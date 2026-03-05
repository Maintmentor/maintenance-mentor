#!/usr/bin/env node

/**
 * AI Agent Diagnostic Tool
 * Run this to diagnose and fix AI agent issues
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testEdgeFunction(url, anonKey) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ question: 'test connection' });
    
    const urlParts = new URL(url);
    const options = {
      hostname: urlParts.hostname,
      port: 443,
      path: '/functions/v1/repair-diagnostic',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ success: res.statusCode === 200, data: parsed, statusCode: res.statusCode });
        } catch (e) {
          resolve({ success: false, error: 'Invalid JSON response', statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function diagnose() {
  log('\n🔍 AI Agent Diagnostic Tool\n', 'cyan');
  
  // Step 1: Check environment
  log('Step 1: Checking environment variables...', 'blue');
  
  const hasSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const hasSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    log('❌ Missing Supabase configuration', 'red');
    log('\nPlease set these environment variables:', 'yellow');
    log('  - VITE_SUPABASE_URL or SUPABASE_URL');
    log('  - VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
    
    const url = await question('\nEnter your Supabase URL: ');
    const key = await question('Enter your Supabase Anon Key: ');
    
    // Step 2: Test edge function
    log('\nStep 2: Testing edge function...', 'blue');
    const result = await testEdgeFunction(url, key);
    
    if (result.success) {
      log('✅ Edge function is working!', 'green');
      log(`Response: ${JSON.stringify(result.data, null, 2)}`);
    } else {
      log('❌ Edge function test failed', 'red');
      log(`Error: ${result.error || `HTTP ${result.statusCode}`}`, 'red');
      
      if (result.data?.error?.includes('OpenAI')) {
        log('\n⚠️  OpenAI API key not configured in Supabase', 'yellow');
        log('\nTo fix this:', 'cyan');
        log('1. Run: supabase secrets set OPENAI_API_KEY=your-key-here');
        log('2. Run: supabase functions deploy repair-diagnostic');
      }
    }
  } else {
    log('✅ Environment variables found', 'green');
  }
  
  // Step 3: Check common issues
  log('\nStep 3: Checking common issues...', 'blue');
  
  log('\n📋 Common Issues Checklist:', 'cyan');
  log('');
  log('1. OpenAI API Key in Supabase:');
  log('   Run: supabase secrets list');
  log('   Should show OPENAI_API_KEY');
  log('');
  log('2. Edge Function Deployed:');
  log('   Run: supabase functions list');
  log('   Should show repair-diagnostic as ACTIVE');
  log('');
  log('3. Frontend Configuration:');
  log('   - Remove VITE_OPENAI_API_KEY from .env');
  log('   - Ensure using edge function, not direct OpenAI');
  log('');
  log('4. Test in Browser Console:');
  log("   const {data, error} = await supabase.functions.invoke('repair-diagnostic', {body: {question: 'test'}})");
  log('   console.log(data, error)');
  
  // Step 4: Provide fix commands
  log('\n🔧 Quick Fix Commands:', 'cyan');
  log('');
  log('# Set OpenAI API key in Supabase:');
  log('supabase secrets set OPENAI_API_KEY=sk-...');
  log('');
  log('# Deploy edge function:');
  log('supabase functions deploy repair-diagnostic');
  log('');
  log('# Check logs:');
  log('supabase functions logs repair-diagnostic');
  
  rl.close();
}

// Run diagnostics
diagnose().catch(console.error);