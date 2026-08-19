import { Pool } from 'pg';
import { AthleteProfile, Assessment, ScoutNote, User, Sport, CommunityPost, Opportunity } from '../types';
import {
  SPORTS_DATA,
  INITIAL_ATHLETES,
  INITIAL_ASSESSMENTS,
  INITIAL_SCOUT_NOTES,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_POST_COMMENTS,
  INITIAL_OPPORTUNITIES
} from '../data/mockDatabase';

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
  }

  return pool;
}

/**
 * Initializes required PostgreSQL tables in Supabase if not present.
 */
export async function initializeDatabaseSchema(): Promise<boolean> {
  const db = getDbPool();
  if (!db) return false;

  try {
    const client = await db.connect();
    try {
      // 1. Create tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS sports (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          icon VARCHAR(64) NOT NULL,
          description TEXT,
          color VARCHAR(64),
          banner_gradient VARCHAR(128),
          assessment_types JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS profiles (
          id VARCHAR(128) PRIMARY KEY,
          auth_user_id VARCHAR(128),
          email VARCHAR(255) UNIQUE,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(64) DEFAULT 'athlete',
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS athlete_profiles (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          age INT DEFAULT 18,
          gender VARCHAR(32) DEFAULT 'other',
          height_cm INT DEFAULT 175,
          weight_kg INT DEFAULT 70,
          sport VARCHAR(64) DEFAULT 'football',
          position VARCHAR(128) DEFAULT 'Striker / Forward',
          experience_level VARCHAR(64) DEFAULT 'intermediate',
          location VARCHAR(255) DEFAULT 'United States',
          bio TEXT,
          avatar_url TEXT,
          overall_rating NUMERIC(5,2) DEFAULT 75.0,
          total_assessments INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS assessments (
          id VARCHAR(128) PRIMARY KEY,
          athlete_id VARCHAR(128) NOT NULL,
          athlete_name VARCHAR(255),
          athlete_avatar TEXT,
          sport VARCHAR(64) NOT NULL,
          assessment_type VARCHAR(128) NOT NULL,
          assessment_name VARCHAR(255) NOT NULL,
          video_storage_path TEXT,
          video_url TEXT,
          video_metadata JSONB,
          status VARCHAR(64) DEFAULT 'uploaded',
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          overall_score NUMERIC(5,2),
          tier VARCHAR(64),
          confidence_score INT,
          metrics JSONB,
          raw_measurements JSONB,
          biomechanics JSONB,
          strengths JSONB,
          improvement_areas JSONB,
          recommendations JSONB,
          model_version VARCHAR(64),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS scout_notes (
          id VARCHAR(128) PRIMARY KEY,
          scout_id VARCHAR(128) NOT NULL,
          scout_name VARCHAR(255) NOT NULL,
          athlete_id VARCHAR(128) NOT NULL,
          note TEXT NOT NULL,
          rating NUMERIC(4,1) DEFAULT 8.5,
          status VARCHAR(64) DEFAULT 'shortlisted',
          tags JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS xp_transactions (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          amount INT NOT NULL,
          source_type VARCHAR(64) NOT NULL,
          source_id VARCHAR(128) NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT uq_user_source UNIQUE (user_id, source_type, source_id)
        );

        CREATE TABLE IF NOT EXISTS badges (
          id VARCHAR(128) PRIMARY KEY,
          code VARCHAR(64) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          icon VARCHAR(64) NOT NULL,
          category VARCHAR(64) NOT NULL,
          requirement_type VARCHAR(64) NOT NULL,
          requirement_value INT NOT NULL,
          xp_reward INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS user_badges (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          badge_id VARCHAR(128) NOT NULL,
          badge_code VARCHAR(64) NOT NULL,
          unlocked_at TIMESTAMPTZ DEFAULT NOW(),
          trigger_value NUMERIC(10,2),
          source_reference VARCHAR(128),
          CONSTRAINT uq_user_badge UNIQUE (user_id, badge_code)
        );

        CREATE TABLE IF NOT EXISTS user_streaks (
          user_id VARCHAR(128) PRIMARY KEY,
          current_streak INT DEFAULT 0,
          longest_streak INT DEFAULT 0,
          last_activity_date DATE,
          activity_dates JSONB DEFAULT '[]',
          claimed_milestones JSONB DEFAULT '[]',
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Community & Opportunities Tables
        CREATE TABLE IF NOT EXISTS community_posts (
          id VARCHAR(128) PRIMARY KEY,
          author_id VARCHAR(128) NOT NULL,
          author_name VARCHAR(255) NOT NULL,
          author_avatar TEXT,
          author_level INT DEFAULT 1,
          author_level_name VARCHAR(128),
          author_level_icon VARCHAR(32),
          author_badge VARCHAR(128),
          post_type VARCHAR(64) NOT NULL,
          sport VARCHAR(64),
          title VARCHAR(255),
          content TEXT NOT NULL,
          media_url TEXT,
          media_type VARCHAR(32),
          like_count INT DEFAULT 0,
          comment_count INT DEFAULT 0,
          is_deleted BOOLEAN DEFAULT FALSE,
          is_hidden BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_comm_posts_created_at ON community_posts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_comm_posts_author ON community_posts(author_id);
        CREATE INDEX IF NOT EXISTS idx_comm_posts_type ON community_posts(post_type);

        CREATE TABLE IF NOT EXISTS post_likes (
          id VARCHAR(128) PRIMARY KEY,
          post_id VARCHAR(128) NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
          user_id VARCHAR(128) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT uq_post_like UNIQUE (post_id, user_id)
        );
        CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
        CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

        CREATE TABLE IF NOT EXISTS post_comments (
          id VARCHAR(128) PRIMARY KEY,
          post_id VARCHAR(128) NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
          author_id VARCHAR(128) NOT NULL,
          author_name VARCHAR(255) NOT NULL,
          author_avatar TEXT,
          author_level INT DEFAULT 1,
          author_level_name VARCHAR(128),
          author_level_icon VARCHAR(32),
          content TEXT NOT NULL,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

        CREATE TABLE IF NOT EXISTS community_reports (
          id VARCHAR(128) PRIMARY KEY,
          reporter_id VARCHAR(128) NOT NULL,
          target_type VARCHAR(32) NOT NULL,
          target_id VARCHAR(128) NOT NULL,
          reason VARCHAR(64) NOT NULL,
          details TEXT,
          status VARCHAR(32) DEFAULT 'PENDING',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_comm_reports_target ON community_reports(target_type, target_id);

        CREATE TABLE IF NOT EXISTS opportunities (
          id VARCHAR(128) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          organization_name VARCHAR(255) NOT NULL,
          organization_logo TEXT,
          opportunity_type VARCHAR(64) NOT NULL,
          sport VARCHAR(64) NOT NULL,
          location VARCHAR(255) NOT NULL,
          is_remote BOOLEAN DEFAULT FALSE,
          start_date TIMESTAMPTZ,
          end_date TIMESTAMPTZ,
          application_deadline TIMESTAMPTZ NOT NULL,
          eligibility TEXT,
          requirements JSONB DEFAULT '[]',
          benefits JSONB DEFAULT '[]',
          registration_url TEXT,
          contact_email VARCHAR(255),
          contact_phone VARCHAR(64),
          created_by VARCHAR(128) DEFAULT 'admin_official',
          status VARCHAR(32) DEFAULT 'VERIFIED',
          is_verified BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_opp_deadline ON opportunities(application_deadline);
        CREATE INDEX IF NOT EXISTS idx_opp_sport ON opportunities(sport);
        CREATE INDEX IF NOT EXISTS idx_opp_type ON opportunities(opportunity_type);
        CREATE INDEX IF NOT EXISTS idx_opp_status ON opportunities(status);

        CREATE TABLE IF NOT EXISTS saved_opportunities (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          opportunity_id VARCHAR(128) NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT uq_user_opp UNIQUE (user_id, opportunity_id)
        );
        CREATE INDEX IF NOT EXISTS idx_saved_opp_user ON saved_opportunities(user_id);
      `);

      // 2. Check if sports catalog is empty, seed initial standardized sports & drills
      const { rows: sportRows } = await client.query('SELECT COUNT(*) FROM sports');
      if (parseInt(sportRows[0].count, 10) === 0) {
        for (const sp of SPORTS_DATA) {
          await client.query(`
            INSERT INTO sports (id, name, icon, description, color, banner_gradient, assessment_types, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
          `, [sp.id, sp.name, sp.icon, sp.description, sp.color, sp.banner_gradient, JSON.stringify(sp.assessment_types)]);
        }
      }

      // 3. Check if athlete_profiles is empty, seed initial baseline athletes
      const { rows: athleteRows } = await client.query('SELECT COUNT(*) FROM athlete_profiles');
      if (parseInt(athleteRows[0].count, 10) === 0) {
        for (const ath of INITIAL_ATHLETES) {
          await client.query(`
            INSERT INTO athlete_profiles (
              id, user_id, name, email, age, gender, height_cm, weight_kg,
              sport, position, experience_level, location, bio, avatar_url,
              overall_rating, total_assessments, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id) DO NOTHING
          `, [
            ath.id, ath.user_id, ath.name, ath.email, ath.age, ath.gender, ath.height_cm, ath.weight_kg,
            ath.sport, ath.position, ath.experience_level, ath.location, ath.bio, ath.avatar_url,
            ath.overall_rating, ath.total_assessments, ath.created_at, ath.updated_at
          ]);
        }
      }

      // Check if assessments is empty, seed initial assessments
      const { rows: asmRows } = await client.query('SELECT COUNT(*) FROM assessments');
      if (parseInt(asmRows[0].count, 10) === 0) {
        for (const asm of INITIAL_ASSESSMENTS) {
          await client.query(`
            INSERT INTO assessments (
              id, athlete_id, athlete_name, athlete_avatar, sport, assessment_type,
              assessment_name, video_storage_path, video_url, status, started_at,
              completed_at, overall_score, tier, confidence_score, metrics,
              raw_measurements, biomechanics, strengths, improvement_areas,
              recommendations, model_version, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            ON CONFLICT (id) DO NOTHING
          `, [
            asm.id, asm.athlete_id, asm.athlete_name, asm.athlete_avatar, asm.sport, asm.assessment_type,
            asm.assessment_name, asm.video_storage_path, asm.video_url, asm.status, asm.started_at,
            asm.completed_at, asm.overall_score, asm.tier, asm.confidence_score, JSON.stringify(asm.metrics || {}),
            JSON.stringify(asm.raw_measurements || {}), JSON.stringify(asm.biomechanics || {}),
            JSON.stringify(asm.strengths || []), JSON.stringify(asm.improvement_areas || []),
            JSON.stringify(asm.recommendations || []), asm.model_version, asm.created_at, asm.updated_at
          ]);
        }
      }

      // Check if community_posts is empty, seed initial posts
      const { rows: postRows } = await client.query('SELECT COUNT(*) FROM community_posts');
      if (parseInt(postRows[0].count, 10) === 0) {
        for (const post of INITIAL_COMMUNITY_POSTS) {
          await client.query(`
            INSERT INTO community_posts (
              id, author_id, author_name, author_avatar, author_level,
              author_level_name, author_level_icon, author_badge, post_type,
              sport, title, content, media_url, media_type, like_count,
              comment_count, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id) DO NOTHING
          `, [
            post.id, post.author_id, post.author_name, post.author_avatar, post.author_level,
            post.author_level_name, post.author_level_icon, post.author_badge, post.post_type,
            post.sport, post.title, post.content, post.media_url, post.media_type, post.like_count,
            post.comment_count, post.created_at, post.updated_at
          ]);
        }
      }

      // Check if post_comments is empty, seed initial comments
      const { rows: commRows } = await client.query('SELECT COUNT(*) FROM post_comments');
      if (parseInt(commRows[0].count, 10) === 0) {
        for (const comm of INITIAL_POST_COMMENTS) {
          await client.query(`
            INSERT INTO post_comments (
              id, post_id, author_id, author_name, author_avatar, author_level,
              author_level_name, author_level_icon, content, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO NOTHING
          `, [
            comm.id, comm.post_id, comm.author_id, comm.author_name, comm.author_avatar, comm.author_level,
            comm.author_level_name, comm.author_level_icon, comm.content, comm.created_at, comm.created_at
          ]);
        }
      }

      // Check if opportunities is empty, seed initial opportunities
      const { rows: oppRows } = await client.query('SELECT COUNT(*) FROM opportunities');
      if (parseInt(oppRows[0].count, 10) === 0) {
        for (const opp of INITIAL_OPPORTUNITIES) {
          await client.query(`
            INSERT INTO opportunities (
              id, title, description, organization_name, organization_logo,
              opportunity_type, sport, location, is_remote, start_date, end_date,
              application_deadline, eligibility, requirements, benefits,
              registration_url, contact_email, contact_phone, created_by,
              status, is_verified, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            ON CONFLICT (id) DO NOTHING
          `, [
            opp.id, opp.title, opp.description, opp.organization_name, opp.organization_logo,
            opp.opportunity_type, opp.sport, opp.location, opp.is_remote, opp.start_date, opp.end_date,
            opp.application_deadline, opp.eligibility, JSON.stringify(opp.requirements || []),
            JSON.stringify(opp.benefits || []), opp.registration_url, opp.contact_email, opp.contact_phone,
            opp.created_by, opp.status, opp.is_verified, opp.created_at, opp.updated_at
          ]);
        }
      }

      console.log('PostgreSQL schema initialized and verified.');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database schema initialization error:', err);
    return false;
  }
}
