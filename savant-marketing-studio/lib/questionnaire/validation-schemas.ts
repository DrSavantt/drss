import { z } from 'zod';

// Individual question schemas (reduced minimums to 20 chars for better UX)
export const q1Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q2Schema = z.array(z.string())
  .min(1, "Please select at least one criterion");

export const q3Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q4Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q5Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q6Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q7Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q8Schema = z.string()
  .min(10, "Please provide at least 10 characters")
  .max(300, "Please keep under 300 characters");

export const q9Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q10Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q11Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q12Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q13Schema = z.string().max(1000, "Please keep under 1000 characters");

export const q14Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q15Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q16Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q17Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q18Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q19Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q20Schema = z.string()
  .min(1, "Please select a voice type");

export const q21Schema = z.string()
  .min(10, "Please provide at least 10 characters")
  .max(300, "Please keep under 300 characters");

export const q22Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q23Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q24Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(2000, "Please keep under 2000 characters");

export const q25Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(1000, "Please keep under 1000 characters");

export const q26Schema = z.string().max(500, "Please keep under 500 characters");

export const q27Schema = z.string()
  .min(20, "Please provide at least 20 characters")
  .max(500, "Please keep under 500 characters");

export const q28Schema = z.string();

export const q29Schema = z.string().max(1000, "Please keep under 1000 characters");

export const q30Schema = z.string().max(500, "Please keep under 500 characters");

export const q31Schema = z.string()
  .min(1, "Please select a revenue range");

export const q32Schema = z.string()
  .min(1, "Please select a primary goal");

// Full questionnaire schema
export const questionnaireSchema = z.object({
  avatar_definition: z.object({
    q1_ideal_customer: q1Schema,
    q2_avatar_criteria: q2Schema,
    q3_demographics: q3Schema,
    q4_psychographics: q4Schema,
    q5_platforms: q5Schema,
  }),
  dream_outcome: z.object({
    q6_dream_outcome: q6Schema,
    q7_status: q7Schema,
    q8_time_to_result: q8Schema,
    q9_effort_sacrifice: q9Schema,
    q10_proof: q10Schema,
  }),
  problems_obstacles: z.object({
    q11_external_problems: q11Schema,
    q12_internal_problems: q12Schema,
    q13_philosophical_problems: q13Schema.optional(),
    q14_past_failures: q14Schema,
    q15_limiting_beliefs: q15Schema,
  }),
  solution_methodology: z.object({
    q16_core_offer: q16Schema,
    q17_unique_mechanism: q17Schema,
    q18_differentiation: q18Schema,
    q19_delivery_vehicle: q19Schema,
  }),
  brand_voice: z.object({
    q20_voice_type: q20Schema,
    q21_personality_words: q21Schema,
    q22_signature_phrases: q22Schema,
    q23_avoid_topics: q23Schema,
  }),
  proof_transformation: z.object({
    q24_transformation_story: q24Schema,
    q25_measurable_results: q25Schema,
    q26_credentials: q26Schema.optional(),
    q27_guarantees: q27Schema,
  }),
  faith_integration: z.object({
    q28_faith_preference: q28Schema.optional(),
    q29_faith_mission: q29Schema.optional(),
    q30_biblical_principles: q30Schema.optional(),
  }),
  business_metrics: z.object({
    q31_annual_revenue: q31Schema,
    q32_primary_goal: q32Schema,
  }),
});

// Schema map for individual question validation
export const questionSchemas: Record<string, z.ZodSchema> = {
  q1: q1Schema,
  q2: q2Schema,
  q3: q3Schema,
  q4: q4Schema,
  q5: q5Schema,
  q6: q6Schema,
  q7: q7Schema,
  q8: q8Schema,
  q9: q9Schema,
  q10: q10Schema,
  q11: q11Schema,
  q12: q12Schema,
  q13: q13Schema,
  q14: q14Schema,
  q15: q15Schema,
  q16: q16Schema,
  q17: q17Schema,
  q18: q18Schema,
  q19: q19Schema,
  q20: q20Schema,
  q21: q21Schema,
  q22: q22Schema,
  q23: q23Schema,
  q24: q24Schema,
  q25: q25Schema,
  q26: q26Schema,
  q27: q27Schema,
  q28: q28Schema,
  q29: q29Schema,
  q30: q30Schema,
  q31: q31Schema,
  q32: q32Schema,
};
