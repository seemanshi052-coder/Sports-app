import { Pool } from 'pg';
import { AthleteProfile, Assessment, ScoutNote, User, Sport } from '../types';
import { SPORTS_DATA, INITIAL_ATHLETES, INITIAL_ASSESSMENTS, INITIAL_SCOUT_NOTES } from '../data/mockDatabase';

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
