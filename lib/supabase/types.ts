export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      locations: {
        Row: {
          address: string | null;
          created_at: string | null;
          google_account_id: string;
          google_location_id: string;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string | null;
          voice_profile_id: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          google_account_id: string;
          google_location_id: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id?: string | null;
          voice_profile_id?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          google_account_id?: string;
          google_location_id?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string | null;
          voice_profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "locations_voice_profile_id_fkey";
            columns: ["voice_profile_id"];
            isOneToOne: false;
            referencedRelation: "voice_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          created_at: string | null;
          email_enabled: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          plan_tier: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          plan_tier?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          plan_tier?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          created_at: string | null;
          edited_text: string | null;
          final_text: string | null;
          generated_text: string;
          id: string;
          published_at: string | null;
          review_id: string | null;
          status: string | null;
          tokens_used: number | null;
        };
        Insert: {
          created_at?: string | null;
          edited_text?: string | null;
          final_text?: string | null;
          generated_text: string;
          id?: string;
          published_at?: string | null;
          review_id?: string | null;
          status?: string | null;
          tokens_used?: number | null;
        };
        Update: {
          created_at?: string | null;
          edited_text?: string | null;
          final_text?: string | null;
          generated_text?: string;
          id?: string;
          published_at?: string | null;
          review_id?: string | null;
          status?: string | null;
          tokens_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "responses_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          created_at: string | null;
          external_review_id: string;
          has_response: boolean | null;
          id: string;
          location_id: string | null;
          platform: string | null;
          rating: number | null;
          review_date: string | null;
          review_text: string | null;
          reviewer_name: string | null;
          reviewer_photo_url: string | null;
          sentiment: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          external_review_id: string;
          has_response?: boolean | null;
          id?: string;
          location_id?: string | null;
          platform?: string | null;
          rating?: number | null;
          review_date?: string | null;
          review_text?: string | null;
          reviewer_name?: string | null;
          reviewer_photo_url?: string | null;
          sentiment?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          external_review_id?: string;
          has_response?: boolean | null;
          id?: string;
          location_id?: string | null;
          platform?: string | null;
          rating?: number | null;
          review_date?: string | null;
          review_text?: string | null;
          reviewer_name?: string | null;
          reviewer_photo_url?: string | null;
          sentiment?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          google_refresh_token: string | null;
          id: string;
          name: string | null;
          organization_id: string | null;
          role: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          google_refresh_token?: string | null;
          id: string;
          name?: string | null;
          organization_id?: string | null;
          role?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          google_refresh_token?: string | null;
          id?: string;
          name?: string | null;
          organization_id?: string | null;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      voice_profiles: {
        Row: {
          created_at: string | null;
          example_responses: string[] | null;
          id: string;
          max_length: number | null;
          name: string | null;
          organization_id: string | null;
          personality_notes: string | null;
          sign_off_style: string | null;
          tone: string | null;
          words_to_avoid: string[] | null;
          words_to_use: string[] | null;
        };
        Insert: {
          created_at?: string | null;
          example_responses?: string[] | null;
          id?: string;
          max_length?: number | null;
          name?: string | null;
          organization_id?: string | null;
          personality_notes?: string | null;
          sign_off_style?: string | null;
          tone?: string | null;
          words_to_avoid?: string[] | null;
          words_to_use?: string[] | null;
        };
        Update: {
          created_at?: string | null;
          example_responses?: string[] | null;
          id?: string;
          max_length?: number | null;
          name?: string | null;
          organization_id?: string | null;
          personality_notes?: string | null;
          sign_off_style?: string | null;
          tone?: string | null;
          words_to_avoid?: string[] | null;
          words_to_use?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "voice_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_tones: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          description: string;
          enhanced_context: string | null;
          quiz_responses: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          name: string;
          description: string;
          enhanced_context?: string | null;
          quiz_responses?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          name?: string;
          description?: string;
          enhanced_context?: string | null;
          quiz_responses?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "custom_tones_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      cron_poll_state: {
        Row: {
          tier: string;
          last_processed_at: string;
          updated_at: string | null;
        };
        Insert: {
          tier: string;
          last_processed_at: string;
          updated_at?: string | null;
        };
        Update: {
          tier?: string;
          last_processed_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// Type aliases for convenience
export type Review = Tables<"reviews">;
export type ReviewInsert = TablesInsert<"reviews">;
export type VoiceProfile = Tables<"voice_profiles">;
export type VoiceProfileInsert = TablesInsert<"voice_profiles">;
export type Location = Tables<"locations">;
export type LocationInsert = TablesInsert<"locations">;
export type User = Tables<"users">;
export type UserInsert = TablesInsert<"users">;
export type Organization = Tables<"organizations">;
export type OrganizationInsert = TablesInsert<"organizations">;
export type Response = Tables<"responses">;
export type ResponseInsert = TablesInsert<"responses">;
