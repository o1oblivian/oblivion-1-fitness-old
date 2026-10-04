/**
 * Re-export and safe initialization guard for Supabase client
 * Strict File Ceiling: < 140 lines
 */
export { supabase, syncSessionToSupabase, fetchAthleteProfile } from '../services/supabaseClient';
export type { WorkoutSessionPayload, AthleteProfile } from '../services/supabaseClient';
