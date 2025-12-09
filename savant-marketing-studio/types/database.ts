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
      clients: {
        Row: {
          brand_data: Json | null
          created_at: string | null
          email: string | null
          id: string
          intake_responses: Json | null
          name: string
          questionnaire_completed_at: string | null
          questionnaire_progress: Json | null
          questionnaire_status: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          brand_data?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          intake_responses?: Json | null
          name: string
          questionnaire_completed_at?: string | null
          questionnaire_progress?: Json | null
          questionnaire_status?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          brand_data?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          intake_responses?: Json | null
          name?: string
          questionnaire_completed_at?: string | null
          questionnaire_progress?: Json | null
          questionnaire_status?: string | null
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
          id: string
          linked_id: string | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          linked_id?: string | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          linked_id?: string | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          attachments: Json | null
          chat_id: string | null
          content: string
          converted_to_content_id: string | null
          created_at: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_framework_chunks: {
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
