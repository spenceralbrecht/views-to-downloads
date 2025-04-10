export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      apps: {
        Row: {
          app_description: string | null
          app_logo_url: string | null
          app_name: string | null
          app_store_url: string | null
          created_at: string
          id: string
          is_manual: boolean | null
          owner_id: string | null
        }
        Insert: {
          app_description?: string | null
          app_logo_url?: string | null
          app_name?: string | null
          app_store_url?: string | null
          created_at?: string
          id?: string
          is_manual?: boolean | null
          owner_id?: string | null
        }
        Update: {
          app_description?: string | null
          app_logo_url?: string | null
          app_name?: string | null
          app_store_url?: string | null
          created_at?: string
          id?: string
          is_manual?: boolean | null
          owner_id?: string | null
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          display_name: string | null
          id: string
          metadata: Json | null
          profile_picture: string | null
          provider: string
          provider_account_id: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          metadata?: Json | null
          profile_picture?: string | null
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          metadata?: Json | null
          profile_picture?: string | null
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      formats: {
        Row: {
          created_at: string
          difficulty: string
          examples: Json
          how_it_works: string
          id: string
          name: string
          requires: Json
        }
        Insert: {
          created_at?: string
          difficulty: string
          examples: Json
          how_it_works: string
          id?: string
          name: string
          requires: Json
        }
        Update: {
          created_at?: string
          difficulty?: string
          examples?: Json
          how_it_works?: string
          id?: string
          name?: string
          requires?: Json
        }
        Relationships: []
      }
      generated_influencers: {
        Row: {
          age: string | null
          created_at: string | null
          emotion: string | null
          ethnicity: string | null
          gender: string | null
          id: string
          image_url: string
          location: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          age?: string | null
          created_at?: string | null
          emotion?: string | null
          ethnicity?: string | null
          gender?: string | null
          id?: string
          image_url: string
          location?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          age?: string | null
          created_at?: string | null
          emotion?: string | null
          ethnicity?: string | null
          gender?: string | null
          id?: string
          image_url?: string
          location?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hooks: {
        Row: {
          app_id: string | null
          created_at: string
          hook_text: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          hook_text?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string
          hook_text?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hooks_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_vid_tags: {
        Row: {
          id: string
          influencer_vid_id: string | null
          tag_id: string | null
        }
        Insert: {
          id?: string
          influencer_vid_id?: string | null
          tag_id?: string | null
        }
        Update: {
          id?: string
          influencer_vid_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_vid_tags_influencer_vid_id_fkey"
            columns: ["influencer_vid_id"]
            isOneToOne: false
            referencedRelation: "influencer_vids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_vid_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_vids: {
        Row: {
          created_at: string | null
          id: string
          thumbnail_url: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          thumbnail_url: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          thumbnail_url?: string
          video_url?: string
        }
        Relationships: []
      }
      input_content: {
        Row: {
          app_id: string | null
          content_url: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          app_id?: string | null
          content_url?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          app_id?: string | null
          content_url?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "input_content_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      output_content: {
        Row: {
          app_id: string | null
          created_at: string
          id: string
          published: string | null
          published_url: string | null
          status: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          id?: string
          published?: string | null
          published_url?: string | null
          status?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string
          id?: string
          published?: string | null
          published_url?: string | null
          status?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          content_reset_date: string
          content_used_this_month: number
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_reset_date?: string
          content_used_this_month?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_reset_date?: string
          content_used_this_month?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_videos_with_all_tags: {
        Args: { tag_ids: string[] }
        Returns: {
          created_at: string | null
          id: string
          thumbnail_url: string
          video_url: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
