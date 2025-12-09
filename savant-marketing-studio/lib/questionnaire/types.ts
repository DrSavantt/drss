export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

export interface QuestionnaireData {
  avatar_definition: {
    q1_ideal_customer: string;
    q2_avatar_criteria: string[];
    q3_demographics: string;
    q4_psychographics: string;
    q5_platforms: string;
  };
  dream_outcome: {
    q6_dream_outcome: string;
    q7_status: string;
    q8_time_to_result: string;
    q9_effort_sacrifice: string;
    q10_proof: string;
  };
  problems_obstacles: {
    q11_external_problems: string;
    q12_internal_problems: string;
    q13_philosophical_problems: string;
    q14_past_failures: string;
    q15_limiting_beliefs: string;
  };
  solution_methodology: {
    q16_core_offer: string;
    q17_unique_mechanism: string;
    q18_differentiation: string;
    q19_delivery_vehicle: string;
  };
  brand_voice: {
    q20_voice_type: string;
    q21_personality_words: string;
    q22_signature_phrases: string;
    q23_avoid_topics: string;
    q33_brand_assets?: UploadedFile[]; // Optional: logos, style guides, etc.
  };
  proof_transformation: {
    q24_transformation_story: string;
    q25_measurable_results: string;
    q26_credentials: string;
    q27_guarantees: string;
    q34_proof_assets?: UploadedFile[]; // Optional: testimonials, case studies, etc.
  };
  faith_integration: {
    q28_faith_preference: string;
    q29_faith_mission: string;
    q30_biblical_principles: string;
  };
  business_metrics: {
    q31_annual_revenue: string;
    q32_primary_goal: string;
  };
}

export type FormStatus = 'saved' | 'saving' | 'error';

export const REQUIRED_QUESTIONS = [
  'q1', 'q2', 'q3', 'q4', 'q5',
  'q6', 'q7', 'q8', 'q9', 'q10',
  'q11', 'q12', 'q14', 'q15',
  'q16', 'q17', 'q18', 'q19',
  'q20', 'q21', 'q22', 'q23',
  'q24', 'q25', 'q27',
  'q31', 'q32'
];

export const OPTIONAL_QUESTIONS = [
  'q13', 'q26', 'q28', 'q29', 'q30'
];

export const EMPTY_QUESTIONNAIRE_DATA: QuestionnaireData = {
  avatar_definition: {
    q1_ideal_customer: '',
    q2_avatar_criteria: [],
    q3_demographics: '',
    q4_psychographics: '',
    q5_platforms: '',
  },
  dream_outcome: {
    q6_dream_outcome: '',
    q7_status: '',
    q8_time_to_result: '',
    q9_effort_sacrifice: '',
    q10_proof: '',
  },
  problems_obstacles: {
    q11_external_problems: '',
    q12_internal_problems: '',
    q13_philosophical_problems: '',
    q14_past_failures: '',
    q15_limiting_beliefs: '',
  },
  solution_methodology: {
    q16_core_offer: '',
    q17_unique_mechanism: '',
    q18_differentiation: '',
    q19_delivery_vehicle: '',
  },
  brand_voice: {
    q20_voice_type: '',
    q21_personality_words: '',
    q22_signature_phrases: '',
    q23_avoid_topics: '',
    q33_brand_assets: [],
  },
  proof_transformation: {
    q24_transformation_story: '',
    q25_measurable_results: '',
    q26_credentials: '',
    q27_guarantees: '',
    q34_proof_assets: [],
  },
  faith_integration: {
    q28_faith_preference: '',
    q29_faith_mission: '',
    q30_biblical_principles: '',
  },
  business_metrics: {
    q31_annual_revenue: '',
    q32_primary_goal: '',
  },
};
