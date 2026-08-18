import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as jose from 'jose';
import { SPORTS_DATA, INITIAL_ATHLETES, INITIAL_ASSESSMENTS, INITIAL_SCOUT_NOTES } from '../data/mockDatabase';
import { Sport, AthleteProfile, Assessment, ScoutNote, LeaderboardItem } from '../types';

export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  // Handle dashboard URLs: https://supabase.com/dashboard/project/<project_id>
  const match = trimmed.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }
  return trimmed;
}

let supabaseServerClient: SupabaseClient | null = null;
let jwksClient: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  if (!supabaseServerClient) {
    supabaseServerClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseServerClient;
}

/**
 * RESTful Query: Sports & Standardized Drills Catalog
 * Calls Supabase REST API `GET /rest/v1/sports?select=*`
 */
export async function querySportsFromSupabase(): Promise<Sport[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return SPORTS_DATA;
  }

  try {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Sport[];
    }

    // Auto-seed sports catalog into Supabase RESTful table if empty
    if (!error && (!data || data.length === 0)) {
      const { error: seedError } = await supabase.from('sports').upsert(SPORTS_DATA);
      if (!seedError) {
        return SPORTS_DATA;
      }
    }
  } catch (err) {
    console.warn('Supabase REST query for sports failed, falling back:', (err as Error).message);
  }

  return SPORTS_DATA;
}

/**
 * RESTful Query: Athlete Profiles with Multi-Criteria Filters
 * Calls Supabase REST API `GET /rest/v1/athlete_profiles`
 */
export async function queryAthletesFromSupabase(filters?: {
  sport?: string;
  position?: string;
  min_score?: number;
  search?: string;
}): Promise<AthleteProfile[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    let list = [...INITIAL_ATHLETES];
    if (filters?.sport && filters.sport !== 'all') {
      list = list.filter(a => a.sport.toLowerCase() === filters.sport?.toLowerCase());
    }
    if (filters?.position && filters.position !== 'all') {
      list = list.filter(a => a.position.toLowerCase().includes(filters.position!.toLowerCase()));
    }
    if (filters?.min_score) {
      list = list.filter(a => (a.overall_rating || 0) >= filters.min_score!);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
    }
    return list;
  }

  try {
    let query = supabase
      .from('athlete_profiles')
      .select('*')
      .order('overall_rating', { ascending: false });

    if (filters?.sport && filters.sport !== 'all') {
      query = query.ilike('sport', filters.sport);
    }
    if (filters?.position && filters.position !== 'all') {
      query = query.ilike('position', `%${filters.position}%`);
    }
    if (filters?.min_score) {
      query = query.gte('overall_rating', filters.min_score);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%,sport.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as AthleteProfile[];
    }

    // If table is newly created and empty, seed baseline records
    if (!error && (!data || data.length === 0)) {
      await supabase.from('athlete_profiles').upsert(INITIAL_ATHLETES);
      return INITIAL_ATHLETES;
    }
  } catch (err) {
    console.warn('Supabase REST query for athletes failed:', (err as Error).message);
  }

  return INITIAL_ATHLETES;
}

/**
 * RESTful Query: Single Athlete Profile by ID or User ID
 * Calls Supabase REST API `GET /rest/v1/athlete_profiles?id=eq.<id>`
 */
export async function queryAthleteByIdFromSupabase(id: string): Promise<AthleteProfile | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return INITIAL_ATHLETES.find(a => a.id === id || a.user_id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as AthleteProfile;
    }
  } catch (err) {
    console.warn('Supabase REST query for athlete by id failed:', (err as Error).message);
  }

  return INITIAL_ATHLETES.find(a => a.id === id || a.user_id === id) || null;
}

/**
 * RESTful Mutation: Upsert Athlete Profile in Supabase
 * Calls Supabase REST API `POST /rest/v1/athlete_profiles` (upsert)
 */
export async function upsertAthleteProfileInSupabase(profile: Partial<AthleteProfile>): Promise<AthleteProfile | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return profile as AthleteProfile;
  }

  try {
    const { data, error } = await supabase
      .from('athlete_profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!error && data) {
      return data as AthleteProfile;
    }
  } catch (err) {
    console.error('Supabase REST upsert athlete profile error:', (err as Error).message);
  }

  return profile as AthleteProfile;
}

/**
 * RESTful Query: Drill Assessments
 * Calls Supabase REST API `GET /rest/v1/assessments`
 */
export async function queryAssessmentsFromSupabase(filters?: {
  athlete_id?: string;
  sport?: string;
  status?: string;
}): Promise<Assessment[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    let list = [...INITIAL_ASSESSMENTS];
    if (filters?.athlete_id) list = list.filter(a => a.athlete_id === filters.athlete_id);
    if (filters?.sport && filters.sport !== 'all') list = list.filter(a => a.sport.toLowerCase() === filters.sport?.toLowerCase());
    if (filters?.status) list = list.filter(a => a.status === filters.status);
    return list;
  }

  try {
    let query = supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.athlete_id) query = query.eq('athlete_id', filters.athlete_id);
    if (filters?.sport && filters.sport !== 'all') query = query.ilike('sport', filters.sport);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as Assessment[];
    }

    if (!error && (!data || data.length === 0)) {
      await supabase.from('assessments').upsert(INITIAL_ASSESSMENTS);
      return INITIAL_ASSESSMENTS;
    }
  } catch (err) {
    console.warn('Supabase REST query for assessments failed:', (err as Error).message);
  }

  return INITIAL_ASSESSMENTS;
}

/**
 * RESTful Mutation: Create/Insert Assessment in Supabase
 * Calls Supabase REST API `POST /rest/v1/assessments`
 */
export async function insertAssessmentInSupabase(assessment: Assessment): Promise<Assessment> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return assessment;
  }

  try {
    const { data, error } = await supabase
      .from('assessments')
      .insert(assessment)
      .select()
      .single();

    if (!error && data) {
      // Recalculate athlete's overall rating after new assessment
      await recalculateAthleteRatingInSupabase(assessment.athlete_id);
      return data as Assessment;
    }
  } catch (err) {
    console.error('Supabase REST insert assessment error:', (err as Error).message);
  }

  return assessment;
}

/**
 * Recalculate and update athlete's overall rating in Supabase RESTful table
 * Computes the exact arithmetic mean of completed drill assessment scores
 */
export async function recalculateAthleteRatingInSupabase(athleteId: string): Promise<number | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('overall_score')
      .eq('athlete_id', athleteId)
      .eq('status', 'completed')
      .not('overall_score', 'is', null);

    if (assessments && assessments.length > 0) {
      const sum = assessments.reduce((acc, curr) => acc + (Number(curr.overall_score) || 0), 0);
      const avg = Number((sum / assessments.length).toFixed(1));
      await supabase
        .from('athlete_profiles')
        .update({
          overall_rating: avg,
          total_assessments: assessments.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', athleteId);
      return avg;
    }
  } catch (err) {
    console.warn('Recalculate rating error in Supabase:', (err as Error).message);
  }

  return null;
}

/**
 * RESTful Query: Leaderboard Rankings
 * Queries aggregated scores from Supabase assessments and profiles
 */
export async function queryLeaderboardFromSupabase(sport?: string): Promise<LeaderboardItem[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('assessments')
      .select('id, athlete_id, athlete_name, athlete_avatar, sport, assessment_name, overall_score, tier, created_at')
      .eq('status', 'completed')
      .not('overall_score', 'is', null)
      .order('overall_score', { ascending: false })
      .limit(50);

    if (sport && sport !== 'all') {
      query = query.ilike('sport', sport);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((item, index) => ({
        rank: index + 1,
        athlete_id: item.athlete_id,
        display_name: item.athlete_name || 'Athlete',
        avatar_url: item.athlete_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        sport: item.sport,
        assessment_type: item.assessment_name,
        score: item.overall_score,
        age: 18,
        location: 'Verified Platform Talent',
        verified: true,
        tier: item.tier || 'Scouted',
        recorded_at: item.created_at
      }));
    }
  } catch (err) {
    console.warn('Leaderboard Supabase query failed:', (err as Error).message);
  }

  return [];
}

/**
 * RESTful Query: Scout Notes
 * Calls Supabase REST API `GET /rest/v1/scout_notes`
 */
export async function queryScoutNotesFromSupabase(athleteId: string): Promise<ScoutNote[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return INITIAL_SCOUT_NOTES.filter(n => n.athlete_id === athleteId);
  }

  try {
    const { data, error } = await supabase
      .from('scout_notes')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as ScoutNote[];
    }
  } catch (err) {
    console.warn('Scout notes Supabase query error:', (err as Error).message);
  }

  return INITIAL_SCOUT_NOTES.filter(n => n.athlete_id === athleteId);
}

/**
 * RESTful Mutation: Create Scout Note
 * Calls Supabase REST API `POST /rest/v1/scout_notes`
 */
export async function insertScoutNoteInSupabase(note: ScoutNote): Promise<ScoutNote> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return note;
  }

  try {
    const { data, error } = await supabase
      .from('scout_notes')
      .insert(note)
      .select()
      .single();

    if (!error && data) {
      return data as ScoutNote;
    }
  } catch (err) {
    console.error('Insert scout note in Supabase error:', (err as Error).message);
  }

  return note;
}

/**
 * Verify a real Supabase access token.
 * Uses modern Supabase JWKS endpoint: https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
 * Or falls back to supabase.auth.getUser(token) if JWKS is unavailable.
 */
export async function verifySupabaseToken(token: string): Promise<{ userId: string; email?: string; role?: string } | null> {
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);

  // 1. Try JWKS verification (modern signature verification without needing shared secret)
  if (supabaseUrl) {
    try {
      if (!jwksClient) {
        const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
        jwksClient = jose.createRemoteJWKSet(jwksUrl);
      }

      const { payload } = await jose.jwtVerify(token, jwksClient, {
        issuer: `${supabaseUrl}/auth/v1`
      });

      if (payload && payload.sub) {
        return {
          userId: payload.sub as string,
          email: payload.email as string | undefined,
          role: (payload.user_metadata as any)?.role || (payload.role as string) || 'athlete'
        };
      }
    } catch (jwksErr) {
      // If JWKS verify had a network/header mismatch, fallback to Supabase SDK getUser
      console.warn('JWKS token verify attempt:', (jwksErr as Error).message);
    }
  }

  // 2. Fallback to Supabase server client getUser
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        return {
          userId: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'athlete'
        };
      }
    } catch (err) {
      console.error('Supabase getUser error:', err);
    }
  }

  return null;
}

/**
 * Ensure the videos storage bucket exists in Supabase Storage.
 */
export async function ensureStorageBucket(bucketName = 'assessment-videos'): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Error listing Supabase storage buckets:', error.message);
      return false;
    }

    const exists = buckets?.some(b => b.name === bucketName);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 104857600 // 100MB
      });
      if (createError) {
        console.error('Error creating storage bucket:', createError.message);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error('Exception verifying storage bucket:', e);
    return false;
  }
}
