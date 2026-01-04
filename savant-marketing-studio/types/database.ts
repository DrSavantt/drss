export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: string
          client_id: string | null
          created_at: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          client_id?: string | null
          created_at?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          client_id?: string | null
          created_at?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_executions: {
        Row: {
          client_id: string | null
          complexity: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json
          input_tokens: number | null
          model_id: string
          output_data: Json | null
          output_tokens: number | null
          status: string
          task_type: string
          total_cost_usd: number | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          complexity?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data: Json
          input_tokens?: number | null
          model_id: string
          output_data?: Json | null
          output_tokens?: number | null
          status: string
          task_type: string
          total_cost_usd?: number | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          complexity?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json
          input_tokens?: number | null
          model_id?: string
          output_data?: Json | null
          output_tokens?: number | null
          status?: string
          task_type?: string
          total_cost_usd?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_executions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generations: {
        Row: {
          client_id: string | null
          context_used: Json | null
          cost_estimate: number | null
          created_at: string | null
          generation_type: string
          id: string
          model_used: string
          output_data: Json | null
          prompt: string
          tokens_used: number | null
          user_id: string
          was_accepted: boolean | null
        }
        Insert: {
          client_id?: string | null
          context_used?: Json | null
          cost_estimate?: number | null
          created_at?: string | null
          generation_type: string
          id?: string
          model_used: string
          output_data?: Json | null
          prompt: string
          tokens_used?: number | null
          user_id: string
          was_accepted?: boolean | null
        }
        Update: {
          client_id?: string | null
          context_used?: Json | null
          cost_estimate?: number | null
          created_at?: string | null
          generation_type?: string
          id?: string
          model_used?: string
          output_data?: Json | null
          prompt?: string
          tokens_used?: number | null
          user_id?: string
          was_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          cost_per_1m_input: number | null
          cost_per_1m_output: number | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          max_tokens: number | null
          metadata: Json | null
          model_name: string
          model_tier: string
          provider_id: string
          supports_streaming: boolean | null
        }
        Insert: {
          cost_per_1m_input?: number | null
          cost_per_1m_output?: number | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          model_name: string
          model_tier: string
          provider_id: string
          supports_streaming?: boolean | null
        }
        Update: {
          cost_per_1m_input?: number | null
          cost_per_1m_output?: number | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          model_name?: string
          model_tier?: string
          provider_id?: string
          supports_streaming?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_key_env_var: string | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          provider_type: string
        }
        Insert: {
          api_key_env_var?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          provider_type: string
        }
        Update: {
          api_key_env_var?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          provider_type?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          brand_data: Json | null
          client_code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          industry: string | null
          intake_responses: Json | null
          name: string
          questionnaire_completed_at: string | null
          questionnaire_status: string | null
          questionnaire_token: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          brand_data?: Json | null
          client_code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          intake_responses?: Json | null
          name: string
          questionnaire_completed_at?: string | null
          questionnaire_status?: string | null
          questionnaire_token?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          brand_data?: Json | null
          client_code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          intake_responses?: Json | null
          name?: string
          questionnaire_completed_at?: string | null
          questionnaire_status?: string | null
          questionnaire_token?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      component_instances: {
        Row: {
          content_data: Json
          created_at: string | null
          id: string
          is_visible: boolean | null
          page_id: string
          position: number
          template_id: string
          updated_at: string | null
        }
        Insert: {
          content_data: Json
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          page_id: string
          position?: number
          template_id: string
          updated_at?: string | null
        }
        Update: {
          content_data?: Json
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          page_id?: string
          position?: number
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_instances_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "component_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      component_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          preview_image: string | null
          required_fields: Json
          structure: Json
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          preview_image?: string | null
          required_fields: Json
          structure: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image?: string | null
          required_fields?: Json
          structure?: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      content_assets: {
        Row: {
          asset_type: string
          client_id: string
          content_json: Json | null
          created_at: string | null
          deleted_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_archived: boolean | null
          metadata: Json | null
          parent_id: string | null
          project_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          asset_type: string
          client_id: string
          content_json?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          parent_id?: string | null
          project_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          asset_type?: string
          client_id?: string
          content_json?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          parent_id?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          embedding: string | null
          framework_id: string
          id: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          embedding?: string | null
          framework_id: string
          id?: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          framework_id?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "framework_chunks_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "marketing_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_embeddings: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          embedding: string | null
          framework_id: string
          id: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          embedding?: string | null
          framework_id: string
          id?: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          framework_id?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "framework_embeddings_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      frameworks: {
        Row: {
          category: string | null
          content: string
          content_json: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          content_json?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          content_json?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_chats: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          folder_id: string | null
          id: string
          linked_id: string | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          linked_id?: string | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          linked_id?: string | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_chats_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "journal_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          attachments: Json | null
          chat_id: string | null
          content: string
          converted_to_content_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_converted: boolean | null
          is_pinned: boolean | null
          mentioned_clients: string[] | null
          mentioned_content: string[] | null
          mentioned_projects: string[] | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          voice_url: string | null
        }
        Insert: {
          attachments?: Json | null
          chat_id?: string | null
          content: string
          converted_to_content_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_converted?: boolean | null
          is_pinned?: boolean | null
          mentioned_clients?: string[] | null
          mentioned_content?: string[] | null
          mentioned_projects?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          voice_url?: string | null
        }
        Update: {
          attachments?: Json | null
          chat_id?: string | null
          content?: string
          converted_to_content_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_converted?: boolean | null
          is_pinned?: boolean | null
          mentioned_clients?: string[] | null
          mentioned_content?: string[] | null
          mentioned_projects?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "journal_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_converted_to_content_id_fkey"
            columns: ["converted_to_content_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          position: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketing_frameworks: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          page_type: string | null
          project_id: string | null
          published_at: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          page_type?: string | null
          project_id?: string | null
          published_at?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          page_type?: string | null
          project_id?: string | null
          published_at?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          name: string
          position: number | null
          priority: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          name: string
          position?: number | null
          priority?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          position?: number | null
          priority?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_questions: {
        Row: {
          accepted_file_types: string[] | null
          conditional_on: Json | null
          created_at: string | null
          enabled: boolean | null
          file_description: string | null
          help_content: Json | null
          id: string
          max_file_size: number | null
          max_files: number | null
          max_length: number | null
          min_length: number | null
          options: Json | null
          placeholder: string | null
          question_key: string
          required: boolean | null
          section_id: number | null
          sort_order: number
          text: string
          type: string
          updated_at: string | null
        }
        Insert: {
          accepted_file_types?: string[] | null
          conditional_on?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          file_description?: string | null
          help_content?: Json | null
          id: string
          max_file_size?: number | null
          max_files?: number | null
          max_length?: number | null
          min_length?: number | null
          options?: Json | null
          placeholder?: string | null
          question_key: string
          required?: boolean | null
          section_id?: number | null
          sort_order: number
          text: string
          type: string
          updated_at?: string | null
        }
        Update: {
          accepted_file_types?: string[] | null
          conditional_on?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          file_description?: string | null
          help_content?: Json | null
          id?: string
          max_file_size?: number | null
          max_files?: number | null
          max_length?: number | null
          min_length?: number | null
          options?: Json | null
          placeholder?: string | null
          question_key?: string
          required?: boolean | null
          section_id?: number | null
          sort_order?: number
          text?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_sections: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          estimated_minutes: number | null
          id: number
          key: string
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          estimated_minutes?: number | null
          id?: number
          key: string
          sort_order: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          estimated_minutes?: number | null
          id?: number
          key?: string
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ai_cost_summary: {
        Row: {
          avg_duration_ms: number | null
          client_id: string | null
          date: string | null
          execution_count: number | null
          model_id: string | null
          total_cost_usd: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_executions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      count_journal_entries: { Args: never; Returns: number }
      generate_client_code: { Args: never; Returns: string }
      match_framework_chunks:
        | {
            Args: {
              match_count: number
              match_threshold: number
              query_embedding: string
            }
            Returns: {
              content: string
              framework_id: string
              id: number
              similarity: number
            }[]
          }
        | {
            Args: {
              match_count: number
              match_threshold: number
              query_embedding: string
            }
            Returns: {
              content: string
              framework_id: string
              id: number
              similarity: number
            }[]
          }
      remove_client_from_journal_mentions: {
        Args: { p_client_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
