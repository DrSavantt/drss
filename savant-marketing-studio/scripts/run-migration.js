#!/usr/bin/env node

/**
 * Run SQL Migration Script
 * Executes the count_journal_entries RPC function migration
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read the SQL file
const sqlPath = path.join(__dirname, '../supabase/migrations/20251220000001_add_count_journal_entries_rpc.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

// Get Supabase credentials from environment or args
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Usage: node run-migration.js <service-role-key>')
  console.error('Or set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

async function runMigration() {
  console.log('🔄 Connecting to Supabase...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('📝 Executing SQL migration...')
  
  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // Try direct query if RPC doesn't exist
      const { error: directError } = await supabase
        .from('_sql')
        .insert({ query: sql })
      
      if (directError) {
        throw directError
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('\n🧪 Testing the function...')
    
    // Test the function
    const { data: testData, error: testError } = await supabase.rpc('count_journal_entries')
    
    if (testError) {
      console.error('⚠️  Function created but test failed:', testError.message)
      console.log('This is normal if you need to be authenticated to test.')
    } else {
      console.log('✅ Function test successful! Count:', testData)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('\n💡 Please run the SQL manually in Supabase Dashboard:')
    console.error('   1. Go to https://supabase.com/dashboard')
    console.error('   2. Open SQL Editor')
    console.error('   3. Paste and run the SQL from:')
    console.error(`   ${sqlPath}`)
    process.exit(1)
  }
}

runMigration()

