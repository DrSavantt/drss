'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { QuestionnaireData, UploadedFile } from '@/lib/questionnaire/types';

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

export async function saveQuestionnaire(
  clientId: string,
  data: QuestionnaireData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return { success: false, error: 'Failed to connect to database' };
    }

    // Upload files if present
    let brandAssetUrls: string[] = [];
    let proofAssetUrls: string[] = [];

    if (data.brand_voice.q33_brand_assets && data.brand_voice.q33_brand_assets.length > 0) {
      brandAssetUrls = await uploadFiles(supabase, clientId, data.brand_voice.q33_brand_assets, 'brand-assets');
    }

    if (data.proof_transformation.q34_proof_assets && data.proof_transformation.q34_proof_assets.length > 0) {
      proofAssetUrls = await uploadFiles(supabase, clientId, data.proof_transformation.q34_proof_assets, 'proof-assets');
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
          q33_brand_assets: brandAssetUrls,
        },
        proof_transformation: {
          q24_transformation_story: data.proof_transformation.q24_transformation_story,
          q25_measurable_results: data.proof_transformation.q25_measurable_results,
          q26_credentials: data.proof_transformation.q26_credentials,
          q27_guarantees: data.proof_transformation.q27_guarantees,
          q34_proof_assets: proofAssetUrls,
        },
        faith_integration: {
          q28_faith_preference: data.faith_integration.q28_faith_preference,
          q29_faith_mission: data.faith_integration.q29_faith_mission,
          q30_biblical_principles: data.faith_integration.q30_biblical_principles,
        },
        business_metrics: {
          q31_annual_revenue: data.business_metrics.q31_annual_revenue,
          q32_primary_goal: data.business_metrics.q32_primary_goal,
        },
      },
    };

    // Update clients table
    const { error } = await supabase
      .from('clients')
      .update({
        intake_responses: intakeResponses,
        questionnaire_status: 'completed',
        questionnaire_completed_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Revalidate paths
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath('/dashboard/clients');

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to save questionnaire:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save questionnaire';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
