'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { QuestionnaireData, UploadedFile } from '@/lib/questionnaire/types';
import { questionSchemas } from '@/lib/questionnaire/validation-schemas';

// File upload constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Validate a single file for size and type
 */
function validateFile(file: { name: string; size: number; type: string }): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `${file.name} exceeds 10MB limit`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `${file.name} - only PDF and images allowed`,
    };
  }

  return { valid: true };
}

/**
 * Upload files to Supabase Storage
 */
async function uploadFiles(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  clientId: string,
  files: UploadedFile[],
  folder: string
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  // Validate all files first before uploading
  const validationErrors: string[] = [];
  for (const fileData of files) {
    if (fileData.file) {
      // Only validate new uploads (not already-uploaded URLs)
      const validation = validateFile({
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
      });

      if (!validation.valid && validation.error) {
        validationErrors.push(validation.error);
      }
    }
  }

  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(', '));
  }

  for (const fileData of files) {
    if (!fileData.file) {
      // If file already has a URL (already uploaded), keep it
      if (fileData.url) {
        uploadedUrls.push(fileData.url);
      }
      continue;
    }

    try {
      const file = fileData.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Convert File to ArrayBuffer then to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('questionnaire-uploads')
        .upload(fileName, uint8Array, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('questionnaire-uploads')
        .getPublicUrl(uploadData.path);

      uploadedUrls.push(urlData.publicUrl);
    } catch (error) {
      console.error('File upload failed:', error);
    }
  }

  return uploadedUrls;
}

/**
 * Validate questionnaire data against Zod schemas
 * Handles conditional logic (Q28 faith questions)
 * Skips validation for file URLs (already uploaded)
 */
function validateQuestionnaireData(data: QuestionnaireData): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Check if faith questions should be validated
  const faithPreference = data.faith_integration?.q30_faith_preference;
  const skipFaithQuestions = !faithPreference || faithPreference === 'separate';

  // Validate each section's questions
  Object.entries(data).forEach(([, sectionData]) => {
    if (!sectionData || typeof sectionData !== 'object') return;

    Object.entries(sectionData as Record<string, unknown>).forEach(([questionKey, value]) => {
      // Extract question ID (q1, q2, etc.)
      const questionId = questionKey.split('_')[0];

      // Skip Q31 and Q32 if Q30 is "separate" or empty
      if ((questionId === 'q31' || questionId === 'q32') && skipFaithQuestions) {
        return;
      }

      // Skip file upload fields (Q24, Q29) - they're validated separately
      if (questionId === 'q24' || questionId === 'q29') {
        return;
      }

      // Get the schema for this question
      const schema = questionSchemas[questionId];

      if (schema) {
        // Skip validation if value is empty and schema is optional
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          // Check if schema is optional by testing with undefined
          const testResult = schema.safeParse(undefined);
          if (testResult.success) {
            return; // Optional field, skip validation
          }
        }

        // Validate the value
        const result = schema.safeParse(value);
        if (!result.success) {
          const errorMessage = result.error.issues[0]?.message || 'Invalid value';
          errors[questionKey] = errorMessage;
        }
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function saveQuestionnaire(
  clientId: string,
  data: QuestionnaireData,
  mode: 'create' | 'edit' = 'create'
): Promise<{
  success: boolean;
  error?: string;
  mode?: 'create' | 'edit';
  validationErrors?: Record<string, string>;
}> {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return { success: false, error: 'Failed to connect to database' };
    }

    // Upload files if present
    let brandAssetUrls: string[] = [];
    let proofAssetUrls: string[] = [];

    if (data.brand_voice.q24_brand_assets && data.brand_voice.q24_brand_assets.length > 0) {
      brandAssetUrls = await uploadFiles(supabase, clientId, data.brand_voice.q24_brand_assets, 'brand-assets');
    }

    if (data.proof_transformation.q29_proof_assets && data.proof_transformation.q29_proof_assets.length > 0) {
      proofAssetUrls = await uploadFiles(supabase, clientId, data.proof_transformation.q29_proof_assets, 'proof-assets');
    }

    // Validate questionnaire data before saving
    const validation = validateQuestionnaireData(data);

    if (!validation.isValid) {
      console.error('Server-side validation failed:', validation.errors);
      return {
        success: false,
        error: 'Please check your answers and try again.',
        validationErrors: validation.errors,
      };
    }

    // Structure as JSONB for database
    const intakeResponses = {
      version: '1.0',
      completed_at: new Date().toISOString(),
      sections: {
        avatar_definition: {
          q1_ideal_customer: data.avatar_definition.q1_ideal_customer,
          q2_avatar_criteria: data.avatar_definition.q2_avatar_criteria,
          q3_demographics: data.avatar_definition.q3_demographics,
          q4_psychographics: data.avatar_definition.q4_psychographics,
          q5_platforms: data.avatar_definition.q5_platforms,
        },
        dream_outcome: {
          q6_dream_outcome: data.dream_outcome.q6_dream_outcome,
          q7_status: data.dream_outcome.q7_status,
          q8_time_to_result: data.dream_outcome.q8_time_to_result,
          q9_effort_sacrifice: data.dream_outcome.q9_effort_sacrifice,
          q10_proof: data.dream_outcome.q10_proof,
        },
        problems_obstacles: {
          q11_external_problems: data.problems_obstacles.q11_external_problems,
          q12_internal_problems: data.problems_obstacles.q12_internal_problems,
          q13_philosophical_problems: data.problems_obstacles.q13_philosophical_problems,
          q14_past_failures: data.problems_obstacles.q14_past_failures,
          q15_limiting_beliefs: data.problems_obstacles.q15_limiting_beliefs,
        },
        solution_methodology: {
          q16_core_offer: data.solution_methodology.q16_core_offer,
          q17_unique_mechanism: data.solution_methodology.q17_unique_mechanism,
          q18_differentiation: data.solution_methodology.q18_differentiation,
          q19_delivery_vehicle: data.solution_methodology.q19_delivery_vehicle,
        },
        brand_voice: {
          q20_voice_type: data.brand_voice.q20_voice_type,
          q21_personality_words: data.brand_voice.q21_personality_words,
          q22_signature_phrases: data.brand_voice.q22_signature_phrases,
          q23_avoid_topics: data.brand_voice.q23_avoid_topics,
          q24_brand_assets: brandAssetUrls,
        },
        proof_transformation: {
          q25_transformation_story: data.proof_transformation.q25_transformation_story,
          q26_measurable_results: data.proof_transformation.q26_measurable_results,
          q27_credentials: data.proof_transformation.q27_credentials,
          q28_guarantees: data.proof_transformation.q28_guarantees,
          q29_proof_assets: proofAssetUrls,
        },
        faith_integration: {
          q30_faith_preference: data.faith_integration.q30_faith_preference,
          q31_faith_mission: data.faith_integration.q31_faith_mission,
          q32_biblical_principles: data.faith_integration.q32_biblical_principles,
        },
        business_metrics: {
          q33_annual_revenue: data.business_metrics.q33_annual_revenue,
          q34_primary_goal: data.business_metrics.q34_primary_goal,
        },
      },
    };

    // Build update data - only set questionnaire_completed_at on initial submission
    const updateData: {
      intake_responses: typeof intakeResponses;
      questionnaire_status: string;
      questionnaire_completed_at?: string;
    } = {
      intake_responses: intakeResponses,
      questionnaire_status: 'completed',
    };

    // Only update the completion timestamp on initial creation, not on edits
    if (mode === 'create') {
      updateData.questionnaire_completed_at = new Date().toISOString();
    }

    // Update clients table
    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Revalidate paths
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath(`/dashboard/clients/${clientId}/questionnaire-responses`);
    revalidatePath('/dashboard/clients');

    return { success: true, mode };
  } catch (error: unknown) {
    console.error('Failed to save questionnaire:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save questionnaire';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Reset questionnaire - clears all responses and resets status
 * Keeps the client but removes all questionnaire data
 */
export async function resetQuestionnaire(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return { success: false, error: 'Failed to connect to database' };
    }

    // Reset all questionnaire fields
    const { error } = await supabase
      .from('clients')
      .update({
        intake_responses: null,
        questionnaire_status: 'not_started',
        questionnaire_progress: null,
        questionnaire_completed_at: null,
      })
      .eq('id', clientId);

    if (error) {
      console.error('Failed to reset questionnaire:', error);
      throw error;
    }

    // Revalidate paths
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath(`/dashboard/clients/${clientId}/questionnaire-responses`);
    revalidatePath('/dashboard/clients');

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to reset questionnaire:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset questionnaire';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
