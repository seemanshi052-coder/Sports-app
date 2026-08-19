export type UserRole = 'athlete' | 'coach' | 'scout' | 'admin';

export type ProfileVisibility = 'PUBLIC' | 'COACHES_ONLY' | 'PRIVATE';

export type AchievementEvidenceType =
  | 'digital_certificate'
  | 'physical_certificate'
  | 'competition_result'
  | 'institution_verification'
  | 'organizer_verification'
  | 'Digital Certificate'
  | 'Physical Certificate'
  | 'Competition Result'
  | 'Institution Verification'
  | 'Organizer Verification';

export type AchievementVerificationStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected';

export interface Achievement {
  id: string;
  athlete_id: string;
  title: string;
  sport: string;
  event_name?: string;
  date_achieved: string;
  evidence_type: AchievementEvidenceType;
  evidence_url?: string;
  certificate_url?: string;
  verification_status: AchievementVerificationStatus;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface AthleteProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  sport: string;
  position: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'pro';
  location: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  profile_visibility?: ProfileVisibility;
  overall_rating?: number | null;
  total_assessments: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentMetricInfo {
  name: string;
  key: string;
  unit: string;
  description: string;
  benchmark: number;
  weight: number; // percentage in overall score
}

export interface AssessmentType {
  id: string;
  sport_id: string;
  name: string;
  short_name: string;
  category: 'speed' | 'agility' | 'power' | 'endurance' | 'technique' | 'coordination';
  description: string;
  instructions: string[];
  camera_setup_guidelines: string[];
  duration_sec: number;
  metrics: AssessmentMetricInfo[];
  video_demo_url?: string;
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  banner_gradient: string;
  assessment_types: AssessmentType[];
}

export type AssessmentStatus = 'created' | 'uploading' | 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed';

export interface VideoMetadata {
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  duration_sec?: number;
  resolution?: string;
  storage_bucket: string;
  storage_path: string;
  public_url?: string;
  uploaded_at: string;
}

export interface AssessmentRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  drill_type: string;
}

export interface BiomechanicalLandmarkData {
  frame_count: number;
  average_confidence: number;
  joint_angles?: {
    knee_flexion_avg?: number;
    trunk_inclination_avg?: number;
    hip_extension_avg?: number;
    arm_swing_amplitude?: number;
  };
  stride_cadence_spm?: number;
  acceleration_peak_ms2?: number;
  reaction_time_ms?: number;
  ground_contact_time_ms?: number;
}

export interface Assessment {
  id: string;
  athlete_id: string;
  athlete_name: string;
  athlete_avatar?: string;
  sport: string;
  assessment_type: string;
  assessment_name: string;
  video_storage_path?: string;
  video_url?: string;
  video_metadata?: VideoMetadata;
  status: AssessmentStatus;
  started_at: string;
  completed_at?: string;
  overall_score?: number;
  tier?: 'Elite Prospect' | 'National Level' | 'Regional Talent' | 'Developmental';
  confidence_score?: number;
  metrics?: Record<string, number>;
  raw_measurements?: Record<string, string | number>;
  biomechanics?: BiomechanicalLandmarkData;
  strengths?: string[];
  improvement_areas?: string[];
  recommendations?: AssessmentRecommendation[];
  model_version?: string;
  error_message?: string;
  scout_feedback_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardItem {
  rank: number;
  athlete_id: string;
  display_name: string;
  avatar_url?: string;
  sport: string;
  assessment_type: string;
  score: number;
  speed_score?: number;
  agility_score?: number;
  technique_score?: number;
  consistency_score?: number;
  age: number;
  location: string;
  verified: boolean;
  tier: string;
  recorded_at: string;
  level?: number;
  level_name?: string;
  level_icon?: string;
  total_xp?: number;
}

export interface ScoutNote {
  id: string;
  scout_id: string;
  scout_name: string;
  athlete_id: string;
  note: string;
  rating: number;
  status: 'scouted' | 'shortlisted' | 'trial_offered' | 'signed' | 'watching';
  tags: string[];
  created_at: string;
}

export interface PlatformStats {
  total_athletes: number;
  total_assessments: number;
  sports_supported: number;
  ai_accuracy_rate: number;
  scouts_active: number;
  verified_talents: number;
}

// ==========================================
// GAMIFICATION SYSTEM TYPES & MODELS
// ==========================================

export type XPSourceType =
  | 'PROFILE_COMPLETION'
  | 'ASSESSMENT_COMPLETION'
  | 'PERSONAL_BEST'
  | 'IMPROVEMENT'
  | 'VERIFIED_ACHIEVEMENT'
  | 'STREAK_MILESTONE'
  | 'BADGE_REWARD';

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  source_type: XPSourceType;
  source_id: string;
  description: string;
  created_at: string;
}

export type BadgeCategory = 'LEVEL' | 'STREAK' | 'IMPROVEMENT' | 'ASSESSMENT' | 'ACHIEVEMENT';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  is_active: boolean;
  created_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge_code?: string;
  badge?: Badge;
  unlocked_at: string;
  trigger_value?: number;
  source_reference?: string;
}

export interface LevelDefinition {
  level: number;
  name: string;
  icon: string;
  min_xp: number;
  max_xp: number;
}

export interface PrimaryBadgeInfo {
  name: string;
  icon: string;
  level: number;
  requirement_xp: number;
}

export interface BadgeWithStatus extends Badge {
  unlocked: boolean;
  unlocked_at?: string;
}

export interface GamificationProfile {
  user_id: string;
  total_xp: number;
  level: number;
  level_name: string;
  level_icon: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  next_level_xp: number;
  current_level_min_xp: number;
  xp_to_next_level: number;
  level_progress_percentage: number;
  primary_badge: PrimaryBadgeInfo;
  badges: BadgeWithStatus[];
  total_assessments: number;
  personal_bests: number;
  improvement_percentage: number;
  claimed_streak_milestones: number[];
  recent_transactions: XPTransaction[];
  created_at?: string;
  updated_at?: string;
}

export type MotivationalMessageCategory =
  | 'FIRST_ASSESSMENT'
  | 'IMPROVEMENT'
  | 'PERSONAL_BEST'
  | 'SMALL_IMPROVEMENT'
  | 'NO_CHANGE'
  | 'PERFORMANCE_DROP'
  | 'STREAK_MILESTONE'
  | 'LONG_STREAK'
  | 'BADGE_UNLOCK'
  | 'LEVEL_UP'
  | 'GENERAL_ENCOURAGEMENT';

export interface GamificationEventResult {
  xp_earned: number;
  total_xp: number;
  current_level: number;
  level_name: string;
  level_icon: string;
  current_streak: number;
  longest_streak: number;
  personal_best: boolean;
  improvement_detected: boolean;
  improvement_percentage: number;
  previous_score?: number;
  current_score?: number;
  new_badges: Badge[];
  level_up: boolean;
  new_level?: number;
  new_level_name?: string;
  motivational_category: MotivationalMessageCategory;
  motivational_message: string;
  xp_breakdown: Array<{ source_type: XPSourceType; amount: number; description: string }>;
}

// ==========================================
// COMMUNITY & OPPORTUNITIES MODULE TYPES
// ==========================================

export type PostCategory =
  | 'TRAINING'
  | 'ACHIEVEMENT'
  | 'PROGRESS'
  | 'PERFORMANCE'
  | 'QUESTION'
  | 'MOTIVATION'
  | 'GENERAL';

export interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_level?: number;
  author_level_name?: string;
  author_level_icon?: string;
  author_badge?: string;
  post_type: PostCategory;
  sport?: string;
  title?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  like_count: number;
  comment_count: number;
  liked_by_current_user?: boolean;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  is_hidden?: boolean;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_level?: number;
  author_level_name?: string;
  author_level_icon?: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export type ReportTargetType = 'POST' | 'COMMENT' | 'OPPORTUNITY';

export type ReportReason =
  | 'INAPPROPRIATE_CONTENT'
  | 'HARASSMENT'
  | 'SPAM'
  | 'FAKE_OPPORTUNITY'
  | 'MISLEADING_INFORMATION'
  | 'OTHER';

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';

export interface CommunityReport {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  created_at: string;
}

export type OpportunityType =
  | 'COMPETITION'
  | 'TRIAL'
  | 'TOURNAMENT'
  | 'CAMP'
  | 'SCHOLARSHIP'
  | 'ACADEMY'
  | 'TRAINING_PROGRAM'
  | 'SCOUTING'
  | 'OTHER';

export type OpportunityStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  organization_logo?: string;
  opportunity_type: OpportunityType;
  sport: string;
  location: string;
  is_remote?: boolean;
  start_date?: string;
  end_date?: string;
  application_deadline: string;
  eligibility?: string;
  requirements?: string[];
  benefits?: string[];
  registration_url?: string;
  contact_email?: string;
  contact_phone?: string;
  created_by?: string;
  status: OpportunityStatus;
  is_verified: boolean;
  is_saved?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SavedOpportunity {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
}

