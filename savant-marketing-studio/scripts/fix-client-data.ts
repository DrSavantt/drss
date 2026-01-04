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
    const isEmptyObject = (obj: unknown): boolean => {
      if (obj === null || obj === undefined) return false;
      if (typeof obj !== 'object') return false;
      if (Array.isArray(obj)) return false;
      return Object.keys(obj as object).length === 0;
    };
    
    // Helper to check if data has empty objects nested
    const hasNestedEmptyObjects = (data: unknown): boolean => {
      if (!data || typeof data !== 'object') return false;
      
      return Object.values(data as object).some(value => {
        if (isEmptyObject(value)) return true;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return Object.values(value as object).some(v => isEmptyObject(v));
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
    
    // Detect if cleanup is needed
    const needsCleanup = 
      isEmptyObject(client.intake_responses) ||
      hasNestedEmptyObjects(client.intake_responses) ||
      isEmptyObject(client.questionnaire_progress);
    
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

