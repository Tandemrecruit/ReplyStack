/**
 * Database types for Supabase.
 *
 * This file should be regenerated when the database schema changes using:
 * npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
 *
 * For now, we define the types manually based on ARCHITECTURE.md
 */

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan_tier: string;
          trial_ends_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: string;
          trial_ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: string;
          trial_ends_at?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string | null;
          email: string;
          name: string | null;
          role: string;
          google_refresh_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          email: string;
          name?: string | null;
          role?: string;
          google_refresh_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          email?: string;
          name?: string | null;
          role?: string;
          google_refresh_token?: string | null;
          created_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          user_id: string;
          email_enabled: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          email_enabled?: boolean;
          created_at?: string;
        };
      };
      voice_profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          tone: string;
          personality_notes: string | null;
          example_responses: string[] | null;
          sign_off_style: string | null;
          words_to_use: string[] | null;
          words_to_avoid: string[] | null;
          max_length: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          name?: string;
          tone?: string;
          personality_notes?: string | null;
          example_responses?: string[] | null;
          sign_off_style?: string | null;
          words_to_use?: string[] | null;
          words_to_avoid?: string[] | null;
          max_length?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          name?: string;
          tone?: string;
          personality_notes?: string | null;
          example_responses?: string[] | null;
          sign_off_style?: string | null;
          words_to_use?: string[] | null;
          words_to_avoid?: string[] | null;
          max_length?: number;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          organization_id: string | null;
          google_account_id: string;
          google_location_id: string;
          name: string;
          address: string | null;
          is_active: boolean;
          voice_profile_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          google_account_id: string;
          google_location_id: string;
          name: string;
          address?: string | null;
          is_active?: boolean;
          voice_profile_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          google_account_id?: string;
          google_location_id?: string;
          name?: string;
          address?: string | null;
          is_active?: boolean;
          voice_profile_id?: string | null;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          location_id: string | null;
          platform: string;
          external_review_id: string;
          reviewer_name: string | null;
          reviewer_photo_url: string | null;
          rating: number | null;
          review_text: string | null;
          review_date: string | null;
          has_response: boolean;
          status: string;
          sentiment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id?: string | null;
          platform?: string;
          external_review_id: string;
          reviewer_name?: string | null;
          reviewer_photo_url?: string | null;
          rating?: number | null;
          review_text?: string | null;
          review_date?: string | null;
          has_response?: boolean;
          status?: string;
          sentiment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string | null;
          platform?: string;
          external_review_id?: string;
          reviewer_name?: string | null;
          reviewer_photo_url?: string | null;
          rating?: number | null;
          review_text?: string | null;
          review_date?: string | null;
          has_response?: boolean;
          status?: string;
          sentiment?: string | null;
          created_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          review_id: string | null;
          generated_text: string;
          edited_text: string | null;
          final_text: string | null;
          status: string;
          published_at: string | null;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id?: string | null;
          generated_text: string;
          edited_text?: string | null;
          final_text?: string | null;
          status?: string;
          published_at?: string | null;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string | null;
          generated_text?: string;
          edited_text?: string | null;
          final_text?: string | null;
          status?: string;
          published_at?: string | null;
          tokens_used?: number | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper types for easier access
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type VoiceProfile =
  Database["public"]["Tables"]["voice_profiles"]["Row"];
export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Response = Database["public"]["Tables"]["responses"]["Row"];

// Insert types
export type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type VoiceProfileInsert =
  Database["public"]["Tables"]["voice_profiles"]["Insert"];
export type LocationInsert =
  Database["public"]["Tables"]["locations"]["Insert"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ResponseInsert =
  Database["public"]["Tables"]["responses"]["Insert"];

// Update types
export type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type VoiceProfileUpdate =
  Database["public"]["Tables"]["voice_profiles"]["Update"];
export type LocationUpdate =
  Database["public"]["Tables"]["locations"]["Update"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];
export type ResponseUpdate =
  Database["public"]["Tables"]["responses"]["Update"];
