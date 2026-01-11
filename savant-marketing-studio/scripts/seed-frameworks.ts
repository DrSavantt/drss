// Seed marketing frameworks with content types and writing frameworks
// Run with: npx tsx --env-file=.env.local scripts/seed-frameworks.ts
//
// This creates:
// - 8 Content Types (Facebook Ad, Instagram Ad, Email Sales, etc.)
// - 7 Writing Frameworks (AIDA, PAS, BAB, etc.)
// - Cleans up test entries ("h", "hub")

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
// CONTENT TYPES
// ============================================
const contentTypes = [
  {
    name: 'Facebook Ad',
    description: 'Optimized ad copy for Facebook/Meta ads platform',
    category: 'social',
    type: 'content-type' as const,
    content: `## Facebook Ad Format Guidelines

### Character Limits
- **Primary Text**: Up to 125 characters visible before "See More" (total limit 2,200)
- **Headline**: Up to 40 characters (displays below image)
- **Link Description**: Up to 30 characters
- **CTA Button Options**: Learn More, Shop Now, Sign Up, Download, Get Offer, Book Now, Contact Us, Get Quote, Subscribe, Watch More

### Structure Requirements
1. **Hook (First Line)**: Must stop the scroll immediately. Use pattern interrupts, bold claims, questions, or emotional triggers.
2. **Body**: Bridge from hook to offer. Include benefits, social proof snippet, or curiosity builder.
3. **Call-to-Action**: Clear next step aligned with the CTA button.

### Best Practices
- Lead with the most compelling benefit or pain point
- Use line breaks for readability (avoid walls of text)
- Emoji usage: 1-2 max for visual breaks, not decoration
- Include specific numbers when possible (results, timeframes, savings)
- Match ad copy tone and promises to landing page
- Test variations: different hooks, different angles, different CTAs

### Output Format
When generating Facebook Ad copy, provide:
1. **Primary Text** (2-3 variations with different angles)
2. **Headline** (2-3 variations)
3. **Link Description**
4. **Recommended CTA Button**

### Example Structure
[Hook/Pattern Interrupt]

[Benefit Statement or Pain Agitation]

[Social Proof or Credibility Element]

[Clear CTA + What They Get]`
  },
  {
    name: 'Instagram Ad',
    description: 'Visual-first ad copy optimized for Instagram feed and stories',
    category: 'social',
    type: 'content-type' as const,
    content: `## Instagram Ad Format Guidelines

### Character Limits
- **Primary Text**: 125 characters visible before truncation (2,200 max)
- **Headline**: Not displayed on most placements
- **Caption Length**: First 125 chars must hook; use line breaks
- **Hashtags**: 3-5 relevant hashtags (placed at end or in first comment)

### Visual-First Approach
Instagram is a visual platform. Copy supports the image/video, not the other way around.
- Hook must complement the visual, not repeat it
- Copy should add context the visual can't convey
- Strong visuals can use minimal copy; weak visuals need stronger copy

### Structure Requirements
1. **Hook Line**: Visible before truncation - must compel the tap
2. **Value Proposition**: Why should they care? What's in it for them?
3. **Engagement Driver**: Question, poll reference, or conversation starter
4. **CTA**: Clear action (often "Link in bio" for organic, direct CTA for ads)
5. **Hashtags**: Relevant, mix of broad and niche

### Best Practices
- Write for mobile reading (short paragraphs, line breaks)
- Use 1-3 emojis strategically as visual breaks
- Create "caption hooks" - incomplete thoughts that drive "more" taps
- Speak directly to the viewer (you/your language)
- Match brand voice to platform (more casual than LinkedIn, more polished than TikTok)
- Stories: Use urgency, time-sensitive offers, behind-the-scenes angles

### Output Format
When generating Instagram Ad copy, provide:
1. **Primary Caption** (2 variations)
2. **Hook Line** (what appears before truncation)
3. **Hashtag Set** (5 relevant hashtags)
4. **Stories Variation** (shorter, more urgent)
5. **Recommended CTA**

### Platform-Specific Notes
- Feed ads: Can be longer, more detailed
- Stories ads: 15 seconds of attention max - get to the point
- Reels ads: Hook in first 2 seconds, value in remaining time`
  },
  {
    name: 'Email - Sales',
    description: 'Direct response sales email with clear conversion goal',
    category: 'email',
    type: 'content-type' as const,
    content: `## Sales Email Format Guidelines

### Structure Components
1. **Subject Line**: 30-50 characters ideal, conveys benefit or curiosity
2. **Preview Text**: 35-90 characters, complements subject line
3. **Opening Line**: Personal, pattern interrupt, or direct benefit
4. **Body**: Problem → Solution → Proof → Offer flow
5. **Call-to-Action**: Single, clear, specific action
6. **P.S. Line**: Second hook, urgency, or benefit restatement

### Character Guidelines
- **Subject Line**: 30-50 chars (avoid spam triggers: FREE, Act Now, etc.)
- **Preview Text**: 35-90 chars (don't let it auto-generate)
- **Email Body**: 150-300 words for cold emails; up to 500 for warm lists
- **CTA Button Text**: 2-5 words, action-oriented

### Email Structure Framework
\`\`\`
Subject: [Benefit] or [Curiosity Gap]
Preview: [Completes subject line thought]

[Opening hook - personal, relevant, pattern interrupt]

[Identify the problem/pain they're experiencing]

[Introduce your solution - brief, focused on outcome]

[Proof element - testimonial snippet, result, credibility]

[The offer - what they get, why now]

[Single CTA - be specific about what happens when they click]

[Signature]

P.S. [Restate key benefit, add urgency, or second angle]
\`\`\`

### Best Practices
- One email = one goal = one CTA
- Write to one person, not a list
- Use their name in subject line or opening (when appropriate)
- Create urgency without being manipulative (real deadlines, limited spots)
- Mobile-first: 40%+ of emails opened on mobile
- Test subject lines - it's your biggest lever

### Output Format
When generating sales emails, provide:
1. **Subject Line Options** (3 variations)
2. **Preview Text** (matching each subject line)
3. **Full Email Copy**
4. **P.S. Line Options** (2 variations)
5. **CTA Button Text Suggestion**`
  },
  {
    name: 'Email - Newsletter',
    description: 'Value-focused newsletter email for audience nurturing',
    category: 'email',
    type: 'content-type' as const,
    content: `## Newsletter Email Format Guidelines

### Purpose & Approach
Newsletters nurture relationships and build trust. The goal is VALUE FIRST, sell second (or not at all).
- 80% value, 20% promotion (or 90/10)
- Consistency > frequency
- Personality > polish

### Structure Components
1. **Subject Line**: Content-focused, curiosity or benefit-driven
2. **Preview Text**: Teases the value inside
3. **Greeting**: Personal, conversational
4. **Hook/Intro**: Story, observation, or insight that pulls them in
5. **Main Content**: 1-3 value pieces (insights, tips, resources)
6. **Soft CTA**: If any - relevant offer, not hard sell
7. **Closing**: Personal sign-off, conversation invitation

### Content Types to Include
- Quick tips or tactics they can use immediately
- Industry insights or trend analysis
- Behind-the-scenes or personal stories
- Curated resources (tools, articles, templates)
- Reader questions and answers
- Case studies or mini success stories

### Format Best Practices
- **Length**: 300-800 words typical; consistency matters more than length
- Use subheadings for scanability
- Include 1-2 links to deeper content (blog, podcast, video)
- Keep paragraphs short (2-3 sentences max)
- Use bullet points for lists and takeaways
- Include one "water cooler" element (personal, relatable, human)

### Engagement Elements
- Ask questions (real ones you'll respond to)
- Include polls or quick feedback requests
- Reference previous newsletters or reader responses
- Create running segments or themes readers expect

### Output Format
When generating newsletter copy, provide:
1. **Subject Line Options** (3 variations)
2. **Preview Text**
3. **Full Newsletter Copy** with clear sections
4. **Suggested Links/Resources** to include
5. **Engagement Element** (question, poll, etc.)
6. **Optional Soft CTA** (if promoting something)`
  },
  {
    name: 'Landing Page',
    description: 'Conversion-focused landing page copy with clear sections',
    category: 'web',
    type: 'content-type' as const,
    content: `## Landing Page Format Guidelines

### Core Sections (In Order)
1. **Hero Section**: Headline, subheadline, CTA, supporting visual
2. **Problem Section**: Identify pain points, current frustrations
3. **Solution Section**: Introduce your offer as the answer
4. **Benefits Section**: What they get, transformation they'll experience
5. **Social Proof**: Testimonials, logos, results, credibility
6. **How It Works**: 3-step process, what to expect
7. **Offer Details**: What's included, pricing if applicable
8. **FAQ Section**: Overcome objections, answer common questions
9. **Final CTA**: Urgency, guarantee, last push

### Hero Section Guidelines
- **Headline**: 6-12 words, clear benefit or outcome
- **Subheadline**: Supports headline, adds specificity
- **Above-fold CTA**: Clear, action-oriented button
- Keep above-fold area clean and focused

### Copy Length Guidelines
- Headlines: 6-12 words
- Subheadlines: 15-30 words
- Section headers: 3-8 words
- Body paragraphs: 2-4 sentences
- Bullet points: 1-2 lines each
- CTA buttons: 2-5 words

### Conversion Elements
- Single, focused goal (one CTA type repeated)
- Remove navigation to reduce exit paths
- Use directional cues (arrows, eye gaze, layout flow)
- Include trust signals (security badges, guarantees, media logos)
- Mobile-first design and copy

### Objection Handling
Address objections in this order:
1. "Is this right for me?" (qualification)
2. "Will this work?" (proof and mechanism)
3. "Can I trust this?" (credibility and guarantee)
4. "Is now the right time?" (urgency and risk reversal)

### Output Format
When generating landing page copy, provide:
1. **Hero Section** (headline, subheadline, CTA)
2. **Problem Section** (pain points, 3-5 bullets)
3. **Solution Section** (your offer intro)
4. **Benefits Section** (5-7 benefit bullets)
5. **How It Works** (3-step process)
6. **Testimonial Prompts** (what to highlight)
7. **FAQ Section** (5-7 Q&As)
8. **Final CTA Section** (urgency + CTA)
9. **Guarantee Statement**`
  },
  {
    name: 'Blog Post',
    description: 'SEO-friendly blog article structure with engagement hooks',
    category: 'content',
    type: 'content-type' as const,
    content: `## Blog Post Format Guidelines

### SEO Structure
1. **Title**: Include primary keyword, 50-60 characters
2. **Meta Description**: 150-160 characters, include keyword, drive clicks
3. **URL Slug**: Short, keyword-rich, no stop words
4. **H1**: Title (one per page)
5. **H2s**: Main sections, include keywords naturally
6. **H3s**: Subsections within H2s

### Content Structure
1. **Hook Intro** (50-100 words): Start with a pattern interrupt, question, or bold statement
2. **Context Bridge** (50-100 words): Why this matters to them
3. **Main Content** (800-1500 words): H2 sections with actionable content
4. **Conclusion** (50-100 words): Summary and next step
5. **CTA**: What should they do after reading?

### Section Types (Mix and Match)
- **How-To Steps**: Numbered, clear actions
- **List Posts**: Scannable, valuable items
- **Problem/Solution**: Pain → Answer format
- **Case Study/Example**: Story-driven proof
- **Comparison**: X vs Y analysis

### Readability Guidelines
- Short paragraphs (2-4 sentences max)
- Subheadings every 200-300 words
- Bullet points for lists and key takeaways
- Bold key phrases (not whole sentences)
- One idea per paragraph
- Reading level: 8th grade (clear, not simplistic)

### Engagement Elements
- Personal stories or examples
- Questions to the reader
- Callout boxes for key insights
- Internal links to related content
- External links to credible sources

### Output Format
When generating blog content, provide:
1. **Title Options** (3 variations)
2. **Meta Description**
3. **Outline** (H2s and H3s)
4. **Intro Paragraph**
5. **Full Article** with formatted sections
6. **Conclusion with CTA**
7. **Internal Link Suggestions**`
  },
  {
    name: 'Social Media Post',
    description: 'Platform-agnostic social post for general use',
    category: 'social',
    type: 'content-type' as const,
    content: `## Social Media Post Format Guidelines

### Universal Structure
1. **Hook** (First line): Stop the scroll, create curiosity
2. **Value/Story** (Body): Deliver on the hook's promise
3. **Engagement Driver**: Question, CTA, or conversation starter
4. **Hashtags/Tags**: Platform-appropriate discovery elements

### Hook Types (First Line)
- **Bold Claim**: "Most marketing advice is wrong."
- **Question**: "Want to know what's killing your sales?"
- **Curiosity Gap**: "I stopped doing this one thing and doubled my leads."
- **Controversial Take**: "You don't need more traffic."
- **Story Open**: "Last week a client told me something that changed everything."
- **Number/List**: "3 things I'd never do again:"

### Content Types
- **Tips/How-To**: Quick wins they can implement today
- **Story/Experience**: Personal lessons and insights
- **Contrarian Take**: Challenge common wisdom
- **Question/Poll**: Drive engagement and conversation
- **Behind-the-Scenes**: Humanize your brand
- **User-Generated/Testimonial**: Social proof
- **Industry Commentary**: Trends, news, observations

### Platform Adjustments
- **LinkedIn**: Professional, longer form OK, no hashtag overload
- **Twitter/X**: Concise, thread-friendly, personality-forward
- **Facebook**: Conversational, community-focused, questions work well
- **Instagram**: Visual-first, caption supports image, emojis OK

### Engagement Tactics
- End with a question
- Ask for opinions or experiences
- Use "save this" or "share with someone who..."
- Create series or recurring themes
- Respond to every comment

### Output Format
When generating social posts, provide:
1. **Hook Line** (standalone, powerful)
2. **Full Post** (ready to post)
3. **Short Variation** (Twitter-friendly)
4. **Engagement Question** (for comments)
5. **Hashtags** (5-10 relevant options)`
  },
  {
    name: 'Sales Letter',
    description: 'Long-form direct response sales letter',
    category: 'sales',
    type: 'content-type' as const,
    content: `## Sales Letter Format Guidelines

### Classic Structure (Time-Tested)
1. **Headline**: Big promise, pattern interrupt, curiosity
2. **Opening/Lead**: Hook them emotionally, establish relevance
3. **Story**: Relatable narrative that leads to your solution
4. **Problem**: Deepen the pain, make them feel understood
5. **Solution**: Introduce your offer as the answer
6. **Credibility**: Why you, why this, why now
7. **Benefits**: Stack the value, paint the transformation
8. **Social Proof**: Testimonials, case studies, results
9. **Offer**: What they get, how it's delivered
10. **Guarantee**: Remove risk, show confidence
11. **Urgency/Scarcity**: Why act now
12. **Close/CTA**: Clear next step
13. **P.S. Lines**: Restate key points, secondary hooks

### Headline Types
- **How-To**: "How to [Achieve Result] Without [Common Obstacle]"
- **Secret/Discovery**: "Discover the [X] That [Outcome]"
- **Question**: "Are You Making These [X] Mistakes?"
- **Direct Benefit**: "[Desired Outcome] in [Timeframe]"
- **Story Lead**: "They Laughed When I [Action]... But Then..."

### Lead Types (Opening)
- **Story Lead**: Personal narrative that resonates
- **Problem Lead**: Start with their pain point
- **Secret Lead**: Tease exclusive information
- **Proclamation Lead**: Bold statement that demands attention
- **Question Lead**: Series of "yes" questions

### Key Copywriting Principles
- One reader: Write to a single person
- Features → Advantages → Benefits (FAB)
- Future pace: Help them visualize the after
- Specificity sells: Numbers, details, examples
- Handle objections before they think them
- Multiple closes: Don't ask once, ask many times

### Length & Formatting
- Sales letters can be 3,000-10,000+ words
- Short paragraphs (1-3 sentences)
- Subheadlines every few paragraphs
- Bold and italics for emphasis
- Bullet points for benefit stacks
- Multiple CTAs throughout (not just at end)

### Output Format
When generating sales letters, provide:
1. **Headline Options** (3 variations)
2. **Opening/Lead** (story or problem hook)
3. **Problem Agitation Section**
4. **Solution Introduction**
5. **Benefit Stack** (bullets)
6. **Social Proof Section**
7. **Offer Summary**
8. **Guarantee Statement**
9. **Urgency Element**
10. **Closing CTA**
11. **P.S. Lines** (2-3)`
  },
];

// ============================================
// WRITING FRAMEWORKS
// ============================================
const writingFrameworks = [
  {
    name: 'AIDA',
    description: 'Attention → Interest → Desire → Action framework',
    category: 'persuasion',
    type: 'writing-framework' as const,
    content: `## AIDA Framework

AIDA is the foundational copywriting framework. Every piece of persuasive content should guide readers through these four stages.

### A - Attention
**Goal**: Stop them in their tracks. Break the pattern.

Tactics:
- **Bold claim**: "Most entrepreneurs are leaving $100K on the table."
- **Provocative question**: "What if everything you know about marketing is wrong?"
- **Startling statistic**: "73% of businesses fail because of this one mistake."
- **Pattern interrupt**: Something unexpected that doesn't fit
- **Curiosity gap**: Create an open loop they need to close

The attention element MUST be relevant to your target audience. Shock value alone doesn't convert.

### I - Interest
**Goal**: Make them want to keep reading. Answer "What's in it for me?"

Tactics:
- Connect to their specific situation
- Highlight benefits that matter to THEM (not features)
- Use "imagine" and "what if" to create mental engagement
- Share relatable problems or scenarios
- Provide a taste of the value to come

This is where you prove you understand their world. Specificity builds trust.

### D - Desire
**Goal**: Make them WANT the transformation. Emotional investment.

Tactics:
- **Paint the after picture**: What does life look like with this solved?
- **Social proof**: Others like them have achieved this
- **Scarcity/exclusivity**: Not everyone can have this
- **Future pacing**: "Imagine 90 days from now..."
- **Emotional triggers**: Fear of missing out, aspiration, belonging

Desire is emotional. Logic justifies, but emotion drives action.

### A - Action
**Goal**: Tell them exactly what to do next. Make it easy.

Tactics:
- **Clear CTA**: Specific action, not vague requests
- **Urgency**: Real reason to act now (deadline, limited quantity)
- **Risk reversal**: Guarantee, free trial, money-back
- **Simple next step**: Reduce friction, one click away

Never assume they know what to do. Be explicit.

### Application Notes
- The transition between stages should feel natural, not formulaic
- Short copy hits all four stages quickly
- Long copy can expand each stage significantly
- Test different hooks and CTAs - those are your biggest levers`
  },
  {
    name: 'PAS - Problem Agitate Solution',
    description: 'Problem → Agitate → Solution framework',
    category: 'persuasion',
    type: 'writing-framework' as const,
    content: `## PAS Framework (Problem → Agitate → Solution)

PAS is the most direct path from pain to purchase. It works because it meets people where they are (in pain) before offering hope.

### P - Problem
**Goal**: Identify and name their pain point clearly.

Your audience needs to see themselves in the problem. Be specific:
- **External Problem**: The surface-level issue they can articulate
  - "Your email open rates are dropping"
  - "You can't find good employees"
  - "Sales have plateaued"
  
- **Internal Problem**: How it makes them feel
  - Frustrated, embarrassed, overwhelmed, stuck, anxious
  
- **Philosophical Problem**: Why this is fundamentally wrong
  - "It shouldn't be this hard to..."
  - "You deserve better than..."

The more accurately you describe the problem, the more they trust you understand the solution.

### A - Agitate
**Goal**: Make them FEEL the full weight of the problem. Don't let them rationalize it away.

This is NOT about being negative. It's about honesty about consequences.

Agitation tactics:
- **Consequences**: "If nothing changes, what happens in 6 months?"
- **Hidden costs**: "How much is this really costing you in [time/money/stress]?"
- **Comparisons**: "While you struggle with this, your competitors are..."
- **Worst case**: "This is exactly how [bad outcome] starts..."
- **The real pain**: "And the worst part isn't the [surface problem], it's the [deeper impact]"

Agitation creates urgency. Without it, "someday" wins over "today."

### S - Solution
**Goal**: Position your offer as the answer they've been looking for.

The solution should feel inevitable after proper agitation:
- **Bridge the gap**: "There's a better way"
- **Introduce your mechanism**: How it works (briefly)
- **Show the transformation**: Before → After
- **Make it achievable**: "Here's exactly what to do"
- **Reduce perceived effort**: "It's simpler than you think"

The solution is relief. Make them feel the weight lift.

### Application Notes
- PAS works exceptionally well for cold audiences
- Can be compressed into a single paragraph or expanded over pages
- The agitation step is often under-utilized - don't skip it
- Pair with social proof after the solution for maximum impact
- Works for: ads, emails, landing page sections, video scripts`
  },
  {
    name: 'BAB - Before After Bridge',
    description: 'Before → After → Bridge framework',
    category: 'persuasion',
    type: 'writing-framework' as const,
    content: `## BAB Framework (Before → After → Bridge)

BAB is a transformation-focused framework. It works by creating contrast between current pain and future possibility.

### B - Before (Current State)
**Goal**: Paint a vivid picture of their current painful reality.

Get specific about the "Before" state:
- What does their day look like?
- What are they struggling with?
- What have they tried that hasn't worked?
- How do they feel about the situation?
- What's the cost of staying here?

Example: "Right now, you're working 60+ hours a week, missing family dinners, and still worried about making payroll. You've tried hiring help, but they never quite 'get it' the way you do. Every vacation gets interrupted by fires only you can put out."

The "Before" should feel uncomfortably accurate.

### A - After (Desired State)
**Goal**: Paint an equally vivid picture of life after the transformation.

The "After" should be aspirational but believable:
- What does their ideal day look like?
- What problems are now solved?
- How do they feel?
- What have they gained?
- What's now possible that wasn't before?

Example: "Imagine working 35 hours a week while your revenue grows. Your team handles client delivery without you. You take vacations where your phone stays in the drawer. You have time for your family, your health, and the strategic work you actually enjoy."

The "After" creates desire. Make them WANT to be there.

### B - Bridge (Your Solution)
**Goal**: Show how your product/service is the path from Before to After.

The Bridge makes the transformation accessible:
- Introduce your solution
- Explain the mechanism (briefly)
- Show why it works
- Provide proof that others have crossed this bridge
- Make the next step clear

Example: "The Owner Freedom System is how you get there. In 6 months, we document your genius into repeatable systems, train your team to think like you, and systematically release you from day-to-day operations. 67 business owners have made this crossing. Here's how to start..."

### Application Notes
- BAB works exceptionally well for transformation-focused offers
- The contrast between Before and After is what creates motivation
- Be careful not to make "After" seem unbelievable
- Works beautifully with testimonials showing real Before/After
- Great for: sales pages, email sequences, video sales letters, testimonial frameworks`
  },
  {
    name: '4 P\'s - Promise Picture Proof Push',
    description: 'Promise → Picture → Proof → Push framework',
    category: 'persuasion',
    type: 'writing-framework' as const,
    content: `## 4 P's Framework (Promise → Picture → Proof → Push)

The 4 P's framework is direct and results-focused. It's particularly effective for offers with strong proof elements.

### P1 - Promise
**Goal**: Make a bold, specific claim about what you deliver.

Your promise should be:
- **Specific**: Not "better results" but "23% increase in 90 days"
- **Desirable**: Something they actually want
- **Believable**: Ambitious but not outlandish
- **Measurable**: They can verify if you delivered

Promise types:
- **Result promise**: "Double your leads in 30 days"
- **Time promise**: "Get your first sale within a week"
- **Ease promise**: "Without spending a dime on ads"
- **Unique promise**: "The only system that works for [specific niche]"

The promise is your headline. It's the hook that earns attention.

### P2 - Picture
**Goal**: Help them visualize achieving the promise. Make it real.

Picture techniques:
- **Future pacing**: "Imagine 90 days from now..."
- **Day-in-the-life**: "Picture waking up to..."
- **Contrast**: "Instead of [current pain], you'll be [future state]"
- **Sensory details**: Make it vivid and specific
- **Emotional outcome**: How will they FEEL?

Example: "Picture this: You wake up to notification after notification of sales that came in while you slept. Your calendar has buffer time built in. Your spouse isn't worried about the business anymore. You feel in control for the first time in years."

The picture builds emotional investment in the outcome.

### P3 - Proof
**Goal**: Provide evidence that the promise is achievable.

Proof hierarchy (strongest to weakest):
1. **Their own experience**: Free trial, demo, sample
2. **Social proof**: Testimonials, case studies, user numbers
3. **Third-party validation**: Media mentions, awards, certifications
4. **Demonstration**: Show the product/service working
5. **Data/statistics**: Industry data, research, your results
6. **Logic**: Explain why it works (mechanism)

Stack multiple proof types. Address the question: "Why should I believe this?"

### P4 - Push
**Goal**: Create urgency and tell them exactly what to do.

Push elements:
- **Clear CTA**: Specific, action-oriented button/link
- **Urgency**: Deadline, limited spots, price increase
- **Scarcity**: Limited availability, exclusive access
- **Risk reversal**: Guarantee that removes fear
- **Incentive**: Bonus for acting now

The push overcomes inertia. Without it, "interested" never becomes "customer."

### Application Notes
- 4 P's is excellent for results-focused offers
- Works well when you have strong proof elements
- Can be condensed (social ads) or expanded (sales pages)
- The "Picture" step is often under-emphasized - don't skip it
- Great for: landing pages, webinar pitches, sales calls`
  },
  {
    name: 'StoryBrand',
    description: 'Donald Miller\'s StoryBrand framework - customer as hero',
    category: 'persuasion',
    type: 'writing-framework' as const,
    content: `## StoryBrand Framework (Donald Miller)

StoryBrand positions your customer as the hero of the story, with your brand as the guide. This creates emotional resonance through narrative structure.

### Core Principle
Your customer is the HERO. Your brand is the GUIDE.
- Heroes have problems
- Guides have solutions
- Guides help heroes win

### The 7 Elements

#### 1. Character (The Hero)
Who is your customer and what do they want?

- Identify their primary desire/goal
- Keep it simple and clear
- The want should be survival-related (physical, financial, relational)

Example: "A business owner who wants freedom from day-to-day operations"

#### 2. Problem (What's Stopping Them)
What problem stands in their way?

Three levels of problem:
- **External**: The surface problem (tangible, obvious)
- **Internal**: How the problem makes them feel (frustration, fear, insecurity)
- **Philosophical**: Why this is fundamentally wrong (justice, fairness, values)

Great stories resonate at all three levels. The internal problem is where emotional connection happens.

#### 3. Guide (You)
Position yourself as the trusted guide.

Two characteristics of a guide:
- **Empathy**: "I understand what you're going through"
- **Authority**: "And I can help because I've solved this before"

The guide is NOT the hero. Don't make it about you. Make it about how you help THEM win.

#### 4. Plan (The Path Forward)
Give them a clear, simple path.

- **3-step process**: Simple enough to remember
- **Agreement plan**: What you commit to doing
- **Action plan**: What they need to do

Reduce confusion. Clarity creates confidence.

#### 5. Call to Action
Tell them exactly what to do.

Two types:
- **Direct CTA**: "Buy Now," "Schedule a Call," "Start Free Trial"
- **Transitional CTA**: "Download the Guide," "Watch the Video" (for those not ready)

Always have both. Make the direct CTA prominent and clear.

#### 6. Success (What Winning Looks Like)
Paint the picture of their transformed life.

- What do they achieve?
- How do they feel?
- What's now possible?
- Who do they become?

People need to see the destination before they start the journey.

#### 7. Failure (What's at Stake)
Show what happens if they don't act.

- What do they lose?
- What gets worse?
- What opportunity disappears?

Stakes create urgency. Don't dwell here, but don't skip it.

### Application Notes
- StoryBrand works for all brand messaging
- Great for: website copy, brand messaging, pitch decks
- The framework ensures customer-centric communication
- Focus on clarity over cleverness
- Test: Does every message pass the "grunt test"? (Could a caveman understand what you offer?)`
  },
  {
    name: 'FAB - Features Advantages Benefits',
    description: 'Features → Advantages → Benefits framework',
    category: 'persuasion',
    type: 'writing-framework' as const,
    content: `## FAB Framework (Features → Advantages → Benefits)

FAB transforms product/service attributes into emotional outcomes. It's the bridge from what you sell to why they should care.

### Understanding the Progression

**Feature**: What it IS or HAS (objective, factual)
**Advantage**: What it DOES (functional, comparative)  
**Benefit**: What it MEANS for them (emotional, personal)

Most copy stops at features. Great copy reaches benefits.

### F - Features
**Definition**: The factual attributes of your product/service.

Examples:
- "24/7 customer support"
- "Built with aerospace-grade aluminum"
- "Includes 12 video modules"
- "100GB cloud storage"

Features are necessary but not sufficient. They're the "what."

### A - Advantages
**Definition**: What the feature does or how it performs compared to alternatives.

Features → Advantages:
- "24/7 customer support" → "Get help whenever you need it"
- "Aerospace-grade aluminum" → "Lighter and more durable than competitors"
- "12 video modules" → "Learn at your own pace, anywhere"
- "100GB cloud storage" → "Never worry about running out of space"

Advantages answer "so what?" for each feature.

### B - Benefits
**Definition**: The emotional outcome - what it means for their life.

Advantages → Benefits:
- "Get help whenever you need it" → "Sleep soundly knowing you're never stuck"
- "Lighter and more durable" → "Feel confident it'll last through anything"
- "Learn at your own pace" → "Finally master this without sacrificing family time"
- "Never run out of space" → "Stop wasting hours managing files and focus on creating"

Benefits answer "why should I care?" at a personal level.

### The Complete Transformation
Feature: "24/7 customer support via chat, phone, and email"
Advantage: "Get help whenever issues arise, without waiting for business hours"
Benefit: "You'll never feel stuck or stressed because help is always one message away"

### Benefit Categories
When crafting benefits, consider these emotional drivers:
- **Save time**: "Get hours back"
- **Save money**: "Keep more of what you earn"
- **Reduce stress**: "Finally feel at peace"
- **Gain status**: "Be recognized as..."
- **Avoid pain**: "Never worry about..."
- **Achieve goals**: "Finally reach..."
- **Feel belonging**: "Join thousands of..."

### Application Notes
- Lead with benefits, support with features
- Use features for logical justification (after emotional hook)
- Different audiences value different benefits
- Stack FAB for each key feature in your copy
- Great for: product descriptions, sales pages, pitch decks, ads`
  },
  {
    name: 'PASTOR',
    description: 'Problem → Amplify → Story → Transformation → Offer → Response',
    category: 'persuasion',
    type: 'writing-framework' as const,
    content: `## PASTOR Framework

PASTOR combines problem-focused and story-driven copywriting into a comprehensive framework perfect for long-form content.

### P - Problem
**Goal**: Identify and articulate their core problem.

- Name the problem clearly
- Use their language (how THEY describe it)
- Show you understand the nuances
- Connect with their daily experience

"You're working harder than ever but your business hasn't grown in 18 months. You've tried ads, you've tried hiring, you've tried the latest tactics. Nothing seems to stick."

The problem should feel familiar and personal to your reader.

### A - Amplify
**Goal**: Intensify the problem. Make the cost of inaction vivid.

Amplification questions:
- What happens if this continues?
- What is this really costing you?
- What opportunities are you missing?
- How is this affecting other areas of life?
- Where will you be in 5 years if nothing changes?

"Every month that passes, your competitors get further ahead. The stress is affecting your sleep, your relationships, your health. You've started to wonder if maybe this isn't for you. But you know you're capable of more—you've just been spinning your wheels."

Amplification creates urgency without manipulation. It's honest about consequences.

### S - Story / Solution
**Goal**: Share a relatable story that leads to your solution.

Story elements:
- **Relatability**: Someone like them
- **Struggle**: They faced the same problem
- **Discovery**: They found a better way
- **Transformation**: Life after the solution

"I was exactly where you are three years ago. 60-hour weeks, revenue plateau, constant firefighting. Then I discovered a system for extracting myself from operations while actually growing the business. Within 6 months, I was working 30 hours and revenue was up 40%..."

The story builds trust and proves the transformation is possible.

### T - Transformation
**Goal**: Paint a vivid picture of life after the problem is solved.

Before → After contrast:
- What does their day look like now?
- How do they feel?
- What have they achieved?
- What's now possible?
- How have relationships improved?

"Imagine checking your dashboard and seeing steady growth while you're on vacation with your family. Your team handles client delivery without needing you. You spend your time on high-level strategy and business development—the work you actually enjoy."

The transformation should feel achievable, not fantasy.

### O - Offer
**Goal**: Present your solution with clear value.

Offer components:
- What they get (deliverables)
- How it's delivered (format, timeline)
- What results they can expect
- What makes this different
- Why this is worth the investment

Stack the value. Make the offer feel like a no-brainer.

### R - Response
**Goal**: Tell them exactly how to take action.

Response elements:
- Clear, specific CTA
- Urgency (why now)
- Risk reversal (guarantee)
- What happens next
- Simple next step

"Click the button below to schedule your Strategy Session. In 45 minutes, we'll map out exactly how the Owner Freedom System applies to your business. If you don't leave with at least one actionable insight, I'll send you $500 for wasting your time."

Remove all friction. Make saying yes easier than saying no.

### Application Notes
- PASTOR is ideal for long-form sales pages and video scripts
- Each section can be expanded or compressed as needed
- The story section is what separates good copy from great copy
- Always end with a clear response mechanism
- Great for: sales pages, webinar pitches, email sequences, VSLs`
  },
];

// ============================================
// SEED FUNCTION
// ============================================
async function seedFrameworks() {
  console.log('🌱 Starting framework seed...\n');
  
  // Get a user_id from existing data (required for the table)
  const { data: existingUser } = await supabase
    .from('marketing_frameworks')
    .select('user_id')
    .limit(1)
    .single();
  
  let userId: string;
  
  if (existingUser) {
    userId = existingUser.user_id;
  } else {
    // Fallback: get user_id from clients table
    const { data: clientUser } = await supabase
      .from('clients')
      .select('user_id')
      .limit(1)
      .single();
    
    if (!clientUser) {
      console.error('❌ No existing user found to associate frameworks with.');
      console.error('   Please create at least one client or framework first via the UI.');
      process.exit(1);
    }
    userId = clientUser.user_id;
  }
  
  console.log(`📌 Using user_id: ${userId}\n`);

  // Clean up test entries
  console.log('🧹 Cleaning up test entries...');
  const { error: cleanupError, count } = await supabase
    .from('marketing_frameworks')
    .delete({ count: 'exact' })
    .in('name', ['h', 'hub']);
  
  if (cleanupError) {
    console.error('   ⚠️ Error cleaning up:', cleanupError.message);
  } else {
    console.log(`   ✅ Removed ${count || 0} test entries\n`);
  }

  // Seed content types
  console.log('📝 Seeding content types...');
  for (const ct of contentTypes) {
    // First try to find existing entry
    const { data: existing } = await supabase
      .from('marketing_frameworks')
      .select('id')
      .eq('name', ct.name)
      .eq('type', 'content-type')
      .single();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('marketing_frameworks')
        .update({
          ...ct,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      if (error) {
        console.error(`   ❌ Error updating ${ct.name}:`, error.message);
      } else {
        console.log(`   ✅ Updated: ${ct.name}`);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('marketing_frameworks')
        .insert({
          ...ct,
          user_id: userId,
          is_active: true,
        });
      
      if (error) {
        console.error(`   ❌ Error creating ${ct.name}:`, error.message);
      } else {
        console.log(`   ✅ Created: ${ct.name}`);
      }
    }
  }

  // Seed writing frameworks
  console.log('\n✍️ Seeding writing frameworks...');
  for (const wf of writingFrameworks) {
    // First try to find existing entry
    const { data: existing } = await supabase
      .from('marketing_frameworks')
      .select('id')
      .eq('name', wf.name)
      .eq('type', 'writing-framework')
      .single();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('marketing_frameworks')
        .update({
          ...wf,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      if (error) {
        console.error(`   ❌ Error updating ${wf.name}:`, error.message);
      } else {
        console.log(`   ✅ Updated: ${wf.name}`);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('marketing_frameworks')
        .insert({
          ...wf,
          user_id: userId,
          is_active: true,
        });
      
      if (error) {
        console.error(`   ❌ Error creating ${wf.name}:`, error.message);
      } else {
        console.log(`   ✅ Created: ${wf.name}`);
      }
    }
  }

  // Also handle the old AIDA entry - rename it or update it
  console.log('\n🔄 Checking for old AIDA entry...');
  const { data: oldAida } = await supabase
    .from('marketing_frameworks')
    .select('id, name')
    .eq('name', 'AIDA - Facebook ADS')
    .single();
  
  if (oldAida) {
    // Delete the old entry since we now have a proper AIDA framework
    const { error } = await supabase
      .from('marketing_frameworks')
      .delete()
      .eq('id', oldAida.id);
    
    if (error) {
      console.log(`   ⚠️ Could not remove old "AIDA - Facebook ADS" entry:`, error.message);
    } else {
      console.log(`   ✅ Removed old "AIDA - Facebook ADS" entry (replaced with standard AIDA)`);
    }
  }

  // Summary
  console.log('\n━'.repeat(50));
  console.log('✨ Seed complete!\n');
  
  // Verify counts
  const { count: contentTypeCount } = await supabase
    .from('marketing_frameworks')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'content-type')
    .is('deleted_at', null);
  
  const { count: writingFrameworkCount } = await supabase
    .from('marketing_frameworks')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'writing-framework')
    .is('deleted_at', null);
  
  console.log(`📊 Summary:`);
  console.log(`   Content Types: ${contentTypeCount || 0}`);
  console.log(`   Writing Frameworks: ${writingFrameworkCount || 0}`);
  console.log(`\n🧪 Test at: /dashboard/ai/chat`);
  console.log('   Content Type dropdown should now show options');
  console.log('   Writing Framework checkboxes should show all frameworks');
}

// Run the seed
seedFrameworks().catch(console.error);
