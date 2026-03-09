// Test file for repair-diagnostic function
// Run with: deno run --allow-net --allow-env test.ts

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'your-anon-key';

async function testRepairDiagnostic() {
  console.log('🧪 Testing repair-diagnostic function...\n');
  
  const testCases = [
    {
      name: 'Simple question',
      body: { question: 'How do I fix a leaky faucet?' }
    },
    {
      name: 'Part identification',
      body: { question: 'What does a toilet fill valve look like?' }
    },
    {
      name: 'Complex repair',
      body: { question: 'My AC is not cooling properly, what should I check?' }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`Question: ${testCase.body.question}`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/repair-diagnostic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.body)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Success!');
        console.log(`Answer preview: ${data.answer?.substring(0, 100)}...`);
        console.log(`Part images found: ${data.partImages?.length || 0}`);
      } else {
        console.log('❌ Failed!');
        console.log(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('❌ Request failed!');
      console.log(`Error: ${error.message}`);
    }
  }
  
  console.log('\n\n🏁 Testing complete!');
}

// Run the test
testRepairDiagnostic();