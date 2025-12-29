// Fix corrupted client data
// Run with: npx tsx scripts/fix-client-data.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixClientData(clientName: string = 'axeee') {
  console.log(`🔍 Finding "${clientName}" client...`);
  
  // Find the client
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', `%${clientName}%`);
  
  if (clientError) {
    console.error('❌ Error finding client:', clientError);
    return;
  }
  
  if (!clients || clients.length === 0) {
    console.log('❌ No clients found matching:', clientName);
    return;
  }
  
  console.log(`\n📋 Found ${clients.length} client(s):\n`);
  
  for (const client of clients) {
    console.log('━'.repeat(60));
    console.log(`📌 Client: ${client.name} (ID: ${client.id})`);
    console.log('━'.repeat(60));
    
    // Helper to check if value is empty object
    const isEmptyObject = (obj: any): boolean => {
      if (obj === null || obj === undefined) return false;
      if (typeof obj !== 'object') return false;
      if (Array.isArray(obj)) return false;
      return Object.keys(obj).length === 0;
    };
    
    // Helper to check if data has empty objects nested
    const hasNestedEmptyObjects = (data: any): boolean => {
      if (!data || typeof data !== 'object') return false;
      
      return Object.values(data).some(value => {
        if (isEmptyObject(value)) return true;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return Object.values(value).some(v => isEmptyObject(v));
        }
        return false;
      });
    };
    
    // Check intake_responses
    console.log('\n📄 intake_responses:');
    if (client.intake_responses === null) {
      console.log('  ✅ null (clean)');
    } else if (isEmptyObject(client.intake_responses)) {
      console.log('  ⚠️  EMPTY OBJECT {} detected!');
    } else if (hasNestedEmptyObjects(client.intake_responses)) {
      console.log('  ⚠️  Contains nested empty objects!');
      console.log('  ', JSON.stringify(client.intake_responses, null, 2).substring(0, 200));
    } else {
      const keys = Object.keys(client.intake_responses || {});
      console.log(`  ✅ Valid data (${keys.length} sections)`);
    }
    
    // Check questionnaire_status
    console.log('\n📊 questionnaire_status:', client.questionnaire_status || 'null');
    console.log('📅 questionnaire_completed_at:', client.questionnaire_completed_at || 'null');
    
    // Check questionnaire_progress
    console.log('\n📈 questionnaire_progress:');
    if (client.questionnaire_progress === null) {
      console.log('  ✅ null (clean)');
    } else if (isEmptyObject(client.questionnaire_progress)) {
      console.log('  ⚠️  EMPTY OBJECT {} detected!');
    } else {
      console.log('  ', JSON.stringify(client.questionnaire_progress, null, 2));
    }
    
    // Check questionnaire_responses table
    console.log('\n📋 Checking questionnaire_responses table...');
    const { data: responses, error: respError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('client_id', client.id);
    
    if (respError) {
      console.error('  ❌ Error:', respError);
    } else if (!responses || responses.length === 0) {
      console.log('  ℹ️  No responses found');
    } else {
      console.log(`  📦 Found ${responses.length} response(s)`);
      
      responses.forEach((resp, idx) => {
        console.log(`\n  Response ${idx + 1} (ID: ${resp.id}):`);
        console.log(`    - Version: ${resp.version}`);
        console.log(`    - Status: ${resp.status}`);
        console.log(`    - Is Latest: ${resp.is_latest}`);
        
        if (isEmptyObject(resp.response_data)) {
          console.log('    ⚠️  response_data is EMPTY OBJECT {}');
        } else if (hasNestedEmptyObjects(resp.response_data)) {
          console.log('    ⚠️  response_data contains nested empty objects');
        } else {
          const keys = Object.keys(resp.response_data || {});
          console.log(`    ✅ response_data has ${keys.length} sections`);
        }
      });
    }
    
    // Detect if cleanup is needed
    const needsCleanup = 
      isEmptyObject(client.intake_responses) ||
      hasNestedEmptyObjects(client.intake_responses) ||
      isEmptyObject(client.questionnaire_progress) ||
      (responses && responses.some(r => 
        isEmptyObject(r.response_data) || hasNestedEmptyObjects(r.response_data)
      ));
    
    if (needsCleanup) {
      console.log('\n' + '⚠️ '.repeat(30));
      console.log('⚠️  BAD DATA DETECTED - CLEANUP NEEDED');
      console.log('⚠️ '.repeat(30));
      console.log('\n🔧 Starting cleanup...\n');
      
      // Clean intake_responses
      if (isEmptyObject(client.intake_responses) || hasNestedEmptyObjects(client.intake_responses)) {
        console.log('  → Resetting intake_responses to null...');
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            intake_responses: null,
            questionnaire_status: 'not_started',
            questionnaire_completed_at: null,
          })
          .eq('id', client.id);
        
        if (updateError) {
          console.error('    ❌ Error:', updateError);
        } else {
          console.log('    ✅ Cleaned');
        }
      }
      
      // Clean questionnaire_progress
      if (isEmptyObject(client.questionnaire_progress)) {
        console.log('  → Resetting questionnaire_progress to null...');
        const { error: updateError } = await supabase
          .from('clients')
          .update({ questionnaire_progress: null })
          .eq('id', client.id);
        
        if (updateError) {
          console.error('    ❌ Error:', updateError);
        } else {
          console.log('    ✅ Cleaned');
        }
      }
      
      // Clean bad responses
      if (responses && responses.length > 0) {
        for (const resp of responses) {
          if (isEmptyObject(resp.response_data) || hasNestedEmptyObjects(resp.response_data)) {
            console.log(`  → Deleting bad response (ID: ${resp.id})...`);
            const { error: deleteError } = await supabase
              .from('questionnaire_responses')
              .delete()
              .eq('id', resp.id);
            
            if (deleteError) {
              console.error('    ❌ Error:', deleteError);
            } else {
              console.log('    ✅ Deleted');
            }
          }
        }
      }
      
      console.log('\n✅ Cleanup complete for', client.name);
    } else {
      console.log('\n✅ No cleanup needed - data looks good!');
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ All done!');
  console.log('═'.repeat(60));
}

// Get client name from command line args or default to 'axeee'
const clientName = process.argv[2] || 'axeee';
fixClientData(clientName).catch(console.error);

