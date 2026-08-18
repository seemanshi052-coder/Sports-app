export type UserRole = 'athlete' | 'coach' | 'scout' | 'admin';

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
  overall_rating?: number;
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
