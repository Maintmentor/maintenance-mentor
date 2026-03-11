#!/usr/bin/env node

/**
 * Edge Function Deployment Validator
 * Checks deployment status and function health
 */

const https = require('https');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const FUNCTIONS_TO_TEST = [
  'health-check',
  'repair-diagnostic',
  'slack-alert-sender',
  'storage-monitor',
  'api-key-validator',
  'fetch-real-part-images',
  'fetch-real-part-images-cached',
  'generate-repair-image'
];

const IMAGE_FUNCTIONS = [
  'fetch-real-part-images',
  'fetch-real-part-images-cached',
  'generate-repair-image'
];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFunction(functionName) {
  return new Promise((resolve) => {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          name: functionName,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 500,
          response: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: functionName,
        status: 0,
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: functionName,
        status: 0,
        success: false,
        error: 'Request timeout'
      });
    });

    req.write(JSON.stringify({ test: true }));
    req.end();
  });
}

async function validateDeployment() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  Edge Function Deployment Validator       ║', 'blue');
  log('╚════════════════════════════════════════════╝\n', 'blue');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('❌ Missing environment variables!', 'red');
    log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', 'yellow');
    process.exit(1);
  }

  log('Testing deployed functions...\n', 'blue');

  const results = [];
  for (const func of FUNCTIONS_TO_TEST) {
    process.stdout.write(`Testing ${func}... `);
    const result = await testFunction(func);
    results.push(result);
    
    if (result.success) {
      log('✓ OK', 'green');
    } else {
      log(`✗ FAILED (${result.error || result.status})`, 'red');
    }
  }

  log('\n═══════════════════════════════════════════\n', 'blue');
  log('Deployment Summary:', 'blue');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log(`✓ Successful: ${successful}`, 'green');
  log(`✗ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed > 0) {
    log('\nFailed Functions:', 'yellow');
    results.filter(r => !r.success).forEach(r => {
      log(`  - ${r.name}: ${r.error || r.status}`, 'red');
    });
    log('\nRun ./deploy-edge-functions.sh to redeploy', 'yellow');
  } else {
    log('\n✅ All functions deployed successfully!', 'green');
  }

  // Image Functions Status section
  log('\n═══════════════════════════════════════════\n', 'blue');
  log('Image Functions Status:', 'blue');
  let imageFailures = 0;
  IMAGE_FUNCTIONS.forEach(name => {
    const result = results.find(r => r.name === name);
    if (result && result.success) {
      log(`  ✓ ${name}: LIVE`, 'green');
    } else {
      log(`  ✗ ${name}: DOWN`, 'red');
      imageFailures++;
    }
  });

  if (imageFailures > 0) {
    log('\n⚠️  One or more image functions are not responding.', 'yellow');
    log('Follow the deployment checklist to fix them:', 'yellow');
    log('  docs/DEPLOY_IMAGE_FUNCTIONS_CHECKLIST.md', 'yellow');
  } else {
    log('\n✅ All image functions are live!', 'green');
  }

  process.exit(failed > 0 ? 1 : 0);
}

validateDeployment();
