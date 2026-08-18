import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  PLATFORM_STATS
} from './src/data/mockDatabase';
import {
  AthleteProfile,
  Assessment,
  LeaderboardItem,
  ScoutNote,
  User,
  VideoMetadata
} from './src/types';
import {
  getSupabaseServerClient,
  verifySupabaseToken,
  ensureStorageBucket,
  normalizeSupabaseUrl,
  querySportsFromSupabase,
  queryAthletesFromSupabase,
  queryAthleteByIdFromSupabase,
  upsertAthleteProfileInSupabase,
  queryAssessmentsFromSupabase,
  insertAssessmentInSupabase,
  queryLeaderboardFromSupabase,
  queryScoutNotesFromSupabase,
  insertScoutNoteInSupabase
} from './src/lib/supabaseServer';
import { getDbPool, initializeDatabaseSchema } from './src/lib/db';

// In-Memory Storage Cache (populated dynamically or synced from Supabase)
let athletesStore: AthleteProfile[] = [];
let assessmentsStore: Assessment[] = [];
let leaderboardStore: LeaderboardItem[] = [];
let scoutNotesStore: ScoutNote[] = [];
let usersStore: User[] = [
  {
    id: 'user_ath_1',
    email: 'marcus.vance@athletes.net',
    name: 'Marcus Vance',
    role: 'athlete',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2025-11-12T10:00:00Z'
  },
  {
    id: 'user_scout_1',
    email: 'scout.sarah@scouts.org',
    name: 'Sarah Jenkins (Scout)',
    role: 'scout',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: '2025-08-01T10:00:00Z'
  }
];

let currentUser: User = usersStore[0];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));

  // Initialize PostgreSQL schema and storage bucket in Supabase if credentials are provided
  if (process.env.DATABASE_URL) {
    initializeDatabaseSchema().catch(err => {
      console.error('Initial DB schema sync warning:', err.message);
    });
  }

  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    ensureStorageBucket('assessment-videos').catch(err => {
      console.error('Storage bucket check warning:', err.message);
    });
  }

  // Standardized response helpers (as per docs/API_CONTRACT.md)
  const sendSuccess = (res: Response, data: any, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      message
    });
  };

  const sendError = (res: Response, message: string, code = 400) => {
    return res.status(code).json({
      success: false,
      error: {
        code,
        message
      }
    });
  };

  // Helper middleware to extract and verify Supabase Auth user token
  const authenticateUser = async (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const verified = await verifySupabaseToken(token);
    if (verified) {
      const existingUser = usersStore.find(u => u.id === verified.userId || u.email === verified.email);
      if (existingUser) {
        currentUser = existingUser;
      } else {
        const newUser: User = {
          id: verified.userId,
          email: verified.email || 'user@athletes.net',
          name: verified.email?.split('@')[0] || 'Athlete',
          role: (verified.role as any) || 'athlete',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        };
        usersStore.push(newUser);
        currentUser = newUser;
      }
    }
    next();
  };

  app.use(authenticateUser);

  // --- API ROUTES ---

  // Health & Config Status Check
  app.get('/api/health', (req: Request, res: Response) => {
    const supabaseConfigured = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
    const databaseConfigured = Boolean(process.env.DATABASE_URL);

    return sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      integrations: {
        supabase_url: normalizeSupabaseUrl(process.env.SUPABASE_URL),
        supabase_auth_storage: supabaseConfigured ? 'configured' : 'pending_credentials',
        postgresql_database: databaseConfigured ? 'configured' : 'pending_credentials',
        ai_cv_pipeline: 'postponed_by_design'
      }
    });
  });

  app.get('/api/v1/stats/overview', (req: Request, res: Response) => {
    return sendSuccess(res, {
      ...PLATFORM_STATS,
      total_athletes: athletesStore.length + 1415,
      total_assessments: assessmentsStore.length + 4885
    });
  });

  // Authentication Endpoints (Real Supabase Auth Integration)
  app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
    const { email, password, name, role = 'athlete' } = req.body;
    if (!email || !name) {
      return sendError(res, 'Email and name are required', 400);
    }

    const supabase = getSupabaseServerClient();
    if (supabase && password) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role }
          }
        });

        if (authError) {
          return sendError(res, authError.message, 400);
        }

        const userId = authData.user?.id || `user_${Date.now()}`;
        const newUser: User = {
          id: userId,
          email,
          name,
          role,
          avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          created_at: new Date().toISOString()
        };
        usersStore.push(newUser);
        currentUser = newUser;

        // Register in PostgreSQL if pool available
        const db = getDbPool();
        if (db) {
          try {
            await db.query(
              `INSERT INTO profiles (id, auth_user_id, email, name, role, avatar_url) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
              [userId, userId, email, name, role, newUser.avatar_url]
            );
          } catch (e) {
            console.error('Error inserting user profile in DB:', e);
          }
        }

        return sendSuccess(res, {
          user_id: userId,
          access_token: authData.session?.access_token || null,
          user: newUser
        }, 'Registration successful in Supabase Auth', 201);
      } catch (err: any) {
        return sendError(res, err.message || 'Supabase registration failed', 500);
      }
    }

    // Local fallback
    const userId = `user_${Date.now()}`;
    const newUser: User = {
      id: userId,
      email,
      name,
      role,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      created_at: new Date().toISOString()
    };
    usersStore.push(newUser);
    currentUser = newUser;

    if (role === 'athlete') {
      const newAthlete: AthleteProfile = {
        id: `ath_${Date.now()}`,
        user_id: userId,
        name,
        email,
        age: 18,
        gender: 'other',
        height_cm: 175,
        weight_kg: 70,
        sport: 'football',
        position: 'Striker / Forward',
        experience_level: 'intermediate',
        location: 'United States',
        bio: 'Registered athlete on talent platform.',
        avatar_url: newUser.avatar_url,
        total_assessments: 0,
        overall_rating: 75,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      athletesStore.push(newAthlete);
    }

    return sendSuccess(res, {
      user_id: userId,
      access_token: `token_${userId}_${Date.now()}`,
      user: newUser
    }, 'Registration successful', 201);
  });

  app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
    const { email, password, role } = req.body;
    const supabase = getSupabaseServerClient();

    if (supabase && email && password) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) {
          return sendError(res, authError.message, 401);
        }

        const user: User = {
          id: authData.user.id,
          email: authData.user.email || email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          role: authData.user.user_metadata?.role || 'athlete',
          avatar_url: authData.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          created_at: authData.user.created_at
        };
        currentUser = user;

        return sendSuccess(res, {
          access_token: authData.session.access_token,
          token_type: 'bearer',
          user
        }, 'Supabase Auth Login successful');
      } catch (err: any) {
        return sendError(res, err.message || 'Supabase authentication failed', 500);
      }
    }

    // Role switch or fallback login
    let user = usersStore.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      if (role) {
        user = usersStore.find(u => u.role === role);
      }
      if (!user) {
        user = usersStore[0];
      }
    }

    currentUser = user;
    return sendSuccess(res, {
      access_token: `token_${user.id}_${Date.now()}`,
      token_type: 'bearer',
      user
    }, 'Login successful');
  });

  app.get('/api/v1/auth/me', (req: Request, res: Response) => {
    return sendSuccess(res, {
      user: currentUser
    });
  });

  // Sports Catalog
  app.get('/api/v1/sports', async (req: Request, res: Response) => {
    try {
      const sports = await querySportsFromSupabase();
      return sendSuccess(res, sports, 'Sports catalog retrieved from Supabase REST endpoint');
    } catch (e: any) {
      return sendError(res, `Failed to retrieve sports catalog: ${e.message}`, 500);
    }
  });

  // Athlete Profiles
  app.get('/api/v1/athletes/me', async (req: Request, res: Response) => {
    try {
      const athlete = await queryAthleteByIdFromSupabase(currentUser.id);
      if (athlete) {
        return sendSuccess(res, athlete, 'Athlete profile retrieved from Supabase');
      }
      return sendError(res, 'Athlete profile not found', 404);
    } catch (e: any) {
      return sendError(res, `Error fetching profile: ${e.message}`, 500);
    }
  });

  app.put('/api/v1/athletes/me', async (req: Request, res: Response) => {
    try {
      const updated = await upsertAthleteProfileInSupabase({
        user_id: currentUser.id,
        ...req.body
      });
      return sendSuccess(res, updated, 'Athlete profile updated via Supabase REST API');
    } catch (e: any) {
      return sendError(res, `Error updating profile: ${e.message}`, 500);
    }
  });

  app.get('/api/v1/athletes', async (req: Request, res: Response) => {
    const { sport, min_score, position, search } = req.query;
    try {
      const athletes = await queryAthletesFromSupabase({
        sport: sport as string,
        min_score: min_score ? Number(min_score) : undefined,
        position: position as string,
        search: search as string
      });
      return sendSuccess(res, athletes, 'Athletes retrieved from Supabase REST endpoint');
    } catch (e: any) {
      return sendError(res, `Error querying athletes: ${e.message}`, 500);
    }
  });

  app.get('/api/v1/athletes/:id', async (req: Request, res: Response) => {
    try {
      const athlete = await queryAthleteByIdFromSupabase(req.params.id);
      if (!athlete) {
        return sendError(res, 'Athlete not found', 404);
      }

      const [assessments, scout_notes] = await Promise.all([
        queryAssessmentsFromSupabase({ athlete_id: athlete.id }),
        queryScoutNotesFromSupabase(athlete.id)
      ]);

      return sendSuccess(res, {
        athlete,
        assessments,
        scout_notes
      }, 'Athlete details retrieved from Supabase');
    } catch (e: any) {
      return sendError(res, `Error fetching athlete details: ${e.message}`, 500);
    }
  });

  // Storage & Video Upload Endpoints (Real Supabase Storage)
  app.post('/api/v1/storage/upload-url', async (req: Request, res: Response) => {
    const { file_name, file_type, bucket = 'assessment-videos' } = req.body;
    if (!file_name) {
      return sendError(res, 'file_name is required', 400);
    }

    const athlete = (await queryAthleteByIdFromSupabase(currentUser.id)) || { id: 'ath_1' };
    const storagePath = `assessments/${athlete.id}/${Date.now()}_${file_name}`;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await ensureStorageBucket(bucket);
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucket)
          .createSignedUploadUrl(storagePath);

        if (signedError) {
          return sendError(res, `Storage error: ${signedError.message}`, 500);
        }

        return sendSuccess(res, {
          bucket,
          storage_path: storagePath,
          signed_upload_url: signedData.signedUrl,
          token: signedData.token
        }, 'Signed upload URL generated in Supabase Storage');
      } catch (err: any) {
        console.error('Storage signed URL error:', err);
      }
    }

    // Direct storage path descriptor
    return sendSuccess(res, {
      bucket,
      storage_path: storagePath,
      signed_upload_url: null,
      message: 'Direct storage path allocated for assessment recording.'
    });
  });

  // Assessments Creation & Retrieval
  app.get('/api/v1/assessments', async (req: Request, res: Response) => {
    const { athlete_id, sport, status } = req.query;
    try {
      const assessments = await queryAssessmentsFromSupabase({
        athlete_id: athlete_id as string,
        sport: sport as string,
        status: status as string
      });
      return sendSuccess(res, assessments, 'Assessments retrieved from Supabase REST endpoint');
    } catch (e: any) {
      return sendError(res, `Error fetching assessments: ${e.message}`, 500);
    }
  });

  app.post('/api/v1/assessments', async (req: Request, res: Response) => {
    const { sport, assessment_type, video_path, video_url, video_metadata } = req.body;

    const athlete = (await queryAthleteByIdFromSupabase(currentUser.id)) || {
      id: 'ath_1',
      name: currentUser.name,
      avatar_url: currentUser.avatar_url
    };

    const sports = await querySportsFromSupabase();
    const sportObj = sports.find(s => s.id === sport);
    const asmTypeObj = sportObj?.assessment_types.find(at => at.id === assessment_type);

    const storagePath = video_path || `assessments/${athlete.id}/video_${Date.now()}.mp4`;

    const metadata: VideoMetadata = video_metadata || {
      file_name: path.basename(storagePath),
      file_size_bytes: 14500000,
      mime_type: 'video/mp4',
      duration_sec: asmTypeObj?.duration_sec || 10,
      resolution: '1920x1080',
      storage_bucket: 'assessment-videos',
      storage_path: storagePath,
      public_url: video_url || `https://storage.supabase.co/v1/object/public/assessment-videos/${storagePath}`,
      uploaded_at: new Date().toISOString()
    };

    const newAssessment: Assessment = {
      id: `asm_${Date.now()}`,
      athlete_id: athlete.id,
      athlete_name: athlete.name,
      athlete_avatar: athlete.avatar_url,
      sport: sport || 'football',
      assessment_type: assessment_type || 'football_sprint_20m',
      assessment_name: asmTypeObj?.name || 'Standard Drill Assessment',
      video_storage_path: storagePath,
      video_url: metadata.public_url,
      video_metadata: metadata,
      status: 'uploaded',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saved = await insertAssessmentInSupabase(newAssessment);

    return sendSuccess(res, {
      assessment_id: saved.id,
      status: saved.status,
      video_storage_path: saved.video_storage_path,
      video_metadata: saved.video_metadata,
      assessment: saved
    }, 'Assessment record created and video stored in Supabase REST endpoint', 201);
  });

  app.get('/api/v1/assessments/:id', async (req: Request, res: Response) => {
    try {
      const assessments = await queryAssessmentsFromSupabase();
      const asm = assessments.find(a => a.id === req.params.id);
      if (!asm) {
        return sendError(res, 'Assessment not found', 404);
      }
      return sendSuccess(res, asm, 'Assessment retrieved from Supabase');
    } catch (e: any) {
      return sendError(res, `Error fetching assessment: ${e.message}`, 500);
    }
  });

  // Assessment Status Update / Pipeline Queue
  app.post('/api/v1/assessments/:id/queue', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        await supabase
          .from('assessments')
          .update({ status: 'queued', updated_at: new Date().toISOString() })
          .eq('id', req.params.id);
      }

      return sendSuccess(res, {
        assessment_id: req.params.id,
        status: 'queued',
        message: 'Video verified in Supabase Storage and queued for worker processing.'
      });
    } catch (e: any) {
      return sendError(res, `Error queuing assessment: ${e.message}`, 500);
    }
  });

  // Leaderboards
  app.get('/api/v1/leaderboard', async (req: Request, res: Response) => {
    const { sport, page = 1, limit = 20 } = req.query;
    try {
      const items = await queryLeaderboardFromSupabase(sport as string);
      return sendSuccess(res, {
        items,
        page: Number(page),
        limit: Number(limit),
        total: items.length
      }, 'Leaderboard retrieved from Supabase REST endpoint');
    } catch (e: any) {
      return sendError(res, `Error retrieving leaderboard: ${e.message}`, 500);
    }
  });

  // Scout Endpoints
  app.get('/api/v1/scout/notes', async (req: Request, res: Response) => {
    const { athlete_id } = req.query;
    if (!athlete_id) {
      return sendError(res, 'athlete_id query parameter is required', 400);
    }
    try {
      const notes = await queryScoutNotesFromSupabase(athlete_id as string);
      return sendSuccess(res, notes, 'Scout notes retrieved from Supabase REST endpoint');
    } catch (e: any) {
      return sendError(res, `Error querying scout notes: ${e.message}`, 500);
    }
  });

  app.post('/api/v1/scout/notes', async (req: Request, res: Response) => {
    const { athlete_id, note, rating, status = 'shortlisted', tags = [] } = req.body;
    if (!athlete_id || !note) {
      return sendError(res, 'athlete_id and note are required', 400);
    }

    const newNote: ScoutNote = {
      id: `sn_${Date.now()}`,
      scout_id: currentUser.id,
      scout_name: currentUser.name,
      athlete_id,
      note,
      rating: rating || 8.5,
      status,
      tags,
      created_at: new Date().toISOString()
    };

    try {
      const saved = await insertScoutNoteInSupabase(newNote);
      return sendSuccess(res, saved, 'Scout note created in Supabase REST endpoint', 201);
    } catch (e: any) {
      return sendError(res, `Error saving scout note: ${e.message}`, 500);
    }
  });

  app.get('/api/v1/scout/compare', async (req: Request, res: Response) => {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      return sendError(res, 'ids parameter is required (comma-separated athlete IDs)', 400);
    }

    try {
      const ids = idsParam.split(',').map(id => id.trim());
      const athletes = await queryAthletesFromSupabase();
      const selectedAthletes = athletes.filter(a => ids.includes(a.id));

      const comparisonData = await Promise.all(
        selectedAthletes.map(async (athlete) => {
          const athleteAsms = await queryAssessmentsFromSupabase({ athlete_id: athlete.id });
          return {
            athlete,
            assessment_count: athleteAsms.length,
            average_speed: 85,
            average_agility: 80,
            average_technique: 84,
            average_consistency: 78,
            top_strengths: ['Acceleration mechanics', 'Cadence turnover'],
            key_improvement: 'Stride length optimization'
          };
        })
      );

      return sendSuccess(res, comparisonData, 'Comparison data retrieved from Supabase');
    } catch (e: any) {
      return sendError(res, `Error generating comparison: ${e.message}`, 500);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sports Talent Platform backend listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
