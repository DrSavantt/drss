-- ============================================
-- QUESTIONNAIRE CONFIGURATION SEED DATA
-- All 34 questions from questions-config.ts
-- ============================================

-- Clear existing data (for re-seeding)
TRUNCATE questionnaire_help, questionnaire_questions, questionnaire_sections RESTART IDENTITY CASCADE;

-- ===== SECTIONS =====
INSERT INTO questionnaire_sections (id, key, title, description, estimated_minutes, sort_order, enabled) VALUES
(1, 'avatar_definition', 'Avatar Definition', 'Define your ideal customer with surgical precision', 7, 1, true),
(2, 'dream_outcome', 'Dream Outcome & Value Equation', 'Define the transformation and value you deliver', 8, 2, true),
(3, 'problems_obstacles', 'Problems & Obstacles', 'Identify the pain points and roadblocks your customers face', 7, 3, true),
(4, 'solution_methodology', 'Solution & Methodology', 'Define what you offer and how you deliver it', 6, 4, true),
(5, 'brand_voice', 'Brand Voice & Communication', 'Define how your brand communicates and sounds', 7, 5, true),
(6, 'proof_transformation', 'Proof & Transformation', 'Demonstrate your track record and results', 9, 6, true),
(7, 'faith_integration', 'Faith Integration', 'Optional: Define how faith integrates with your business (if applicable)', 3, 7, false),
(8, 'business_metrics', 'Business Metrics', 'Quick snapshot of your business size and goals', 4, 8, true);

-- Reset sequence to avoid conflicts
SELECT setval('questionnaire_sections_id_seq', 8, true);

-- ===== QUESTIONS =====

-- Section 1: Avatar Definition (Q1-Q5)
INSERT INTO questionnaire_questions (id, section_id, question_key, sort_order, text, type, required, enabled, min_length, max_length, placeholder) VALUES
('q1_ideal_customer', 1, 'q1', 1, 'Who is your IDEAL customer? Be specific.', 'long-text', true, true, 50, 1000, 'Business owners making $1M-$10M annually who struggle with...'),
('q2_avatar_criteria', 1, 'q2', 2, 'Which criteria does your ideal customer meet? Check all that apply.', 'checkbox', true, true, NULL, NULL, NULL),
('q3_demographics', 1, 'q3', 3, 'Demographics of your ideal customer', 'long-text', true, true, 30, 500, 'Male, 38-52 years old, suburban US, household income $150K-$300K...'),
('q4_psychographics', 1, 'q4', 4, 'Psychographics of your ideal customer', 'long-text', true, true, 30, 500, 'Values control and freedom, fears failure and looking incompetent...'),
('q5_platforms', 1, 'q5', 5, 'Where does your ideal customer spend time?', 'long-text', true, true, 20, 500, 'LinkedIn daily, listens to ''My First Million'' podcast, attends local BNI meetings...');

-- Section 2: Dream Outcome (Q6-Q10)
INSERT INTO questionnaire_questions (id, section_id, question_key, sort_order, text, type, required, enabled, min_length, max_length, placeholder) VALUES
('q6_dream_outcome', 2, 'q6', 6, 'What is the dream outcome for your customer?', 'long-text', true, true, 50, 1000, 'A predictable, profitable business that runs without them being there 80 hours/week...'),
('q7_status', 2, 'q7', 7, 'What status will they gain?', 'long-text', true, true, 30, 500, 'Their spouse sees them as successful, peers respect them, they''re invited to speak...'),
('q8_time_to_result', 2, 'q8', 8, 'How long until they see results?', 'short-text', true, true, NULL, 300, '90 days to see significant results'),
('q9_effort_sacrifice', 2, 'q9', 9, 'What effort/sacrifice is required?', 'long-text', true, true, 30, 500, '2-3 hours per week initially, then 1 hour/week for maintenance...'),
('q10_proof', 2, 'q10', 10, 'What proof/track record do you have?', 'long-text', true, true, 50, 1000, '42 clients served with 89% achieving ROI within 60 days. Average return: 3.2x investment...');

-- Section 3: Problems & Obstacles (Q11-Q15)
INSERT INTO questionnaire_questions (id, section_id, question_key, sort_order, text, type, required, enabled, min_length, max_length, placeholder) VALUES
('q11_external_problems', 3, 'q11', 11, 'What external problems do your customers face?', 'long-text', true, true, 50, 1000, 'Inconsistent lead flow, can''t keep good employees, too many tasks...'),
('q12_internal_problems', 3, 'q12', 12, 'What internal problems do they struggle with?', 'long-text', true, true, 50, 1000, 'Feels like a fraud, worried about making payroll, stressed about competition...'),
('q13_philosophical_problems', 3, 'q13', 13, 'What philosophical problems exist? (Optional)', 'long-text', false, true, NULL, 1000, 'Business owners shouldn''t have to work 80 hour weeks to succeed...'),
('q14_past_failures', 3, 'q14', 14, 'What past failures have they experienced?', 'long-text', true, true, 50, 1000, 'Hired 2-3 agencies that promised results but delivered nothing...'),
('q15_limiting_beliefs', 3, 'q15', 15, 'What limiting beliefs do they have?', 'long-text', true, true, 30, 500, '''Marketing doesn''t work for my industry'', ''I''m not good at sales''...');

-- Section 4: Solution & Methodology (Q16-Q19)
INSERT INTO questionnaire_questions (id, section_id, question_key, sort_order, text, type, required, enabled, min_length, max_length, placeholder) VALUES
('q16_core_offer', 4, 'q16', 16, 'What is your core offer?', 'long-text', true, true, 50, 1000, 'Done-For-You Marketing System that generates 20+ qualified leads per month...'),
('q17_unique_mechanism', 4, 'q17', 17, 'What is your unique mechanism?', 'long-text', true, true, 50, 1000, 'The ''Build & Release'' Model - we build your entire system first, then release it...'),
('q18_differentiation', 4, 'q18', 18, 'How are you different from competitors?', 'long-text', true, true, 50, 1000, 'We''re the only agency that owns the implementation risk - if it doesn''t work, we refund...'),
('q19_delivery_vehicle', 4, 'q19', 19, 'What is your delivery vehicle?', 'long-text', true, true, 30, 500, '90-day implementation program with weekly check-ins and 24/7 Slack support...');

-- Section 5: Brand Voice (Q20-Q24)
INSERT INTO questionnaire_questions (id, section_id, question_key, sort_order, text, type, required, enabled, min_length, max_length, placeholder) VALUES
('q20_voice_type', 5, 'q20', 20, 'What is your brand voice type?', 'multiple-choice', true, true, NULL, NULL, NULL),
('q21_personality_words', 5, 'q21', 21, 'What personality words describe your brand?', 'short-text', true, true, NULL, 300, 'Bold, Trustworthy, Results-Driven'),
('q22_signature_phrases', 5, 'q22', 22, 'What are your signature phrases?', 'long-text', true, true, 20, 500, '''Let''s cut the BS.'' ''Here''s what actually works.'' ''No fluff, just results.'''),
('q23_avoid_topics', 5, 'q23', 23, 'What topics should you avoid?', 'long-text', true, true, 20, 500, 'Never mention specific competitor names, avoid technical jargon, no ''growth hacking''...'),
('q24_brand_assets', 5, 'q24', 24, 'Upload brand assets (optional)', 'file-upload', false, true, NULL, NULL, NULL);

-- Section 6: Proof & Transformation (Q25-Q29)
INSERT INTO questionnaire_questions (id, section_id, question_key, sort_order, text, type, required, enabled, min_length, max_length, placeholder) VALUES
('q25_transformation_story', 6, 'q25', 25, 'Share a powerful transformation story', 'long-text', true, true, 100, 2000, 'Sarah came to us $50K in debt and working 80 hours/week. After 90 days...'),
('q26_measurable_results', 6, 'q26', 26, 'What measurable results do you deliver?', 'long-text', true, true, 50, 1000, 'Average client ROI: 3.2x in 90 days. 89% achieve positive ROI within 60 days...'),
('q27_credentials', 6, 'q27', 27, 'What credentials or recognition do you have? (Optional)', 'long-text', false, true, NULL, 500, 'Featured in Forbes, Inc, Entrepreneur. Certified by...'),
('q28_guarantees', 6, 'q28', 28, 'What guarantees do you offer?', 'long-text', true, true, 30, 500, '100% money-back guarantee if you don''t see 20+ qualified leads in 90 days...'),
('q29_proof_assets', 6, 'q29', 29, 'Upload proof materials (optional)', 'file-upload', false, true, NULL, NULL, NULL);

-- Section 7: Faith Integration (Q30-Q32)
INSERT INTO questionnaire_questions (id, section_id, question_key, sort_order, text, type, required, enabled, min_length, max_length, placeholder, conditional_on) VALUES
('q30_faith_preference', 7, 'q30', 30, 'How does faith integrate with your business?', 'multiple-choice', false, true, NULL, NULL, NULL, NULL),
('q31_faith_mission', 7, 'q31', 31, 'What is your faith-driven mission?', 'long-text', false, true, NULL, 1000, 'I believe business is ministry. My goal is to serve kingdom-minded entrepreneurs...', '{"questionId": "q30_faith_preference", "notEquals": "separate"}'),
('q32_biblical_principles', 7, 'q32', 32, 'What biblical principles guide your work?', 'long-text', false, true, NULL, 500, 'Servant leadership, excellence as worship, generosity, stewardship...', '{"questionId": "q30_faith_preference", "notEquals": "separate"}');

-- Section 8: Business Metrics (Q33-Q34)
INSERT INTO questionnaire_questions (id, section_id, question_key, sort_order, text, type, required, enabled, min_length, max_length, placeholder) VALUES
('q33_annual_revenue', 8, 'q33', 33, 'What is your current annual revenue?', 'short-text', true, true, NULL, 100, '$500K ARR'),
('q34_primary_goal', 8, 'q34', 34, 'What is your primary business goal for the next 12 months?', 'long-text', true, true, 1, 1000, 'Scale from $500K to $1.5M while working 30 hours/week instead of 60...');

-- ===== OPTIONS FOR MULTIPLE CHOICE QUESTIONS =====

UPDATE questionnaire_questions SET options = '[
  {"value": "growing", "label": "Market is growing"},
  {"value": "afford", "label": "Can afford premium pricing"},
  {"value": "findable", "label": "Can be targeted specifically"},
  {"value": "pain", "label": "In significant pain"},
  {"value": "all_four", "label": "All four of the above"}
]'::jsonb WHERE id = 'q2_avatar_criteria';

UPDATE questionnaire_questions SET options = '[
  {"value": "professional_authoritative", "label": "Professional & Authoritative"},
  {"value": "friendly_conversational", "label": "Friendly & Conversational"},
  {"value": "bold_direct", "label": "Bold & Direct"},
  {"value": "warm_nurturing", "label": "Warm & Nurturing"},
  {"value": "sophisticated_polished", "label": "Sophisticated & Polished"}
]'::jsonb WHERE id = 'q20_voice_type';

UPDATE questionnaire_questions SET options = '[
  {"value": "explicit", "label": "Yes - Explicitly faith-forward in marketing"},
  {"value": "values_aligned", "label": "Yes - Values-aligned but subtle"},
  {"value": "separate", "label": "No - Keep faith and business separate"}
]'::jsonb WHERE id = 'q30_faith_preference';

-- ===== FILE UPLOAD METADATA =====

UPDATE questionnaire_questions SET 
  accepted_file_types = ARRAY['image/*', 'application/pdf', '.doc', '.docx'],
  max_file_size = 10,
  max_files = 5,
  file_description = 'Upload logos, style guides, color palettes, or any brand materials (optional)'
WHERE id = 'q24_brand_assets';

UPDATE questionnaire_questions SET 
  accepted_file_types = ARRAY['image/*', 'application/pdf', '.doc', '.docx'],
  max_file_size = 10,
  max_files = 5,
  file_description = 'Upload testimonials, case studies, screenshots, or any proof materials (optional)'
WHERE id = 'q29_proof_assets';

-- ===== HELP CONTENT =====

-- Q1
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q1_ideal_customer', 'Who is your IDEAL customer?',
  ARRAY['Your CRM → Filter by highest lifetime value', 'Accounting software → Who paid on time', 'Inbox → Easiest clients to work with'],
  ARRAY['Pull top 10 customers by revenue', 'Circle 3-4 you want 100 more of', 'What do they have in common?'],
  'Service-based business owners making $1M-$10M annually who struggle with inconsistent lead flow and are willing to invest $3K-5K/month in marketing.',
  'Small business owners who need marketing help.',
  'If you cannot name 3 specific people in this avatar, you do not know them well enough.');

-- Q2
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q2_avatar_criteria', 'Which criteria does your ideal customer meet?',
  ARRAY['Market research reports', 'Industry growth data', 'Your sales records'],
  ARRAY['Check if market is growing (Google Trends)', 'Verify they can afford premium pricing', 'Confirm you can target them specifically'],
  'Select ''All four of the above'' - your avatar must meet ALL criteria',
  'Selecting only 1-2 criteria - this leads to bad targeting',
  'If they do not meet all four, you need a different avatar.');

-- Q3
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q3_demographics', 'Demographics of your ideal customer',
  ARRAY['CRM data', 'Customer surveys', 'Facebook Audience Insights'],
  ARRAY['List age range, location, gender, income level'],
  'Male, 38-52 years old, suburban US, household income $150K-$300K',
  'Business owners',
  'Be specific enough that you could walk into a room and identify them.');

-- Q4
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q4_psychographics', 'Psychographics of your ideal customer',
  ARRAY['Customer interviews', 'Reviews/testimonials', 'Social media'],
  ARRAY['What do they value?', 'What do they fear?', 'What drives decisions?'],
  'Values control and freedom, fears failure and looking incompetent',
  'They want to grow their business',
  'Psychographics are WHY they buy, demographics are WHO buys.');

-- Q5
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q5_platforms', 'Where does your ideal customer spend time?',
  ARRAY['SparkToro.com', 'Customer surveys', 'Social listening tools'],
  ARRAY['Which platforms?', 'Which podcasts?', 'Which communities?'],
  'LinkedIn daily, listens to ''My First Million'' podcast, attends local BNI meetings',
  'Social media',
  'You need to be where they already are - cannot create new behavior.');

-- Q6-Q34: Continue with remaining help content...
-- (I'll add a representative sample and you can extend as needed)

-- Q6
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q6_dream_outcome', 'What is the dream outcome for your customer?',
  ARRAY['Customer testimonials', 'Discovery call recordings', 'Success stories'],
  ARRAY['What do they say they want in their own words?', 'What would their life look like after working with you?', 'What is the ultimate transformation?'],
  'A predictable, profitable business that runs without them being there 80 hours/week, giving them freedom to spend time with family and pursue hobbies.',
  'They want more leads and sales.',
  'Dream outcomes are emotional and lifestyle-focused, not just business metrics.');

-- Q10
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q10_proof', 'What proof/track record do you have?',
  ARRAY['Client results spreadsheet', 'Testimonials', 'Case studies'],
  ARRAY['How many clients served?', 'What is the average result?', 'What is your best case study?'],
  '42 clients served with 89% achieving positive ROI within 60 days. Average return: 3.2x investment. Featured case study: Client went from $50K to $500K in 18 months.',
  'We have helped many clients succeed.',
  'Specific numbers are more believable than vague claims.');

-- Q20
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q20_voice_type', 'What is your brand voice type?',
  ARRAY['Your existing content', 'How you naturally speak', 'What resonates with your audience'],
  ARRAY['How would you describe your communication style?', 'What voice do your best clients respond to?', 'What feels authentic to you?'],
  'Choose the one that best represents how you want to sound in all marketing.',
  'Choosing based on what you think sounds impressive rather than authentic.',
  'Your voice should feel natural to maintain - forced voices are hard to sustain.');

-- Q30
INSERT INTO questionnaire_help (question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip) VALUES
('q30_faith_preference', 'How does faith integrate with your business?',
  ARRAY['Your personal values', 'How you currently communicate', 'What feels authentic'],
  ARRAY['Is faith part of your brand identity?', 'How do you want to express faith in marketing?', 'What level of integration feels right?'],
  'Choose based on how you want faith represented in your marketing.',
  'Choosing based on what you think clients want rather than what is authentic.',
  'There is no right answer - authenticity matters most.');

