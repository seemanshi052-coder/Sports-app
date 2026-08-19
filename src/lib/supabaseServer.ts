import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as jose from 'jose';
import {
  SPORTS_DATA,
  INITIAL_ATHLETES,
  INITIAL_ASSESSMENTS,
  INITIAL_SCOUT_NOTES,
  INITIAL_ACHIEVEMENTS,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_POST_COMMENTS,
  INITIAL_OPPORTUNITIES
} from '../data/mockDatabase';
import {
  Sport,
  AthleteProfile,
  Assessment,
  ScoutNote,
  LeaderboardItem,
  Achievement,
  CommunityPost,
  PostLike,
  PostComment,
  CommunityReport,
  Opportunity,
  SavedOpportunity
} from '../types';

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

export const MAX_STORAGE_FILE_SIZE_MB = 50;
export const MAX_STORAGE_FILE_SIZE_BYTES = MAX_STORAGE_FILE_SIZE_MB * 1024 * 1024; // 52,428,800 bytes
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/avi',
  'video/mpeg'
];

export interface StorageValidationResult {
  valid: boolean;
  error?: string;
  maxSizeBytes: number;
  maxSizeMB: number;
  currentSizeBytes?: number;
  currentSizeMB?: number;
}

/**
 * Validate video file size prior to bucket upload operations.
 */
export function validateVideoFileSize(fileSizeBytes: number): StorageValidationResult {
  const currentSizeMB = Number((fileSizeBytes / (1024 * 1024)).toFixed(2));
  if (fileSizeBytes > MAX_STORAGE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${currentSizeMB} MB) exceeds the maximum allowed limit of ${MAX_STORAGE_FILE_SIZE_MB} MB. Please trim or compress the video before uploading.`,
      maxSizeBytes: MAX_STORAGE_FILE_SIZE_BYTES,
      maxSizeMB: MAX_STORAGE_FILE_SIZE_MB,
      currentSizeBytes: fileSizeBytes,
      currentSizeMB
    };
  }
  return {
    valid: true,
    maxSizeBytes: MAX_STORAGE_FILE_SIZE_BYTES,
    maxSizeMB: MAX_STORAGE_FILE_SIZE_MB,
    currentSizeBytes: fileSizeBytes,
    currentSizeMB
  };
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
      console.warn('Supabase storage list buckets notice:', error.message);
      return false;
    }

    const exists = buckets?.some(b => b.name === bucketName);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      if (createError) {
        // If already exists or size limit notice, log informative warning without breaking
        console.warn('Storage bucket initialization notice:', createError.message);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.warn('Exception checking storage bucket:', (e as Error).message);
    return false;
  }
}

/**
 * RESTful Query: Athlete Achievements & Verification Records
 */
export async function queryAchievementsFromSupabase(filters?: {
  athlete_id?: string;
  verification_status?: string;
}): Promise<Achievement[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    let list = [...INITIAL_ACHIEVEMENTS];
    if (filters?.athlete_id) list = list.filter(a => a.athlete_id === filters.athlete_id);
    if (filters?.verification_status) list = list.filter(a => a.verification_status === filters.verification_status);
    return list;
  }

  try {
    let query = supabase
      .from('achievements')
      .select('*')
      .order('date_achieved', { ascending: false });

    if (filters?.athlete_id) query = query.eq('athlete_id', filters.athlete_id);
    if (filters?.verification_status) query = query.eq('verification_status', filters.verification_status);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as Achievement[];
    }

    if (!error && (!data || data.length === 0)) {
      await supabase.from('achievements').upsert(INITIAL_ACHIEVEMENTS);
      return INITIAL_ACHIEVEMENTS;
    }
  } catch (err) {
    console.warn('Supabase REST query for achievements failed:', (err as Error).message);
  }

  return INITIAL_ACHIEVEMENTS;
}

/**
 * RESTful Mutation: Create/Insert Athlete Achievement
 */
export async function insertAchievementInSupabase(achievement: Achievement): Promise<Achievement> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    INITIAL_ACHIEVEMENTS.unshift(achievement);
    return achievement;
  }

  try {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievement)
      .select()
      .single();

    if (!error && data) {
      return data as Achievement;
    }
  } catch (err) {
    console.error('Supabase REST insert achievement error:', (err as Error).message);
  }

  INITIAL_ACHIEVEMENTS.unshift(achievement);
  return achievement;
}

// In-Memory fallback stores for Community & Opportunities
export let postsStore: CommunityPost[] = [...INITIAL_COMMUNITY_POSTS];
export let commentsStore: PostComment[] = [...INITIAL_POST_COMMENTS];
export let likesStore: PostLike[] = [
  { id: 'like_1', post_id: 'post_2', user_id: 'user_ath_1', created_at: '2026-08-17T17:00:00Z' }
];
export let reportsStore: CommunityReport[] = [];
export let opportunitiesStore: Opportunity[] = [...INITIAL_OPPORTUNITIES];
export let savedOpportunitiesStore: SavedOpportunity[] = [
  { id: 'saved_1', user_id: 'user_ath_1', opportunity_id: 'opp_1', created_at: '2026-08-18T08:00:00Z' }
];

/**
 * Query Community Posts with optional filters and pagination
 */
export async function queryCommunityPostsFromSupabase(filters?: {
  post_type?: string;
  sport?: string;
  author_id?: string;
  page?: number;
  limit?: number;
  current_user_id?: string;
}): Promise<{ posts: CommunityPost[]; total: number; page: number; limit: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const currentUserId = filters?.current_user_id;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase
        .from('community_posts')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (filters?.post_type && filters.post_type !== 'ALL') {
        query = query.eq('post_type', filters.post_type);
      }
      if (filters?.sport && filters.sport !== 'all') {
        query = query.eq('sport', filters.sport);
      }
      if (filters?.author_id) {
        query = query.eq('author_id', filters.author_id);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (!error && data) {
        // Query user likes to annotate liked_by_current_user
        let userLikes = new Set<string>();
        if (currentUserId) {
          const { data: likesData } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', currentUserId);
          if (likesData) {
            likesData.forEach(l => userLikes.add(l.post_id));
          }
        }

        const enriched = (data as CommunityPost[]).map(p => ({
          ...p,
          liked_by_current_user: currentUserId ? userLikes.has(p.id) : false
        }));

        return {
          posts: enriched,
          total: count || enriched.length,
          page,
          limit
        };
      }
    } catch (e) {
      console.warn('Supabase community posts query error, falling back:', (e as Error).message);
    }
  }

  // Fallback to in-memory posts
  let filtered = postsStore.filter(p => !p.is_deleted && !p.is_hidden);
  if (filters?.post_type && filters.post_type !== 'ALL') {
    filtered = filtered.filter(p => p.post_type === filters.post_type);
  }
  if (filters?.sport && filters.sport !== 'all') {
    filtered = filtered.filter(p => p.sport === filters.sport);
  }
  if (filters?.author_id) {
    filtered = filtered.filter(p => p.author_id === filters.author_id);
  }

  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const total = filtered.length;
  const startIdx = (page - 1) * limit;
  const paginated = filtered.slice(startIdx, startIdx + limit);

  const enriched = paginated.map(p => {
    const isLiked = currentUserId
      ? likesStore.some(l => l.post_id === p.id && l.user_id === currentUserId)
      : !!p.liked_by_current_user;
    return {
      ...p,
      liked_by_current_user: isLiked
    };
  });

  return {
    posts: enriched,
    total,
    page,
    limit
  };
}

/**
 * Insert new Community Post
 */
export async function insertCommunityPostInSupabase(post: CommunityPost): Promise<CommunityPost> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert(post)
        .select()
        .single();
      if (!error && data) {
        postsStore.unshift(data as CommunityPost);
        return data as CommunityPost;
      }
    } catch (e) {
      console.warn('Supabase post insert fallback:', (e as Error).message);
    }
  }

  postsStore.unshift(post);
  return post;
}

/**
 * Delete Community Post (Soft delete / ownership enforced)
 */
export async function deleteCommunityPostInSupabase(postId: string, userId: string, isAdmin = false): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase.from('community_posts').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', postId);
      if (!isAdmin) {
        query = query.eq('author_id', userId);
      }
      const { error } = await query;
      if (!error) {
        const local = postsStore.find(p => p.id === postId);
        if (local) local.is_deleted = true;
        return true;
      }
    } catch (e) {
      console.warn('Supabase post delete fallback:', (e as Error).message);
    }
  }

  const post = postsStore.find(p => p.id === postId);
  if (!post) return false;
  if (!isAdmin && post.author_id !== userId) return false;
  post.is_deleted = true;
  return true;
}

/**
 * Toggle Like on Post
 */
export async function togglePostLikeInSupabase(postId: string, userId: string): Promise<{ liked: boolean; like_count: number }> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      // Check existing like
      const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Unlike
        await supabase.from('post_likes').delete().eq('id', existing.id);
        const { data: postData } = await supabase.from('community_posts').select('like_count').eq('id', postId).single();
        const newCount = Math.max(0, (postData?.like_count || 1) - 1);
        await supabase.from('community_posts').update({ like_count: newCount }).eq('id', postId);
        return { liked: false, like_count: newCount };
      } else {
        // Like
        await supabase.from('post_likes').insert({
          id: `like_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        });
        const { data: postData } = await supabase.from('community_posts').select('like_count').eq('id', postId).single();
        const newCount = (postData?.like_count || 0) + 1;
        await supabase.from('community_posts').update({ like_count: newCount }).eq('id', postId);
        return { liked: true, like_count: newCount };
      }
    } catch (e) {
      console.warn('Supabase like toggle error, falling back:', (e as Error).message);
    }
  }

  // Fallback
  const post = postsStore.find(p => p.id === postId);
  const existingIdx = likesStore.findIndex(l => l.post_id === postId && l.user_id === userId);

  if (existingIdx >= 0) {
    likesStore.splice(existingIdx, 1);
    if (post) post.like_count = Math.max(0, post.like_count - 1);
    return { liked: false, like_count: post ? post.like_count : 0 };
  } else {
    likesStore.push({
      id: `like_${Date.now()}`,
      post_id: postId,
      user_id: userId,
      created_at: new Date().toISOString()
    });
    if (post) post.like_count = post.like_count + 1;
    return { liked: true, like_count: post ? post.like_count : 1 };
  }
}

/**
 * Query Comments for a Post
 */
export async function queryPostCommentsFromSupabase(postId: string): Promise<PostComment[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data as PostComment[];
      }
    } catch (e) {
      console.warn('Supabase post comments query error, falling back:', (e as Error).message);
    }
  }

  return commentsStore
    .filter(c => c.post_id === postId && !c.is_deleted)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/**
 * Insert Comment on Post
 */
export async function insertPostCommentInSupabase(comment: PostComment): Promise<PostComment> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert(comment)
        .select()
        .single();
      if (!error && data) {
        // Increment post comment count
        const { data: postData } = await supabase.from('community_posts').select('comment_count').eq('id', comment.post_id).single();
        const newCount = (postData?.comment_count || 0) + 1;
        await supabase.from('community_posts').update({ comment_count: newCount }).eq('id', comment.post_id);

        commentsStore.push(data as PostComment);
        return data as PostComment;
      }
    } catch (e) {
      console.warn('Supabase comment insert error:', (e as Error).message);
    }
  }

  commentsStore.push(comment);
  const post = postsStore.find(p => p.id === comment.post_id);
  if (post) post.comment_count = (post.comment_count || 0) + 1;
  return comment;
}

/**
 * Delete Comment
 */
export async function deletePostCommentInSupabase(commentId: string, userId: string, isAdmin = false): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase.from('post_comments').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', commentId);
      if (!isAdmin) query = query.eq('author_id', userId);
      const { error } = await query;
      if (!error) {
        const local = commentsStore.find(c => c.id === commentId);
        if (local) local.is_deleted = true;
        return true;
      }
    } catch (e) {
      console.warn('Supabase comment delete fallback:', (e as Error).message);
    }
  }

  const comm = commentsStore.find(c => c.id === commentId);
  if (!comm) return false;
  if (!isAdmin && comm.author_id !== userId) return false;
  comm.is_deleted = true;
  const post = postsStore.find(p => p.id === comm.post_id);
  if (post) post.comment_count = Math.max(0, (post.comment_count || 1) - 1);
  return true;
}

/**
 * Submit Community Report
 */
export async function insertCommunityReportInSupabase(report: CommunityReport): Promise<CommunityReport> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_reports')
        .insert(report)
        .select()
        .single();
      if (!error && data) {
        reportsStore.push(data as CommunityReport);
        return data as CommunityReport;
      }
    } catch (e) {
      console.warn('Supabase report insert fallback:', (e as Error).message);
    }
  }

  reportsStore.push(report);
  return report;
}

/**
 * Query Opportunities with filters, search, and saved status
 */
export async function queryOpportunitiesFromSupabase(filters?: {
  sport?: string;
  opportunity_type?: string;
  location?: string;
  search?: string;
  status?: string;
  include_expired?: boolean;
  current_user_id?: string;
}): Promise<Opportunity[]> {
  const currentUserId = filters?.current_user_id;
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      let query = supabase
        .from('opportunities')
        .select('*')
        .order('application_deadline', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'VERIFIED');
      }

      if (filters?.sport && filters.sport !== 'all') {
        query = query.eq('sport', filters.sport);
      }
      if (filters?.opportunity_type && filters.opportunity_type !== 'ALL') {
        query = query.eq('opportunity_type', filters.opportunity_type);
      }

      const { data, error } = await query;
      if (!error && data) {
        let list = data as Opportunity[];
        const now = new Date().toISOString();

        if (!filters?.include_expired) {
          list = list.filter(o => o.application_deadline >= now);
        }

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(o =>
            o.title.toLowerCase().includes(q) ||
            o.organization_name.toLowerCase().includes(q) ||
            o.sport.toLowerCase().includes(q) ||
            o.location.toLowerCase().includes(q)
          );
        }

        // Annotate saved status
        let savedSet = new Set<string>();
        if (currentUserId) {
          const { data: savedData } = await supabase
            .from('saved_opportunities')
            .select('opportunity_id')
            .eq('user_id', currentUserId);
          if (savedData) {
            savedData.forEach(s => savedSet.add(s.opportunity_id));
          }
        }

        return list.map(o => ({
          ...o,
          is_saved: currentUserId ? savedSet.has(o.id) : false
        }));
      }
    } catch (e) {
      console.warn('Supabase opportunities query fallback:', (e as Error).message);
    }
  }

  // Fallback
  let list = [...opportunitiesStore];
  const now = new Date().toISOString();

  if (filters?.status) {
    list = list.filter(o => o.status === filters.status);
  } else {
    list = list.filter(o => o.status === 'VERIFIED');
  }

  if (filters?.sport && filters.sport !== 'all') {
    list = list.filter(o => o.sport === filters.sport);
  }
  if (filters?.opportunity_type && filters.opportunity_type !== 'ALL') {
    list = list.filter(o => o.opportunity_type === filters.opportunity_type);
  }
  if (!filters?.include_expired) {
    list = list.filter(o => o.application_deadline >= now);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(o =>
      o.title.toLowerCase().includes(q) ||
      o.organization_name.toLowerCase().includes(q) ||
      o.sport.toLowerCase().includes(q) ||
      o.location.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime());

  return list.map(o => ({
    ...o,
    is_saved: currentUserId ? savedOpportunitiesStore.some(s => s.user_id === currentUserId && s.opportunity_id === o.id) : false
  }));
}

/**
 * Toggle Save Opportunity for Current User
 */
export async function toggleSaveOpportunityInSupabase(opportunityId: string, userId: string): Promise<{ saved: boolean }> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('saved_opportunities')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('saved_opportunities').delete().eq('id', existing.id);
        const idx = savedOpportunitiesStore.findIndex(s => s.opportunity_id === opportunityId && s.user_id === userId);
        if (idx >= 0) savedOpportunitiesStore.splice(idx, 1);
        return { saved: false };
      } else {
        const newRecord = {
          id: `saved_${Date.now()}`,
          opportunity_id: opportunityId,
          user_id: userId,
          created_at: new Date().toISOString()
        };
        await supabase.from('saved_opportunities').insert(newRecord);
        savedOpportunitiesStore.push(newRecord);
        return { saved: true };
      }
    } catch (e) {
      console.warn('Supabase toggle save opportunity fallback:', (e as Error).message);
    }
  }

  const idx = savedOpportunitiesStore.findIndex(s => s.opportunity_id === opportunityId && s.user_id === userId);
  if (idx >= 0) {
    savedOpportunitiesStore.splice(idx, 1);
    return { saved: false };
  } else {
    savedOpportunitiesStore.push({
      id: `saved_${Date.now()}`,
      opportunity_id: opportunityId,
      user_id: userId,
      created_at: new Date().toISOString()
    });
    return { saved: true };
  }
}

/**
 * Query Saved Opportunities for User
 */
export async function querySavedOpportunitiesFromSupabase(userId: string): Promise<Opportunity[]> {
  const allOpps = await queryOpportunitiesFromSupabase({ include_expired: true, current_user_id: userId });
  return allOpps.filter(o => o.is_saved);
}
