/**
 * Supabase Client & Telemetry Sync Service
 * Safe initialization guard with defensive env checks.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface WorkoutSessionPayload {
  id?: string; user_id?: string; title?: string; duration?: string; duration_seconds?: number;
  strain?: number; tonnage_kg?: number; total_sets?: number; exercises?: any; created_at?: string; [key: string]: any;
}

export interface AthleteProfile {
  id: string; handle?: string; full_name?: string; bio?: string; avatar_url?: string; settings?: Record<string, any>; updated_at?: string;
}

function getSafeEnv(key: string): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) return (import.meta as any).env[key];
    if (typeof process !== 'undefined' && process?.env?.[key]) return process.env[key]!;
  } catch {}
  return '';
}

const envUrl = getSafeEnv('VITE_SUPABASE_URL');
const envKey = getSafeEnv('VITE_SUPABASE_ANON_KEY');
const hasValidConfig = Boolean(envUrl && envUrl.startsWith('http') && envKey);

if (!hasValidConfig && typeof window !== 'undefined') {
  console.warn('[Supabase Config] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Safe fallback active.');
}

const SUPABASE_URL = hasValidConfig ? envUrl : 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = hasValidConfig ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

type ExtendedSupabaseClient = SupabaseClient & {
  insert: (table: string, payload: any) => Promise<{ data: any; error: any }>;
  selectOne: (table: string, queryParam: string) => Promise<{ data: any; error: any }>;
};

let rawClient: SupabaseClient;
try {
  rawClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: typeof window !== 'undefined', autoRefreshToken: true },
  });
} catch (e) {
  console.warn('[Supabase Safe Guard] Fallback client active:', e);
  rawClient = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }), limit: async () => ({ data: [], error: null }) }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  } as unknown as SupabaseClient;
}

export const supabase: ExtendedSupabaseClient = Object.assign(rawClient, {
  insert: async (table: string, payload: any) => {
    try {
      const { data, error } = await rawClient.from(table).insert(payload).select();
      return { data, error };
    } catch (err) { return { data: null, error: err }; }
  },
  selectOne: async (table: string, queryParam: string) => {
    try {
      const { data, error } = await rawClient.from(table).select('*').limit(1);
      return { data: data?.[0] || null, error };
    } catch (err) { return { data: null, error: err }; }
  },
});

export async function syncSessionToSupabase(sessionData: WorkoutSessionPayload): Promise<boolean> {
  try {
    const userId = sessionData.user_id || (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_id')) || 'default-athlete';
    const durationMins = parseInt(sessionData.duration?.replace('m', '') || '45', 10);
    const durationSeconds = sessionData.duration_seconds || durationMins * 60;
    const tonnage = sessionData.tonnage_kg ?? sessionData.tonnageKg ?? 0;
    const totalSets = sessionData.total_sets ?? sessionData.totalSets ?? 0;
    const nowIso = new Date().toISOString();
    const sessionTitle = sessionData.title || 'Gym Protocol';

    const completedSessionPayload = {
      id: sessionData.id || `session-${Date.now()}`, user_id: userId, client_id: userId, title: sessionTitle,
      session_name: sessionTitle, duration_seconds: durationSeconds, tonnage_kg: tonnage, volume_kg: tonnage,
      total_sets: totalSets, strain: sessionData.strain || 14.5, completed_at: nowIso, created_at: nowIso,
    };

    await supabase.from('completed_sessions').insert([completedSessionPayload]);
    if (Array.isArray(sessionData.exercises) && sessionData.exercises.length > 0) {
      const logRows = sessionData.exercises.flatMap((ex: any) => {
        const setsCount = Number(ex.sets?.length || ex.sets || 1);
        return Array.from({ length: setsCount }, (_, sIdx) => ({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, user_id: userId,
          session_id: completedSessionPayload.id, exercise_name: ex.name || 'Exercise', set_number: sIdx + 1,
          reps: Number(ex.reps || 10), weight_kg: Number(ex.weightKg || ex.weight || 0), rpe: Number(ex.rpe || 8.5), created_at: new Date().toISOString(),
        }));
      });
      await supabase.from('workout_logs').insert(logRows);
    }
    await supabase.from('workout_sessions').insert([{ ...completedSessionPayload, exercises: sessionData.exercises || [] }]);
    return true;
  } catch (err) {
    console.error('[Supabase] Exception while archiving session:', err);
    return false;
  }
}

export async function fetchAthleteProfile(userId: string = 'default-athlete'): Promise<AthleteProfile | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return error ? null : (data as AthleteProfile | null);
  } catch { return null; }
}
