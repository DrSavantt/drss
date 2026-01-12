'use server';

import { createClient } from '@/lib/supabase/server';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { getModelIdFromName } from '@/lib/ai/model-lookup';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity-log';
import type { Database, Json } from '@/types/database';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CreateConversationInput {
  clientId?: string;
  contentTypeId?: string;           // Single content type (e.g., Facebook Ad, Email, Landing Page)
  writingFrameworkIds?: string[];   // Multiple writing frameworks (e.g., AIDA, PAS, BAB)
  title?: string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  modelId?: string; // Model name like 'claude-sonnet-4-5-20250929', defaults to claude sonnet
  useExtendedThinking?: boolean;
}

export interface UpdateConversationInput {
  title?: string;
  qualityRating?: number;
}

export interface SaveToContentInput {
  executionId: string;
  projectId?: string;
  title?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string | null;
  messageRole: string | null;
  content: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalCostUsd: number | null;
  modelId: string;
  createdAt: string | null;
}

export interface ConversationWithMessages {
  conversation: Database['public']['Tables']['ai_conversations']['Row'];
  messages: ConversationMessage[];
  client?: { id: string; name: string } | null;
}

export interface ConversationListItem {
  id: string;
  title: string;
  clientId: string | null;
  clientName: string | null;
  messageCount: number;
  totalCost: number;
  qualityRating: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build system prompt from client context, content type, and writing frameworks
 */
async function buildSystemPrompt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId?: string,
  contentTypeId?: string,
  writingFrameworkIds?: string[]
): Promise<string> {
  let systemPrompt = `You are an expert marketing strategist and copywriter. You help create compelling, effective marketing content tailored to specific brands and their target audiences.

Your responses should:
1. Be strategic and goal-oriented
2. Match the brand's voice and tone (when context is provided)
3. Apply proven marketing frameworks and copywriting principles
4. Be actionable and ready for implementation
5. Consider the target audience's needs and pain points

`;

  // Load client context if provided
  if (clientId && supabase) {
    const { data: client } = await supabase
      .from('clients')
      .select('name, intake_responses, brand_data')
      .eq('id', clientId)
      .single();

    if (client) {
      systemPrompt += `## Client Context: ${client.name}\n\n`;

      if (client.brand_data) {
        systemPrompt += `### Brand Information\n${JSON.stringify(client.brand_data, null, 2)}\n\n`;
      }

      if (client.intake_responses) {
        systemPrompt += `### Questionnaire Responses\n${JSON.stringify(client.intake_responses, null, 2)}\n\n`;
      }
    }
  }

  // Load content type context if selected
  if (contentTypeId && supabase) {
    const { data: contentType } = await supabase
      .from('marketing_frameworks')
      .select('name, content')
      .eq('id', contentTypeId)
      .single();

    if (contentType) {
      systemPrompt += `## Content Type: ${contentType.name}\n\n`;
      systemPrompt += `Follow these format guidelines:\n${contentType.content}\n\n`;
    }
  }

  // Load writing framework context if specific frameworks selected
  if (writingFrameworkIds?.length && supabase) {
    // Get framework content directly (explicit selection, not RAG)
    const { data: frameworks } = await supabase
      .from('marketing_frameworks')
      .select('name, content')
      .in('id', writingFrameworkIds);

    if (frameworks?.length) {
      systemPrompt += `## Writing Frameworks\n\n`;
      frameworks.forEach(fw => {
        systemPrompt += `### ${fw.name}\n${fw.content}\n\n`;
      });
    }
  }

  systemPrompt += `Remember to apply the above context in all your responses. Be concise but thorough.`;

  return systemPrompt;
}

/**
 * Get default model ID for chat (Claude 4.5 Sonnet)
 */
async function getDefaultChatModelId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
): Promise<string> {
  const { data: model } = await supabase
    .from('ai_models')
    .select('id')
    .eq('model_name', 'claude-sonnet-4-5-20250929')
    .eq('is_active', true)
    .single();

  if (model) return model.id;

  // Fallback to any active model
  const { data: fallback } = await supabase
    .from('ai_models')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  return fallback?.id || '';
}

// ============================================================================
// CONVERSATION CRUD OPERATIONS
// ============================================================================

/**
 * Create a new conversation
 * Optionally scope to a client, content type, and/or writing frameworks
 */
export async function createConversation(
  data: CreateConversationInput
): Promise<ActionResult<Database['public']['Tables']['ai_conversations']['Row']>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Build system prompt with client, content type, and writing framework context
    const systemPrompt = await buildSystemPrompt(
      supabase,
      data.clientId,
      data.contentTypeId,
      data.writingFrameworkIds
    );

    // Generate default title if not provided
    let title = data.title;
    if (!title) {
      if (data.clientId) {
        const { data: client } = await supabase
          .from('clients')
          .select('name')
          .eq('id', data.clientId)
          .single();
        title = client ? `Chat with ${client.name}` : 'New Chat';
      } else {
        title = `New Chat - ${new Date().toLocaleDateString()}`;
      }
    }

    // Combine all framework IDs for storage (content type + writing frameworks)
    const allFrameworkIds = [
      ...(data.contentTypeId ? [data.contentTypeId] : []),
      ...(data.writingFrameworkIds || [])
    ];

    // Create conversation record
    const { data: conversation, error: insertError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        client_id: data.clientId || null,
        framework_ids: allFrameworkIds.length > 0 ? allFrameworkIds : null,
        title,
        system_prompt: systemPrompt,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create conversation:', insertError);
      return { success: false, error: insertError.message };
    }

    revalidatePath('/dashboard/ai/chat');
    
    return { success: true, data: conversation };
  } catch (error) {
    console.error('createConversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create conversation',
    };
  }
}

/**
 * Get a conversation with all its messages
 */
export async function getConversation(
  conversationId: string
): Promise<ActionResult<ConversationWithMessages>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Load conversation (RLS ensures ownership)
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return { success: false, error: 'Conversation not found' };
    }

    // Load all messages for this conversation
    const { data: executions, error: msgError } = await supabase
      .from('ai_executions')
      .select('id, conversation_id, message_role, input_data, output_data, input_tokens, output_tokens, total_cost_usd, model_id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Failed to load messages:', msgError);
      return { success: false, error: 'Failed to load messages' };
    }

    // Transform executions to messages
    const messages: ConversationMessage[] = (executions || []).map(exec => ({
      id: exec.id,
      conversationId: exec.conversation_id,
      messageRole: exec.message_role,
      content: exec.message_role === 'user'
        ? (exec.input_data as { content?: string })?.content || ''
        : (exec.output_data as { content?: string })?.content || '',
      inputTokens: exec.input_tokens,
      outputTokens: exec.output_tokens,
      totalCostUsd: exec.total_cost_usd,
      modelId: exec.model_id,
      createdAt: exec.created_at,
    }));

    // Load client name if conversation has client_id
    let client: { id: string; name: string } | null = null;
    if (conversation.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', conversation.client_id)
        .single();
      client = clientData || null;
    }

    return {
      success: true,
      data: {
        conversation,
        messages,
        client,
      },
    };
  } catch (error) {
    console.error('getConversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation',
    };
  }
}

/**
 * List conversations with optional filters
 */
export async function listConversations(
  filters?: { clientId?: string; status?: string; limit?: number }
): Promise<ActionResult<ConversationListItem[]>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Build query
    let query = supabase
      .from('ai_conversations')
      .select(`
        id,
        title,
        client_id,
        total_cost_usd,
        quality_rating,
        status,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(filters?.limit || 50);

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data: conversations, error: listError } = await query;

    if (listError) {
      console.error('Failed to list conversations:', listError);
      return { success: false, error: listError.message };
    }

    if (!conversations || conversations.length === 0) {
      return { success: true, data: [] };
    }

    // Get client names for conversations with client_id
    const clientIds = Array.from(new Set(conversations
      .filter(c => c.client_id)
      .map(c => c.client_id as string)
    ));

    let clientMap: Map<string, string> = new Map();
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      if (clients) {
        clientMap = new Map(clients.map(c => [c.id, c.name]));
      }
    }

    // Get message counts for each conversation
    const conversationIds = conversations.map(c => c.id);
    const { data: messageCounts } = await supabase
      .from('ai_executions')
      .select('conversation_id')
      .in('conversation_id', conversationIds);

    const countMap = new Map<string, number>();
    (messageCounts || []).forEach(m => {
      if (m.conversation_id) {
        countMap.set(m.conversation_id, (countMap.get(m.conversation_id) || 0) + 1);
      }
    });

    // Transform to list items
    const items: ConversationListItem[] = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      clientId: conv.client_id,
      clientName: conv.client_id ? clientMap.get(conv.client_id) || null : null,
      messageCount: countMap.get(conv.id) || 0,
      totalCost: conv.total_cost_usd || 0,
      qualityRating: conv.quality_rating,
      status: conv.status,
      createdAt: conv.created_at || '',
      updatedAt: conv.updated_at || '',
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error('listConversations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list conversations',
    };
  }
}

/**
 * Update conversation metadata (title, quality rating)
 */
export async function updateConversation(
  conversationId: string,
  data: UpdateConversationInput
): Promise<ActionResult<Database['public']['Tables']['ai_conversations']['Row']>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.qualityRating !== undefined) {
      // Validate rating range (1-10)
      if (data.qualityRating < 1 || data.qualityRating > 10) {
        return { success: false, error: 'Quality rating must be between 1 and 10' };
      }
      updateData.quality_rating = data.qualityRating;
    }

    const { data: conversation, error: updateError } = await supabase
      .from('ai_conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update conversation:', updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard/ai/chat');
    revalidatePath(`/dashboard/ai/chat/${conversationId}`);

    return { success: true, data: conversation };
  } catch (error) {
    console.error('updateConversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update conversation',
    };
  }
}

/**
 * Archive a conversation (soft delete)
 */
export async function archiveConversation(
  conversationId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const { error: archiveError } = await supabase
      .from('ai_conversations')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (archiveError) {
      console.error('Failed to archive conversation:', archiveError);
      return { success: false, error: archiveError.message };
    }

    revalidatePath('/dashboard/ai/chat');

    return { success: true };
  } catch (error) {
    console.error('archiveConversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive conversation',
    };
  }
}

/**
 * Delete a conversation (hard delete - cascades to executions)
 */
export async function deleteConversation(
  conversationId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Delete conversation (cascade will handle ai_executions)
    const { error: deleteError } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) {
      console.error('Failed to delete conversation:', deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/dashboard/ai/chat');

    return { success: true };
  } catch (error) {
    console.error('deleteConversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete conversation',
    };
  }
}

// ============================================================================
// ARCHIVE FUNCTIONS (for universal archive page)
// ============================================================================

/**
 * Get all archived AI conversations for the archive page
 */
export async function getArchivedConversations(): Promise<Array<{
  id: string;
  title: string;
  client_id: string | null;
  clients: { id: string; name: string } | null;
  updated_at: string;
  message_count: number;
}>> {
  try {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: conversations, error } = await supabase
      .from('ai_conversations')
      .select(`
        id,
        title,
        client_id,
        clients (id, name),
        updated_at
      `)
      .eq('status', 'archived')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to get archived conversations:', error);
      return [];
    }

    // Get message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { count } = await supabase
          .from('ai_executions')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        // Supabase foreign key joins return single object, but TS may infer array
        const clientData = Array.isArray(conv.clients) 
          ? conv.clients[0] 
          : conv.clients;
        
        return {
          id: conv.id,
          title: conv.title,
          client_id: conv.client_id,
          clients: clientData as { id: string; name: string } | null,
          updated_at: conv.updated_at || new Date().toISOString(),
          message_count: count || 0,
        };
      })
    );

    return conversationsWithCounts;
  } catch (error) {
    console.error('getArchivedConversations error:', error);
    return [];
  }
}

/**
 * Restore an archived conversation back to active status
 */
export async function restoreConversation(
  conversationId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const { error: restoreError } = await supabase
      .from('ai_conversations')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (restoreError) {
      console.error('Failed to restore conversation:', restoreError);
      return { success: false, error: restoreError.message };
    }

    revalidatePath('/dashboard/ai/chat');
    revalidatePath('/dashboard/archive');

    return { success: true };
  } catch (error) {
    console.error('restoreConversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore conversation',
    };
  }
}

/**
 * Permanently delete a conversation (hard delete)
 * Alias for deleteConversation for archive page consistency
 */
export async function permanentlyDeleteConversation(
  conversationId: string
): Promise<ActionResult<void>> {
  const result = await deleteConversation(conversationId);
  if (result.success) {
    revalidatePath('/dashboard/archive');
  }
  return result;
}

// ============================================================================
// MESSAGING
// ============================================================================

/**
 * Send a message in a conversation and get AI response
 */
export async function sendMessage(
  data: SendMessageInput
): Promise<ActionResult<{
  response: string;
  userMessageId: string;
  assistantMessageId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  modelUsed: string;
}>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Load conversation (RLS ensures ownership)
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', data.conversationId)
      .single();

    if (convError || !conversation) {
      return { success: false, error: 'Conversation not found' };
    }

    // Load previous messages for context
    const { data: previousExecutions } = await supabase
      .from('ai_executions')
      .select('message_role, input_data, output_data')
      .eq('conversation_id', data.conversationId)
      .order('created_at', { ascending: true });

    // Build messages array for AI API
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add previous conversation messages
    (previousExecutions || []).forEach(exec => {
      if (exec.message_role === 'user') {
        const content = (exec.input_data as { content?: string })?.content;
        if (content) {
          messages.push({ role: 'user', content });
        }
      } else if (exec.message_role === 'assistant') {
        const content = (exec.output_data as { content?: string })?.content;
        if (content) {
          messages.push({ role: 'assistant', content });
        }
      }
    });

    // Add new user message
    messages.push({ role: 'user', content: data.content });

    // Determine model to use
    const modelName = data.modelId || 'claude-sonnet-4-5-20250929';
    
    // Get model_id for database
    const modelId = await getModelIdFromName(modelName) || await getDefaultChatModelId(supabase);
    if (!modelId) {
      return { success: false, error: 'No active AI models available' };
    }

    // Save user message first
    const { data: userMessage, error: userMsgError } = await supabase
      .from('ai_executions')
      .insert({
        user_id: user.id,
        client_id: conversation.client_id,
        conversation_id: conversation.id,
        model_id: modelId,
        task_type: 'chat_message',
        message_role: 'user',
        input_data: { content: data.content } as Json,
        output_data: null,
        status: 'success',
        input_tokens: null,
        output_tokens: null,
        total_cost_usd: null,
      })
      .select('id')
      .single();

    if (userMsgError) {
      console.error('Failed to save user message:', userMsgError);
      return { success: false, error: 'Failed to save message' };
    }

    // Execute AI task
    const orchestrator = new AIOrchestrator();
    let aiResponse;
    
    try {
      aiResponse = await orchestrator.executeTask({
        type: 'chat_message',
        complexity: 'medium',
        clientId: conversation.client_id || undefined,
        forceModel: modelName,
        request: {
          messages,
          maxTokens: 4096,
          temperature: 0.7,
          systemPrompt: conversation.system_prompt || undefined,
          useExtendedThinking: data.useExtendedThinking,
          thinkingBudget: data.useExtendedThinking ? 10000 : undefined,
        },
      });
    } catch (aiError) {
      console.error('AI execution failed:', aiError);
      // Mark user message as part of a failed exchange
      return {
        success: false,
        error: aiError instanceof Error ? aiError.message : 'AI request failed',
      };
    }

    // Save assistant response
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('ai_executions')
      .insert({
        user_id: user.id,
        client_id: conversation.client_id,
        conversation_id: conversation.id,
        model_id: modelId,
        task_type: 'chat_message',
        message_role: 'assistant',
        input_data: { content: data.content } as Json, // Store the prompt that generated this
        output_data: { content: aiResponse.content } as Json,
        status: 'success',
        input_tokens: aiResponse.inputTokens,
        output_tokens: aiResponse.outputTokens,
        total_cost_usd: aiResponse.cost,
      })
      .select('id')
      .single();

    if (assistantMsgError) {
      console.error('Failed to save assistant message:', assistantMsgError);
      // Note: The AI response was generated successfully, but we failed to save it
      // Return the response anyway so the user can see it
    }

    // Update conversation timestamp
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // Log activity
    await logActivity({
      activityType: 'ai_generation',
      entityType: 'ai_execution',
      entityId: assistantMessage?.id || userMessage.id,
      entityName: `Chat: ${conversation.title}`,
      clientId: conversation.client_id || undefined,
      metadata: {
        conversation_id: conversation.id,
        model: modelName,
        tokens: aiResponse.inputTokens + aiResponse.outputTokens,
        cost: aiResponse.cost,
      },
    });

    revalidatePath(`/dashboard/ai/chat/${data.conversationId}`);

    return {
      success: true,
      data: {
        response: aiResponse.content,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage?.id || '',
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        cost: aiResponse.cost,
        modelUsed: aiResponse.modelUsed,
      },
    };
  } catch (error) {
    console.error('sendMessage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

// ============================================================================
// CONTENT INTEGRATION
// ============================================================================

/**
 * Save an AI message output to the content library
 */
export async function saveMessageToContent(
  data: SaveToContentInput
): Promise<ActionResult<{ contentAssetId: string }>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Load the execution record
    const { data: execution, error: execError } = await supabase
      .from('ai_executions')
      .select('*, ai_conversations!inner(client_id, title)')
      .eq('id', data.executionId)
      .single();

    if (execError || !execution) {
      return { success: false, error: 'Message not found' };
    }

    // Get content from output_data
    const outputContent = (execution.output_data as { content?: string })?.content;
    if (!outputContent) {
      return { success: false, error: 'Message has no content to save' };
    }

    // Get client_id from conversation
    const conversation = execution.ai_conversations as unknown as { client_id: string | null; title: string };
    const clientId = conversation?.client_id;

    if (!clientId) {
      return { success: false, error: 'Cannot save content without a client context' };
    }

    // Generate title
    const title = data.title || `Chat Response - ${conversation.title || 'Untitled'}`;

    // Create content asset
    const { data: contentAsset, error: saveError } = await supabase
      .from('content_assets')
      .insert({
        client_id: clientId,
        project_id: data.projectId || null,
        title,
        asset_type: 'note',
        content_json: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: outputContent }],
            },
          ],
        },
        metadata: {
          source: 'ai_chat',
          ai_execution_id: data.executionId,
          conversation_id: execution.conversation_id,
          model_id: execution.model_id,
          saved_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Failed to save content:', saveError);
      return { success: false, error: saveError.message };
    }

    // Log activity
    await logActivity({
      activityType: 'content_created',
      entityType: 'content',
      entityId: contentAsset.id,
      entityName: title,
      clientId,
      metadata: {
        source: 'ai_chat',
        conversation_id: execution.conversation_id,
      },
    });

    revalidatePath(`/dashboard/clients/${clientId}/content`);

    return {
      success: true,
      data: { contentAssetId: contentAsset.id },
    };
  } catch (error) {
    console.error('saveMessageToContent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save content',
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Regenerate the system prompt for a conversation (e.g., if client data changed)
 */
export async function regenerateSystemPrompt(
  conversationId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Load conversation
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('client_id, framework_ids')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return { success: false, error: 'Conversation not found' };
    }

    // Separate content types from writing frameworks based on their type
    let contentTypeId: string | undefined;
    let writingFrameworkIds: string[] | undefined;

    if (conversation.framework_ids?.length) {
      const { data: frameworks } = await supabase
        .from('marketing_frameworks')
        .select('id, type')
        .in('id', conversation.framework_ids);

      if (frameworks) {
        const contentType = frameworks.find(f => f.type === 'content-type');
        const writingFrameworks = frameworks.filter(f => f.type === 'writing-framework');
        
        contentTypeId = contentType?.id;
        writingFrameworkIds = writingFrameworks.length > 0 
          ? writingFrameworks.map(f => f.id) 
          : undefined;
      }
    }

    // Rebuild system prompt
    const systemPrompt = await buildSystemPrompt(
      supabase,
      conversation.client_id || undefined,
      contentTypeId,
      writingFrameworkIds
    );

    // Update conversation
    const { error: updateError } = await supabase
      .from('ai_conversations')
      .update({
        system_prompt: systemPrompt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Failed to update system prompt:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('regenerateSystemPrompt error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate system prompt',
    };
  }
}

/**
 * Get conversation statistics for a client
 */
export async function getClientChatStats(
  clientId: string
): Promise<ActionResult<{
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  totalCost: number;
  avgQualityRating: number | null;
}>> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Get conversation stats
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('id, status, total_cost_usd, quality_rating')
      .eq('client_id', clientId)
      .eq('user_id', user.id);

    if (!conversations || conversations.length === 0) {
      return {
        success: true,
        data: {
          totalConversations: 0,
          activeConversations: 0,
          totalMessages: 0,
          totalCost: 0,
          avgQualityRating: null,
        },
      };
    }

    const conversationIds = conversations.map(c => c.id);

    // Get message count
    const { data: messages } = await supabase
      .from('ai_executions')
      .select('id')
      .in('conversation_id', conversationIds);

    const totalMessages = messages?.length || 0;
    const totalCost = conversations.reduce((sum, c) => sum + (c.total_cost_usd || 0), 0);
    const activeConversations = conversations.filter(c => c.status === 'active').length;
    
    const ratings = conversations
      .map(c => c.quality_rating)
      .filter((r): r is number => r !== null);
    const avgQualityRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;

    return {
      success: true,
      data: {
        totalConversations: conversations.length,
        activeConversations,
        totalMessages,
        totalCost,
        avgQualityRating,
      },
    };
  } catch (error) {
    console.error('getClientChatStats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
}
