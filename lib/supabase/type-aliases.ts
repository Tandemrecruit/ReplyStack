/**
 * Type aliases for convenience.
 * These extract commonly used types from the generated Database type.
 * This file is NOT auto-generated and can be safely edited.
 */

import type { Database } from "./types";

// Review types
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

// Voice Profile types
export type VoiceProfile =
  Database["public"]["Tables"]["voice_profiles"]["Row"];
export type VoiceProfileInsert =
  Database["public"]["Tables"]["voice_profiles"]["Insert"];
export type VoiceProfileUpdate =
  Database["public"]["Tables"]["voice_profiles"]["Update"];

// Location types
export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type LocationInsert =
  Database["public"]["Tables"]["locations"]["Insert"];
export type LocationUpdate =
  Database["public"]["Tables"]["locations"]["Update"];

// User types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

// Organization types
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];
export type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

// Response types
export type Response = Database["public"]["Tables"]["responses"]["Row"];
export type ResponseInsert =
  Database["public"]["Tables"]["responses"]["Insert"];
export type ResponseUpdate =
  Database["public"]["Tables"]["responses"]["Update"];
