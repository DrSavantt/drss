// Seed RMBC Marketing Frameworks (23 total)
// Run with: npx tsx --env-file=.env.local scripts/seed-rmbc-frameworks.ts
//
// This creates 23 frameworks from the RMBC Method Course:
// - Batch 1: Deep Research (11 frameworks)
// - Batch 2: Unique Mechanisms + VSL (12 frameworks)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// RMBC FRAMEWORKS DATA (23 total)
// ============================================

interface RMBCFramework {
  title: string;
  description: string;
  category: string;
  tags: string[];
  source: string;
  content: string;
}

const rmbcFrameworks: RMBCFramework[] = [
  // ============================================
  // BATCH 1: Deep Research (11 frameworks)
  // ============================================
  {
    title: "5 Stages of Market Awareness",
    description: "Eugene Schwartz's framework for understanding where prospects sit on the awareness spectrum—from completely unaware to most aware—and how to match copy strategy to each level.",
    category: "strategy_framework",
    tags: ["awareness", "targeting", "schwartz", "market-research", "segmentation"],
    source: "RMBC Method - Product Market Awareness Module",
    content: `## The 5 Stages

**1. Unaware**
Prospect doesn't know they have a problem. They're not searching, not thinking about it. Hardest to convert—requires education-first content.

**2. Problem-Aware**
Prospect knows they have a problem but doesn't know solutions exist. They're searching symptoms, asking "why does this happen?" This is often the largest segment (60%+ of TAM).

**3. Solution-Aware**
Prospect knows solutions exist but doesn't know YOUR product. They're comparing categories: "supplements vs. surgery vs. lifestyle changes."

**4. Product-Aware**
Prospect knows your product exists but hasn't bought. They need proof, differentiation, and reasons to choose you over alternatives.

**5. Most-Aware**
Prospect knows your product and likes it. They just need an offer, reminder, or incentive. Smallest segment (~1% of TAM) but highest conversion rate.

---

## Typical Market Distribution

| Stage | % of TAM | Conversion Difficulty |
|-------|----------|----------------------|
| Unaware | 10-20% | Very Hard |
| Problem-Aware | 60%+ | Medium |
| Solution-Aware | 15-20% | Medium-Easy |
| Product-Aware | 5-10% | Easy |
| Most-Aware | ~1% | Easiest |

---

## Buyer's Journey (Mental Transition)

1. "I didn't know I had this problem" → Unaware to Problem-Aware
2. "I didn't know there was a solution" → Problem-Aware to Solution-Aware
3. "I didn't know about THIS solution" → Solution-Aware to Product-Aware
4. "I need to decide if this is for me" → Product-Aware to Most-Aware
5. "I'm ready to buy" → Most-Aware to Customer

---

## Copy Strategy by Awareness Level

**Unaware:** Lead with story, curiosity, or pattern interrupt. Don't mention product. Focus on "Did you know...?" content.

**Problem-Aware:** Agitate the problem. Show you understand their pain. Lead with symptoms they recognize.

**Solution-Aware:** Compare solution categories. Position your category as superior. "Why X works better than Y."

**Product-Aware:** Differentiate from competitors. Stack proof, testimonials, guarantees. Handle objections.

**Most-Aware:** Lead with offer. Urgency, scarcity, bonuses. Minimal education needed.

---

## Content Length by Awareness

- **Unaware/Problem-Aware:** Long-form content. VSLs, advertorials, detailed emails. Need more persuasion runway.
- **Solution/Product-Aware:** Medium-form. Can get to point faster.
- **Most-Aware:** Short-form. Flash sales, reminder emails, retargeting ads.

---

## Channel-Awareness Fit

Different channels reach different awareness levels:

- **Cold traffic (Meta, TikTok):** Mostly unaware/problem-aware. Need education-first content.
- **Search (Google):** Problem-aware to solution-aware. They're actively looking.
- **Retargeting:** Product-aware to most-aware. They know you.
- **Email list:** Varies, but generally more aware than cold traffic.

**Example:** GLP-1 medications work on Meta because the market is already solution-aware (everyone's heard of Ozempic). Obscure supplements for obscure problems need more education.

---

## Diagnosis: Awareness Mismatch

If your copy isn't converting, check for awareness mismatch:

- **Symptom:** High click-through but low conversion
- **Cause:** Ad targets problem-aware, but landing page assumes product-aware
- **Fix:** Add bridge content that moves them through stages

- **Symptom:** Low engagement on cold traffic
- **Cause:** Copy assumes too much awareness
- **Fix:** Lead with problem/story, not product

---

## Scaling Plateau Diagnosis

Why businesses stall at $1-3M:

1. They've exhausted the product-aware segment (small but easy to convert)
2. They haven't built content/funnels for less-aware segments
3. Same ads, same copy—but the easy buyers are gone

**Solution:** Build dedicated funnels for problem-aware and solution-aware segments. Longer content, different hooks, more education.

---

## Implementation Checklist

1. Research your market—which awareness stages exist and how big is each?
2. Identify which stage your current marketing targets
3. Audit your funnel for awareness mismatches
4. Build stage-specific content (hooks, leads, VSLs)
5. Match channels to awareness levels`
  },
  {
    title: "Competitor Intelligence Framework",
    description: "Systematic approach to analyzing competitors across 3 pillars: value propositions, customer feedback, and messaging frameworks—to find positioning gaps and steal proven angles.",
    category: "strategy_framework",
    tags: ["competitor-analysis", "market-research", "positioning", "messaging"],
    source: "RMBC Method - Competitor Research Module",
    content: `## The 3 Pillars of Competitor Intelligence

### Pillar 1: Value Propositions

What are competitors promising? How do they position themselves?

**Extract:**
- Main headline claims
- Key differentiators they emphasize
- Unique mechanisms they use
- Price positioning (premium, value, etc.)
- Guarantee structures

**Look for:** Gaps no one is filling, overused angles to avoid, proof points you can beat.

---

### Pillar 2: Customer Feedback

What do real customers say—good and bad?

**Sources:**
- Amazon reviews (1-star AND 5-star)
- Trustpilot, BBB complaints
- Reddit threads, Facebook groups
- YouTube comments on review videos
- App store reviews (if applicable)

**Extract:**
- Language customers use (steal for copy)
- Pain points competitors don't solve
- Objections that arise post-purchase
- What customers love (prove you have it too)
- Horror stories (use as contrast)

---

### Pillar 3: Messaging Frameworks

How do competitors structure their persuasion?

**Analyze:**
- Ad creative (Meta Ad Library, TikTok Creative Center)
- Landing pages and VSLs
- Email sequences (sign up for their list)
- Retargeting sequences

**Extract:**
- Hook patterns that get engagement
- Story structures they use
- Objection handling approaches
- Offer stacking and bonuses
- Urgency/scarcity tactics

---

## 8-Dimension Research Framework

When analyzing each competitor, cover:

1. **Demographics** — Who are they targeting? Age, gender, income, location.
2. **Psychographics** — What emotions, beliefs, aspirations do they target?
3. **Funnel structure** — What's their customer journey? Ad → LP → Upsells?
4. **Messaging angles** — What hooks and big ideas do they use?
5. **Pricing & offers** — Price points, bundles, guarantees, bonuses?
6. **Customer feedback** — What do reviews reveal?
7. **Estimated revenue** — Use tools or proxies to gauge their scale.
8. **Weaknesses** — Where do they fall short? What complaints recur?

---

## 4-Step Research Process

1. **Define parameters** — Which competitors? Direct vs. indirect? How many?
2. **Identify competitors** — Use search, social, ad libraries, affiliate networks.
3. **Analyze messaging** — Run through 8-dimension framework per competitor.
4. **Evaluate feedback** — Deep dive on reviews and complaints.

---

## AI Tool Selection

| Task | Best Tool |
|------|-----------|
| Broad competitive overview | Gemini (good at synthesis) |
| Specific phrases/hooks | ChatGPT (pattern recognition) |
| Finding competitors | Perplexity (search + summarize) |
| Analyzing patterns across many | Claude (long context, comparison) |

---

## Implementation Checklist

1. List 5-10 direct competitors
2. Run each through 8-dimension framework
3. Create swipe file of best hooks, angles, mechanisms
4. Document recurring customer complaints
5. Identify positioning gaps for your product
6. Extract proven language patterns for copy`
  },
  {
    title: "Psychographic Profile Framework",
    description: "Comprehensive framework for understanding your market's psychology—their beliefs, prejudices, pain points, hopes, and how they view themselves—to write copy that resonates on a deep emotional level.",
    category: "strategy_framework",
    tags: ["psychographics", "audience-research", "pain-points", "customer-psychology", "market-research"],
    source: "RMBC Method - Psychographic Research Module",
    content: `## Why Psychographics Matter

Demographics tell you WHO your customer is. Psychographics tell you WHY they buy.

Deep psychographic research reveals:
- Motivations competitors miss
- Language that resonates emotionally
- Beliefs you can align with (or challenge)
- Objections before they arise

---

## Core Psychographic Questions

### Section 1: Identity & Worldview

- **Who are they?** (beyond demographics—how do they see themselves?)
- **What attitudes do they hold?** (political, religious, social, economic)
- **What are their prejudices?** (biases against institutions, products, groups)
- **Core beliefs about life, love, family?** (sum up in 1-3 sentences)

### Section 2: Emotional Landscape

- **Hopes and dreams?** (related to the problem your product solves)
- **Victories and failures?** (past attempts to solve the problem)
- **What does their ideal future look like?** (paint the transformation)

### Section 3: External Blame

- **What outside forces do they blame?** ("the system," "big pharma," "toxins")
- **What's prevented their best life?** (from their perspective)

---

## Three Types of Market Prejudices

### 1. Institutional Biases

Distrust of "big" entities:
- Big pharma / big medicine
- Big government / politicians
- Big tech / corporations
- Mainstream media

**Use in copy:** Position your product as the outsider, the alternative to the establishment they distrust.

### 2. Age-Related Biases

Assumptions based on generational identity:
- Older → "Younger people don't understand my problems"
- Younger → "Boomers had it easier"

**Use in copy:** Show you understand THEIR specific experience. "Created by someone who's been there."

### 3. Product/Category Biases

Opinions about solution types:
- "Natural is better than synthetic"
- "Supplements don't really work"
- "All gurus are scams"

**Use in copy:** Either align with their bias or directly confront and reframe it.

---

## Solution Landscape Analysis

Understand what they've already tried:

### 4-Step Evaluation

1. **Identify current solutions** — What products/services have they used?
2. **Evaluate experiences** — What did they like? What frustrated them?
3. **Collect horror stories** — Dramatic negative experiences (powerful for contrast)
4. **Assess effectiveness beliefs** — Do they think existing solutions work?

### Key Questions

- What has the market already tried?
- What do they like about existing solutions?
- What do they hate?
- Are there horror stories?
- Do they believe solutions can work, or are they skeptical of everything?

---

## Psychographic-to-Messaging Translation

### Economic Attitudes Example

**If they believe wealth is unfairly distributed:**
→ "Finally, level the playing field. Access the secret that greedy billionaires have been keeping from the rest of us."

**If they believe in meritocracy:**
→ "The same principles Elon Musk and Steve Jobs used—now available to anyone willing to put in the work."

### Age-Related Prejudice Example

**Targeting women 45+:**
→ "Tired of 25-year-old beauty counter reps who don't understand YOUR skin? We get it—because we're living it too."

---

## Implementation Checklist

1. Run psychographic research prompt (see prompt_template)
2. Identify 3-5 core beliefs/prejudices
3. Map their solution journey (what they've tried, why it failed)
4. Define their ideal future state in emotional terms
5. Translate insights into messaging angles
6. Create "language to use" and "language to avoid" lists`
  },
  {
    title: "Unified Research Document Structure",
    description: "The 6-section template for consolidating all market research (awareness, competitor, psychographic) into a single brief that serves as context for all downstream copy generation.",
    category: "strategy_framework",
    tags: ["research-synthesis", "briefing", "llm-context", "campaign-planning"],
    source: "RMBC Method - Unified Research Process Module",
    content: `## Purpose

The Unified Research Document consolidates all research into ONE reference document that:

- Provides consistent context for all copy generation
- Eliminates re-uploading multiple docs per task
- Ensures messaging consistency across assets
- Focuses only on copy-relevant insights (excludes TAM sizing, strategic recommendations)

---

## The 6 Sections

### 1. Target Market Demographic Overview

**Focus on:** Problem-Aware and Solution-Aware segments primarily.

**Include:**
- Age range, gender, income level
- Life stage and roles (e.g., "sandwiched generation")
- Digital behavior (where they search, what platforms)
- Shopping habits and decision-making patterns

---

### 2. Target Market Psychographic Overview

**Pain Points** — Specific emotional and practical struggles. Use their language.

*Example format:*
- Feel embarrassed, ashamed about their weight
- Struggle to lose weight despite trying diets
- Feel like a prisoner in their own body
- Experience low self-esteem, lack of confidence
- Fear their partner no longer finds them attractive

**Hopes & Dreams** — Their ideal future state. What transformation do they want?

**Self-Perception** — How do they view themselves? What identity do they hold?

---

### 3. Language Guidelines

**Language to Use:**
- Terms that resonate (e.g., "financial freedom," "natural solution")
- Phrases from customer reviews and forums
- Empowering, aspirational words

**Language to Avoid:**
- Terms that trigger skepticism (e.g., "get rich quick," "miracle cure")
- Jargon they don't use
- Anything that sounds like hype they've been burned by before

---

### 4. Primary Promises

Key claims that resonate with the market and can be substantiated:

*Example format:*
- Experience rapid fat loss from belly, hips, thighs
- Boost metabolism and burn fat 24/7
- Fit back into favorite clothes
- Increase confidence and feel vibrant again
- Free yourself from guilt and shame about weight

---

### 5. Key Objections & Rebuttals

| Objection | Rebuttal Strategy |
|-----------|------------------|
| "I've tried everything before" | Acknowledge past failures, explain why this is different (mechanism) |
| "It's too expensive" | Stack value, compare to alternatives, show cost of inaction |
| "Sounds too good to be true" | Lead with proof, studies, specific results |
| "I don't have time" | Emphasize simplicity, show time required |

---

### 6. Existing Solutions Analysis

**What they've tried:**
- List main solution categories (products, services, approaches)

**Why inadequate:**
- What's missing from current solutions
- Pain points competitors don't address
- Why they're still searching

---

## LLM Output Review Checklist

After generating the unified doc, human review required:

1. **Review language recommendations** — LLM may flag language that's actually appropriate for YOUR product
2. **Assess timeframe claims** — Adjust to actual product performance
3. **Consider emotional states** — Different segments may need different tones
4. **Adapt to awareness level** — Ensure focus matches your target awareness stage

---

## Usage

Once created, attach this document to every copy generation prompt:

- "Here's my unified research brief. Write a VSL lead for this product."
- "Based on this brief, generate 10 email subject lines."
- "Using this context, create 5 ad hooks."

The brief becomes the persistent context layer for all marketing assets.`
  },
  {
    title: "Curiosity Angle (Rediscovered Solutions)",
    description: "Narrative structure that positions your product as a rediscovery of forgotten or suppressed solutions—tapping into curiosity about hidden knowledge and distrust of modern alternatives.",
    category: "story_framework",
    tags: ["narrative", "persuasion", "curiosity", "storytelling", "hook"],
    source: "RMBC Method - Psychographic Research Module",
    content: `## The Core Narrative

People are drawn to the idea that effective solutions once existed but were:
- Forgotten by time
- Suppressed by powerful interests
- Overlooked by modern science
- Known only to isolated groups

Your product becomes the vehicle for REDISCOVERING this lost wisdom.

---

## 3-Part Structure

### Part 1: The Historical Solution

Identify a historical attempt to solve the problem that was:
- Unique or unconventional
- Effective (or at least interesting)
- From a credible or romantic source

**Examples:**
- "During WWII, the U.S. Army Surgeon General discovered undecylenic acid to combat nail fungus in troops stationed in tropical environments."
- "Dust bowl farmer wives of 1930s Oklahoma had perfect, glowing skin despite harsh conditions."
- "Ancient Okinawan villagers who lived past 100 with perfect heart health."

---

### Part 2: The Suppression or Forgetting

Explain why this solution was lost:

**Suppression narratives:**
- "Big pharma couldn't patent it, so they buried the research."
- "The industry had too much invested in inferior solutions."
- "Powerful interests discredited the inventor."

**Forgetting narratives:**
- "As medicine modernized, simple natural solutions were dismissed."
- "The knowledge was passed down orally and nearly died out."
- "Fashion and trends moved on, but the science was sound."

**Famous example:** Nikola Tesla's energy innovations—"discredited and shamed, his discoveries thrown into the ash heap of history."

---

### Part 3: The Rediscovery

Position your product as bringing this solution back:

- "We've rediscovered this powerful natural solution..."
- "Modern science finally validates what they knew all along..."
- "After decades of being ignored, this remedy is available again..."
- "We've taken their ancient wisdom and made it even better with today's technology."

---

## Research Questions to Find Your Angle

- Has someone tried to solve this problem in a unique way before?
- Are there older attempts (pre-1960) that were forgotten?
- Is there a conspiratorial story behind why old solutions didn't work?
- Were any solutions successful but forgotten? Why?
- Were any solutions suppressed? By whom? Why?

---

## Example Applications

**Skincare:**
"The dust bowl farmer wives of 1930s Oklahoma had perfect, glowing skin despite harsh conditions. Their secret? A simple talc remedy that's been forgotten by modern beauty companies focused on selling you expensive chemicals. We've rediscovered this powerful natural solution."

**Health supplement:**
"During WWII, Army doctors discovered a natural compound that kept soldiers healthy in the harshest conditions. But when the war ended, it was forgotten—until now."

**Business opportunity:**
"Before the internet, small-town entrepreneurs used a simple system to build wealth. Wall Street didn't want you to know about it. Now, you can use the same approach."

---

## Why It Works

1. **Curiosity** — "What was this forgotten solution?"
2. **Distrust validation** — Confirms their suspicion that they've been lied to
3. **Simplicity promise** — Old solutions feel less complicated than modern ones
4. **Credibility through age** — "If it worked then, it must be real"
5. **Exclusivity** — "Knowledge that only I now have access to"`
  },
  {
    title: "Corruption Angle (Paradise Lost)",
    description: "Narrative structure that suggests the market's pain point didn't used to exist—or wasn't as bad—until outside forces corrupted the natural order. Positions your product as restoration.",
    category: "story_framework",
    tags: ["narrative", "persuasion", "corruption", "storytelling", "hook"],
    source: "RMBC Method - Psychographic Research Module",
    content: `## The Core Narrative

The problem your market faces:
- Didn't used to exist, OR
- Used to be much less severe

Something CHANGED. Outside forces corrupted the natural order. Your product helps them escape or reverse this corruption.

---

## Key Questions to Develop the Angle

1. Is there a belief that this pain point used to not exist, or not be so bad?
2. Is there a belief that it's been recently exacerbated by outside forces?
3. If so, what are those forces?
4. What's the reason behind their presence?
5. Is there an isolated group that doesn't have this problem? Why?

---

## The "Isolated Group" Variant

A powerful sub-pattern:

"This isolated group of people doesn't struggle from [condition] that most of us do. In America, we DO suffer from this. The reason? We're exposed to [outside forces] while they aren't."

**Examples:**
- Okinawan centenarians (no heart disease)
- Remote Amazonian tribes (no obesity)
- European populations (different food regulations)
- Historical populations (before modern chemicals)

---

## Common Corruption Villains

**Food industry:**
- "In the 1980s, tobacco scientists were hired by food companies to make products more addictive."
- "Chemicals and preservatives that didn't exist 50 years ago now poison everything we eat."

**Medical establishment:**
- "Dr. Ancel Keys' flawed research on fat led to decades of bad dietary advice and skyrocketing obesity."
- "The FDA is captured by the industries it's supposed to regulate."

**Environmental:**
- "Microplastics didn't exist in our grandparents' bodies. Now they're in our blood."
- "Toxins in our water, air, and soil that previous generations never faced."

**Economic:**
- "Wages haven't kept up with inflation since the 1970s."
- "The system is rigged to keep regular people from building wealth."

---

## Example Applications

**Weight loss:**
"Food wasn't always this harmful. In the 1980s, tobacco scientists were hired by food companies to make products more addictive, adding chemicals and preservatives that have destroyed our health. Look at how rates of obesity have skyrocketed since then. Our product helps you reclaim the natural health humans enjoyed before our food system was corrupted."

**Dental health:**
"Why do fossilized teeth from 2,000 years ago show no cavities—despite no toothbrushes, no dentists, no fluoride? What did they have that we've lost? And who benefits from keeping you in the dark?"

**Financial:**
"Your parents could buy a house on a single income. Today, two incomes barely cover rent. What changed? And who rigged the system against you?"

---

## Structure Template

1. **Establish the paradise** — "It wasn't always this way..."
2. **Introduce the corruption** — "Then [forces] changed everything..."
3. **Show the evidence** — Statistics, comparisons, isolated groups
4. **Validate their frustration** — "It's not your fault. The deck is stacked."
5. **Offer the restoration** — "But there's something you can do..."

---

## Why It Works

1. **Externalizes blame** — "It's not your fault"
2. **Validates existing beliefs** — They already suspect this
3. **Creates an enemy** — Persuasion is stronger with a villain
4. **Positions product as rebellion** — Buying = fighting back
5. **Taps into nostalgia** — Longing for a simpler, purer time`
  },
  {
    title: "Market Awareness Research Prompt",
    description: "AI prompt template for researching a market's awareness levels, buyer journey, and how to match copy strategy to each segment.",
    category: "prompt_template",
    tags: ["prompt", "research", "awareness", "market-analysis"],
    source: "RMBC Method - Product Market Awareness Module",
    content: `## When to Use

Use this prompt when:
- Entering a new market
- Planning a campaign and need to know which awareness level to target
- Diagnosing why existing campaigns aren't converting
- Building stage-specific funnels

---

## The Prompt

\`\`\`
I'm doing market research for [PRODUCT TYPE] targeting [DEMOGRAPHIC] in [REGION].

I need to understand the market awareness levels for this space. Using Eugene Schwartz's 5 Stages of Market Awareness framework:

1. **Unaware** — What percentage of the TAM is completely unaware they have this problem? What would it take to reach them?

2. **Problem-Aware** — What percentage knows they have the problem but doesn't know solutions exist? What symptoms are they searching? What questions are they asking?

3. **Solution-Aware** — What percentage knows solutions exist but doesn't know specific products? What solution categories are they comparing? What "vs" searches are they doing?

4. **Product-Aware** — What percentage knows about products like mine? Who are they comparing? What proof do they need?

5. **Most-Aware** — What percentage already knows and trusts products like mine? What would get them to buy?

For each level, please provide:
- Estimated percentage of the total addressable market
- Typical search queries or questions they ask
- Where they hang out online (platforms, forums, groups)
- What type of content/messaging resonates at this stage
- Recommended content length and format

Also identify:
- Which awareness level represents the biggest opportunity
- Which awareness level competitors are primarily targeting
- Any awareness mismatches I should avoid
\`\`\`

---

## How to Use the Output

1. Identify your target awareness level based on opportunity + your resources
2. Audit your current marketing for awareness mismatches
3. Build stage-specific content (different hooks, leads, and depth)
4. Match channels to awareness levels (cold traffic = less aware, retargeting = more aware)`
  },
  {
    title: "Competitor Research Prompt",
    description: "AI prompt template for analyzing competitors across 8 dimensions—demographics, funnels, messaging, pricing, feedback, and weaknesses.",
    category: "prompt_template",
    tags: ["prompt", "research", "competitor-analysis", "market-analysis"],
    source: "RMBC Method - Competitor Research Module",
    content: `## When to Use

Use this prompt when:
- Entering a market and need to understand the competitive landscape
- Looking for positioning gaps
- Building a swipe file of proven hooks and angles
- Identifying weaknesses to exploit

---

## The Prompt

\`\`\`
I'm researching competitors in the [NICHE] space. The product I'm marketing is [PRODUCT DESCRIPTION] targeting [DEMOGRAPHIC].

Please analyze the top 5-10 competitors in this space across these 8 dimensions:

**1. Demographics**
- Who are they targeting? (age, gender, income, location)
- How do they describe their ideal customer?

**2. Psychographics**
- What emotions and aspirations do they target?
- What pain points do they emphasize?
- What transformation do they promise?

**3. Funnel Structure**
- What's their customer journey? (ad → landing page → upsells?)
- Do they use VSLs, webinars, long-form sales pages?
- What's their lead magnet or tripwire?

**4. Messaging Angles**
- What hooks do they use in ads?
- What "big idea" or unique mechanism do they claim?
- What proof points do they emphasize?

**5. Pricing & Offers**
- What are their price points?
- How do they structure bundles?
- What guarantees do they offer?
- What bonuses do they include?

**6. Customer Feedback**
- What do positive reviews praise?
- What do negative reviews complain about?
- What objections come up in comments?

**7. Estimated Scale**
- How big are they? (revenue estimates, ad spend, audience size)
- How long have they been in market?

**8. Weaknesses**
- Where do they fall short?
- What complaints recur?
- What positioning gaps exist?

For each competitor, also note:
- 2-3 best hooks or headlines worth swiping
- Their apparent unique mechanism
- One thing they do better than others
- One weakness I could exploit
\`\`\`

---

## How to Use the Output

1. Create a swipe file of best hooks and angles
2. Identify positioning gaps no one is filling
3. Note recurring customer complaints (your opportunity)
4. Document unique mechanisms to avoid copying directly
5. Build your differentiation strategy`
  },
  {
    title: "Psychographic Research Prompt",
    description: "AI prompt template for deep psychographic research—uncovering beliefs, prejudices, pain points, hopes, and the market's relationship with existing solutions.",
    category: "prompt_template",
    tags: ["prompt", "research", "psychographics", "audience-research"],
    source: "RMBC Method - Psychographic Research Module",
    content: `## When to Use

Use this prompt when:
- Starting copy for a new market
- Current messaging isn't resonating emotionally
- Need to understand WHY the market buys, not just WHAT they want
- Building customer avatars or personas

---

## The Prompt

\`\`\`
I am writing sales copy targeted towards [DEMOGRAPHIC/MARKET DESCRIPTION]. I need deep psychographic research to understand their psychology.

Please research and answer the following questions. Where possible, provide actual quotes from forums, social media, or reviews that show how this market talks about their problems in their own words.

**SECTION 1: IDENTITY & WORLDVIEW**

- Who is this customer beyond demographics? How do they see themselves?
- What attitudes do they have? (religious, political, social, economic)
- What are their hopes and dreams related to [PROBLEM/DESIRE]?
- What are their victories and failures in trying to solve this problem?
- What outside forces do THEY believe have prevented their best life?
- What are their prejudices? (against institutions, product types, groups)
- Sum up their core beliefs about life, love, and family in 1-3 sentences.

**SECTION 2: EXISTING SOLUTIONS**

- What is this market already using to solve the problem? (list all categories)
- What has their experience been like with these solutions?
- What do they LIKE about existing solutions?
- What do they DISLIKE about existing solutions?
- Are there horror stories about existing solutions?
- Does the market believe existing solutions actually work? If not, why?

**SECTION 3: CURIOSITY ANGLES**

- Has someone tried to solve this problem in a very unique way before? What happened?
- Is there a conspiratorial story behind why old solutions didn't work or were suppressed?
- Are there older attempts to solve the problem (pre-1960) that are unique? Were they successful but forgotten, or failures? Why?

**SECTION 4: CORRUPTION ANGLES**

- Is there a belief that this pain point used to not exist, or used to not be so bad?
- Is there a belief that it's been recently exacerbated by outside forces?
- If so, what are those forces and what's the reason behind their presence?
- Is there an isolated group of people who doesn't have this problem? Why don't they have it while others do?

Please format the output clearly by section, and include actual quotes or paraphrased language from real people in this market whenever possible.
\`\`\`

---

## How to Use the Output

1. Extract 3-5 core beliefs/prejudices to align messaging with
2. Build "language to use" and "language to avoid" lists
3. Identify curiosity and corruption angles for hooks
4. Map their solution journey for objection handling
5. Define ideal future state for transformation promises`
  },
  {
    title: "Research Consolidation Prompt",
    description: "AI prompt template for synthesizing market awareness, competitor, and psychographic research into a single Unified Research Document for ongoing copy generation.",
    category: "prompt_template",
    tags: ["prompt", "research", "synthesis", "briefing"],
    source: "RMBC Method - Unified Research Process Module",
    content: `## When to Use

Use this prompt when:
- You've completed awareness, competitor, and psychographic research
- Need to consolidate findings into one reference document
- Preparing to generate multiple copy assets
- Want consistent context across all LLM copy generation

---

## The Prompt

\`\`\`
I'm working on a marketing campaign in [NICHE]. The product is [PRODUCT] and we focus on [CUSTOMERS] in [REGION].

So far I have performed research around:
- Product/Market Awareness Levels
- Competitors  
- Psychographic Research

I'm uploading the research documents. What I want you to do is go through these in depth and create ONE unified research brief containing all key elements needed for this campaign.

This unified document will be shared with LLMs as background context when generating copy and marketing assets (primarily direct response).

I DON'T need:
- TAM size or market sizing
- Strategic recommendations
- Implementation plans

I DO need:

**1. Target Market Demographic Overview**
Focus on Problem-Aware and Solution-Aware segments. Include age, income, life stage, digital behavior, shopping habits.

**2. Target Market Psychographic Overview**
- Pain points (specific, emotional, in their language)
- Hopes and dreams (ideal future state)
- How they view themselves
- Core beliefs and prejudices

**3. Language Guidelines**
- Language TO USE (terms that resonate)
- Language TO AVOID (terms that trigger skepticism)

**4. Primary Promises**
Key promises that resonate with this market and can be substantiated.

**5. Key Objections & Rebuttals**
Top 5-7 objections they'll have to our marketing, with strategies to address each.

**6. Existing Solutions Analysis**
- What they've already tried
- Why those solutions are inadequate
- What's missing that we can provide

Format this as a clean, scannable document I can reference repeatedly.
\`\`\`

---

## How to Use the Output

1. Review and adjust based on your product knowledge (LLM gets you 95%, you refine)
2. Save as your master context document
3. Attach to every copy generation prompt going forward
4. Update as you learn more from campaign performance`
  },
  {
    title: "Ingredient Research Prompt",
    description: "AI prompt template for finding NCBI and journal-backed claims for product ingredients—connecting scientific studies to your mechanism and market pain points.",
    category: "prompt_template",
    tags: ["prompt", "research", "ingredients", "claims", "scientific-evidence"],
    source: "RMBC Method - Ingredient Deep Research Module",
    content: `## When to Use

Use this prompt when:
- Writing copy for supplement, skincare, or health products
- Need scientific backing for ingredient claims
- Building proof sections in VSLs or sales pages
- Creating ingredient highlight content

---

## The Prompt (With Mechanism Context)

Use this version when you have a defined unique mechanism:

\`\`\`
These are the ingredients for a [PRODUCT TYPE] I'll be doing sales copy for:

[LIST ALL INGREDIENTS]

I'm attaching two documents:
1. An overview of the market and their pain points
2. The unique mechanism I'll be using

Please come up with a list of claims for each ingredient that can be tied back to specific studies or research.

Requirements:
- Research must come from NCBI or reputable scientific journals
- NO random blogs or websites
- Preference for RCTs with humans, but include other studies if RCTs aren't available

Claims should focus on:
1. How the ingredient supports the unique mechanism (when applicable)
2. How the ingredient helps alleviate market pain points (regardless of mechanism connection)

Format:
- Keep claims digestible with references
- No extensive biology lessons
- Include specific efficacy percentages when available
- Focus on best possible results from the research

I'll use these claims across various marketing assets.
\`\`\`

---

## The Prompt (Without Mechanism Context)

Use this version for pure ingredient research:

\`\`\`
These are the ingredients for a [PRODUCT TYPE] I'll be doing sales copy for:

[LIST ALL INGREDIENTS]

For each ingredient, find claims backed by studies from NCBI or scientific journals. No blogs or random websites.

For each ingredient, provide:
- Key research findings
- Efficacy percentages or measurable results
- Source reference
- How it addresses [MAIN MARKET PAIN POINTS]

Prefer RCTs with humans. Include other study types only if RCTs aren't available.

Keep it digestible—no long biology lessons. Just accurate, usable claims showing best efficacy.
\`\`\`

---

## Best Practices

1. **Run both versions** — With and without mechanism context yields different results
2. **Use multiple tools** — Perplexity for speed/stats, ChatGPT for mechanism connection
3. **Verify key claims** — Double-check important statistics across sources
4. **Organize by ingredient** — Makes it easy to reference when writing
5. **Note study quality** — RCT > clinical study > animal study > in-vitro

---

## Source Quality Hierarchy

| Priority | Source Type |
|----------|-------------|
| 1 | RCTs with humans |
| 2 | Human clinical studies (non-RCT) |
| 3 | Meta-analyses |
| 4 | Animal studies |
| 5 | In-vitro studies |
| Never | Blogs, commercial websites, unverified claims |`
  },

  // ============================================
  // BATCH 2: Unique Mechanisms + VSL (12 frameworks)
  // ============================================
  {
    title: "Unique Mechanism Framework",
    description: "Strategic framework for developing and presenting unique mechanisms (UMP/UMS) that differentiate your offer by explaining the real cause of the problem and introducing a novel solution approach.",
    category: "strategy_framework",
    tags: ["mechanism", "differentiation", "UMP", "UMS", "positioning", "sales copy", "VSL"],
    source: "RMBC Method - Unique Mechanisms + VSL Section I",
    content: `## Overview

The Unique Mechanism is the heart of persuasive marketing copy. It consists of two complementary components:

- **UMP (Unique Mechanism of the Problem)**: Explains the *real* cause of the prospect's problem
- **UMS (Unique Mechanism of the Solution)**: Introduces how your solution uniquely addresses that root cause

Together, they create an "aha moment" that shifts the prospect's perspective and makes your solution feel inevitable.

---

## Part 1: Unique Mechanism of the Problem (UMP)

### Core Purpose
The UMP reveals a surprising, often hidden cause of the prospect's problem that they haven't considered. It should challenge conventional wisdom while remaining believable.

### Characteristics of an Effective UMP

1. **Simple and understandable** — Avoid overly complex explanations with too many technical details
2. **Novel** — Present information that feels new or surprising to the viewer
3. **Logical** — Create clear cause-and-effect relationships that make sense
4. **Credible** — Include enough supporting evidence to be believable
5. **Shareable** — Prospects should be able to explain it to others easily
6. **Creates an "aha moment"** — Shifts perspective in a meaningful way

### The System Explanation Framework (4 Steps)

When presenting your UMP, follow this structure:

**Step 1: Explain How the System Should Work**
- Describe the normal, healthy function of the relevant system or process
- Example: "Your calves are your 'second heart' — they contract to push blood back up toward your heart against gravity."

**Step 2: Identify Why It's Not Working Properly**
- Reveal what's malfunctioning or breaking down
- Example: "As you age or become less active, your calves weaken and can't properly contract."

**Step 3: Reveal External Factors or Culprits**
- Name the specific cause or contributing factors
- Example: "This is often accelerated by sedentary lifestyles, certain medications, or underlying conditions."

**Step 4: Connect to Symptoms**
- Link the malfunction directly to what the prospect experiences
- Example: "When your calves can't pump blood efficiently, it pools in your lower legs, causing the swelling, discomfort, and heaviness you've been experiencing."

### UMP Quality Test
Ask: "Could someone explain this mechanism to a friend after hearing it once or twice?" If not, simplify.

---

## Part 2: Unique Mechanism of the Solution (UMS)

### Core Purpose
The UMS explains how your solution addresses the root cause identified in the UMP. It creates a logical bridge that makes your product feel like the inevitable answer.

### UMS Presentation Structure (4 Steps)

**Step 1: Present the Macro Solution**
- Introduce the general approach to solving the problem (not your specific product yet)
- Example: "To relieve edema, you need to stimulate your calves and vein valves to reduce blood pooling."

**Step 2: Address Practical Obstacles**
- Acknowledge why obvious solutions won't work
- Example: "Exercise would help, but when your legs are swollen and painful, moving around isn't possible—creating a vicious cycle."

**Step 3: Introduce the Breakthrough**
- Reveal the specific approach or technology that overcomes these obstacles
- Example: "NMES technology can stimulate calf muscles without requiring physical movement."

**Step 4: Provide Validation**
- Offer proof that the solution works through studies, expert opinions, or results
- Example: "Studies in the Journal of Rehabilitation Medicine show NMES reduces limb swelling and improves quality of life."

### Critical Principle
The UMS must directly correspond to the UMP. If you identified a two-part problem, present a two-part solution. This creates logical coherence that builds belief.

---

## Evaluation Criteria for Mechanisms

### The 5-Point Mechanism Test

| Criterion | Question to Ask |
|-----------|----------------|
| **Novelty** | Is this genuinely new information for the prospect? |
| **Believability** | Does it have enough proof/logic to be credible? |
| **Simplicity** | Can it be explained in 2-3 sentences? |
| **Relevance** | Does it directly connect to the prospect's experienced symptoms? |
| **Differentiation** | Does it position your solution as uniquely effective? |

### Market Considerations

**Health Markets:**
- Often require scientific backing and expert credibility
- Work well with the System Explanation Framework
- Can use technical terms if simplified properly

**Business Opportunity Markets:**
- Often skip UMP and go directly to UMS
- Prospects already understand their problem (need income/freedom)
- Focus more on proof that the method works

**Financial Markets:**
- Blend of both approaches
- May use economic mechanisms instead of biological ones

---

## Common Mistakes to Avoid

1. **Overcomplicating the mechanism** — Too much jargon or too many steps
2. **Weak logical connection** — UMS doesn't clearly address UMP
3. **Lack of credibility** — Claims without supporting evidence
4. **Too generic** — Mechanism could apply to any competitor's product
5. **Forgetting the "aha moment"** — Information is true but not surprising`
  },
  {
    title: "Mechanism Ideation Prompt",
    description: "AI prompt template for brainstorming potential unique mechanisms (UMP/UMS) based on product research, competitor analysis, and target market insights.",
    category: "prompt_template",
    tags: ["mechanism", "ideation", "brainstorming", "AI prompt", "UMP", "UMS"],
    source: "RMBC Method - Unique Mechanisms",
    content: `## Mechanism Ideation Prompt

### Purpose
Generate multiple unique mechanism concepts that could differentiate your offer by explaining the problem and solution in novel ways.

---

### Prompt Template

\`\`\`
You are a direct response copywriter specializing in developing unique mechanisms for marketing campaigns. Based on the research provided, generate 10 potential unique mechanism concepts.

For each mechanism, provide:
1. **Mechanism Name**: A memorable, descriptive name
2. **UMP Summary**: The unique explanation of what's really causing the problem (2-3 sentences)
3. **UMS Summary**: How the solution uniquely addresses this root cause (2-3 sentences)
4. **Key Proof Points**: What evidence could support this mechanism
5. **Novelty Score**: Rate 1-10 how surprising/new this would be to the target audience
6. **Believability Score**: Rate 1-10 how credible this would seem

## Research Context

**Product/Offer**: [Insert product details]

**Target Audience**: [Insert avatar details]

**Key Ingredients/Components**: [Insert active ingredients, features, or methodology]

**Competitor Mechanisms**: [Insert how competitors explain the problem/solution]

**Scientific Research**: [Insert relevant studies or expert findings]

**Common Beliefs to Challenge**: [Insert what the market currently believes about the problem]

## Guidelines

- Prioritize mechanisms that are SIMPLE enough to explain in one sentence
- Look for counterintuitive angles that challenge conventional wisdom
- Ensure each mechanism could credibly be backed by the research provided
- Consider mechanisms at different "levels" (biological, psychological, environmental, behavioral)
- Avoid mechanisms that could apply equally to competitor products
\`\`\`

---

### Usage Notes

- Run this prompt after completing deep research on the product and market
- Feed in competitor analysis to ensure differentiation
- Generate multiple options before selecting the strongest candidate
- The best mechanisms often combine surprising cause + logical solution`
  },
  {
    title: "Mechanism Evaluation Prompt",
    description: "AI prompt template for critically evaluating and scoring potential unique mechanisms against key criteria before selection.",
    category: "prompt_template",
    tags: ["mechanism", "evaluation", "scoring", "AI prompt", "selection"],
    source: "RMBC Method - Unique Mechanisms",
    content: `## Mechanism Evaluation Prompt

### Purpose
Systematically evaluate potential mechanisms to identify the strongest candidate for your campaign.

---

### Prompt Template

\`\`\`
You are evaluating unique mechanism concepts for a marketing campaign. Score each mechanism against the criteria below and provide a final recommendation.

## Mechanisms to Evaluate

[Insert 3-5 mechanism concepts from ideation phase]

## Evaluation Criteria (Score 1-10 for each)

### 1. Novelty
- Does this present genuinely new information?
- Would the target audience say "I never thought of it that way"?
- Does it challenge conventional wisdom in a meaningful way?

### 2. Believability
- Is there credible evidence to support this?
- Does the logic hold up to scrutiny?
- Would a skeptical prospect find this plausible?

### 3. Simplicity
- Can this be explained in 2-3 sentences?
- Could a prospect easily repeat this to a friend?
- Is it free of unnecessary jargon or complexity?

### 4. Emotional Resonance
- Does this connect to the prospect's felt experience?
- Does it validate their frustration with past failures?
- Does it create hope for a real solution?

### 5. Differentiation
- Does this uniquely position our solution?
- Could competitors easily claim the same mechanism?
- Does it create a logical moat around our product?

### 6. Proof Availability
- Do we have studies, testimonials, or expert backing?
- Can we visually demonstrate or explain this?
- Is the evidence compelling and accessible?

## Output Format

For each mechanism:
- Individual criterion scores (1-10)
- Total score (out of 60)
- Key strengths
- Key weaknesses
- Improvement suggestions

Final recommendation with rationale.
\`\`\`

---

### Scoring Guide

| Score | Meaning |
|-------|--------|
| 9-10 | Exceptional — strongest possible |
| 7-8 | Strong — minor improvements possible |
| 5-6 | Adequate — workable but not compelling |
| 3-4 | Weak — significant issues |
| 1-2 | Poor — fundamental problems |

### Decision Framework

- **50+ points**: Strong candidate, proceed with development
- **40-49 points**: Viable but consider improvements first
- **Below 40**: Likely need to revisit ideation phase`
  },
  {
    title: "Mechanism Expansion Prompt",
    description: "AI prompt template for fully developing a selected unique mechanism into detailed copy-ready content with proof elements and presentation structure.",
    category: "prompt_template",
    tags: ["mechanism", "expansion", "copywriting", "AI prompt", "development"],
    source: "RMBC Method - Unique Mechanisms",
    content: `## Mechanism Expansion Prompt

### Purpose
Transform a selected mechanism concept into fully developed, copy-ready content with all supporting elements.

---

### Prompt Template

\`\`\`
You are a direct response copywriter. Take the selected unique mechanism and develop it into comprehensive copy-ready content.

## Selected Mechanism

**Name**: [Insert mechanism name]
**UMP Summary**: [Insert problem mechanism]
**UMS Summary**: [Insert solution mechanism]

## Available Research

[Insert relevant studies, expert quotes, ingredient research, etc.]

## Develop the Following

### 1. UMP Full Narrative (300-500 words)
Write the complete explanation of the problem mechanism using the System Explanation Framework:
- How the system is supposed to work
- Why it's malfunctioning
- External factors/culprits causing the problem
- How this connects to the symptoms they experience

Make it conversational, use analogies where helpful, and build to an "aha moment."

### 2. UMS Full Narrative (300-500 words)
Write the complete explanation of how the solution addresses the root cause:
- The macro-level solution approach
- Why obvious alternatives don't work
- The breakthrough discovery/technology/method
- Proof that it works

### 3. Bridge Statement
Write a 2-3 sentence transition that connects the UMP revelation to the UMS introduction. This should create a natural "So what's the answer?" moment.

### 4. Proof Stack
Organize available proof elements:
- Scientific studies (with specific citations)
- Expert credentials/quotes
- Third-party validation
- Logical demonstrations

### 5. Objection Preemption
Identify 3 likely objections to this mechanism and write brief counter-arguments to weave into the copy.

### 6. Simplification Versions
Provide:
- **One-sentence version**: For hooks and headlines
- **Elevator pitch version**: 30-second verbal explanation
- **Full version**: Complete narrative for VSL body

## Guidelines

- Write in second person ("you") for direct connection
- Use concrete language over abstractions
- Include specific numbers and details where available
- Create mental images the prospect can visualize
- Maintain credibility — don't overclaim
\`\`\`

---

### Quality Checklist

Before finalizing, verify:

- [ ] UMP creates genuine surprise or "aha moment"
- [ ] UMS logically follows from UMP
- [ ] Proof elements are specific and verifiable
- [ ] Language is accessible (no unexplained jargon)
- [ ] One-sentence version is memorable and shareable
- [ ] Objection preemptions are woven in naturally`
  },
  {
    title: "Classic VSL Structure Template",
    description: "Complete 8-section blueprint for Video Sales Letters with granular checklists, format adaptations for different lengths (long/medium/short), and In-Feed variant structure.",
    category: "structure_template",
    tags: ["VSL", "video sales letter", "structure", "template", "sales page", "long-form", "medium-form", "in-feed"],
    source: "RMBC Method - VSL Section I",
    content: `## Overview

The Classic VSL Structure is a proven framework for creating video sales letters that convert. This template covers the complete 8-section architecture with all sub-elements, plus adaptations for different formats and contexts.

---

## The 8-Section Blueprint

### Section 1: Hook/Micro-Lead

**Purpose**: Grab attention immediately and prevent scrolling/clicking away.

**Duration**: 10-60 seconds depending on format

**Elements**:
- Hook-heavy or attention-grabbing opening line
- Quickly relates to the pain point prospect faces
- Quick connection to the promise of a solution
- Pattern interrupt (visual or verbal)

**Hook Types** (use one or combine):
- Provocative question: "Does your skin pass the pinch test?"
- Bold promise: "Say goodbye to [problem] in [timeframe]"
- Warning/danger: "Here are three early signs of [condition]"
- Counterintuitive statement: "What if I told you [surprising claim]?"
- Quick test: "Try this simple experiment..."

---

### Section 2: Lead

**Purpose**: Sell the prospect on continuing to watch. The lead is an advertisement for the rest of your VSL.

**Duration**: 1-3 minutes

**Core Elements** (flexible order):
- [ ] Call out the problem clearly
- [ ] Promise solution to pain point + save time/money
- [ ] Tease emotional discovery story ("I'll share how my sister...")
- [ ] Tease unique mechanism behind solution
- [ ] Tease contrarian nature ("This flies in the face of what you've been told")
- [ ] Work in fascinations as incentive to continue ("I'll answer this riddle for you")
- [ ] Briefly mention credibility builders
- [ ] Qualifiers — who this works for
- [ ] Briefly address skepticism
- [ ] Include broad testimonials if available (benefits, not product)

**Key Principle**: Open loops, don't close them. Tease what's coming without revealing it.

**Common Mistake**: Going into "teacher mode" too early. Save education for later sections.

---

### Section 3: Background Story

**Purpose**: Build emotional connection and establish credibility through narrative.

**Duration**: 2-5 minutes (can be condensed to 30 seconds in short formats)

**Elements**:
1. **Who I Am + Credibility** — Credentials, experience, results (if expert)
2. **Relatable Pain** — "Me or someone close to me was just like you"
3. **Failed Solutions** — Traditional advice and approaches that didn't work
4. **Trigger Event** — The breaking point where something HAD to change
5. **Search for Truth** — The quest for real answers that led to discovery

**Adaptation Notes**:
- Health markets: Expert credentials create instant trust, can shorten story
- BizOp markets: Humble beginnings + struggle creates relatability
- Medium VSLs: Compress to 1-2 sentences per element

---

### Section 4: Discovery

**Purpose**: Bridge from the story to the mechanism revelation.

**Duration**: 1-2 minutes

**Elements**:
- The moment of realization or breakthrough
- What was discovered that changed everything
- Why this information isn't widely known
- Sets up the "real cause" revelation

---

### Section 5: Unique Mechanism (UMP/UMS)

**Purpose**: Explain the real cause of the problem and introduce the real solution.

**Duration**: 3-8 minutes (longest educational section)

#### 5A: Unique Mechanism of the Problem (UMP)

- Explain the "real cause" — the missing 1% they didn't know
- Should be surprising, possibly counterintuitive
- Backed by credibility and proof elements
- Use the System Explanation Framework:
  1. How the system should work
  2. Why it's malfunctioning
  3. External culprits causing the malfunction
  4. Connection to experienced symptoms

#### 5B: Unique Mechanism of the Solution (UMS)

- Now that they know the real cause, this is the real solution (macro level)
- Must be logically connected to the problem
- Go from macro theory to micro proof
- Backed by credibility, citations, scientific sources
- Present: Macro solution → Obstacles → Breakthrough → Validation

**Common Mistake**: Overcomplicating with too many technical details.

---

### Section 6: Product Build-Up and Reveal

**Purpose**: Bridge from solution concept to specific product, building value through narrative.

**Duration**: 2-5 minutes

**Elements**:
1. **Out-of-Box Fails** — Why readily available solutions are flawed
2. **DIY Decision** — Had to create something better themselves
3. **Trials and Setbacks** — Problems encountered during development
4. **Breakthrough** — The moment it finally worked
5. **Proof It Works** — Initial results, others asking for it
6. **Product Is Born** — The reveal of what they created

**For Information Products**:
- Focus on systematizing knowledge
- Testing with students/clients
- Refining based on feedback
- Multiple iterations until it "clicked"

**Psychological Triggers**:
- Preemptive objection handling (why alternatives don't work)
- Perceived value enhancement (effort that went into it)
- Authenticity through struggle narrative
- Effort justification bias (value what took effort to create)

---

### Section 7: Close

**Purpose**: Convert interest into action. This is typically the LONGEST section.

**Duration**: 5-15 minutes

#### Phase 1: Product Introduction
- Product details (what's included, how it works)
- What makes it special (unique selling propositions)
- Discuss and dismiss alternatives (expensive, ineffective, side effects)
- How to use the product (remove confusion)

#### Phase 2: Value Building
- Keep stacking value of the product
- Additional testimonials
- Personal mission tied to emotion
- Scarcity: Demand is high, supplies limited
- Price anchoring: Establish higher reference points
- Price justification: Other solutions cost more, consequences of inaction
- Smart people buy more (encourage larger packages without shaming smaller)

#### Phase 3: Call to Action Sequence

**First CTA**:
- Price reveal: "Normally $X, but right now just $Y"
- Clear instruction: "Click the button below"
- What happens after they click

**Bonus Reveal** (after first CTA):
- Valuable free bonuses introduced
- Adds more perceived value

**Guarantee**:
- Risk reversal: "If for any reason you're not happy..."
- No hassle promise

**Second CTA**:
- Crossroads close: "You have two choices..."
- Contrast continued suffering vs. transformation
- Urgency: "No guarantee how long this will be available"

**Third CTA**:
- Final push
- Thank them for watching

**Key Principle**: You can't have too many CTAs. Each gives prospects another chance to convert.

---

### Section 8: FAQ

**Purpose**: Address remaining objections and remind of key points.

**Duration**: 2-5 minutes

**Elements**:
- Return to friendly, helpful tone
- Clear up common confusion
- Remind what product is and what it's for
- Reiterate importance of taking action
- Restate guarantee terms
- Final reminder of how to buy

---

## Format Adaptations

### Long-Form VSLs (30+ minutes)
- Full development of all sections
- Multiple proof elements and testimonials
- Extended storytelling and emotional build-up
- Detailed mechanism explanation
- Comprehensive objection handling in close

### Medium-Form VSLs (15-25 minutes)
- Compress background story to key beats
- Streamlined mechanism explanation
- Focused proof elements (quality over quantity)
- Still maintain all 8 sections, just condensed

### Short-Form VSLs (5-15 minutes)
- Background story may be 1-2 sentences
- Single powerful hook (vs. multiple)
- Simplified mechanism (core concept only)
- Accelerated pacing throughout
- Maintain strong close with clear CTA

---

## In-Feed VSL Variant

**Context**: Running as ads in social media feeds (Facebook, TikTok, etc.)

**Key Differences**:
- Must capture attention in first 3 seconds
- Viewers are not seeking your content
- Goal is to "sell the click" not the product
- Mobile-first, often vertical format
- May need captions (sound-off viewing)

**In-Feed Structure**:
1. Hook(s) — Multiple, stacked, curiosity-heavy
2. Education — Brief, valuable information
3. Entertainment — Optional but helps retention
4. Pain Point + Promise — Call out problem, tease solution
5. Quick Background Story — Condensed credibility
6. UMP — Simplified mechanism of problem
7. UMS — Simplified mechanism of solution
8. Product Build-Up — Brief
9. Close — "Click to learn more" / "Watch the full video"

**In-Feed vs. On-Page**:
| Aspect | In-Feed | On-Page |
|--------|---------|--------|
| Viewer intent | Low (scrolling) | High (clicked through) |
| Goal | Sell the click | Sell the product |
| Length | 1-5 minutes | 5-45 minutes |
| Hook emphasis | Extremely high | Important but less critical |
| Detail level | Teases only | Full explanation |

---

## Transubstantiation Technique

**Use When**: Your hook uses a metaphor or big idea that differs from your actual offer.

**Process**:
1. Open with compelling metaphor/concept (e.g., "secret trust fund")
2. Build intrigue and emotional investment
3. Gradually shift language toward actual offer
4. Use historical precedent or logical bridges
5. Reveal actual opportunity without jarring disconnect

**Example Flow**:
- "Secret trust fund" (hook)
- "Raw value" and "asset" (transition language)
- Historical parallel (Homestead Act)
- "Investment opportunity" (bridge)
- "Mining stocks" (actual offer)

---

## Common Pitfalls

1. **Structural Disorganization** — Jumping between sections confuses viewers
2. **Overcomplicated Mechanisms** — Too much jargon kills comprehension
3. **Neglecting Future Pacing** — Not painting the transformed life vividly
4. **Skipping Product Build-Up** — Rushing from mechanism to offer
5. **Weak Close** — Underselling the CTA sequence
6. **Zigzagging** — Adding tangential content that breaks flow`
  },
  {
    title: "Mini VSL Structure Templates",
    description: "Seven distinct short-form VSL structures (1-5 minutes) for different product types and marketing contexts, including health, BizOp, and direct product sales.",
    category: "structure_template",
    tags: ["VSL", "short-form", "mini VSL", "ad scripts", "video ads", "templates"],
    source: "RMBC Method - VSL Section I",
    content: `## Overview

Mini VSLs (1-5 minutes) require different structural approaches than long-form content. These seven templates cover the most common short-form patterns, each optimized for specific product types and marketing contexts.

---

## Template 1: Problem → Mechanism → Solution

**Best For**: Health products, supplements, devices (2-3 minutes)

**Structure**:

### Hook/Problem Callout (10-15 seconds)
- Direct statement of pain point
- Examples:
  - "If your toe pain is driving you nuts..."
  - "Think you have a small bladder? Think again."

### Mechanism Reveal (30-60 seconds)
- Explain the "real cause" most people don't know
- Scientific/medical explanation made simple
- Example: "Most people don't realize this isn't random. It starts with high uric acid levels..."

### Solution Reveal (30-45 seconds)
- Introduce the natural/different approach
- Two paths:
  - **Product reveal**: Mention each compound/component + why it matters
  - **Method tease**: Hint at solution without full detail (e.g., "7 Second Morning Ritual")

### CTA (15-30 seconds)
- Quick risk reversal or guarantee
- Example: "If you don't feel the difference, send back the empty bag..."

---

## Template 2: BizOp Contrarian Structure

**Best For**: Business opportunities, investment products, courses (3-5 minutes)

**Structure**:

### 1. Hook (Contrarian Investment/Income Positioning)
- Traditional method is earning terrible returns
- People only do it because they don't know a better way

### 2. Opportunity Introduction
- "But there's something so much better... it's called [Method Name]"
- "Our students are earning [X times better] than traditional methods"
- Quick credibility anchor (verifiable statistic)

### 3. Explain Method/System
- Simple example with physical product/transaction
- Key differentiator (why returns are higher)
- Relatable analogy
- Industry validation

### 4. Business Model Reveal
- Partnership structure: "My partner and I work with [qualifier type] who have [minimum investment]"
- What you do for them
- Done-for-you promise

### 5. Objection Handling Sequence
- "Why don't you just do it yourself?" — We do, but pooling capital allows [advantage]
- "Is this a scam?" — Media credibility, number helped, recognition
- "What's the catch?" — Limited capacity, can only partner with [small number]

### 6. Qualification Requirements
- Financial qualifier: $[amount]+ liquid
- Availability scarcity

### 7. Information Gap Bridge
- "I can't explain everything in this ad"
- Free case study/workshop offer

### 8. Primary CTA with Urgency
- "Last time you'll see this ad"
- Motivational push

### 9. Risk Reversal + Future Pacing
- "What's the worst that could happen?"
- "6-12 months from now, you look back..."

### 10. Final CTA
- Simple action steps
- Casual close

---

## Template 3: Personal Discovery → Solution

**Best For**: Direct product sales, information products (2-3 minutes)

**Structure**:

### 1. Audience Hook + Life Change Promise
- Audience callout: "[Target audience], pause the scroll"
- Big promise: "What I'm about to tell you can change your life"
- Solution tease: "This is how I [solved problem] without [common methods]"

### 2. Problem Agitation (Personal Struggle)
- Failed attempt: "I tried [popular solution] but [negative consequences]"
- Multiple pain points (2-3 specific frustrations)
- Emotional impact

### 3. Discovery Moment
- "But luckily, I came across [discovery source]"
- What they found and how it could help

### 4A. Product Reveal Path (Physical Products)
- Product introduction: "It's called [Product Name]"
- How it works: "[technology/mechanism] to [function]"
- Key features (3-4)
- Ease of use

### 4B. Method Tease Path (Information Products)
- Method name: "It's called the [X]-[Time] [Method Name]"
- What it does without full reveal
- What you avoid
- Authority mention

### 5. Personal Transformation
- Immediate results: "I can finally [primary benefit]"
- Specific improvements (3-4 concrete changes)

### 6A. Direct Sale CTA (Products)
- Offer: "Right now they're running a special offer"
- "Click the link below before it expires"

### 6B. Information CTA (Methods)
- Urgency qualifier: "If you're over [age] and experiencing [symptoms]"
- "Click below to see [Expert's] [Method Name]"

---

## Template 4: Authority/Affinity + Life-Changing Discovery

**Best For**: Products solving lifestyle/activity problems (3-4 minutes)

**Structure**:

### 1. Contrarian Hook + Personal Authority
- "Why I'll never [use common solution] for [activity] again"
- Establish authority/affinity: "I'm a [profession/hobby/identity that relates]"

### 2. High-Stakes Situation Setup
- Important event or activity coming up
- Emotional investment established

### 3. From Old to New Solution
- Was going to use old solution despite flaws
- "But one day, I swapped [old] for [new] and my life changed"

### 4. Experiencing Benefits
- Primary impact on main activity
- Physical or deeper transformation

### 5. Proof/Test Results
- Extreme test scenario: "In [challenging situation], I [impressive metric]"
- Pain-point-free proof

### 6. Personal Recommendation
- Authority endorsement: "That's why I now advise everyone..."
- Broader application

### 7. Product Authority & Features
- Company credibility
- Feature stack (3-4 features + price benefit)

### 8. Comparison/Superiority
- Performance vs. competitors
- Additional advantages

### 9. Technical Benefits
- Special feature highlight
- How it works
- Additional practical benefits

### 10. Social Proof
- "No wonder they have fantastic reviews from [people like target]"

### 11. Current State Transformation
- Main activity without pain point
- Capability expansion

### 12. Offer + CTA
- Limited offer mention
- Authority close
- Simple CTA

---

## Template 5: "Secret" Reveal

**Best For**: Curiosity-driven offers, mystery products (1-3 minutes)

**Structure**:

### Mystery Hook (15-20 seconds)
- "Billionaires have a secret..."
- Reference to hidden knowledge
- Pattern interrupt

### Personal Transformation Story (45-75 seconds)
- Before state (struggling, broke, suffering)
- Mysterious encounter or discovery
- Dramatic results achieved

### Product/Method Reveal (30-45 seconds)
- What the "secret" actually is
- Brief how-it-works explanation
- Just enough to be believable

### Urgency CTA (15-20 seconds)
- Limited availability
- Act now messaging
- Clear next step

---

## Template 6: Emotional Story

**Best For**: Health products with strong emotional hooks (2-4 minutes)

**Structure**:

### 1. Hook/Problem Callout (10 seconds)
- Direct problem + promise
- Example: "Shooting pain in your back or sciatica? Do this to relieve joint pain fast."

### 2. Personal Story as Problem Amplification (45 seconds)
- Family member or personal crisis
- Medical escalation (pills → shots → surgery)
- Stakes raising (losing mobility, independence)

### 3. Authority-Backed Mechanism Reveal (90 seconds)
- Expert validation (credentials)
- The "real cause" explanation
- Scientific detail made simple
- Why conventional treatments fail

### 4. Solution Introduction with More Authority (45 seconds)
- Second expert or additional credibility
- Named method/ritual
- Specific discovery (compound, technique)

### 5. Benefits Promise + CTA (30 seconds)
- Future pacing: "Feel 10, 15, even 20 years younger"
- Free presentation offer
- Clear click instruction

---

## Template 7: Contrarian + Expert Reveals Mechanism

**Best For**: Educational authority approach, health products (3-5 minutes)

**Structure**:

### 1. Hook + Contrarian Twist (15-25 seconds)
- Benefit promise: "This [timeframe] [method] can [outcome]"
- Contrarian statement: "Turns out, [common belief] can be just as dangerous as [opposite]"
- Pattern interrupt: "Alarming, right?"

### 2. Authority Setup + Education (20-30 seconds)
- Expert introduction: "A top [location] [expert type] says..."
- Reframe common thinking
- Authority quote or analogy

### 3. Mechanism Reveal with Progressive Explanation (60-90 seconds)
- How it's supposed to work
- What goes wrong
- Body's failed solution
- Escalation pattern
- Symptoms cascade
- Why common solutions fail (with analogy)

### 4. Real Solution Introduction (30-45 seconds)
- Solution logic (UMS): "To fix the problem, you need to..."
- Authority introduction with method name
- How it works
- Without sacrifice (favorite things, restrictions)
- Convenience factor

### 5. Social Proof Story (45-60 seconds)
- Patient introduction with location
- Failed attempts listed
- Transformation after trying method
- Current state improvements
- Broader proof: "And it's not just [Name]. [Number] of [demographic] are using..."

### 6. Final CTA with Benefit Stack (25-35 seconds)
- Frustration acknowledgment
- Root cause promise
- CTA with method description
- Expanded benefits into age ranges

---

## Choosing the Right Template

| Product Type | Recommended Templates |
|--------------|----------------------|
| Health supplement | 1, 3, 6, 7 |
| Medical device | 1, 4, 6 |
| BizOp/Course | 2, 5 |
| Physical product (lifestyle) | 3, 4 |
| Information product | 2, 3, 5 |
| High-ticket offer | 2, 7 |`
  },
  {
    title: "VSL Lead Formula",
    description: "Eight essential elements for crafting VSL opening sequences that hook attention and sell prospects on continuing to watch, with do's and don'ts for effective execution.",
    category: "copywriting_formula",
    tags: ["VSL", "lead", "opening", "hook", "copywriting", "attention", "curiosity"],
    source: "RMBC Method - VSL Section I",
    content: `## Overview

The lead is the section immediately following your hook. Its sole purpose is to sell the prospect on continuing to watch or read. Think of it as an advertisement for the rest of your VSL.

**Key Principle**: The lead teases and promises — it does NOT educate or reveal.

---

## The 8 Essential Lead Elements

### 1. Call Out the Problem

**What it does**: Shows you understand their situation and creates immediate relevance.

**Examples**:
- "If you're a woman over the age of 40 and you're struggling to melt those stubborn pounds..."
- "If you've been dealing with constant fatigue no matter how much sleep you get..."
- "Are you tired of [specific frustration] and feeling like nothing works?"

**Tip**: Be specific. Generic problem statements don't create the "that's me!" reaction.

---

### 2. Promise a Solution

**What it does**: Offers hope and gives them a reason to keep watching.

**Examples**:
- "...these five simple tasty superfoods can support a supercharged metabolism and start burning through stubborn fat faster than you have in years."
- "I'll show you a scientifically proven way to help transform your appearance by doing one very simple thing every morning."
- "What I'm about to share could save you thousands of dollars and years of frustration."

**Include when possible**: Promises to save time or money amplify the value proposition.

---

### 3. Tease the Contrarian Nature

**What it does**: Creates intrigue by challenging conventional wisdom.

**Examples**:
- "Stop listening to all the so-called fat loss experts, because they have it all wrong."
- "This flies in the face of everything you've been told about [topic]."
- "Forget what your doctor told you about [condition] — there's something they're not telling you."

**Why it works**: Positions your solution as different from everything that's failed them before.

---

### 4. Include Credibility Builders

**What it does**: Establishes why you or your spokesperson should be trusted.

**Examples**:
- "According to the latest nutritional research..."
- "As a scientist, this is one of the best tips I can give you."
- "After 20 years of treating patients with this condition..."
- "Over 100,000 Americans have already discovered this..."

**Note**: Keep brief in the lead. Full credibility comes in the Background Story section.

---

### 5. Qualify Your Audience

**What it does**: Helps prospects self-select and increases relevance.

**Examples**:
- "If you're a woman who's currently between the ages of 35 and 89..."
- "This is specifically for business owners doing at least $50K/month..."
- "If that sounds like you, you need to hear this."

**Why it matters**: People pay more attention to content that feels made for them.

---

### 6. Address Skepticism

**What it does**: Preemptively handles doubt so it doesn't become a barrier.

**Examples**:
- "I know that sounds hard to believe, but stay with me..."
- "Now, I was skeptical too when I first heard this..."
- "You're probably thinking this is too good to be true, and I get it."

**Tip**: Acknowledge the skepticism, don't try to argue against it yet. That comes later.

---

### 7. Tease an Emotional Story

**What it does**: Creates anticipation and emotional connection.

**Examples**:
- "I know it's true, because I've seen it happen thousands of times, including with my own sister, Danielle."
- "In just a moment, I'll share the heartbreaking story of how I almost lost my father..."
- "What happened next changed everything for me and my family."

**Why it works**: Stories are memorable and create investment in the outcome.

---

### 8. Include Fascinations

**What it does**: Creates curiosity gaps that compel continued viewing.

**Examples**:
- "I'm going to reveal what's really making these so-called Super Agers look so young."
- "You'll discover the one anti-aging scam you should never fall for."
- "Stay tuned to learn the surprising connection between your morning routine and your energy levels."

**Format**: Often uses phrases like "I'll reveal..." or "You'll discover..." or "Coming up..."

---

## Lead Do's and Don'ts

### DO:

✅ Open loops (tease information that pays off later)

✅ Focus on ONE big idea (with secondary hooks at the end)

✅ Create urgency to keep watching

✅ Speak directly to your target audience

✅ Use specific, concrete language

✅ Promise value they'll receive by continuing

### DON'T:

❌ Start educating too early (save mechanism for later)

❌ Reveal the unique mechanism completely

❌ Get too technical or detailed

❌ Tell the full story (that comes in Background)

❌ Give away the solution (maintain curiosity)

❌ Go into "teacher mode" prematurely

---

## Lead Quality Checklist

Before finalizing your lead, verify:

- [ ] Does it grab attention in the first sentence?
- [ ] Does it clearly identify who this is for?
- [ ] Does it promise something valuable?
- [ ] Does it create curiosity about what's coming?
- [ ] Does it hint at a story without telling it?
- [ ] Does it feel like it's speaking directly to one person?
- [ ] Does it make them NEED to know what comes next?

---

## The Svelte Lead Example (Annotated)

> "If you're a woman over the age of 40 [QUALIFY] and you're struggling to melt those stubborn pounds [PROBLEM], then do yourself a favor and stop listening to all the so-called fat loss experts, because they have it all wrong [CONTRARIAN]. Here's why. Most of them like to tell you things you have to cut out of your diet... But according to the latest nutritional research [CREDIBILITY], the real secret that's helping hundreds of thousands of women [SOCIAL PROOF] in their 40s, 50s, and 60s burn fat like they're back in high school again, has very little to do with the foods you cut out of your diet, and a lot to do with the foods you add in [SOLUTION TEASE]."

**Why it works**: Simple, direct, and hits multiple elements without being complicated.`
  },
  {
    title: "VSL Close Formula",
    description: "Three-phase structure for converting VSL viewers into buyers, including the 4-step CTA sequence, value building techniques, and all essential close elements.",
    category: "copywriting_formula",
    tags: ["VSL", "close", "CTA", "call to action", "conversion", "copywriting", "sales"],
    source: "RMBC Method - VSL Section I",
    content: `## Overview

The close is where you convert interest into action. It's typically the LONGEST section of your VSL because once you've made your first ask, you're "free-rolling" — taking additional shots to secure the sale.

**Key Insight**: Most viewers won't finish your entire VSL, which makes your first CTA the crescendo. Everything after is bonus opportunity.

---

## The Three-Phase Structure

### Phase 1: Product Introduction

**Purpose**: Clearly explain what they're getting and why it's special.

#### Elements:

**Product Details**
- What's included (ingredients, modules, components)
- How it works (mechanism of action)
- Technical specifications (when relevant)
- Manufacturing/quality standards

**Unique Selling Propositions**
- What makes this different from alternatives
- Proprietary aspects (formulation, method, technology)
- Why this specific solution is superior

**Dismiss Alternatives**
- Why other solutions are flawed:
  - Too expensive
  - Ineffective
  - Side effects
  - Poor quality
  - Unproven
- Reference any earlier content about why out-of-box solutions fail

**Usage Instructions**
- Exactly how to use the product
- Remove all confusion about implementation
- Example: "Take one scoop daily with water, preferably in the morning"

---

### Phase 2: Value Building

**Purpose**: Stack benefits and justify the investment before revealing price.

#### Elements:

**Continue Building Value**
- Additional benefits not yet mentioned
- Secondary advantages of ownership
- Long-term value proposition

**Additional Testimonials**
- Powerful social proof saved for the close
- Specific results and transformations
- Diverse representation (different ages, situations)

**Future Pacing (Dimensionalization)**
- Paint vivid picture of transformed life:
  - "No more struggling to find shoes that fit..."
  - "Imagine waking up with energy to spare..."
  - "Picture yourself confident at the beach..."
- Cover multiple life areas (work, social, family, health)

**Personal Mission**
- Connect offer to something beyond profit
- Show genuine care for customer outcomes
- Acknowledge business interests while demonstrating passion
- Example: "Yes, I want to make money, but I'm genuinely passionate about helping people transform their health."

**Scarcity (Ethical)**
- Legitimate reasons for limited availability:
  - Production constraints
  - High demand
  - Limited batch sizes
  - Exclusive pricing window
- Never use false scarcity — it damages trust

**Price Anchoring**
- Establish higher reference points first:
  - "My consulting rate is $500/hour"
  - "Similar programs charge $15,000"
  - "These ingredients retail for $149 separately"
- Create perception that actual price is a bargain

**Price Justification**
- Cost of NOT solving the problem
- What they'd spend on inferior alternatives
- Long-term savings or value
- Material and immaterial costs of inaction

**Encourage Larger Purchases** (when applicable)
- Multi-bottle/package benefits
- "Smart customers choose..."
- Research supporting longer use
- BUT don't shame smaller purchases: "Even if you only get one, you'll still get a fantastic deal."

---

### Phase 3: Call to Action Sequence

**Purpose**: Ask for the sale multiple times with different triggers.

#### The 4-Step CTA Sequence:

**Step 1: Initial CTA**
- Price reveal with anchoring: "Normally $X, but right now just $Y"
- Clear, direct instruction: "Click the button below right now"
- What happens next: "You'll be taken to our secure order page"
- Create momentum: "Get started today"

**Step 2: Bonus Reveal**
- Introduce after first CTA (for those who didn't act)
- Valuable additions that enhance the offer
- Creates "wait, there's more" effect
- Each bonus should have stated value

**Step 3: Guarantee Presentation**
- Remove risk completely:
  - "Your purchase is protected by our 90-day money-back guarantee"
  - "If you're not completely satisfied, we'll refund every penny"
  - "No questions asked, no hassle"
- Shift risk from buyer to seller
- Include customer service info for trust
- Follow with another CTA

**Step 4: Crossroads Close**
- Present two futures:
  - Path A: Continue suffering without the solution
  - Path B: Transform their life by taking action today
- Make contrast stark and emotional:
  - "You can go on dealing with [pain] day after day..."
  - "OR you can take action right now and finally experience [benefit]"
- Final urgency: "But you must act now — this offer won't last forever"
- Strongest CTA: "The choice is yours. Click below now."

---

## Additional Close Elements

**Thank You**
- After final CTA, thank them for their time
- Tone shifts from urgent to friendly
- Positions you as helpful guide again

**Transition to FAQ**
- "Before you go, let me answer some common questions..."
- FAQ handles remaining objections

---

## Close Quality Checklist

- [ ] Product details are crystal clear
- [ ] Alternatives are dismissed effectively
- [ ] Future pacing creates vivid desire
- [ ] Price is anchored against higher values
- [ ] Scarcity is ethical and believable
- [ ] Guarantee removes all risk
- [ ] Multiple CTAs are included (minimum 3)
- [ ] Crossroads close presents clear contrast
- [ ] Each CTA gives clear instructions

---

## Common Close Mistakes

1. **Only one CTA** — Multiple asks = multiple chances to convert
2. **Weak future pacing** — Be vivid and specific about the transformed life
3. **Burying the guarantee** — Make it prominent and reassuring
4. **Shaming small purchases** — Celebrate any purchase, upsell gently
5. **False scarcity** — Destroys trust; use only legitimate limitations
6. **Rushing to FAQ** — Give the close room to breathe and persuade

---

## Venus Factor Close Example (Value Stacking)

| Element | Amount |
|---------|--------|
| Consultant hourly rate (anchor) | $500 |
| Venus Factor Workouts (bonus) | $297 value |
| Initial price (crossed out) | $97 |
| **Final offer price** | **$47** |

**Why it works**: By the time they see $47, it feels like stealing compared to the stacked value.`
  },
  {
    title: "Background Story Structure",
    description: "Five-element narrative arc for establishing credibility and emotional connection in VSLs and sales copy, with adaptations for health versus business opportunity markets.",
    category: "story_framework",
    tags: ["story", "narrative", "credibility", "origin story", "VSL", "emotional connection"],
    source: "RMBC Method - VSL Section I",
    content: `## Overview

The background story follows the lead and serves two critical purposes:
1. Establish the spokesperson's credibility
2. Create emotional connection through shared experience

This narrative arc shows the prospect that you understand their pain because you've lived it yourself (or witnessed it closely).

---

## The 5-Element Structure

### Element 1: Who I Am + Credibility Builders

**Purpose**: Establish authority and trustworthiness

**For Expert Spokespersons**:
- Professional credentials (degree, certification, title)
- Experience metrics (years, patients treated, clients served)
- Media appearances or publications
- Awards or recognition
- Institutional affiliations

**Example**: "I'm Dr. Jeremy Campbell, a doctor of physical therapy from Chicago with over 10 years of clinical experience and 10,000+ hours helping 1,100+ patients overcome foot problems."

**For Non-Expert Spokespersons**:
- Relatable life circumstances
- Relevant personal experience
- Results achieved (for BizOp especially)
- Humble beginnings that mirror the audience

**Example**: "My two siblings and I shared a bedroom growing up. I went to less than one semester of junior college."

---

### Element 2: Relatable Pain Story

**Purpose**: Create emotional connection through shared struggle

**Formula**: "Me or someone close to me was just like you (in pain)"

**Elements to Include**:
- The specific problem experienced
- How it affected daily life
- The emotional toll (frustration, embarrassment, fear)
- Sense of hopelessness or desperation

**For Health Products**:
- Patient story: "Linda came to me at her wit's end..."
- Family story: "I watched my father collapse on the golf course..."
- Personal story: "For years, I struggled with the same symptoms..."

**For BizOp Products**:
- Job frustration: "I was working at Costco where hard work wasn't rewarded..."
- Financial struggle: "I was drowning in debt with no way out..."
- Life dissatisfaction: "I knew there had to be more to life than this..."

---

### Element 3: Failed Traditional Solutions

**Purpose**: Validate the prospect's frustration and set up why your solution is different

**What to Include**:
- Common approaches that didn't work
- Conventional advice that failed
- Money and time wasted on other solutions
- Why these approaches were doomed to fail

**Example (Health)**: "She tried every cream on the market. She followed all the advice — wear sunscreen, avoid smoking, drink water. Her sister did the same things, yet they aged completely differently."

**Example (BizOp)**: "I tried real estate, reselling on eBay, even day trading. Nothing worked. Every 'opportunity' turned out to be a dead end."

---

### Element 4: Trigger Event

**Purpose**: Create the emotional turning point that demands change

**Characteristics of Effective Triggers**:
- Dramatic or emotional moment
- Stakes become undeniable
- Prospect can relate to similar moments in their life
- Creates urgency for finding a solution

**Health Examples**:
- Medical emergency: "When dad collapsed on the 9th hole..."
- Devastating diagnosis: "The doctor said if I didn't change something..."
- Breaking point: "I couldn't fit into any of my clothes. I cried in the dressing room."

**BizOp Examples**:
- Job humiliation: "I got written up for 'unprofessional appearance' after collecting carts in the rain."
- Financial crisis: "I looked at my bank account and realized I couldn't pay rent."
- Life realization: "I turned 40 and realized I was no better off than at 25."

---

### Element 5: Search for Truth/Answers

**Purpose**: Transition from problem to discovery, building anticipation for the mechanism

**What to Include**:
- The decision to find real answers
- Where the search began
- Obstacles encountered along the way
- Hints at what was eventually discovered

**Example**: "I refused to accept that this was just 'part of aging.' I dove into the research, interviewed specialists, and spent months looking for what everyone else was missing. What I found shocked me."

---

## Market Adaptations

### Health Markets

**Credibility Source**: Expert credentials (doctor, scientist, researcher)

**Story Focus**: Patient suffering witnessed, breakthrough discovery

**Emotional Arc**: Empathy through professional experience

**Note**: If spokesperson has strong credentials, background story can be shortened — credibility does heavy lifting

### Business Opportunity Markets

**Credibility Source**: Results achieved, students helped

**Story Focus**: Personal struggle, humble beginnings, transformation

**Emotional Arc**: "If I can do it, you can too"

**Note**: Requires more extensive proof (income screenshots, testimonials) placed throughout

### Financial Markets

**Credibility Source**: Track record, predictions made, insider access

**Story Focus**: Blend of expert credentials and relatable financial struggles

**Emotional Arc**: "I discovered what the wealthy know"

---

## Best Practices

**Keep It Moving**
- Don't let the story drag
- Hit each beat efficiently
- Regularly "check in" with the reader: "Have you ever experienced this?"

**Maintain Authenticity**
- Real details create believability
- Specific names, places, moments
- Vulnerability builds trust

**Stay Focused**
- Every element should advance toward the mechanism
- Cut anything that doesn't serve the narrative
- Don't write like a novel — this is conversational storytelling

---

## Background Story Checklist

- [ ] Credibility is established early
- [ ] Pain story is emotionally resonant
- [ ] Prospect can see themselves in the story
- [ ] Failed solutions validate their experience
- [ ] Trigger event creates urgency
- [ ] Search for answers builds anticipation
- [ ] Story flows naturally to mechanism section`
  },
  {
    title: "Product Build-Up Framework",
    description: "Four-step narrative structure for transitioning from solution concept to product reveal, building perceived value through the story of development and overcoming obstacles.",
    category: "story_framework",
    tags: ["product reveal", "value building", "narrative", "VSL", "launch", "perceived value"],
    source: "RMBC Method - VSL Section I",
    content: `## Overview

The Product Build-Up bridges the gap between explaining your unique mechanism and revealing your specific product. It's often overlooked but can significantly increase conversions by building perceived value through narrative.

**Core Function**: Answer the question "Why this specific product instead of something I could find elsewhere?"

---

## The 4-Step Framework

### Step 1: Out-of-Box Solutions Fail

**Purpose**: Explain why readily available alternatives don't work

**What to Address**:
- Why can't they just buy existing solutions?
- What's wrong with obvious alternatives?
- What are the hidden problems with common products?

**Techniques**:

**Quality Issues**:
- Reference investigations or studies showing problems
- Example: "A 2015 New York State Attorney General investigation found 19 of 24 popular supplements didn't contain their advertised ingredients."

**Practical Problems**:
- Existing solutions are inconvenient, expensive, or inaccessible
- Example: "To access this technology, patients must visit rehabilitation centers, book appointments, and travel repeatedly."

**Design Flaws**:
- Products exist but are poorly designed
- Example: "They're not user-friendly. They include wires and lack a user manual, making them a nightmare to use."

---

### Step 2: The DIY Decision

**Purpose**: Establish why you had to create something better yourself

**Elements**:
- Recognition that no adequate solution existed
- Decision to take matters into own hands
- Partnership or expertise leveraged
- Initial concept or approach

**Example Narratives**:

**Health/Device**: "I partnered up with NewRo, a US biotech company known for making some of the best pain relief devices, with a single question: What if we could take the same technology doctors use and put it into a simple, affordable device for home use?"

**Supplement**: "My partner and I had been ordering these ingredients directly from European laboratories at over $150 per bottle. We knew there had to be a better way."

**Info Product**: "I started writing everything down, creating a system I could share with others. I gave it to a handful of friends to test."

---

### Step 3: Trials, Setbacks, and Breakthrough

**Purpose**: Build value through narrative of struggle and eventual success

**Why This Matters**:
- Creates authenticity (too-smooth stories feel fake)
- Triggers effort justification bias (we value what took effort)
- Builds narrative tension that engages emotionally
- Justifies the product's existence and price

**Structure**:

**Initial Attempts**:
- "We built three prototypes. They all worked, but they weren't good enough."

**Setbacks and Challenges**:
- "Months passed by with nothing to show for our work. The process was much more expensive than we initially thought."
- "I wanted to give up."

**Persistence**:
- "This voice in my head said, 'Don't stop. If we pull this off, it'll help thousands of people.'"

**Breakthrough Moment**:
- "After another three months of 12-14 hour workdays, we did it."
- "Not only did we combine all the ingredients without reducing potency, but we created something more powerful than we'd anticipated."

**For Information Products**:
- "They said it was pretty good, but there were parts they were confused about."
- "I went back to my office and spent countless nights thinking: How can I make this the simplest plug-and-play system possible?"
- "I went through 10 different versions until finally everyone who used it said it was the easiest thing they'd ever tried."

---

### Step 4: Product Reveal

**Purpose**: Introduce the product as the culmination of this journey

**Elements**:
- The product name and what it is
- Proof it works (initial results)
- Others asking for it / demand emerging
- "And that's how [Product Name] was born"

**Example**: "We created a compact, easy-to-use, and most importantly, affordable device that leverages the same NMES technology used in clinical settings. We called it the NewRo NMES Foot Massager — and it became the best ally for battling edema, available 24/7 at home."

---

## Adaptation for Information Products

**Step 1 (Out-of-Box Fails)**:
- Free information online is fragmented/confusing
- Generic advice doesn't address the real cause
- Other courses/programs are too complex or incomplete

**Step 2 (DIY Decision)**:
- Decided to systematize your knowledge
- Started documenting what actually worked

**Step 3 (Trials and Breakthrough)**:
- Tested with early students/clients
- Gathered feedback on confusing parts
- Multiple iterations to simplify
- Breakthrough when it finally "clicked" for everyone

**Step 4 (Product Reveal)**:
- The refined system ready to share
- Success stories from beta users
- "Now I'm excited to share it with you"

---

## Psychological Triggers at Work

| Trigger | How It's Activated |
|---------|-------------------|
| **Preemptive Objection Handling** | Explaining why they can't just buy something else |
| **Perceived Value Enhancement** | Effort, expertise, resources that went into creation |
| **Authenticity** | Setbacks and struggles make the story believable |
| **Narrative Tension** | Obstacles create engagement, resolution creates satisfaction |
| **Scarcity/Exclusivity** | Explaining why this isn't readily available elsewhere |
| **Effort Justification Bias** | We value what took significant effort to create |
| **Endowment Effect** | Following the journey creates psychological ownership |

---

## Common Mistakes

1. **Skipping this section entirely** — Rushing from mechanism to product loses value-building opportunity

2. **Too-smooth narrative** — Without setbacks, the story lacks authenticity

3. **Vague explanations** — "We worked hard" isn't compelling. Be specific about the challenges.

4. **Tangential information** — Don't zigzag into unrelated content. Keep the narrative moving forward.

5. **Overwriting** — This isn't a novel. Be conversational, not literary.

---

## Optimal Length

Product Build-Up typically comprises about 10-15% of total VSL length:
- Long-form VSL (30 min): 3-5 minutes
- Medium VSL (15 min): 1.5-2.5 minutes
- Short VSL (6 min): 30-60 seconds

---

## Checklist

- [ ] Clear explanation of why alternatives fail
- [ ] Compelling reason for creating something new
- [ ] Specific setbacks that were overcome
- [ ] Breakthrough moment is satisfying
- [ ] Product reveal feels like natural culmination
- [ ] Value is built before price is mentioned`
  },
  {
    title: "VSL Hook Framework",
    description: "Comprehensive framework for creating attention-grabbing VSL openings, including 10+ hook categories, the ADHD Super-Hook strategy for stacking multiple hooks, and first-30-seconds principles.",
    category: "hook_type",
    tags: ["hooks", "attention", "opening", "VSL", "ads", "curiosity", "pattern interrupt"],
    source: "RMBC Method - VSL Section I",
    content: `## Overview

Hooks are the most critical element of any VSL or video ad. They determine whether viewers continue watching or click away. This framework covers hook types, stacking strategies, and the principles behind high-converting openings.

---

## Core Hook Categories

### 1. Pattern Interrupts

**What it is**: Statements or visuals that break expected patterns and force attention

**Examples**:
- Unexpected visual: Woman speaking, suddenly a man breaks the fourth wall to finish her sentence
- Startling claim: "Oops! I accidentally dropped cinnamon sticks into my honey jar. But wait, this could be a lucky mistake..."
- Breaking convention: Starting mid-action or mid-sentence

**Why it works**: Jolts viewers out of passive scrolling mode

---

### 2. Bold Claims

**What it is**: Attention-grabbing statements that challenge expectations or promise remarkable results

**Examples**:
- "This 7-second ritual helped me drop 40 pounds"
- "Why I'll never use [common product] again"
- "The $3 solution that outperforms $300 treatments"

**Caution**: Must be substantiated later in the VSL to maintain credibility

---

### 3. Curiosity Gaps

**What it is**: Creating information gaps that viewers feel compelled to fill

**Examples**:
- "There's one thing every billionaire does before 7am..."
- "Doctors are finally admitting what they've hidden for decades..."
- "The real reason your [problem] keeps coming back..."

**Key**: Hint at valuable information without revealing it

---

### 4. Problem Identification

**What it is**: Immediately naming and validating the viewer's specific problem

**Examples**:
- "Shooting pain in your back or sciatica? Do this..."
- "If your toe pain is driving you nuts..."
- "Think you have a small bladder? Think again."

**Why it works**: Creates immediate "that's me!" recognition

---

### 5. Quick Test Hooks

**What it is**: Inviting viewers to try something simple that reveals a problem

**Examples**:
- "Does your skin pass the pinch test? Let's try an experiment..."
- "Look at your fingernails right now. If you see these lines..."
- "Try touching your toes. If you can't reach past your knees..."

**Why it works**: Creates engagement through participation and personal relevance

---

### 6. Educational Teasers

**What it is**: Offering intriguing facts or tips that lead to the solution

**Examples**:
- "What happens if you drop rosemary leaves into your olive oil?"
- "Scientists just discovered why your body stores fat in these specific areas..."
- "There's a reason Japanese women rarely show signs of aging..."

**Why it works**: Positions content as valuable education, not sales pitch

---

### 7. Surprising Cause Hooks

**What it is**: Revealing unexpected causes behind common problems

**Examples**:
- "The shocking connection between hard water and facial redness"
- "Your morning coffee habit might be destroying your joints"
- "That 'healthy' habit is actually accelerating your aging"

**Why it works**: Challenges existing beliefs and creates need to learn more

---

### 8. Counterintuitive Advice Hooks

**What it is**: Challenging conventional wisdom with opposite advice

**Examples**:
- "Stop washing your face in the shower until you hear this"
- "Eating too little salt can be just as dangerous as too much"
- "Why running on the treadmill might be making you gain weight"

**Why it works**: Creates cognitive dissonance that demands resolution

---

### 9. Hidden Danger Hooks

**What it is**: Warning about unknown threats or mistakes

**Examples**:
- "The three household items silently damaging your skin every day"
- "This common ingredient is in 90% of supplements — and it's toxic"
- "Your doctor's advice might actually be making your condition worse"

**Why it works**: Triggers protective instincts and fear of missing critical information

---

### 10. Unexpected Connection Hooks

**What it is**: Linking seemingly unrelated things to the problem/solution

**Examples**:
- "The surprising link between your laundry detergent and eye bags"
- "What your gut bacteria have to do with your knee pain"
- "Why the direction you sleep could be adding years to your face"

**Why it works**: Novel connections are inherently interesting and memorable

---

### 11. Time-Sensitive Warning Hooks

**What it is**: Creating urgency around information they need NOW

**Examples**:
- "What happens when your skin loses its Velcro effect?"
- "If you're over 50, this change is happening to your body right now"
- "In the next 30 seconds, I'll show you something you can't unsee"

**Why it works**: Combines curiosity with urgency

---

## The ADHD Super-Hook Strategy

### Core Principle

Modern viewers have fragmented attention. Instead of one hook, stack multiple hooks in rapid succession — especially in the first 30 seconds.

### How It Works

**Traditional Approach**: One hook → explanation → content

**ADHD Approach**: Hook → Hook → Hook → Hook → (never fully close loops)

### Key Elements

**1. Open Loops, Don't Close Them**
- Introduce curiosity without resolving it
- Keep multiple questions open simultaneously
- Resolution comes later (or never, for ads)

**2. Command Language**
- "Watch this"
- "Listen to what I'm about to tell you"
- "Stop and pay attention"
- Creates urgency and importance

**3. Rapid Visual Changes**
- Switch speakers frequently
- Show unexpected images
- Use color changes and movement
- Prevents visual fatigue

**4. Repetition with Variation**
- Same concept, different examples
- "This is a metabolism killer" (shows food)
- "This is also a metabolism killer" (shows different food)
- Builds pattern then breaks it

### VShred Example (First 30 Seconds)

1. "This is how to get in shape fast" (promise)
2. "If you want to drop this, start eating more of these" (counterintuitive + visual)
3. "Have you seen this guy?" (curiosity)
4. "The one that keeps telling us to stop running on the treadmill" (counterintuitive)
5. Fourth wall break (pattern interrupt)
6. "Maybe you should forget everything you think you know" (challenge)
7. "This is a metabolism killer" (danger hook, repeated 4x with different visuals)

**Result**: 7+ hooks in 30 seconds, constant engagement

---

## Hook Generation Principles

### Focus on Fragments, Not Fascinations

**Wrong** (Closed Loop):
"The surprising ingredient that boosts metabolism by 300% — it's green tea extract."

**Right** (Open Loop):
"The surprising ingredient that boosts metabolism by 300%..."

### Make Hooks Modular

- Each hook should work independently
- Hooks should also stack with other hooks
- Test individual hooks, then combine winners

### The First 3 Seconds Rule

For in-feed ads, you have 3 seconds before thumb scrolls:
- Lead with your strongest hook
- Make it visually and verbally compelling
- No slow build-ups

---

## Hook Testing Strategy

1. **Generate 50+ hooks** using research and AI
2. **Test individual hooks** as primary text or opening lines
3. **Identify winners** by CTR and view duration
4. **Combine proven hooks** into stacked sequences
5. **Test combinations** to find optimal flow
6. **Iterate** — add new hooks to winning combinations

---

## Hook Quality Checklist

- [ ] Creates immediate curiosity or recognition
- [ ] Relevant to target audience's pain/desire
- [ ] Specific enough to feel personal
- [ ] Works in first 3 seconds
- [ ] Doesn't close the loop (leaves questions open)
- [ ] Can stack with other hooks
- [ ] Transitions smoothly to content`
  },
  {
    title: "Hook Generation Prompt",
    description: "AI prompt template for generating fragmented curiosity hooks at scale, emphasizing open loops and modular hooks suitable for stacking in video ads and VSLs.",
    category: "prompt_template",
    tags: ["hooks", "AI prompt", "generation", "curiosity", "video ads", "copywriting"],
    source: "RMBC Method - VSL Section I",
    content: `## Hook Generation Prompt

### Purpose
Generate large quantities of fragmented, curiosity-driving hooks that can be used in VSLs, video ads, and hook-heavy advertising.

---

### Prompt Template

\`\`\`
You are generating hooks for video advertisements. These hooks must be FRAGMENTED CURIOSITY STATEMENTS — they open loops without closing them.

## Critical Instructions

1. **Create FRAGMENTS, not complete fascinations**
   - WRONG: "The secret to better sleep is avoiding blue light" (closed loop)
   - RIGHT: "The secret to better sleep has nothing to do with your mattress..." (open loop)

2. **These are for multi-speaker video ads**
   - Hooks will be read by different speakers
   - They don't need to connect directly to each other
   - Each hook should stand alone while contributing to overall curiosity

3. **Focus on these hook categories**:
   - Surprising cause hooks (unexpected reason for the problem)
   - Counterintuitive advice (opposite of conventional wisdom)
   - Hidden danger hooks (unknown threats or mistakes)
   - Unexpected connection hooks (linking unrelated things)
   - Time-sensitive warnings (urgency around information)
   - Quick test hooks ("Do this right now to check...")
   - Pattern interrupts (unexpected statements or questions)

4. **Keep hooks SHORT**
   - Most hooks should be 5-15 words
   - Some can be slightly longer if needed for clarity
   - Punchy > elaborate

## Research Context

**Target Audience**: [Insert demographic and psychographic details]

**Problem/Pain Points**: [Insert specific problems they face]

**Product Category**: [Insert type of product]

**Key Mechanism Concepts**: [Insert unique mechanism elements to tease]

**Competitor Messaging**: [Insert what competitors typically say]

## Generate 50 Hooks

Organize by category:

### Surprising Cause Hooks (10)
[Generate hooks revealing unexpected causes]

### Counterintuitive Advice Hooks (10)
[Generate hooks challenging conventional wisdom]

### Hidden Danger Hooks (10)
[Generate hooks warning about unknown threats]

### Unexpected Connection Hooks (10)
[Generate hooks linking surprising things together]

### Time-Sensitive/Urgency Hooks (5)
[Generate hooks creating urgency around information]

### Quick Test/Interactive Hooks (5)
[Generate hooks inviting viewer participation]

## Quality Criteria

- Creates genuine curiosity
- Relevant to target audience
- Opens a loop (does NOT close it)
- Could work in first 3 seconds of video
- Modular (works alone and stacks with others)
\`\`\`

---

### Example Output (Skincare, Women 35+)

**Surprising Cause Hooks**:
- "The collagen-destroying habit 87% of women do every morning..."
- "What your tap water is really doing to your skin barrier..."
- "The hidden ingredient in 'natural' skincare that ages you faster..."

**Counterintuitive Advice Hooks**:
- "Stop washing your face in the shower until you hear this..."
- "Why expensive serums might be making your wrinkles worse..."
- "Dermatologists are finally admitting this 'healthy' habit damages skin..."

**Hidden Danger Hooks**:
- "The three household items silently aging your face every day..."
- "Your pillowcase could be adding years to your appearance..."
- "This common morning beverage is dissolving your collagen..."

**Unexpected Connection Hooks**:
- "The surprising link between your laundry detergent and under-eye bags..."
- "What your gut health has to do with your crow's feet..."
- "The sleep position that's causing one side of your face to age faster..."

---

### Building Your Hook Database

1. Run prompt with different research contexts
2. Use multiple AI tools (Claude, GPT-4, Perplexity) for diversity
3. Collect all outputs in a spreadsheet
4. Tag by category and theme
5. Test individual hooks
6. Track performance data
7. Combine winners into stacked sequences
8. Generate variations of top performers

---

### Quality Filters

After generation, remove hooks that:
- ❌ Close the loop (provide the answer)
- ❌ Feel generic (could apply to any product)
- ❌ Lack specificity (vague promises)
- ❌ Don't create genuine curiosity
- ❌ Require too much context to understand

Keep hooks that:
- ✅ Create immediate "I need to know" reaction
- ✅ Feel specific to the target audience
- ✅ Challenge something they believe
- ✅ Tease valuable information
- ✅ Work in isolation and in combination`
  }
];

// ============================================
// SEED FUNCTION
// ============================================
async function seedRMBCFrameworks() {
  console.log('🌱 Starting RMBC Framework seed...\n');
  console.log(`📚 Total frameworks to seed: ${rmbcFrameworks.length}\n`);
  
  // Get user_id using admin API (service role key required)
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    process.exit(1);
  }
  
  const userId = usersData.users[0]?.id;
  
  if (!userId) {
    console.error('❌ No user found in the system.');
    console.error('   Please create an account first via the UI.');
    process.exit(1);
  }
  
  console.log(`📌 Using user_id: ${userId}\n`);
  console.log('━'.repeat(60));

  let successCount = 0;
  let errorCount = 0;

  for (const [index, fw] of rmbcFrameworks.entries()) {
    const progress = `${index + 1}/${rmbcFrameworks.length}`;
    console.log(`\n🔄 Seeding ${progress}: ${fw.title}`);
    
    // First check if framework with this name exists
    const { data: existing } = await supabase
      .from('marketing_frameworks')
      .select('id')
      .eq('user_id', userId)
      .eq('name', fw.title)
      .single();
    
    const frameworkData = {
      user_id: userId,
      name: fw.title,
      description: fw.description,
      category: fw.category,
      type: 'writing-framework',
      content: fw.content,
      tags: fw.tags,
      source: fw.source,
    };
    
    let error;
    
    if (existing) {
      // Update existing framework
      const result = await supabase
        .from('marketing_frameworks')
        .update({
          ...frameworkData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      error = result.error;
      
      if (!error) {
        console.log(`   ✅ Updated: ${fw.title}`);
        successCount++;
      }
    } else {
      // Insert new framework
      const result = await supabase
        .from('marketing_frameworks')
        .insert(frameworkData);
      error = result.error;
      
      if (!error) {
        console.log(`   ✅ Created: ${fw.title}`);
        successCount++;
      }
    }
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('\n✨ RMBC Framework seed complete!\n');
  
  // Verify counts by category
  const categories = ['strategy_framework', 'story_framework', 'prompt_template', 'structure_template', 'copywriting_formula', 'hook_type'];
  
  console.log('📊 Summary by Category:\n');
  
  for (const category of categories) {
    const { count } = await supabase
      .from('marketing_frameworks')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'writing-framework')
      .eq('category', category)
      .eq('user_id', userId);
    
    console.log(`   ${category}: ${count || 0}`);
  }
  
  // Total count
  const { count: totalCount } = await supabase
    .from('marketing_frameworks')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'writing-framework')
    .eq('user_id', userId);
  
  console.log(`\n   ─────────────────────────────`);
  console.log(`   Total writing-frameworks: ${totalCount || 0}`);
  
  console.log(`\n📈 Results:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  console.log('\n🧪 Test at: /dashboard/ai/chat');
  console.log('   Framework Library should now show all RMBC frameworks');
}

// Run the seed
seedRMBCFrameworks().catch(console.error);
