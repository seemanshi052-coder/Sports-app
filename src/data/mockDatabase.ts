import { Sport, AthleteProfile, Assessment, LeaderboardItem, ScoutNote, PlatformStats, Achievement } from '../types';

export const SPORTS_DATA: Sport[] = [
  {
    id: 'football',
    name: 'Football (Soccer)',
    icon: 'Activity',
    description: 'Pace, directional agility, technical ball handling and stamina assessment.',
    color: 'emerald',
    banner_gradient: 'from-emerald-600 to-teal-800',
    assessment_types: [
      {
        id: 'football_sprint_20m',
        sport_id: 'football',
        name: '20m Acceleration Sprint',
        short_name: '20m Sprint',
        category: 'speed',
        description: 'Measures explosive initial acceleration, stride mechanics, and top-end speed over 20 meters.',
        instructions: [
          'Position camera side-on at 10m mark, 5m distance from running path at waist height.',
          'Start from stationary 3-point or split-stance behind the initial line.',
          'Sprint at 100% effort past the 20m marker cone.',
          'Maintain natural running posture without leaning excessively after 10m.'
        ],
        camera_setup_guidelines: [
          'Tripod or stable phone mount at 90-degree lateral angle',
          'Good outdoor daylight or bright indoor lighting',
          'Capture full body height from head to toe across entire track'
        ],
        duration_sec: 12,
        metrics: [
          { name: 'Acceleration (0-10m)', key: 'accel_10m', unit: 'm/s²', description: 'Initial burst velocity rate', benchmark: 4.8, weight: 30 },
          { name: 'Top Speed', key: 'top_speed', unit: 'km/h', description: 'Peak velocity achieved', benchmark: 31.5, weight: 30 },
          { name: 'Stride Efficiency', key: 'stride_efficiency', unit: '%', description: 'Optimal stride length vs cadence ratio', benchmark: 88, weight: 20 },
          { name: 'Torso Forward Lean', key: 'torso_angle', unit: '°', description: 'Optimum 45° initial lean to 15° upright', benchmark: 85, weight: 20 },
        ]
      },
      {
        id: 'football_pro_agility',
        sport_id: 'football',
        name: 'Pro Agility Shuttle (5-10-5)',
        short_name: '5-10-5 Agility',
        category: 'agility',
        description: 'Evaluates rapid lateral deceleration, change-of-direction biomechanics, and hip lowering.',
        instructions: [
          'Set 3 cones 5 yards apart in a straight line.',
          'Start straddling the middle cone in athletic stance.',
          'Sprint 5 yds to right cone, touch line with hand, sprint 10 yds to left cone, sprint 5 yds back through middle.'
        ],
        camera_setup_guidelines: [
          'Front-facing wide-angle camera 7m away capturing all 3 cones',
          'Keep feet and touchlines in clear unobstructed view'
        ],
        duration_sec: 15,
        metrics: [
          { name: 'Change of Direction Time', key: 'cod_time', unit: 's', description: 'Time spent transitioning at turning points', benchmark: 0.42, weight: 35 },
          { name: 'Knee Flexion on Cut', key: 'knee_flexion', unit: '°', description: 'Depth of squat on plant foot (lower is more stable)', benchmark: 78, weight: 25 },
          { name: 'Lateral Push Force', key: 'lateral_force', unit: 'N/kg', description: 'Estimated ground reaction power', benchmark: 9.2, weight: 25 },
          { name: 'Body Balance Recovery', key: 'balance_score', unit: 'pts', description: 'Center of mass control post-turn', benchmark: 90, weight: 15 },
        ]
      },
      {
        id: 'football_dribble_weave',
        sport_id: 'football',
        name: 'Cone Weave Slalom Dribble',
        short_name: 'Dribble Agility',
        category: 'technique',
        description: 'Measures close ball control, touch frequency, and dynamic footwork precision under speed.',
        instructions: [
          'Place 5 cones 2m apart in a straight corridor.',
          'Dribble through cones using inside/outside of both feet.',
          'Finish with a quick acceleration burst past the final gate.'
        ],
        camera_setup_guidelines: [
          'Elevated 45-degree corner perspective or tracking camera',
          'Ensure ball and both feet are consistently visible'
        ],
        duration_sec: 20,
        metrics: [
          { name: 'Touch Frequency', key: 'touch_freq', unit: 'touches/s', description: 'Number of controlled contacts per second', benchmark: 2.4, weight: 30 },
          { name: 'Slalom Speed', key: 'slalom_speed', unit: 'm/s', description: 'Average traversal speed between markers', benchmark: 3.8, weight: 25 },
          { name: 'Bilateral Balance', key: 'foot_symmetry', unit: '%', description: 'Left vs Right foot touch ratio symmetry', benchmark: 85, weight: 25 },
          { name: 'Ball Proximity', key: 'ball_proximity', unit: 'cm', description: 'Average distance ball stays to foot', benchmark: 35, weight: 20 },
        ]
      }
    ]
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: 'Flame',
    description: 'Vertical explosiveness, lateral lane agility, shooting mechanics, and reaction time.',
    color: 'orange',
    banner_gradient: 'from-amber-600 to-orange-800',
    assessment_types: [
      {
        id: 'basketball_vertical_jump',
        sport_id: 'basketball',
        name: 'Countermovement Vertical Jump',
        short_name: 'Vertical Jump',
        category: 'power',
        description: 'Measures pure lower-limb explosive power, jump height, and takeoff kinetic chain alignment.',
        instructions: [
          'Stand in upright position facing the camera.',
          'Perform rapid countermovement downward dip and explode upward with maximum arm swing.',
          'Land softly on both feet in balanced position.'
        ],
        camera_setup_guidelines: [
          'Side or front view 4m away at waist level',
          'Include full ceiling height above athlete'
        ],
        duration_sec: 10,
        metrics: [
          { name: 'Jump Height', key: 'jump_height', unit: 'cm', description: 'Vertical displacement of center of mass', benchmark: 72, weight: 40 },
          { name: 'Takeoff Velocity', key: 'takeoff_velocity', unit: 'm/s', description: 'Speed leaving ground', benchmark: 3.6, weight: 25 },
          { name: 'Dip Angular Depth', key: 'dip_depth', unit: '°', description: 'Optimal 90-105° knee flexion at bottom of dip', benchmark: 92, weight: 20 },
          { name: 'Flight Time', key: 'flight_time', unit: 's', description: 'Airborne duration', benchmark: 0.68, weight: 15 },
        ]
      },
      {
        id: 'basketball_lane_agility',
        sport_id: 'basketball',
        name: 'NBA Lane Agility Drill',
        short_name: 'Lane Agility',
        category: 'agility',
        description: 'Standardized four-corner key traversal combining sprint, defensive slide, and backpedal.',
        instructions: [
          'Start at free throw line elbow.',
          'Sprint forward to baseline, defensive slide across lane, backpedal to elbow, slide back to start.'
        ],
        camera_setup_guidelines: [
          'High baseline mount or wide angle court view'
        ],
        duration_sec: 25,
        metrics: [
          { name: 'Total Time', key: 'lane_time', unit: 's', description: 'Completion time', benchmark: 11.2, weight: 35 },
          { name: 'Defensive Stance Height', key: 'stance_height', unit: '%', description: 'Low center of gravity maintenance during slides', benchmark: 82, weight: 25 },
          { name: 'Foot Crossover Faults', key: 'slide_integrity', unit: 'pts', description: 'Purity of defensive slide mechanics', benchmark: 92, weight: 25 },
          { name: 'Backpedal Cadence', key: 'backpedal_speed', unit: 'steps/s', description: 'Quickness of reverse turnover', benchmark: 3.5, weight: 15 },
        ]
      }
    ]
  },
  {
    id: 'athletics',
    name: 'Athletics (Track & Field)',
    icon: 'Zap',
    description: 'Sprint biomechanics, stride frequency, broad jump explosiveness, and reaction velocity.',
    color: 'cyan',
    banner_gradient: 'from-cyan-600 to-blue-800',
    assessment_types: [
      {
        id: 'athletics_flying_30m',
        sport_id: 'athletics',
        name: '30m Flying Sprint Max Velocity',
        short_name: '30m Flying Sprint',
        category: 'speed',
        description: 'Isolates pure maximum running velocity after a 20m acceleration build-up zone.',
        instructions: [
          'Build up maximum velocity over 20m run-in.',
          'Sprint at maximum speed through the 30m timing zone.',
          'Maintain tall upright posture, high knee drive, and dorsiflexed ankle recovery.'
        ],
        camera_setup_guidelines: [
          'Lateral tracking or side-fixed camera at 15m mark of timing zone'
        ],
        duration_sec: 15,
        metrics: [
          { name: 'Max Velocity', key: 'max_velocity', unit: 'm/s', description: 'Peak linear ground speed', benchmark: 10.2, weight: 40 },
          { name: 'Stride Cadence', key: 'stride_cadence', unit: 'steps/s', description: 'Step frequency at top speed', benchmark: 4.6, weight: 25 },
          { name: 'Ground Contact Time', key: 'gct', unit: 'ms', description: 'Foot strike dwell time (shorter is better)', benchmark: 95, weight: 20 },
          { name: 'Knee Lift Angle', key: 'knee_lift', unit: '°', description: 'Thigh angle to horizontal at peak swing', benchmark: 88, weight: 15 },
        ]
      },
      {
        id: 'athletics_broad_jump',
        sport_id: 'athletics',
        name: 'Standing Broad Jump',
        short_name: 'Broad Jump',
        category: 'power',
        description: 'Measures horizontal lower body power and triple-extension coordination.',
        instructions: [
          'Stand behind line with feet shoulder-width apart.',
          'Two-foot takeoff with explosive arm swing.',
          'Stick the landing on two feet without stepping backward.'
        ],
        camera_setup_guidelines: [
          'Perpendicular side-view camera capturing takeoff line and landing pit'
        ],
        duration_sec: 10,
        metrics: [
          { name: 'Distance', key: 'jump_distance', unit: 'm', description: 'Heel landing distance from line', benchmark: 2.75, weight: 45 },
          { name: 'Takeoff Angle', key: 'takeoff_angle', unit: '°', description: 'Optimal horizontal projection angle (40-45°)', benchmark: 42, weight: 25 },
          { name: 'Triple Extension Symmetry', key: 'extension_symmetry', unit: '%', description: 'Simultaneous hip/knee/ankle lockout', benchmark: 92, weight: 30 },
        ]
      }
    ]
  },
  {
    id: 'cricket',
    name: 'Cricket',
    icon: 'Trophy',
    description: 'Bowling arm mechanics, batting stance stability, and fielding throw reaction.',
    color: 'sky',
    banner_gradient: 'from-sky-600 to-indigo-800',
    assessment_types: [
      {
        id: 'cricket_bowling_biomechanics',
        sport_id: 'cricket',
        name: 'Fast Bowling Action & Release Speed',
        short_name: 'Bowling Action',
        category: 'technique',
        description: 'Analyzes front-foot plant bracing, bowling arm angle legality, and estimated ball release speed.',
        instructions: [
          'Set camera side-on to crease capturing run-up delivery stride and release.',
          'Bowl standard match delivery at target stumps.'
        ],
        camera_setup_guidelines: [
          'High-speed 60fps+ side camera aligned with bowling crease'
        ],
        duration_sec: 15,
        metrics: [
          { name: 'Release Velocity', key: 'release_speed', unit: 'km/h', description: 'Estimated ball speed at hand release', benchmark: 132, weight: 35 },
          { name: 'Front Knee Bracing', key: 'knee_brace', unit: '°', description: 'Straight front leg brace angle at delivery stride', benchmark: 168, weight: 30 },
          { name: 'Bowling Arm Extension', key: 'arm_extension', unit: '°', description: 'Elbow flex legality (<15 degrees)', benchmark: 8, weight: 20 },
          { name: 'Run-up Momentum Transfer', key: 'momentum_transfer', unit: '%', description: 'Kinetic energy conversion efficiency', benchmark: 86, weight: 15 },
        ]
      }
    ]
  }
];

export const INITIAL_ATHLETES: AthleteProfile[] = [
  {
    id: 'ath_1',
    user_id: 'user_ath_1',
    name: 'Marcus Vance',
    email: 'marcus.vance@athletes.net',
    age: 18,
    gender: 'male',
    height_cm: 184,
    weight_kg: 76,
    sport: 'football',
    position: 'Winger / Attacking Midfielder',
    experience_level: 'elite',
    location: 'Manchester, UK',
    bio: 'Dynamic left-footed winger with exceptional first-step burst and technical close control in 1v1 situations.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+44 7700 900123',
    overall_rating: 89,
    total_assessments: 8,
    created_at: '2025-11-12T10:00:00Z',
    updated_at: '2026-08-10T14:30:00Z'
  },
  {
    id: 'ath_2',
    user_id: 'user_ath_2',
    name: 'Elena Rostova',
    email: 'elena.rostova@track.org',
    age: 19,
    gender: 'female',
    height_cm: 175,
    weight_kg: 62,
    sport: 'athletics',
    position: '100m / 200m Sprinter',
    experience_level: 'elite',
    location: 'Munich, Germany',
    bio: 'Junior national finalist with outstanding top-end velocity and aggressive drive phase mechanics.',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    phone: '+49 151 23456789',
    overall_rating: 93,
    total_assessments: 12,
    created_at: '2025-10-05T09:15:00Z',
    updated_at: '2026-08-12T16:20:00Z'
  },
  {
    id: 'ath_3',
    user_id: 'user_ath_3',
    name: 'Devon Carter',
    email: 'devon.carter@hoops.com',
    age: 17,
    gender: 'male',
    height_cm: 196,
    weight_kg: 88,
    sport: 'basketball',
    position: 'Shooting Guard / Small Forward',
    experience_level: 'advanced',
    location: 'Chicago, USA',
    bio: 'Explosive guard with a 38-inch vertical jump and high lateral agility in transition defense.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 312 555 0188',
    overall_rating: 86,
    total_assessments: 6,
    created_at: '2026-01-20T11:45:00Z',
    updated_at: '2026-08-14T11:00:00Z'
  },
  {
    id: 'ath_4',
    user_id: 'user_ath_4',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@cricacademy.in',
    age: 18,
    gender: 'male',
    height_cm: 182,
    weight_kg: 74,
    sport: 'cricket',
    position: 'Right-Arm Fast Bowler',
    experience_level: 'advanced',
    location: 'Mumbai, India',
    bio: 'Express pacer clocking 135+ km/h with a clean, repeatable front-knee lock delivery action.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98201 54321',
    overall_rating: 85,
    total_assessments: 7,
    created_at: '2026-02-14T08:30:00Z',
    updated_at: '2026-08-15T09:40:00Z'
  },
  {
    id: 'ath_5',
    user_id: 'user_ath_5',
    name: 'Sofia Chen',
    email: 'sofia.chen@talent.io',
    age: 16,
    gender: 'female',
    height_cm: 168,
    weight_kg: 58,
    sport: 'football',
    position: 'Central Midfielder',
    experience_level: 'intermediate',
    location: 'Toronto, Canada',
    bio: 'Vision-oriented midfielder with high bilateral agility and rapid change of direction in tight spaces.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+1 416 555 0192',
    overall_rating: 81,
    total_assessments: 4,
    created_at: '2026-03-10T14:10:00Z',
    updated_at: '2026-08-01T15:20:00Z'
  }
];

export const INITIAL_ASSESSMENTS: Assessment[] = [
  {
    id: 'asm_101',
    athlete_id: 'ath_1',
    athlete_name: 'Marcus Vance',
    athlete_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    sport: 'football',
    assessment_type: 'football_sprint_20m',
    assessment_name: '20m Acceleration Sprint',
    status: 'completed',
    started_at: '2026-08-10T14:20:00Z',
    completed_at: '2026-08-10T14:23:45Z',
    overall_score: 89,
    tier: 'Elite Prospect',
    confidence_score: 96,
    metrics: {
      speed_score: 92,
      acceleration_score: 94,
      technique_score: 86,
      consistency_score: 84
    },
    raw_measurements: {
      '0-10m Split': '1.74s',
      '20m Total Time': '2.88s',
      'Top Velocity': '33.2 km/h',
      'Initial Torso Lean': '42.5°',
      'Average Stride Frequency': '4.45 steps/s'
    },
    biomechanics: {
      frame_count: 360,
      average_confidence: 0.96,
      joint_angles: {
        knee_flexion_avg: 74,
        trunk_inclination_avg: 22,
        hip_extension_avg: 165,
        arm_swing_amplitude: 88
      },
      stride_cadence_spm: 267,
      acceleration_peak_ms2: 5.4,
      ground_contact_time_ms: 104
    },
    strengths: [
      'Explosive first 3 strides with optimal 42.5° torso angle',
      'Minimal ground contact time (104ms) in maximum velocity phase',
      'Aggressive arm drive maintaining linear momentum'
    ],
    improvement_areas: [
      'Slight lateral knee wobble on left foot strike during transition',
      'Can increase stride length by 3% in final 5m with deeper hip extension'
    ],
    recommendations: [
      {
        id: 'rec_1',
        title: 'Single-Leg Isometric Hip Thrusts',
        description: 'Perform 3 sets of 8 reps per leg with 3-second hold to solidify pelvic stability and maximize hip extension.',
        category: 'Strength & Biomechanics',
        priority: 'high',
        drill_type: 'Gym Conditioning'
      },
      {
        id: 'rec_2',
        title: 'Resisted Sled Accelerations (10m)',
        description: 'Use 10-15% bodyweight sled to reinforce low torso drive phase and ground force application.',
        category: 'Speed Training',
        priority: 'medium',
        drill_type: 'On-Pitch Drill'
      }
    ],
    model_version: 'vision-pose-v2.4',
    scout_feedback_count: 3,
    created_at: '2026-08-10T14:20:00Z',
    updated_at: '2026-08-10T14:24:00Z'
  },
  {
    id: 'asm_102',
    athlete_id: 'ath_2',
    athlete_name: 'Elena Rostova',
    athlete_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    sport: 'athletics',
    assessment_type: 'athletics_flying_30m',
    assessment_name: '30m Flying Sprint Max Velocity',
    status: 'completed',
    started_at: '2026-08-12T16:15:00Z',
    completed_at: '2026-08-12T16:18:12Z',
    overall_score: 93,
    tier: 'National Level',
    confidence_score: 98,
    metrics: {
      speed_score: 96,
      agility_score: 88,
      technique_score: 94,
      consistency_score: 92
    },
    raw_measurements: {
      'Flying 30m Time': '3.22s',
      'Max Velocity': '10.85 m/s (39.0 km/h)',
      'Stride Cadence': '4.82 steps/s',
      'Ground Contact Time': '89 ms',
      'Peak Knee Lift': '91.2°'
    },
    biomechanics: {
      frame_count: 420,
      average_confidence: 0.98,
      joint_angles: {
        knee_flexion_avg: 71,
        trunk_inclination_avg: 12,
        hip_extension_avg: 172,
        arm_swing_amplitude: 94
      },
      stride_cadence_spm: 289,
      acceleration_peak_ms2: 6.1,
      ground_contact_time_ms: 89
    },
    strengths: [
      'World-class ground contact time under 90ms',
      'Perfect vertical posture maintenance with minimal braking force',
      'Flawless frontside knee lift and dorsiflexed strike'
    ],
    improvement_areas: [
      'Relaxation in neck and shoulder girdle at absolute top speed'
    ],
    recommendations: [
      {
        id: 'rec_3',
        title: 'Flying 20m In-and-Outs',
        description: 'Focus on conscious facial and trapezius relaxation while sustaining 98% maximum velocity.',
        category: 'Speed & Neuromuscular',
        priority: 'low',
        drill_type: 'Track Interval'
      }
    ],
    model_version: 'vision-pose-v2.4',
    scout_feedback_count: 5,
    created_at: '2026-08-12T16:15:00Z',
    updated_at: '2026-08-12T16:18:20Z'
  },
  {
    id: 'asm_103',
    athlete_id: 'ath_3',
    athlete_name: 'Devon Carter',
    athlete_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    sport: 'basketball',
    assessment_type: 'basketball_vertical_jump',
    assessment_name: 'Countermovement Vertical Jump',
    status: 'completed',
    started_at: '2026-08-14T10:50:00Z',
    completed_at: '2026-08-14T10:54:10Z',
    overall_score: 86,
    tier: 'Regional Talent',
    confidence_score: 94,
    metrics: {
      speed_score: 82,
      agility_score: 85,
      technique_score: 88,
      consistency_score: 89
    },
    raw_measurements: {
      'Jump Height': '84 cm (33.1 in)',
      'Flight Time': '0.74s',
      'Takeoff Velocity': '3.82 m/s',
      'Squat Dip Angle': '94°'
    },
    biomechanics: {
      frame_count: 280,
      average_confidence: 0.94,
      joint_angles: {
        knee_flexion_avg: 94,
        trunk_inclination_avg: 38,
        hip_extension_avg: 176,
        arm_swing_amplitude: 110
      },
      acceleration_peak_ms2: 7.2,
      reaction_time_ms: 195
    },
    strengths: [
      'Synchronized explosive arm swing adding ~12% vertical impulse',
      'Symmetric force distribution on bilateral landing'
    ],
    improvement_areas: [
      'Can shorten amortization transition phase at bottom of dip for greater stretch-shortening cycle return'
    ],
    recommendations: [
      {
        id: 'rec_4',
        title: 'Depth Drop Rebound Jumps (30cm Box)',
        description: 'Drop from box and immediately rebound upward with minimum ground dwell time.',
        category: 'Plyometrics',
        priority: 'high',
        drill_type: 'Court Power'
      }
    ],
    model_version: 'vision-pose-v2.4',
    scout_feedback_count: 2,
    created_at: '2026-08-14T10:50:00Z',
    updated_at: '2026-08-14T10:54:20Z'
  }
];

export const INITIAL_LEADERBOARD: LeaderboardItem[] = [
  {
    rank: 1,
    athlete_id: 'ath_2',
    display_name: 'Elena Rostova',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    sport: 'athletics',
    assessment_type: '30m Flying Sprint',
    score: 93,
    speed_score: 96,
    agility_score: 88,
    technique_score: 94,
    consistency_score: 92,
    age: 19,
    location: 'Munich, Germany',
    verified: true,
    tier: 'National Level',
    recorded_at: '2026-08-12'
  },
  {
    rank: 2,
    athlete_id: 'ath_1',
    display_name: 'Marcus Vance',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    sport: 'football',
    assessment_type: '20m Acceleration Sprint',
    score: 89,
    speed_score: 92,
    agility_score: 90,
    technique_score: 86,
    consistency_score: 84,
    age: 18,
    location: 'Manchester, UK',
    verified: true,
    tier: 'Elite Prospect',
    recorded_at: '2026-08-10'
  },
  {
    rank: 3,
    athlete_id: 'ath_3',
    display_name: 'Devon Carter',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    sport: 'basketball',
    assessment_type: 'Vertical Jump',
    score: 86,
    speed_score: 82,
    agility_score: 85,
    technique_score: 88,
    consistency_score: 89,
    age: 17,
    location: 'Chicago, USA',
    verified: true,
    tier: 'Regional Talent',
    recorded_at: '2026-08-14'
  },
  {
    rank: 4,
    athlete_id: 'ath_4',
    display_name: 'Aarav Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    sport: 'cricket',
    assessment_type: 'Bowling Action',
    score: 85,
    speed_score: 88,
    agility_score: 80,
    technique_score: 87,
    consistency_score: 85,
    age: 18,
    location: 'Mumbai, India',
    verified: true,
    tier: 'Regional Talent',
    recorded_at: '2026-08-15'
  },
  {
    rank: 5,
    athlete_id: 'ath_5',
    display_name: 'Sofia Chen',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    sport: 'football',
    assessment_type: 'Dribble Agility',
    score: 81,
    speed_score: 79,
    agility_score: 84,
    technique_score: 82,
    consistency_score: 80,
    age: 16,
    location: 'Toronto, Canada',
    verified: false,
    tier: 'Developmental',
    recorded_at: '2026-08-01'
  }
];

export const INITIAL_SCOUT_NOTES: ScoutNote[] = [
  {
    id: 'scout_note_1',
    scout_id: 'scout_44',
    scout_name: 'Coach Hans Richter (Bayern Academy)',
    athlete_id: 'ath_1',
    note: 'Rare explosive first step. Biomechanical video proves 104ms contact time. Recommend inviting for U-19 spring trial.',
    rating: 9.2,
    status: 'shortlisted',
    tags: ['High Acceleration', 'Pro Contract Potential', 'Agile'],
    created_at: '2026-08-11T10:00:00Z'
  },
  {
    id: 'scout_note_2',
    scout_id: 'scout_88',
    scout_name: 'Sarah Jenkins (Olympic Development Scout)',
    athlete_id: 'ath_2',
    note: 'Elena has international medal caliber mechanics. Stride frequency of 4.82 steps/sec matches senior international benchmarks.',
    rating: 9.6,
    status: 'trial_offered',
    tags: ['National Record Pace', 'Sprint Form', 'Elite'],
    created_at: '2026-08-13T11:30:00Z'
  }
];

export const PLATFORM_STATS: PlatformStats = {
  total_athletes: 1420,
  total_assessments: 4890,
  sports_supported: 4,
  ai_accuracy_rate: 97.4,
  scouts_active: 135,
  verified_talents: 380
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_1',
    athlete_id: 'ath_1',
    title: 'Regional U-18 Cup Winner & Top Scorer',
    sport: 'football',
    event_name: 'Greater Manchester Youth Championship',
    date_achieved: '2026-05-18',
    evidence_type: 'Digital Certificate',
    certificate_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
    verification_status: 'verified',
    verified_by: 'Manchester District FA',
    verified_at: '2026-05-22T10:00:00Z',
    notes: 'Awarded Golden Boot (14 goals in 8 matches) and Tournament MVP.'
  },
  {
    id: 'ach_2',
    athlete_id: 'ath_1',
    title: 'County Athletics 100m Sprint Silver Medal',
    sport: 'athletics',
    event_name: 'North West Schools Track Meet',
    date_achieved: '2026-06-04',
    evidence_type: 'Competition Result',
    certificate_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
    verification_status: 'verified',
    verified_by: 'County Athletics Board',
    verified_at: '2026-06-10T14:30:00Z',
    notes: 'Clocked official electronic timing 10.92s in U-19 final.'
  }
];

export const INITIAL_COMMUNITY_POSTS = [
  {
    id: 'post_1',
    author_id: 'user_ath_1',
    author_name: 'Marcus Vance',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    author_level: 4,
    author_level_name: 'State Finalist',
    author_level_icon: '⚡',
    author_badge: 'Acceleration Virtuoso',
    post_type: 'ACHIEVEMENT' as const,
    sport: 'football',
    title: 'New Personal Best on 20m Acceleration Sprint!',
    content: 'Just completed my verified video assessment on the 20m Acceleration Sprint. Dropped my 0-10m split time to 1.62s and hit 32.4 km/h peak speed! The biomechanical feedback on torso forward lean during the drive phase made a huge difference.',
    media_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
    media_type: 'image' as const,
    like_count: 38,
    comment_count: 5,
    liked_by_current_user: false,
    created_at: '2026-08-18T09:30:00Z',
    updated_at: '2026-08-18T09:30:00Z'
  },
  {
    id: 'post_2',
    author_id: 'user_ath_2',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    author_level: 5,
    author_level_name: 'National Prodigy',
    author_level_icon: '🌟',
    author_badge: 'Sub-11 Vanguard',
    post_type: 'TRAINING' as const,
    sport: 'athletics',
    title: 'Plyometric Hurdle Bounds & Ground Contact Efficiency',
    content: 'Focusing heavily this week on decreasing ground contact time on high-speed transitions. Mediapipe analysis showed my stride cadence reached 4.82 steps/second on my latest 100m sprint. Consistency every single day compounds!',
    media_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
    media_type: 'image' as const,
    like_count: 64,
    comment_count: 8,
    liked_by_current_user: true,
    created_at: '2026-08-17T16:45:00Z',
    updated_at: '2026-08-17T16:45:00Z'
  },
  {
    id: 'post_3',
    author_id: 'user_ath_3',
    author_name: 'David Chen',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    author_level: 3,
    author_level_name: 'Regional Contender',
    author_level_icon: '🔥',
    author_badge: 'Apex Leaper',
    post_type: 'QUESTION' as const,
    sport: 'basketball',
    title: 'Countermovement Jump: Arm swing timing tips?',
    content: 'Looking for coaching tips on optimizing arm-swing eccentric loading right before takeoff on the vertical jump assessment. My countermovement depth is around 78 degrees at the knee, but I feel like I might be losing peak ground reaction force on the upswing. Any recommendations from track or basketball coaches here?',
    like_count: 19,
    comment_count: 6,
    liked_by_current_user: false,
    created_at: '2026-08-16T14:10:00Z',
    updated_at: '2026-08-16T14:10:00Z'
  },
  {
    id: 'post_4',
    author_id: 'user_ath_4',
    author_name: 'Amara Okafor',
    author_avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    author_level: 4,
    author_level_name: 'State Finalist',
    author_level_icon: '⚡',
    author_badge: 'Agility Maestro',
    post_type: 'PROGRESS' as const,
    sport: 'tennis',
    title: 'Spider Drill: 14.8s benchmark broken!',
    content: 'After 3 weeks of deceleration drills and lower hip positioning at the court boundary lines, my change-of-direction recovery latency dropped below 0.38 seconds. Grateful for the objective video benchmark feedback on The Elitez!',
    media_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=80',
    media_type: 'image' as const,
    like_count: 47,
    comment_count: 4,
    liked_by_current_user: false,
    created_at: '2026-08-15T18:20:00Z',
    updated_at: '2026-08-15T18:20:00Z'
  }
];

export const INITIAL_POST_COMMENTS = [
  {
    id: 'comm_1',
    post_id: 'post_1',
    author_id: 'user_ath_2',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    author_level: 5,
    author_level_name: 'National Prodigy',
    author_level_icon: '🌟',
    content: 'Huge progress Marcus! Sustaining the 45-degree angle in the first 3 steps is everything for sub-1.7s splits.',
    created_at: '2026-08-18T10:05:00Z'
  },
  {
    id: 'comm_2',
    post_id: 'post_1',
    author_id: 'user_scout_1',
    author_name: 'Sarah Jenkins (Scout)',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    author_level: 6,
    author_level_name: 'Elite Master',
    author_level_icon: '🏆',
    content: 'The video mechanics look very clean on the deceleration taper too. Keep up the high standard.',
    created_at: '2026-08-18T10:45:00Z'
  },
  {
    id: 'comm_3',
    post_id: 'post_3',
    author_id: 'user_ath_1',
    author_name: 'Marcus Vance',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    author_level: 4,
    author_level_name: 'State Finalist',
    author_level_icon: '⚡',
    content: 'Try initiating the downswing slightly before your knees reach maximum flexion. That pre-stretches the posterior chain and gives an extra 2-3 inches!',
    created_at: '2026-08-16T15:20:00Z'
  }
];

export const INITIAL_OPPORTUNITIES = [
  {
    id: 'opp_1',
    title: 'National U-19 Football Elite Scouting Trials 2026',
    description: 'Annual premier scouting trials conducted by the National Development Football Federation. Top 30 selected athletes will receive full-tuition residential academy scholarships and direct pathway into division-1 youth reserves.',
    organization_name: 'National Youth Football Development Board',
    organization_logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
    opportunity_type: 'TRIAL' as const,
    sport: 'football',
    location: 'National Sports Complex, Manchester, UK',
    is_remote: false,
    start_date: '2026-09-18T09:00:00Z',
    end_date: '2026-09-20T17:00:00Z',
    application_deadline: '2026-09-10T23:59:59Z',
    eligibility: 'Athletes born between 2008 and 2010. Must submit at least 2 verified video assessments on The Elitez platform.',
    requirements: [
      'Verified 20m sprint assessment score above 80',
      'Valid medical fitness clearance certificate',
      'National youth registration number'
    ],
    benefits: [
      'Full 2-year residential sports academy scholarship',
      'UEFA-licensed coaching staff evaluation',
      'Live showcase in front of premier league scouts'
    ],
    registration_url: 'https://theelitez.org/trials/football-u19-national',
    contact_email: 'trials@nationalfootballboard.org',
    contact_phone: '+44 161 820 4099',
    status: 'VERIFIED' as const,
    is_verified: true,
    created_by: 'admin_official',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-15T12:00:00Z'
  },
  {
    id: 'opp_2',
    title: 'State Sprint & Hurdle Athletics Championship 2026',
    description: 'Official state-level qualifying tournament for the National Athletics Games. All standard track sprint events (100m, 200m, 400m, 110m hurdles) with electronic timing gates and anti-doping accreditation.',
    organization_name: 'Athletics Federation State Chapter',
    organization_logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=150&auto=format&fit=crop&q=80',
    opportunity_type: 'COMPETITION' as const,
    sport: 'athletics',
    location: 'Olympic Stadium, London, UK',
    is_remote: false,
    start_date: '2026-09-26T08:00:00Z',
    end_date: '2026-09-27T19:00:00Z',
    application_deadline: '2026-09-15T23:59:59Z',
    eligibility: 'U-18 and U-21 male & female track athletes with club/school affiliation.',
    requirements: [
      'Official verified 100m or 200m qualifying standard entry',
      'State Athletics ID card',
      'Entry registration fee waiver for verified top-10 leaderboard athletes'
    ],
    benefits: [
      'Official qualification points for National Games',
      'Medals, trophies, and athletic gear sponsorships',
      'Recorded multi-angle video archive'
    ],
    registration_url: 'https://stateathletics.org/championships-2026',
    contact_email: 'events@stateathletics.org',
    contact_phone: '+44 20 7946 0912',
    status: 'VERIFIED' as const,
    is_verified: true,
    created_by: 'admin_official',
    created_at: '2026-08-05T09:00:00Z',
    updated_at: '2026-08-16T11:00:00Z'
  },
  {
    id: 'opp_3',
    title: 'High Performance Basketball Combine & Scholarship Camp',
    description: 'Intensive 4-day athletic combine and skills showcase for aspiring collegiate and pro basketball athletes. Features NBA draft combine testing protocols: standing vertical, lane agility, 3/4 court sprint, and scrimmage play.',
    organization_name: 'Apex Hoops Global Academy',
    organization_logo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80',
    opportunity_type: 'CAMP' as const,
    sport: 'basketball',
    location: 'National Basketball Performance Arena, Birmingham, UK',
    is_remote: false,
    start_date: '2026-10-02T10:00:00Z',
    end_date: '2026-10-05T18:00:00Z',
    application_deadline: '2026-09-22T23:59:59Z',
    eligibility: 'Ages 16-22 with verified high school, club, or collegiate basketball experience.',
    requirements: [
      'Minimum standing reach 7ft 6in or verified vertical jump > 26 inches',
      'Letter of recommendation from club coach or verified Elitez profile'
    ],
    benefits: [
      'Direct exposure to 20+ NCAA and European club scouts',
      'Complete biomechanical combine performance profile',
      'Top 3 MVP awards with collegiate scholarship recommendations'
    ],
    registration_url: 'https://apexhoops.org/combine-2026',
    contact_email: 'combine@apexhoops.org',
    contact_phone: '+44 121 496 0300',
    status: 'VERIFIED' as const,
    is_verified: true,
    created_by: 'admin_official',
    created_at: '2026-08-08T14:00:00Z',
    updated_at: '2026-08-17T10:00:00Z'
  },
  {
    id: 'opp_4',
    title: 'Youth Tennis Future Champions Scholarship 2026-2027',
    description: 'Fully funded annual scholarship grant including year-round court time, tournament travel grants, and personalized conditioning coaching for talented junior tennis athletes.',
    organization_name: 'International Tennis Heritage Foundation',
    organization_logo: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=150&auto=format&fit=crop&q=80',
    opportunity_type: 'SCHOLARSHIP' as const,
    sport: 'tennis',
    location: 'National Tennis Center, London, UK',
    is_remote: false,
    start_date: '2026-11-01T08:00:00Z',
    end_date: '2027-10-31T18:00:00Z',
    application_deadline: '2026-10-01T23:59:59Z',
    eligibility: 'Junior players aged 14-19 with verified national or regional tournament ranking.',
    requirements: [
      'ITF / National ranking certification',
      'Video assessment submissions on Serve Velocity and Spider Agility Drill',
      'Academic progress report'
    ],
    benefits: [
      '£18,000 annual tournament travel and training endowment',
      'Dedicated strength & conditioning coach',
      'Sponsorship equipment package'
    ],
    registration_url: 'https://tennis-heritage-foundation.org/scholarship-2026',
    contact_email: 'grants@tennis-heritage-foundation.org',
    contact_phone: '+44 20 8946 2244',
    status: 'VERIFIED' as const,
    is_verified: true,
    created_by: 'admin_official',
    created_at: '2026-08-10T12:00:00Z',
    updated_at: '2026-08-18T08:00:00Z'
  }
];

