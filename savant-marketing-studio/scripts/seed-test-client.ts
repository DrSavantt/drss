// Seed test client with complete questionnaire data
// Run with: npx tsx --env-file=.env.local scripts/seed-test-client.ts
//
// This creates a test client "Marcus Chen - Peak Performance Consulting"
// with fully populated intake_responses for testing the AI generation pipeline.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// TEST CLIENT DATA
// ============================================
const testClient = {
  name: 'Marcus Chen - Peak Performance Consulting',
  email: 'marcus@peakperformanceconsulting.com',
  website: 'peakperformanceconsulting.com',
  questionnaire_status: 'completed',
  questionnaire_completed_at: new Date().toISOString(),
};

// ============================================
// INTAKE RESPONSES
// Keys match questionnaire_questions.id from database
// ============================================
const intakeResponses = {
  version: '1.0',
  completed_at: new Date().toISOString(),
  submitted_via: 'seed_script',
  sections: {
    // ===== SECTION 1: Avatar Definition =====
    avatar_definition: {
      q1_ideal_customer: `Service-based business owners generating $500K-$2M annually who are stuck in the day-to-day operations trap. They're typically in industries like accounting, legal, coaching, or consulting. They've built something real but can't scale because they ARE the business. Every vacation gets interrupted, every "day off" includes checking emails, and they secretly resent the business they built.`,
      
      q2_avatar_criteria: ['all_four'], // Checkbox - array of selected values
      
      q3_demographics: `Male or female, 35-55 years old, suburban United States, household income $200K-$400K, married with children, college-educated, been in business 5-15 years, team of 3-15 employees`,
      
      q4_psychographics: `Values freedom and family time but feels trapped by success. Fears becoming irrelevant or losing what they built. Motivated by legacy and providing for family. Secretly exhausted but won't admit it publicly. Compares themselves to peers who seem to "have it figured out." Reads business books but rarely finishes them.`,
      
      q5_platforms: `LinkedIn (scrolls daily but rarely posts), listens to "How I Built This" and "The Tim Ferriss Show" while commuting, attends occasional industry conferences, member of local EO or Vistage chapter, YouTube for business tutorials late at night`,
    },

    // ===== SECTION 2: Dream Outcome & Value Equation =====
    dream_outcome: {
      q6_dream_outcome: `A business that generates $1.5M+ annually while they work 25 hours per week or less. They can take a 2-week vacation without a single work emergency. Their team handles 90% of client delivery. They spend their time on high-value strategic work and business development, not putting out fires. Their spouse actually believes them when they say "things are going to slow down."`,
      
      q7_status: `Their spouse sees them as present and successful, not just busy. Peers ask them for advice on how they "escaped the grind." They're invited to speak at industry events. Their kids see them at games and recitals. They're known as someone who built something sustainable, not just someone who works hard.`,
      
      q8_time_to_result: `90 days to see significant operational improvements, 6 months to full transformation`,
      
      q9_effort_sacrifice: `5 hours per week for the first 90 days to implement systems and train team. Includes weekly 60-minute strategy calls, 2 hours of implementation work, and team training sessions. After 90 days, maintenance drops to 2 hours per week.`,
      
      q10_proof: `67 business owners served over 5 years with 91% achieving their "freedom number" within 6 months. Average result: 15 hours per week reclaimed while revenue increased 23%. Notable wins include a law firm owner who went from 70 to 30 hours/week while growing from $1.2M to $1.8M, and a consulting firm that scaled from 4 to 12 team members without the founder burning out.`,
    },

    // ===== SECTION 3: Problems & Obstacles =====
    problems_obstacles: {
      q11_external_problems: `Can't find or keep good employees, everything requires their approval, clients only want to work with them personally, no documented systems or processes, technology is outdated and disconnected, constantly interrupted by "urgent" issues that aren't actually urgent`,
      
      q12_internal_problems: `Feels guilty taking time off, believes "nobody can do it as well as me," terrified of losing clients if they step back, imposter syndrome despite obvious success, exhausted but wears it as a badge of honor, secretly resents the business they built`,
      
      q13_philosophical_problems: `Business owners shouldn't have to sacrifice their health and family to be successful. You shouldn't have to choose between making money and making memories. Building a business should create freedom, not a fancier prison.`,
      
      q14_past_failures: `Hired 2-3 "operations managers" who either couldn't handle the complexity or left within a year. Tried implementing EOS or Traction but couldn't sustain it without outside accountability. Bought courses and programs that collected dust. Tried delegating before but ended up redoing the work themselves because it "wasn't done right."`,
      
      q15_limiting_beliefs: `"My clients specifically want ME, not my team." "If I step back, quality will suffer and I'll lose clients." "I'm not good at managing people." "Systems feel corporate and my business is built on relationships." "I'll slow down when we hit [arbitrary revenue number]."`,
    },

    // ===== SECTION 4: Solution & Methodology =====
    solution_methodology: {
      q16_core_offer: `The Owner Freedom System - a 6-month implementation program that extracts you from daily operations while maintaining quality and growing revenue. We document your genius into repeatable systems, build a team that thinks like you, and create the infrastructure for scale.`,
      
      q17_unique_mechanism: `The "Clone & Release" Method - we spend the first 30 days capturing everything in your head (your decision-making frameworks, quality standards, client handling approaches) into documented systems. Then we train your team to execute at your level. Finally, we systematically release responsibilities with built-in quality checkpoints so you maintain control without doing the work.`,
      
      q18_differentiation: `We're operators, not consultants. We don't hand you a playbook and wish you luck - we implement alongside you. Our team has built and exited service businesses, so we understand the emotional resistance to letting go. We also guarantee results: if you're not working 20+ fewer hours within 6 months while maintaining revenue, we refund our fee and pay for your next solution.`,
      
      q19_delivery_vehicle: `6-month implementation program with weekly 60-minute strategy calls, dedicated implementation specialist, private Slack channel for async support, monthly team training sessions, and quarterly in-person strategy days (optional). Includes our proprietary systems library and SOPs customized to your business.`,
    },

    // ===== SECTION 5: Brand Voice & Communication =====
    brand_voice: {
      q20_voice_type: 'bold_direct', // Multiple choice value
      
      q21_personality_words: `No-nonsense, Empathetic, Results-obsessed, Straightforward, Supportive`,
      
      q22_signature_phrases: `"Freedom isn't found, it's built." "Your business should serve your life, not consume it." "Stop being the bottleneck." "Good enough, delegated, beats perfect, by you." "You didn't build this to be a prisoner of it."`,
      
      q23_avoid_topics: `Never bash employees or make business owners feel bad for struggling. Avoid "hustle culture" language or glorifying overwork. Don't use corporate jargon like "synergy" or "leverage human capital." Never promise overnight results or passive income fantasies. Avoid comparing to specific competitors by name.`,
      
      // q24_brand_assets is file-upload, leaving empty
    },

    // ===== SECTION 6: Proof & Transformation =====
    proof_transformation: {
      q25_transformation_story: `Jennifer ran a successful accounting firm doing $1.4M annually but was working 65 hours a week and hadn't taken a real vacation in 4 years. She'd missed her daughter's dance recitals and her marriage was strained. "I built this thing that was supposed to give us a better life, but it was killing me." Within 90 days of implementing the Owner Freedom System, she had documented her review process, trained two senior accountants to handle 80% of client work, and was down to 40 hours. By month 6, she was at 30 hours, took a 10-day trip to Italy with her husband, and her revenue had actually increased 12% because she finally had time to focus on business development. "I got my life back and my business got better. I didn't think both were possible."`,
      
      q26_measurable_results: `Average client reclaims 18 hours per week within 6 months. 91% achieve their "freedom number" (target hours per week). Average revenue growth of 23% year-over-year post-implementation. 94% client retention rate. Team satisfaction scores increase by average of 34% (because they're empowered, not micromanaged).`,
      
      // q27_credentials is optional, leaving empty
      
      q28_guarantees: `The "Freedom or Free" Guarantee: If you're not working 20+ fewer hours per week while maintaining or growing revenue within 6 months, we'll refund 100% of your investment AND pay $5,000 toward whatever solution you try next. We've never had to pay out.`,
      
      // q29_proof_assets is file-upload, leaving empty
    },

    // ===== SECTION 7: Faith Integration =====
    faith_integration: {
      q30_faith_preference: 'values_aligned', // "Yes - Values-aligned but subtle"
      
      q31_faith_mission: `I believe business is a vehicle for stewardship and impact. My calling is to help entrepreneurs build businesses that honor their families, serve their communities, and reflect excellence. When business owners are freed from the grind, they have capacity to invest in what matters - their families, their churches, their communities.`,
      
      q32_biblical_principles: `Stewardship over ownership - the business is entrusted to us. Sabbath - rest is commanded, not optional. Excellence as worship - do your best in all things. Servant leadership - empower your team, don't lord over them. Generosity - build margin so you can give.`,
    },

    // ===== SECTION 8: Business Metrics =====
    business_metrics: {
      q33_annual_revenue: `$750K ARR`,
      
      q34_primary_goal: `Scale to $1.2M while reducing my working hours from 50 to 30 per week. Hire a second implementation specialist and systematize our client onboarding so I'm not bottlenecking delivery. Build recurring revenue through a maintenance retainer offering for past clients.`,
    },
  },
};

// ============================================
// SEED FUNCTION
// ============================================
async function seedTestClient() {
  console.log('🌱 Seeding test client...\n');
  
  // Check if client already exists
  const { data: existing } = await supabase
    .from('clients')
    .select('id, name')
    .eq('email', testClient.email)
    .single();
  
  if (existing) {
    console.log(`⚠️  Client already exists: ${existing.name} (ID: ${existing.id})`);
    console.log('   Updating with new intake_responses...\n');
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        intake_responses: intakeResponses,
        questionnaire_status: 'completed',
        questionnaire_completed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to update client:', error);
      process.exit(1);
    }
    
    console.log('✅ Client updated successfully!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Status: ${data.questionnaire_status}`);
    return;
  }
  
  // Get current user (we need a user_id for RLS)
  // For seeding, we'll get any admin user
  const { data: users } = await supabase
    .from('clients')
    .select('user_id')
    .limit(1);
  
  if (!users || users.length === 0) {
    console.error('❌ No existing clients found to get user_id from.');
    console.error('   Please create at least one client first via the UI.');
    process.exit(1);
  }
  
  const userId = users[0].user_id;
  console.log(`📌 Using user_id: ${userId}\n`);
  
  // Create the client
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...testClient,
      user_id: userId,
      intake_responses: intakeResponses,
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create client:', error);
    process.exit(1);
  }
  
  console.log('✅ Test client created successfully!\n');
  console.log('━'.repeat(50));
  console.log(`   ID:       ${data.id}`);
  console.log(`   Name:     ${data.name}`);
  console.log(`   Email:    ${data.email}`);
  console.log(`   Website:  ${data.website}`);
  console.log(`   Status:   ${data.questionnaire_status}`);
  console.log('━'.repeat(50));
  console.log('\n📋 Intake Responses Sections:');
  Object.keys(intakeResponses.sections).forEach((section) => {
    const sectionData = intakeResponses.sections[section as keyof typeof intakeResponses.sections];
    const questionCount = Object.keys(sectionData).length;
    console.log(`   • ${section}: ${questionCount} questions`);
  });
  console.log('\n🧪 Test at: /dashboard/clients');
  console.log('   1. Find "Marcus Chen - Peak Performance Consulting"');
  console.log('   2. Open questionnaire tab');
  console.log('   3. Verify all responses are populated');
}

// Run the seed
seedTestClient().catch(console.error);
