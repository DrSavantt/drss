// Seed AscendedBody client with questionnaire data from Typeform CSV (Oct 3, 2025)
// Run with: npx tsx --env-file=.env.local scripts/seed-ascendedbody.ts
//
// This creates the client "AscendedBody" with fully populated intake_responses
// and brand_data extracted from their Typeform questionnaire submission.
//
// IMPORTANT: intake_responses structure matches app/actions/questionnaire.ts
// Section keys and question IDs must match exactly for the UI to display properly.

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
// CLIENT DATA
// ============================================
const clientData = {
  name: 'AscendedBody',
  email: 'contact@ascendedbody.com',
  website: 'https://www.instagram.com/ascended_body',
  industry: 'Holistic Health / Herbal Healing',
  questionnaire_status: 'completed',
  questionnaire_completed_at: '2025-10-05T16:25:43.000Z',
};

// ============================================
// INTAKE RESPONSES
// Structure matches app/actions/questionnaire.ts exactly
// ============================================
const intakeResponses = {
  version: '1.0',
  completed_at: '2025-10-05T16:25:43.000Z',
  submitted_via: 'typeform_import',
  sections: {
    // ===== SECTION 1: PROBLEMS & OBSTACLES =====
    problems_obstacles: {
      q11_external_problems: `My ideal clients are struggling with three major things: community support, prioritization, and accountability.

Community support is often missing. Many of them are surrounded by family and friends who aren't on a healing path themselves. That means the people closest to them may mock, resist, or unintentionally sabotage their efforts — especially during sensitive detox phases, where emotions are heightened and discomfort is common.

There's a struggle with prioritization. Many clients say they want healing, but their actions still lean toward temporary pleasures — processed foods, distractions, or toxic habits. There's often a disconnect between what they say they want and what they're actually doing each day.

And accountability. Some clients blame external forces — the food system, the medical system, even their coach — when they're not getting results. But deep down, they know they haven't been fully consistent.

The biggest problem I faced—and still face—is getting people to believe that healing is possible. It's not about the herbs or protocols alone; it's the belief system people carry. Many think, "We're going to die anyway," and use that to justify destructive habits.`,

      q12_internal_problems: `What keeps my clients up at night is a layered mix of behavioral patterns, emotional unrest, physical symptoms, and societal conditioning.

On the surface, it might look like late-night eating, too much screen time, or overstimulation. But under that is a deeper issue: a lack of prioritization, unprocessed emotions, and a distorted relationship with rest itself. Many clients don't realize how vital sleep is — not just for healing, but for emotional regulation, metabolism, and organ recovery.

I've seen clients with liver stagnation wake up every night around 1–3 a.m. like clockwork. That's not random — that's the liver trying to process stored toxins and emotions like anger or resentment. Clients with kidney or bladder issues often wake up two, three, even five times a night to urinate.

They're trying to escape the shame of not feeling like themselves anymore—the pain of watching their bodies betray them, of feeling exhausted, bloated, inflamed, or stuck in cycles of illness they don't fully understand. They carry the emotional weight of being dismissed, unheard by doctors or even family.

Ultimately, they're trying to escape the pain of not being in control—emotionally, physically, spiritually—and they come to us for a map back to wholeness.`,

      q13_philosophical_problems: `The conventional health system has failed them. Take a pill for the symptom, not the root. Follow the food pyramid. Eat whole grains, low fat, and lots of dairy. Meat is bad. Carbs are energy. Sugar in moderation is fine.

If you're sick, see a specialist. If your labs look "normal," you're fine. Fasting is dangerous. Detoxing is a scam. If it doesn't come from a pharmacy or peer-reviewed double-blind study, it's probably "pseudoscience."

Emotions have nothing to do with disease. Genetics are destiny. And your diagnosis is something you'll "manage" for the rest of your life.

People are starting to realize… all that conventional "wisdom" is part of why they still feel stuck. The system teaches symptom suppression, not root cause healing. And they rarely address the emotional, spiritual, or environmental toxins contributing to their condition.`,

      q14_past_failures: `My clients have already tried everything modern medicine and mainstream wellness has to offer — and yet, nothing has given them lasting results. They've done:
• Chemotherapy
• Chiropractic care
• Physical therapy
• Prescription and over-the-counter medications
• Botox injections (even in the face for systemic issues)
• Vitamin C infusions
• Fad diets (keto, smoothie detoxes, protein shake replacements)
• Trendy treatments with a lot of hype but little depth

What they all have in common is this: none of it addressed the root cause.

The root isn't just physical — it's behavioral, nutritional, emotional, ancestral, and spiritual. You can't band-aid a broken lifestyle with one treatment or protocol. If the behavior doesn't shift, neither does the body.

People will hesitate to buy a $100 herbal kit to heal their liver, but then spend $100 on alcohol that destroys it. They'll invest in surface-level fixes but not in foundational nutrition.

What they haven't tried — and what finally works — is full accountability. A 360-degree lifestyle shift that includes body, mind, and spirit.`,

      q15_limiting_beliefs: `My clients carry a range of fears and limiting beliefs:

"Will this hurt me? Will I have side effects? Will it make me feel worse before better?" — Because they've been conditioned by pharmaceutical medicine, anything unfamiliar feels like a risk — even nature.

Fear of cost — Many clients fear they'll have to give up everything they enjoy, eat bland or boring food forever, or spend their life savings just to feel okay.

"It's too late for me because of my age or diagnosis" — I've worked with people who were told their disease was lifelong, genetic, or incurable — and watched them reverse it. But after being told for years, "there's nothing you can do," people begin to internalize a powerlessness mindset.

"Is he qualified to help me?" — Fair concern, especially when they've been misled before. But I always remind them: it's not me doing the healing. It's their body.

"What if I can't do it? What if I fail again?" — That's the deepest fear no one says out loud.

Common objections: "How much does it cost?" "How long will it take?" "Are there any studies or proof?"`,
    },

    // ===== SECTION 2: IDEAL AVATAR =====
    avatar_definition: {
      q2_avatar_criteria: ['committed_to_change', 'willing_to_invest', 'open_to_guidance', 'has_specific_problem'],

      q1_ideal_customer: `This is for people who are capable of high performance and grounded in spiritual depth—those ready to detox, rebuild, and reclaim their bodies, minds, and vision without shortcuts, gimmicks, or compromises. I'm here to guide, but they have to meet me halfway—because 80% of the work is on them, and I'm only here to deliver the 20% sauce that makes the difference.

My ideal client wants real results—not just a temporary fix. They're tired of suppressing symptoms with pills that only delay deeper problems until their body reaches a crisis point. They want to stick with something meaningful, stay consistent, and experience true transformation from the inside out.

Some are familiar with healing but have never seen this level of comprehensiveness. Others are new to it, but they're open, curious, and willing to trust the process. If they give me just 80% effort, I can guide them toward noticeable and lasting change.`,

      q3_demographics: `Adults with chronic illness or health challenges seeking alternatives to Western medicine. Willing to invest $10,000-$15,000 in coaching programs or $80+ per herbal blend. Located primarily in the tristate area (NY/NJ/CT) but serving clients remotely. Both men and women, typically 30-60 years old. Have tried conventional medicine without lasting results.`,

      q4_psychographics: `They want to become the version of themselves that is powerful, whole, and in control of their health and destiny—not dependent on pills, doctors, or external validation. Someone who radiates vitality, who doesn't just survive, but leads, inspires, protects their family, and lives with divine purpose.

They want to embody the identity of someone who doesn't relapse, who doesn't break promises to themselves. They want to be the person who heals generations, breaks cycles, looks in the mirror and feels proud, not ashamed. Someone who is sovereign in their mind, body, and spirit. A master of their own temple.

Beyond the surface-level goals of weight loss, pain relief, or more energy, my audience deeply desires freedom—freedom from fear, limitation, and confusion about their health. They want to feel safe in their bodies, to trust their instincts, and reclaim agency over their healing.`,

      q5_platforms: `Instagram (@ascended_body), TikTok for educational content, health and wellness communities, word-of-mouth referrals from transformed clients. They consume content about holistic healing, herbal medicine, detoxification, and alternative health approaches.

Content examples:
https://www.tiktok.com/t/ZTMMtTqo1/
https://www.tiktok.com/t/ZTMMtEjEV/
https://www.instagram.com/p/DNTl5b7AMYX/
https://www.instagram.com/p/DKeO6NHgQnV/`,
    },

    // ===== SECTION 3: BRAND VOICE =====
    brand_voice: {
      q20_voice_type: 'bold_direct',

      q21_personality_words: `Direct, powerful, revolutionary, raw, real, rooted in power. We speak from the trenches, not from a pedestal. No-nonsense but deeply empathetic. Results-obsessed. Straightforward and supportive.`,

      q22_signature_phrases: `"Natural immunity"
"Facilitate the body's natural healing processes"
"If I had this disease, here's what I would do to…"
"Elimination → Cleanse → Rebuild"
"Healing is not a race. It's a rhythm."
"The deeper the disease, the slower and safer the detox should be."
"Legacy-driven healing"
"Full-body resurrection"
"Generational healing, sovereignty, and complete cellular restoration"`,

      q23_avoid_topics: `Too many swear words and saying I cure and heal diseases. Anything that breaks FDA and government rules publicly.

We don't want cliché wellness jargon or watered-down spiritual lingo. No "good vibes only," no fluffy empowerment phrases, and definitely no corporate, sterile tone. This isn't a mainstream detox brand — it's a movement forged through spiritual alignment, real discipline, and tangible results.

No promises that sound like quick fixes or magic pills — everything we do is rooted in long-term transformation and deep work. No shame-based marketing — we don't guilt people into growth; we call them forward from a place of strength and vision.`,

      q24_brand_assets: [],
    },

    // ===== SECTION 4: DREAM OUTCOME =====
    dream_outcome: {
      q6_dream_outcome: `Their end goal isn't just temporary relief—it's total resolution. They don't just want the migraines gone today only to come back next week. They want to be done with the root cause for good.

The ideal outcome is full liberation from the cycle of suppression. They want their body to return to a state of ease, balance, and clarity—where symptoms aren't just managed, they're near-obsolete. On a scale of 1-10, we want 1-2 at the most! Where energy flows, digestion is smooth, sleep is deep, skin is glowing, and their mind and body are finally in sync.

They want to reclaim the version of themselves they barely remember—vibrant, pain-free, and in control of their health long-term. Not surviving… thriving.

Beyond the surface, what they really want is safety—inside their own body. They want to trust that their organs aren't silently breaking down, that their body isn't secretly working against them. They want to wake up without fear, without fatigue, without fog.`,

      q7_status: `They want to become the version of themselves that is powerful, whole, and in control of their health and destiny—not dependent on pills, doctors, or external validation. Someone who radiates vitality, who doesn't just survive, but leads, inspires, protects their family, and lives with divine purpose.

They want to embody the identity of someone who doesn't relapse, who doesn't break promises to themselves. They want to be the person who heals generations, breaks cycles, looks in the mirror and feels proud, not ashamed. Someone who is sovereign in their mind, body, and spirit. A master of their own temple.

Someone that is no longer sickly and ill but can stand with their back straight against a system that taught them to self destruct and correct it. Creating a new system of life instead of destruction is masterful and powerful.`,

      q8_time_to_result: `You'll likely start feeling changes within the first 7–14 days—more energy, better digestion, deeper sleep—but true, lasting transformation takes 3 to 4 months of consistent work. That's the minimum window for real shifts in labs, organ function, and how you show up in the world. We're not selling Band-Aids; this is root-level healing—and roots take time to rewire.`,

      q9_effort_sacrifice: `They would sacrifice comfort, convenience, and even long-held habits if it meant reclaiming their health and vitality. Many are willing to give up favorite foods, fast food, late nights, and even social norms if those things are blocking their healing.

They'll sacrifice money they can barely spare, time they don't think they have, and even relationships that enable their self-neglect. If it means finally being free of pain, fatigue, illness, or shame—they'll change their entire lifestyle.

Some would even risk looking "crazy" to their friends and family for doing something different—so long as it gives them a real chance at healing.

If you commit to at least 80% of the protocol over the course of 3 to 4 months, we promise you'll see undeniable shifts.`,

      q10_proof: `• Over 75+ clients personally coached across detox, fitness, chronic illness, hormonal repair, and emotional regulation
• 25+ herbal formulas created and refined for specific organ systems
• 80% client compliance rate
• Kidney filtration restored within 28 days for a client with Stage 4 kidney disease
• Kappa light chain stabilization achieved in a client with multiple myeloma after 90+ days
• 50–70%+ reduction in migraine severity within 3–4 months
• 300%+ improvement in strength and mobility (client went from no stair mobility to full-range jumping)
• Bowel frequency normalized from 1–2x/week to 1–2x/day in 4–6 weeks
• Zero refunds, 100% transformation rate among clients who completed protocols
• Zero hospitalizations or regressions in clients who fully followed protocols`,
    },

    // ===== SECTION 5: SOLUTION & METHODOLOGY =====
    solution_methodology: {
      q16_core_offer: `Right now, the offer includes 15 powerful, hand-crafted herbal blends—each targeting a different body system—which are sold individually at $80 per pouch. Most clients need anywhere from 12 to 15 blends depending on the severity and location of their issue.

In addition to the herbal products, we offer premium one-on-one coaching programs designed for full-spectrum healing, priced between $10,000 and $15,000 for a 3–4 month transformation container.

For those more focused on physical performance and aesthetics, we also offer a separate personal training tier—less intensive than the full detox protocols, but still rooted in the same philosophy of full-body recalibration and high-level execution.

Monthly option available at $250/month.`,

      q17_unique_mechanism: `The AscendedBody Healing Framework: Elimination → Cleanse → Rebuild (→ Repeat as Needed)

It's a tiered, organ-specific healing system rooted in cellular regeneration and detoxification. We evaluate clients across 15 targeted organ systems — including colon, liver, kidneys, lymph, adrenals, thyroid, brain/CNS, mitochondria — and categorize each organ's function into a tier (from Tier 1 = optimal to Tier 4 = critical).

The mechanism is rooted in organ-specific cleansing and nutrient replenishment:

Phase 1 – Elimination: Open primary detox pathways (bowels, kidneys, skin, lungs). If waste isn't being eliminated, no amount of cleansing will work.

Phase 2 – Cleanse: Pull deeper waste from tissues, organs, and cells using herbs, juices, saunas, and fasting protocols. Remove acids, toxins, mucus, heavy metals, parasites.

Phase 3 – Rebuild: Nourish glands, bones, nervous system, blood, and organs with deep minerals, amino acids, fats, herbal tonics, and structured movement.

AscendedBody Principle: "The deeper the disease, the slower and safer the detox should be. The more damaged the system, the more intentional the rebuild must be."`,

      q18_differentiation: `I don't just sell herbs—I engineer a full transformation. Most alternatives focus on symptom relief, or they sell you a "one-size-fits-all" cleanse. What I offer is a personalized, multi-layered protocol that works with your body's biology and your lifestyle.

My competitors teach similar ideas—like parasite cleanses, liver detoxes, plant-based eating—but the delivery is often disorganized, surface-level, or lacking precision. They'll say "kill parasites" but don't mention that if you don't first sedate them, they can lay more eggs. They'll promote liver detoxes without explaining you must cleanse the colon first.

What sets me apart:
• I track kidney filtration, bowel movements, lymphatic flow, organ-specific symptoms, emotional patterns, cookware, food safety, and even spiritual alignment
• I custom-formulate every herb blend to match your organ systems and timeline
• I guide you in phasing off medication strategically, never recklessly
• I blend ancient herbalism with modern biochemistry
• Clients get direct access to me — we review poop logs, tongue photos, bloodwork, meal timing, trauma patterns

I help people break free from the "forever patient" model—so they can heal for real.`,

      q19_delivery_vehicle: `6-month implementation with the following structure:

1. Assessment & Mapping — Intake forms, quizzes, and symptom tracking to identify primary blockages and prioritize organs.

2. Elimination & Detox Pathway Activation — Clear the colon, kidneys, liver, and lymph using specific herbal blends, hydration protocols, and movement strategies.

3. Organ-Specific Healing & Nourishment — Tailored herbal and nutritional protocols to rebuild weak organs, supported with breathwork, bodywork, and mineral repletion.

4. Behavioral & Environmental Realignment — Address hygiene products, cookware, sleep hygiene, stress habits, emotional patterns, and toxic exposures.

5. Integration & Education — Weekly check-ins, quizzes, and live coaching. Clients understand what each herb does and how their body is responding.

Includes: Weekly 1-on-1 calls, tailored quizzes, client journaling, educational materials, custom herbal protocols, and high-touch support via direct messaging.`,
    },

    // ===== SECTION 6: PROOF & TRANSFORMATION =====
    proof_transformation: {
      q25_transformation_story: `When I first got into health, it started with a breakup. I was just a heartbroken teenager doing push-ups, sit-ups, and squats to look and feel better. That changed when I was hit by a large SUV. The accident fractured my hip, damaged my spine, and caused long-term pain. The medical system focused more on financial settlements than real healing. I ended up with a check and chronic pain.

That's when I took my healing into my own hands—stretching for hours daily, practicing Qigong, and changing how I ate.

My girlfriend at the time had a genetic heart disease. I began studying everything I could about heart health, often spending 6–7 hours in a Dunkin' Donuts reading research. After years of study and trial-and-error, she messaged me saying her cardiologist declared her heart fully healed. That was a pivotal moment.

Since then, I've helped my dog recover from near-death, healed my mother who couldn't move the left side of her body (she began to walk, run, and move again), and helped my grandmother.

Case Study - H.P. (Stage 4 Multiple Myeloma): She had dangerously elevated kappa light chains, stage 3 kidney impairment, severe fatigue. We began a gentle 90-day juice fast with customized herbal blends. After 2–3 months, her energy returned, kidney filtration improved, and bloodwork stabilized.

Case Study - A.H. (Advanced Atrophy): Could not walk up stairs, jump, or do basic physical activity. Over 4–6 months, we rebuilt her ability to move without pain. She now does her own workouts regularly.`,

      q26_measurable_results: `Data & Metrics:
• 80% client compliance rate
• 25+ pounds of waste removed per client (average across 8–12 week detoxes)
• 50–70%+ reduction in migraine severity within 3–4 months
• Kidney filtration restored within 28 days (Stage 4 kidney disease client C.S.)
• Kappa light chain stabilization in multiple myeloma client after 90+ days
• 50–70% decrease in HPV6-related symptoms within 5 months
• 300%+ improvement in strength and mobility
• Bowel frequency normalized from 1–2x/week to 1–2x/day in 4–6 weeks
• 5–7 inches of waist/hip fat loss in 6–8 weeks
• Zero hospitalizations or regressions in clients who fully followed protocols
• $2,500–$3,000+ in monthly gross revenue, achieved solely through client referrals

Before & After Examples:
https://www.instagram.com/p/DNTl5b7AMYX/
https://www.instagram.com/p/DMt8_Z1AQvI/
https://www.instagram.com/p/DKeO6NHgQnV/`,

      q27_credentials: `• Over 75+ clients personally coached across detox, fitness, chronic illness, hormonal repair, and emotional regulation — ranging from stage 4 cancer to elite-level performance goals
• 25+ herbal formulas created and refined for specific systems (kidneys, colon, lymph, blood, heart, hormones, nervous system, cellular regeneration, spleen, etc.)
• Medical lab markers reversed/improved in multiple clients including Stage 4 kidney disease reversal signs, cancer markers stabilized, HPV6 symptoms reversed
• Zero refunds, 100% transformation rate among clients who completed protocols
• Currently scaling AscendedBody from 1:1 coaching to scalable products, kits, and digital infrastructure`,

      q28_guarantees: `If you commit to at least 80% of the protocol over the course of 3 to 4 months, we promise you'll see undeniable shifts—measurable improvements in lab results, a powerful upgrade in energy, emotional clarity, a rebalanced nervous system, and a lifestyle you no longer have to escape from.

This is not a gimmick or quick fix; it's a full-body reclamation for those ready to show up for themselves. We can't guarantee results for half-effort, but if you do your part—we'll meet you with the other 20% and give you everything you need to transform.

In a world where doctors say, "There's nothing more we can do," I give people their power back.`,

      q29_proof_assets: [],
    },

    // ===== SECTION 7: FAITH INTEGRATION =====
    faith_integration: {
      q30_faith_preference: 'faith_forward',

      q31_faith_mission: `AscendedBody is not just a detox brand — it's a movement of legacy-driven healing. Everything we offer is designed to help people break generational curses through God-aligned protocols, herbal detoxification, movement coaching, and mindset reprogramming.

We bridge ancestral wisdom with modern results, fusing herbal medicine, lab tracking, and physical transformation into one system.

This brand started from nothing and is scaling into a $30K/month, $5M legacy enterprise, powered by transformations, not ads. We're building the foundation for land-based healing centers, family-run systems, and generational trust structures.

The goal isn't just profit — it's freedom for our people. Sovereignty. Health. Legacy. A new standard for what healing looks like.

We aren't here to blend in. We're here to rebuild the blueprint — and every client we work with becomes part of that mission.`,

      q32_biblical_principles: `• Stewardship of the body as God's temple
• Radical self-responsibility — Our clients take ownership of their healing, habits, and outcomes. No victimhood. No blame. Just aligned action.
• God-alignment over hustle — We don't worship grind culture. We follow divine timing, discernment, and intuition.
• Data-backed spiritual healing — Lab results matter. But so do prayer, energy, and faith. We blend the two without compromise.
• Generational blessing — We help people detox generational trauma, systemic illness, and deeply rooted dysfunction — spiritually, physically, and emotionally.
• Transformation over tactics — We're not selling products; we're selling outcomes.`,
    },

    // ===== SECTION 8: BUSINESS METRICS =====
    business_metrics: {
      q33_annual_revenue: `$2,500–$3,000+ monthly gross revenue during early coaching and product phases, achieved solely through client referrals and real transformation results — without paid advertising. Scaling toward $30K/month.`,

      q34_primary_goal: `Scale to $30K/month and eventually build a $5M legacy enterprise. Build land-based healing centers, family-run systems, and generational trust structures. Expand from 1:1 coaching to scalable products, kits, and digital infrastructure (quizzes, eBooks, forms, training programs). Continue building through transformations and word-of-mouth — no ads, only proof.`,
    },
  },
};

// ============================================
// BRAND DATA
// Extracted from questionnaire for quick reference
// ============================================
const brandData = {
  name: 'AscendedBody',
  tagline: 'Legacy-driven healing through God-aligned protocols',
  tone: 'direct, powerful, revolutionary, raw, real',
  industry: 'Holistic Health / Herbal Healing',
  target_audience: {
    summary: 'People capable of high performance and grounded in spiritual depth—those ready to detox, rebuild, and reclaim their bodies, minds, and vision without shortcuts.',
    demographics: 'Adults with chronic illness, willing to invest $10-15k, seeking alternative to Western medicine',
    psychographics: 'Soul-led individuals seeking sovereignty, freedom from fear, and generational healing',
  },
  offer: {
    products: [
      { name: 'Herbal Blends', price: '$80/pouch', quantity: '15 blends available' },
      { name: 'Premium Coaching', price: '$10,000-$15,000', duration: '3-4 months' },
      { name: 'Monthly Option', price: '$250/month' },
    ],
    big_promise: 'Measurable improvements in lab results, energy, emotional clarity, and nervous system balance within 3-4 months',
    timeline: '7-14 days initial changes, 3-4 months full transformation',
  },
  framework: {
    name: 'AscendedBody Healing Framework',
    phases: ['Elimination', 'Cleanse', 'Rebuild'],
    principle: 'The deeper the disease, the slower and safer the detox should be.',
  },
  avoid: [
    'FDA violations (cure/heal claims)',
    'Excessive swearing',
    'Cliché wellness jargon',
    'Good vibes only mentality',
    'Quick fix promises',
    'Shame-based marketing',
  ],
  angles: [
    'Radical self-responsibility',
    'Legacy healing',
    'God-alignment over hustle',
    'Data-backed spiritual healing',
    'Transformation over tactics',
  ],
  key_phrases: [
    'Natural immunity',
    'Facilitate the body\'s natural healing processes',
    'Elimination → Cleanse → Rebuild',
    'Healing is not a race. It\'s a rhythm.',
    'Legacy-driven healing',
  ],
  social: {
    instagram: 'https://www.instagram.com/ascended_body',
  },
  credentials: {
    clients: '75+',
    formulas: '25+',
    compliance_rate: '80%',
    transformation_rate: '100% (completed protocols)',
  },
};

// ============================================
// SEED FUNCTION
// ============================================
async function seedAscendedBody() {
  console.log('🌱 Seeding AscendedBody client...\n');

  // Check if client already exists
  const { data: existing } = await supabase
    .from('clients')
    .select('id, name')
    .eq('name', clientData.name)
    .single();

  if (existing) {
    console.log(`⚠️  Client already exists: ${existing.name} (ID: ${existing.id})`);
    console.log('   Updating with remapped intake_responses...\n');

    const { data, error } = await supabase
      .from('clients')
      .update({
        intake_responses: intakeResponses,
        brand_data: brandData,
        industry: clientData.industry,
        website: clientData.website,
        questionnaire_status: 'completed',
        questionnaire_completed_at: clientData.questionnaire_completed_at,
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
    printSummary();
    return;
  }

  // Get user_id from existing client
  const { data: users } = await supabase
    .from('clients')
    .select('user_id')
    .limit(1);

  if (!users || users.length === 0) {
    console.error('❌ No existing clients found to get user_id from.');
    process.exit(1);
  }

  const userId = users[0].user_id;
  console.log(`📌 Using user_id: ${userId}\n`);

  // Create the client
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      user_id: userId,
      intake_responses: intakeResponses,
      brand_data: brandData,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create client:', error);
    process.exit(1);
  }

  console.log('✅ AscendedBody client created successfully!\n');
  console.log('━'.repeat(60));
  console.log(`   ID:       ${data.id}`);
  console.log(`   Name:     ${data.name}`);
  console.log(`   Industry: ${data.industry}`);
  console.log(`   Website:  ${data.website}`);
  console.log(`   Status:   ${data.questionnaire_status}`);
  console.log('━'.repeat(60));
  printSummary();
}

function printSummary() {
  console.log('\n📋 Intake Response Sections (matching Savant schema):');
  const sections = intakeResponses.sections;
  Object.entries(sections).forEach(([key, value]) => {
    const questionCount = Object.keys(value).length;
    console.log(`   • ${key}: ${questionCount} questions`);
  });

  console.log('\n🔑 Question IDs mapped:');
  console.log('   problems_obstacles: q11, q12, q13, q14, q15');
  console.log('   avatar_definition:  q1, q2, q3, q4, q5');
  console.log('   brand_voice:        q20, q21, q22, q23, q24');
  console.log('   dream_outcome:      q6, q7, q8, q9, q10');
  console.log('   solution_methodology: q16, q17, q18, q19');
  console.log('   proof_transformation: q25, q26, q27, q28, q29');
  console.log('   faith_integration:  q30, q31, q32');
  console.log('   business_metrics:   q33, q34');

  console.log('\n🧪 Test at: /dashboard/clients');
  console.log('   1. Find "AscendedBody"');
  console.log('   2. Click "Questionnaire" tab');
  console.log('   3. Verify all responses display correctly');
}

// Run
seedAscendedBody().catch(console.error);
