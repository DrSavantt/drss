'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AssetCategory = 'framework' | 'brand_guideline' | 'template' | 'strategy' | 'example_copy'

export interface MarketingAsset {
  id: string
  user_id: string
  title: string
  category: AssetCategory
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getAssets(): Promise<{ assets: MarketingAsset[] | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { assets: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('marketing_assets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching assets:', error)
    return { assets: null, error: error.message }
  }

  return { assets: data as MarketingAsset[], error: null }
}

export async function createAsset(formData: {
  title: string
  category: AssetCategory
  content: string
  is_active?: boolean
}): Promise<{ asset: MarketingAsset | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { asset: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('marketing_assets')
    .insert({
      user_id: user.id,
      title: formData.title,
      category: formData.category,
      content: formData.content,
      is_active: formData.is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating asset:', error)
    return { asset: null, error: error.message }
  }

  revalidatePath('/dashboard/ai-assets')
  return { asset: data as MarketingAsset, error: null }
}

export async function updateAsset(
  id: string,
  formData: Partial<{
    title: string
    category: AssetCategory
    content: string
    is_active: boolean
  }>
): Promise<{ asset: MarketingAsset | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { asset: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('marketing_assets')
    .update(formData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating asset:', error)
    return { asset: null, error: error.message }
  }

  revalidatePath('/dashboard/ai-assets')
  return { asset: data as MarketingAsset, error: null }
}

export async function deleteAsset(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('marketing_assets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting asset:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/ai-assets')
  return { success: true, error: null }
}

export async function toggleAssetActive(id: string, isActive: boolean): Promise<{ success: boolean; error: string | null }> {
  const result = await updateAsset(id, { is_active: isActive })
  return { success: !!result.asset, error: result.error }
}

