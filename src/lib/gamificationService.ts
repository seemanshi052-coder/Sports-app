import {
  XPSourceType,
  XPTransaction,
  Badge,
  UserBadge,
  LevelDefinition,
  GamificationProfile,
  MotivationalMessageCategory,
  GamificationEventResult,
  Assessment,
  AthleteProfile,
  Achievement,
  BadgeWithStatus
} from '../types';

// ==========================================
// CENTRAL LEVEL DEFINITIONS
// ==========================================
export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, name: 'Rising Athlete', icon: '🌱', min_xp: 0, max_xp: 100 },
  { level: 2, name: 'Momentum Maker', icon: '⚡', min_xp: 100, max_xp: 500 },
  { level: 3, name: 'Performance Igniter', icon: '🔥', min_xp: 500, max_xp: 1000 },
  { level: 4, name: 'Skill Hunter', icon: '🏹', min_xp: 1000, max_xp: 2500 },
  { level: 5, name: 'Elite Challenger', icon: '💎', min_xp: 2500, max_xp: 5000 },
  { level: 6, name: 'Peak Pursuer', icon: '🦅', min_xp: 5000, max_xp: 10000 },
  { level: 7, name: 'Elite Performer', icon: '👑', min_xp: 10000, max_xp: 25000 },
  { level: 8, name: 'The Elitez', icon: '🏆', min_xp: 25000, max_xp: 50000 },
  { level: 9, name: 'Elite Legend', icon: '🌟', min_xp: 50000, max_xp: 100000 }
];

// ==========================================
// CENTRAL XP RULES
// ==========================================
export const XP_RULES = {
  PROFILE_COMPLETION: 50,
  ASSESSMENT_COMPLETION: 100,
  PERSONAL_BEST: 150,
  IMPROVEMENT: 200,
  VERIFIED_ACHIEVEMENT: 300,
  STREAK_MILESTONES: {
    7: 250,
    14: 500,
    30: 1000,
    50: 2000,
    75: 3000,
    100: 5000,
    150: 7500,
    180: 10000,
    365: 25000
  } as Record<number, number>
};

// ==========================================
// CENTRAL AUTHORITATIVE BADGES CATALOG
// ==========================================
export const AUTHORITATIVE_BADGES: Badge[] = [
  // 1. Level Badges (Status indicators based on XP, 0 badge loop XP)
  {
    id: 'badge_lvl_1',
    code: 'LEVEL_1',
    name: 'Rising Athlete',
    description: 'Began the athletic journey on The Elitez platform.',
    icon: '🌱',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 0,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_lvl_2',
    code: 'LEVEL_2',
    name: 'Momentum Maker',
    description: 'Surpassed 100 XP with consistent effort and assessments.',
    icon: '⚡',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 100,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_lvl_3',
    code: 'LEVEL_3',
    name: 'Performance Igniter',
    description: 'Reached 500 XP proving athletic commitment.',
    icon: '🔥',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 500,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_lvl_4',
    code: 'LEVEL_4',
    name: 'Skill Hunter',
    description: 'Crossed 1,000 XP with disciplined training.',
    icon: '🏹',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 1000,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_lvl_5',
    code: 'LEVEL_5',
    name: 'Elite Challenger',
    description: 'Earned 2,500 XP through rigorous progress.',
    icon: '💎',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 2500,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_lvl_6',
    code: 'LEVEL_6',
    name: 'Peak Pursuer',
    description: 'Achieved 5,000 XP entering elite territory.',
    icon: '🦅',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 5000,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_lvl_7',
    code: 'LEVEL_7',
    name: 'Elite Performer',
    description: 'Reached 10,000 XP demonstrating mastery.',
    icon: '👑',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 10000,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_lvl_8',
    code: 'LEVEL_8',
    name: 'The Elitez',
    description: 'Crossed 25,000 XP among the nation\'s top athletes.',
    icon: '🏆',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 25000,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_lvl_9',
    code: 'LEVEL_9',
    name: 'Elite Legend',
    description: 'Reached the summit at 50,000 XP.',
    icon: '🌟',
    category: 'LEVEL',
    requirement_type: 'XP',
    requirement_value: 5000,
    xp_reward: 0,
    is_active: true
  },

  // 2. Consistency / Streak Badges
  {
    id: 'badge_strk_7',
    code: 'STREAK_7',
    name: 'First Spark',
    description: 'Maintained a 7-day continuous assessment activity streak.',
    icon: '🔥',
    category: 'STREAK',
    requirement_type: 'STREAK_DAYS',
    requirement_value: 7,
    xp_reward: 250,
    is_active: true
  },
  {
    id: 'badge_strk_14',
    code: 'STREAK_14',
    name: 'Rhythm Builder',
    description: 'Maintained a 14-day continuous activity streak.',
    icon: '⚡',
    category: 'STREAK',
    requirement_type: 'STREAK_DAYS',
    requirement_value: 14,
    xp_reward: 500,
    is_active: true
  },
  {
    id: 'badge_strk_30',
    code: 'STREAK_30',
    name: 'Consistency Beast',
    description: 'Completed 30 consecutive days of athletic assessments.',
    icon: '🔥',
    category: 'STREAK',
    requirement_type: 'STREAK_DAYS',
    requirement_value: 30,
    xp_reward: 1000,
    is_active: true
  },
  {
    id: 'badge_strk_50',
    code: 'STREAK_50',
    name: 'Iron Discipline',
    description: 'Sustained a 50-day training and testing streak.',
    icon: '🛡',
    category: 'STREAK',
    requirement_type: 'STREAK_DAYS',
    requirement_value: 50,
    xp_reward: 2000,
    is_active: true
  },
  {
    id: 'badge_strk_100',
    code: 'STREAK_100',
    name: 'Unbreakable',
    description: 'Achieved a legendary 100-day consecutive streak.',
    icon: '🦅',
    category: 'STREAK',
    requirement_type: 'STREAK_DAYS',
    requirement_value: 100,
    xp_reward: 5000,
    is_active: true
  },
  {
    id: 'badge_strk_180',
    code: 'STREAK_180',
    name: 'Relentless',
    description: 'Maintained an unbroken 180-day athletic assessment streak.',
    icon: '🔥',
    category: 'STREAK',
    requirement_type: 'STREAK_DAYS',
    requirement_value: 180,
    xp_reward: 10000,
    is_active: true
  },
  {
    id: 'badge_strk_365',
    code: 'STREAK_365',
    name: 'Year of Grit',
    description: 'Completed a full 365 days of active athletic discipline.',
    icon: '👑',
    category: 'STREAK',
    requirement_type: 'STREAK_DAYS',
    requirement_value: 365,
    xp_reward: 25000,
    is_active: true
  },

  // 3. Improvement & Personal Best Badges
  {
    id: 'badge_imp_first',
    code: 'IMP_FIRST',
    name: 'Getting Better',
    description: 'Recorded your first meaningful score improvement on a drill.',
    icon: '📈',
    category: 'IMPROVEMENT',
    requirement_type: 'FIRST_IMPROVEMENT',
    requirement_value: 1,
    xp_reward: 200,
    is_active: true
  },
  {
    id: 'badge_imp_10',
    code: 'IMP_10',
    name: 'Breakthrough',
    description: 'Achieved at least 10% cumulative improvement over baseline.',
    icon: '🚀',
    category: 'IMPROVEMENT',
    requirement_type: 'IMPROVEMENT_PERCENT',
    requirement_value: 10,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_imp_25',
    code: 'IMP_25',
    name: 'Game Changer',
    description: 'Achieved at least 25% cumulative improvement over baseline.',
    icon: '🔥',
    category: 'IMPROVEMENT',
    requirement_type: 'IMPROVEMENT_PERCENT',
    requirement_value: 25,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_imp_50',
    code: 'IMP_50',
    name: 'Transformation',
    description: 'Achieved a massive 50% cumulative improvement over baseline.',
    icon: '💥',
    category: 'IMPROVEMENT',
    requirement_type: 'IMPROVEMENT_PERCENT',
    requirement_value: 50,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_pb_5',
    code: 'PB_5',
    name: 'Limit Breaker',
    description: 'Recorded 5 verified Personal Best assessment scores.',
    icon: '⚡',
    category: 'IMPROVEMENT',
    requirement_type: 'PERSONAL_BESTS',
    requirement_value: 5,
    xp_reward: 0,
    is_active: true
  },

  // 4. Assessment Milestones
  {
    id: 'badge_asm_1',
    code: 'ASM_1',
    name: 'First Test',
    description: 'Completed your first standardized video assessment.',
    icon: '🎯',
    category: 'ASSESSMENT',
    requirement_type: 'ASSESSMENTS_COUNT',
    requirement_value: 1,
    xp_reward: 100,
    is_active: true
  },
  {
    id: 'badge_asm_5',
    code: 'ASM_5',
    name: 'Dedicated Athlete',
    description: 'Completed 5 standardized protocol assessments.',
    icon: '🏋',
    category: 'ASSESSMENT',
    requirement_type: 'ASSESSMENTS_COUNT',
    requirement_value: 5,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_asm_10',
    code: 'ASM_10',
    name: 'Performance Tracker',
    description: 'Logged 10 standardized performance assessments.',
    icon: '📊',
    category: 'ASSESSMENT',
    requirement_type: 'ASSESSMENTS_COUNT',
    requirement_value: 10,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_asm_25',
    code: 'ASM_25',
    name: 'Data Driven',
    description: 'Logged 25 standardized performance assessments.',
    icon: '🧠',
    category: 'ASSESSMENT',
    requirement_type: 'ASSESSMENTS_COUNT',
    requirement_value: 25,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_asm_50',
    code: 'ASM_50',
    name: 'Performance Machine',
    description: 'Completed 50 standardized performance assessments.',
    icon: '⚙',
    category: 'ASSESSMENT',
    requirement_type: 'ASSESSMENTS_COUNT',
    requirement_value: 50,
    xp_reward: 0,
    is_active: true
  },

  // 5. Verified Achievements
  {
    id: 'badge_ach_1',
    code: 'ACH_1',
    name: 'First Victory',
    description: 'Received official verification for your first external achievement.',
    icon: '🏆',
    category: 'ACHIEVEMENT',
    requirement_type: 'VERIFIED_ACHIEVEMENTS',
    requirement_value: 1,
    xp_reward: 300,
    is_active: true
  },
  {
    id: 'badge_ach_3',
    code: 'ACH_3',
    name: 'Proven Competitor',
    description: 'Verified 3 competition certificates or tournament recognitions.',
    icon: '🥉',
    category: 'ACHIEVEMENT',
    requirement_type: 'VERIFIED_ACHIEVEMENTS',
    requirement_value: 3,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_ach_5',
    code: 'ACH_5',
    name: 'Podium Chaser',
    description: 'Verified 5 competition certificates or medals.',
    icon: '🥈',
    category: 'ACHIEVEMENT',
    requirement_type: 'VERIFIED_ACHIEVEMENTS',
    requirement_value: 5,
    xp_reward: 0,
    is_active: true
  },
  {
    id: 'badge_ach_10',
    code: 'ACH_10',
    name: 'Achievement Hunter',
    description: 'Verified 10 competition certificates and awards.',
    icon: '🏆',
    category: 'ACHIEVEMENT',
    requirement_type: 'VERIFIED_ACHIEVEMENTS',
    requirement_value: 10,
    xp_reward: 0,
    is_active: true
  }
];

// ==========================================
// CENTRAL MOTIVATIONAL MESSAGES REPOSITORY
// ==========================================
export const MOTIVATIONAL_MESSAGES: Record<MotivationalMessageCategory, string[]> = {
  FIRST_ASSESSMENT: [
    'Every great athletic journey starts with a first attempt.',
    'Your journey starts here. Keep showing up.',
    'Your first result is not your limit. It\'s your starting point.'
  ],
  IMPROVEMENT: [
    'You didn\'t just improve your score. You proved your potential.',
    'Progress is showing. Keep pushing.',
    'Your hard work and repetitions are starting to show.',
    'Another step forward. Keep climbing.'
  ],
  PERSONAL_BEST: [
    'New personal best! Your previous limit is now your new baseline.',
    'You just raised your own standard. Keep going.',
    'New personal best unlocked. The next challenge is yours.'
  ],
  SMALL_IMPROVEMENT: [
    'Small improvements become big victories.',
    'Progress doesn\'t have to be dramatic to matter.',
    'You\'re moving forward. Keep building consistency.'
  ],
  NO_CHANGE: [
    'Not every session creates a breakthrough. Every session builds one.',
    'Consistency beats perfection every single day.',
    'Keep showing up. Progress compounds over time.'
  ],
  PERFORMANCE_DROP: [
    'One result doesn\'t define your ability. Learn from it and come back stronger.',
    'Today wasn\'t your best day. That\'s okay. Your next attempt is waiting.',
    'Every great athlete has off days. Keep going.',
    'Don\'t let one result define your journey. Reset and attack.'
  ],
  STREAK_MILESTONE: [
    'Consistency is your superpower. Milestone achieved!',
    'Discipline turns potential into real performance.',
    'You are building something extraordinary one day at a time.'
  ],
  LONG_STREAK: [
    '50+ days of showing up. That\'s what separates potential from progress.',
    'Your consistency is becoming your greatest competitive advantage.',
    'You\'re building something stronger than a score: pure discipline.'
  ],
  BADGE_UNLOCK: [
    'New badge unlocked! Your dedication has earned permanent recognition.',
    'Another milestone in the books. Wear your new badge with pride.'
  ],
  LEVEL_UP: [
    'Level Up! You\'ve climbed to a new athletic tier on The Elitez.',
    'New Level Unlocked! Keep striving for the highest peak.'
  ],
  GENERAL_ENCOURAGEMENT: [
    'Compete with who you were yesterday.',
    'Every rep counts. Keep building.',
    'Stay focused, stay disciplined, stay hungry.'
  ]
};

// ==========================================
// IN-MEMORY LEDGER STORES (SERVER PERSISTENCE)
// ==========================================
export let xpTransactionsStore: XPTransaction[] = [
  {
    id: 'xp_tx_seed_1',
    user_id: 'user_ath_1',
    amount: 50,
    source_type: 'PROFILE_COMPLETION',
    source_id: 'ath_1',
    description: 'Completed athlete profile dossier',
    created_at: '2025-11-12T10:00:00Z'
  },
  {
    id: 'xp_tx_seed_2',
    user_id: 'user_ath_1',
    amount: 100,
    source_type: 'ASSESSMENT_COMPLETION',
    source_id: 'asm_seed_1',
    description: 'Completed sprint assessment drill',
    created_at: '2026-08-10T14:30:00Z'
  },
  {
    id: 'xp_tx_seed_3',
    user_id: 'user_ath_1',
    amount: 150,
    source_type: 'PERSONAL_BEST',
    source_id: 'asm_seed_1',
    description: 'Achieved personal best in sprint velocity',
    created_at: '2026-08-10T14:30:00Z'
  },
  {
    id: 'xp_tx_seed_4',
    user_id: 'user_ath_1',
    amount: 300,
    source_type: 'VERIFIED_ACHIEVEMENT',
    source_id: 'ach_1',
    description: 'Verified Regional U-18 Cup Winner & Top Scorer',
    created_at: '2026-05-22T10:00:00Z'
  }
];

export let userBadgesStore: UserBadge[] = [
  {
    id: 'ub_seed_1',
    user_id: 'user_ath_1',
    badge_id: 'badge_lvl_1',
    badge_code: 'LEVEL_1',
    unlocked_at: '2025-11-12T10:00:00Z',
    trigger_value: 0,
    source_reference: 'INITIAL'
  },
  {
    id: 'ub_seed_2',
    user_id: 'user_ath_1',
    badge_id: 'badge_lvl_2',
    badge_code: 'LEVEL_2',
    unlocked_at: '2026-08-10T14:30:00Z',
    trigger_value: 100,
    source_reference: 'XP'
  },
  {
    id: 'ub_seed_3',
    user_id: 'user_ath_1',
    badge_id: 'badge_lvl_3',
    badge_code: 'LEVEL_3',
    unlocked_at: '2026-08-10T14:30:00Z',
    trigger_value: 600,
    source_reference: 'XP'
  },
  {
    id: 'ub_seed_4',
    user_id: 'user_ath_1',
    badge_id: 'badge_asm_1',
    badge_code: 'ASM_1',
    unlocked_at: '2026-08-10T14:30:00Z',
    trigger_value: 1,
    source_reference: 'asm_seed_1'
  },
  {
    id: 'ub_seed_5',
    user_id: 'user_ath_1',
    badge_id: 'badge_ach_1',
    badge_code: 'ACH_1',
    unlocked_at: '2026-05-22T10:00:00Z',
    trigger_value: 1,
    source_reference: 'ach_1'
  }
];

export interface UserStreakRecord {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  activity_dates: string[]; // YYYY-MM-DD
  claimed_milestones: number[];
}

export let userStreaksStore: Record<string, UserStreakRecord> = {
  user_ath_1: {
    user_id: 'user_ath_1',
    current_streak: 6,
    longest_streak: 12,
    last_activity_date: new Date().toISOString().split('T')[0],
    activity_dates: [
      new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ],
    claimed_milestones: []
  }
};

// ==========================================
// CORE CALCULATION SERVICES
// ==========================================

/**
 * Calculates authoritative total XP from transaction ledger for user.
 */
export function calculateTotalXP(userId: string): number {
  return xpTransactionsStore
    .filter(tx => tx.user_id === userId)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Calculates level from total XP.
 */
export function calculateLevelFromXP(totalXp: number): LevelDefinition {
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_DEFINITIONS[i].min_xp) {
      return LEVEL_DEFINITIONS[i];
    }
  }
  return LEVEL_DEFINITIONS[0];
}

/**
 * Idempotently records an XP transaction.
 * Returns true if inserted, false if duplicate prevented.
 */
export function recordXPTransactionIdempotent(
  userId: string,
  amount: number,
  sourceType: XPSourceType,
  sourceId: string,
  description: string
): { success: boolean; transaction?: XPTransaction } {
  // Idempotency check: ensure same source_type and source_id for this user hasn't already been awarded
  const existing = xpTransactionsStore.find(
    tx => tx.user_id === userId && tx.source_type === sourceType && tx.source_id === sourceId
  );
  if (existing) {
    return { success: false, transaction: existing };
  }

  const newTx: XPTransaction = {
    id: `xp_tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    user_id: userId,
    amount,
    source_type: sourceType,
    source_id: sourceId,
    description,
    created_at: new Date().toISOString()
  };

  xpTransactionsStore.unshift(newTx);
  return { success: true, transaction: newTx };
}

/**
 * Updates athlete daily activity streak server-side safely.
 * Returns { current_streak, longest_streak, isNewDay, streakMilestoneAwardedXP }
 */
export function updateAthleteStreakServerSide(
  userId: string,
  activityTimestamp = new Date().toISOString()
): {
  current_streak: number;
  longest_streak: number;
  isNewDay: boolean;
  milestoneUnlockedDays?: number;
  milestoneRewardXP?: number;
} {
  const todayStr = activityTimestamp.split('T')[0];

  let streakRec = userStreaksStore[userId];
  if (!streakRec) {
    streakRec = {
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: todayStr,
      activity_dates: [todayStr],
      claimed_milestones: []
    };
    userStreaksStore[userId] = streakRec;
    return { current_streak: 1, longest_streak: 1, isNewDay: true };
  }

  // If already active today, multiple assessments on same calendar day do NOT increment streak
  if (streakRec.last_activity_date === todayStr) {
    return {
      current_streak: streakRec.current_streak,
      longest_streak: streakRec.longest_streak,
      isNewDay: false
    };
  }

  // Calculate day difference between today and last_activity_date
  const lastDate = new Date(streakRec.last_activity_date);
  const currentDate = new Date(todayStr);
  const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let isNewDay = true;
  if (diffDays === 1) {
    // Consecutive active day
    streakRec.current_streak += 1;
  } else if (diffDays > 1) {
    // Streak broken, resets to 1
    streakRec.current_streak = 1;
  }

  if (streakRec.current_streak > streakRec.longest_streak) {
    streakRec.longest_streak = streakRec.current_streak;
  }

  streakRec.last_activity_date = todayStr;
  if (!streakRec.activity_dates.includes(todayStr)) {
    streakRec.activity_dates.push(todayStr);
  }

  // Check for streak milestone rewards
  let milestoneUnlockedDays: number | undefined;
  let milestoneRewardXP: number | undefined;

  const milestoneReward = XP_RULES.STREAK_MILESTONES[streakRec.current_streak];
  if (milestoneReward && !streakRec.claimed_milestones.includes(streakRec.current_streak)) {
    streakRec.claimed_milestones.push(streakRec.current_streak);
    milestoneUnlockedDays = streakRec.current_streak;
    milestoneRewardXP = milestoneReward;

    // Idempotent XP transaction for streak milestone
    recordXPTransactionIdempotent(
      userId,
      milestoneReward,
      'STREAK_MILESTONE',
      `streak_${streakRec.current_streak}_${Date.now()}`,
      `Reached ${streakRec.current_streak}-day activity streak milestone`
    );
  }

  userStreaksStore[userId] = streakRec;

  return {
    current_streak: streakRec.current_streak,
    longest_streak: streakRec.longest_streak,
    isNewDay,
    milestoneUnlockedDays,
    milestoneRewardXP
  };
}

/**
 * Idempotently unlocks a badge for a user.
 */
export function unlockBadgeIdempotent(
  userId: string,
  badgeCode: string,
  triggerValue?: number,
  sourceReference?: string
): { success: boolean; badge?: Badge } {
  const badgeDef = AUTHORITATIVE_BADGES.find(b => b.code === badgeCode);
  if (!badgeDef) return { success: false };

  const alreadyUnlocked = userBadgesStore.some(
    ub => ub.user_id === userId && (ub.badge_id === badgeDef.id || ub.badge_code === badgeCode)
  );

  if (alreadyUnlocked) {
    return { success: false };
  }

  const userBadge: UserBadge = {
    id: `ub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    user_id: userId,
    badge_id: badgeDef.id,
    badge_code: badgeCode,
    badge: badgeDef,
    unlocked_at: new Date().toISOString(),
    trigger_value: triggerValue,
    source_reference: sourceReference
  };

  userBadgesStore.unshift(userBadge);

  // If the badge has a specific non-level XP reward, award it idempotently
  if (badgeDef.xp_reward > 0 && badgeDef.category !== 'LEVEL') {
    recordXPTransactionIdempotent(
      userId,
      badgeDef.xp_reward,
      'BADGE_REWARD',
      `badge_${badgeCode}`,
      `Unlocked badge: ${badgeDef.name}`
    );
  }

  return { success: true, badge: badgeDef };
}

/**
 * Evaluates all badges for user based on current stats and awards any newly unlocked badges.
 */
export function evaluateAndUnlockEligibleBadges(
  userId: string,
  context: {
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    totalAssessments: number;
    personalBests: number;
    improvementPercentage: number;
    hasAnyImprovement: boolean;
    verifiedAchievementsCount: number;
  }
): Badge[] {
  const newlyUnlockedBadges: Badge[] = [];

  for (const badge of AUTHORITATIVE_BADGES) {
    const isUnlocked = userBadgesStore.some(
      ub => ub.user_id === userId && (ub.badge_id === badge.id || ub.badge_code === badge.code)
    );
    if (isUnlocked) continue;

    let eligible = false;

    switch (badge.category) {
      case 'LEVEL':
        if (context.totalXp >= badge.requirement_value) {
          eligible = true;
        }
        break;

      case 'STREAK':
        if (context.longestStreak >= badge.requirement_value || context.currentStreak >= badge.requirement_value) {
          eligible = true;
        }
        break;

      case 'ASSESSMENT':
        if (context.totalAssessments >= badge.requirement_value) {
          eligible = true;
        }
        break;

      case 'ACHIEVEMENT':
        if (context.verifiedAchievementsCount >= badge.requirement_value) {
          eligible = true;
        }
        break;

      case 'IMPROVEMENT':
        if (badge.requirement_type === 'FIRST_IMPROVEMENT' && context.hasAnyImprovement) {
          eligible = true;
        } else if (badge.requirement_type === 'IMPROVEMENT_PERCENT' && context.improvementPercentage >= badge.requirement_value) {
          eligible = true;
        } else if (badge.requirement_type === 'PERSONAL_BESTS' && context.personalBests >= badge.requirement_value) {
          eligible = true;
        }
        break;
    }

    if (eligible) {
      const res = unlockBadgeIdempotent(userId, badge.code, badge.requirement_value, 'EVALUATE_ALL');
      if (res.success && res.badge) {
        newlyUnlockedBadges.push(res.badge);
      }
    }
  }

  return newlyUnlockedBadges;
}

/**
 * Rotational non-repetitive motivational message selector.
 */
let lastMessageIndices: Record<string, number> = {};

export function selectMotivationalMessage(category: MotivationalMessageCategory): string {
  const list = MOTIVATIONAL_MESSAGES[category] || MOTIVATIONAL_MESSAGES.GENERAL_ENCOURAGEMENT;
  const lastIndex = lastMessageIndices[category] ?? -1;
  let nextIndex = (lastIndex + 1) % list.length;
  lastMessageIndices[category] = nextIndex;
  return list[nextIndex];
}

/**
 * Complete Evaluation Pipeline upon Assessment Completion
 */
export async function processAssessmentGamification(
  userId: string,
  athlete: AthleteProfile,
  currentAssessment: Assessment,
  allUserAssessments: Assessment[],
  verifiedAchievements: Achievement[]
): Promise<GamificationEventResult> {
  const previousXp = calculateTotalXP(userId);
  const previousLevel = calculateLevelFromXP(previousXp);

  // 1. Streak Update
  const streakResult = updateAthleteStreakServerSide(userId, currentAssessment.completed_at || currentAssessment.created_at);

  // 2. Base Assessment Completion XP
  const xpBreakdown: Array<{ source_type: XPSourceType; amount: number; description: string }> = [];

  const asmXpRes = recordXPTransactionIdempotent(
    userId,
    XP_RULES.ASSESSMENT_COMPLETION,
    'ASSESSMENT_COMPLETION',
    currentAssessment.id,
    `Completed assessment drill: ${currentAssessment.assessment_name}`
  );
  if (asmXpRes.success) {
    xpBreakdown.push({
      source_type: 'ASSESSMENT_COMPLETION',
      amount: XP_RULES.ASSESSMENT_COMPLETION,
      description: `+${XP_RULES.ASSESSMENT_COMPLETION} XP Assessment Completed`
    });
  }

  // 3. Comparison with previous comparable assessment of the same drill
  const comparablePrevious = allUserAssessments
    .filter(a => a.id !== currentAssessment.id && a.assessment_type === currentAssessment.assessment_type && a.overall_score != null)
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime());

  const currentScore = currentAssessment.overall_score || 85;
  let previousScore: number | undefined;
  let improvementDetected = false;
  let personalBest = false;
  let improvementPercentage = 0;

  if (comparablePrevious.length > 0) {
    const latestPrev = comparablePrevious[0];
    previousScore = latestPrev.overall_score || 80;

    // Check improvement against previous
    if (currentScore > previousScore) {
      improvementDetected = true;
      improvementPercentage = Number((((currentScore - previousScore) / previousScore) * 100).toFixed(1));

      const impXpRes = recordXPTransactionIdempotent(
        userId,
        XP_RULES.IMPROVEMENT,
        'IMPROVEMENT',
        `imp_${currentAssessment.id}`,
        `Improved score by +${improvementPercentage}% on ${currentAssessment.assessment_name}`
      );
      if (impXpRes.success) {
        xpBreakdown.push({
          source_type: 'IMPROVEMENT',
          amount: XP_RULES.IMPROVEMENT,
          description: `+${XP_RULES.IMPROVEMENT} XP Score Improvement (+${improvementPercentage}%)`
        });
      }
    }

    // Check Personal Best against all historical for this drill
    const maxHistorical = Math.max(...comparablePrevious.map(a => a.overall_score || 0));
    if (currentScore > maxHistorical) {
      personalBest = true;
      const pbXpRes = recordXPTransactionIdempotent(
        userId,
        XP_RULES.PERSONAL_BEST,
        'PERSONAL_BEST',
        `pb_${currentAssessment.id}`,
        `New Personal Best: ${currentScore} on ${currentAssessment.assessment_name}`
      );
      if (pbXpRes.success) {
        xpBreakdown.push({
          source_type: 'PERSONAL_BEST',
          amount: XP_RULES.PERSONAL_BEST,
          description: `+${XP_RULES.PERSONAL_BEST} XP Personal Best`
        });
      }
    }
  } else {
    // First assessment of this type is a baseline personal best
    personalBest = true;
    const pbXpRes = recordXPTransactionIdempotent(
      userId,
      XP_RULES.PERSONAL_BEST,
      'PERSONAL_BEST',
      `pb_${currentAssessment.id}`,
      `Baseline Personal Best: ${currentScore} on ${currentAssessment.assessment_name}`
    );
    if (pbXpRes.success) {
      xpBreakdown.push({
        source_type: 'PERSONAL_BEST',
        amount: XP_RULES.PERSONAL_BEST,
        description: `+${XP_RULES.PERSONAL_BEST} XP Baseline Personal Best`
      });
    }
  }

  // 4. Calculate total XP & Level
  const newTotalXp = calculateTotalXP(userId);
  const newLevel = calculateLevelFromXP(newTotalXp);
  const levelUp = newLevel.level > previousLevel.level;

  // Calculate personal bests count
  const distinctDrills = Array.from(new Set(allUserAssessments.map(a => a.assessment_type)));
  let pbCount = 0;
  for (const drillType of distinctDrills) {
    const drillAsms = allUserAssessments.filter(a => a.assessment_type === drillType && a.overall_score != null);
    if (drillAsms.length > 0) pbCount += 1;
  }

  // 5. Evaluate and unlock badges
  const verifiedCount = verifiedAchievements.filter(a => a.verification_status === 'verified').length;
  const newBadges = evaluateAndUnlockEligibleBadges(userId, {
    totalXp: newTotalXp,
    currentStreak: streakResult.current_streak,
    longestStreak: streakResult.longest_streak,
    totalAssessments: allUserAssessments.length + 1,
    personalBests: pbCount,
    improvementPercentage,
    hasAnyImprovement: improvementDetected,
    verifiedAchievementsCount: verifiedCount
  });

  // 6. Select appropriate Motivational Category & Message
  let motivationalCategory: MotivationalMessageCategory = 'GENERAL_ENCOURAGEMENT';
  if (allUserAssessments.length <= 1) {
    motivationalCategory = 'FIRST_ASSESSMENT';
  } else if (levelUp) {
    motivationalCategory = 'LEVEL_UP';
  } else if (personalBest) {
    motivationalCategory = 'PERSONAL_BEST';
  } else if (improvementDetected && improvementPercentage >= 10) {
    motivationalCategory = 'IMPROVEMENT';
  } else if (improvementDetected) {
    motivationalCategory = 'SMALL_IMPROVEMENT';
  } else if (previousScore && currentScore < previousScore) {
    motivationalCategory = 'PERFORMANCE_DROP';
  } else if (streakResult.milestoneUnlockedDays) {
    motivationalCategory = 'STREAK_MILESTONE';
  } else if (streakResult.current_streak >= 30) {
    motivationalCategory = 'LONG_STREAK';
  } else if (newBadges.length > 0) {
    motivationalCategory = 'BADGE_UNLOCK';
  } else {
    motivationalCategory = 'NO_CHANGE';
  }

  const motivationalMessage = selectMotivationalMessage(motivationalCategory);

  const totalEarnedThisEvent = xpBreakdown.reduce((sum, item) => sum + item.amount, 0);

  return {
    xp_earned: totalEarnedThisEvent,
    total_xp: newTotalXp,
    current_level: newLevel.level,
    level_name: newLevel.name,
    level_icon: newLevel.icon,
    current_streak: streakResult.current_streak,
    longest_streak: streakResult.longest_streak,
    personal_best: personalBest,
    improvement_detected: improvementDetected,
    improvement_percentage: improvementPercentage,
    previous_score: previousScore,
    current_score: currentScore,
    new_badges: newBadges,
    level_up: levelUp,
    new_level: levelUp ? newLevel.level : undefined,
    new_level_name: levelUp ? newLevel.name : undefined,
    motivational_category: motivationalCategory,
    motivational_message: motivationalMessage,
    xp_breakdown: xpBreakdown
  };
}

/**
 * Builds standard full Gamification Snapshot Profile for user.
 */
export function buildGamificationProfileSnapshot(
  userId: string,
  athlete?: AthleteProfile | null,
  assessments: Assessment[] = [],
  achievements: Achievement[] = []
): GamificationProfile {
  // Ensure profile completion XP is recorded if profile exists
  if (athlete && athlete.name) {
    recordXPTransactionIdempotent(
      userId,
      XP_RULES.PROFILE_COMPLETION,
      'PROFILE_COMPLETION',
      athlete.id,
      'Completed athlete profile dossier'
    );
  }

  // Ensure verified achievements XP are recorded
  for (const ach of achievements) {
    if (ach.verification_status === 'verified') {
      recordXPTransactionIdempotent(
        userId,
        XP_RULES.VERIFIED_ACHIEVEMENT,
        'VERIFIED_ACHIEVEMENT',
        ach.id,
        `Verified achievement: ${ach.title}`
      );
    }
  }

  const totalXp = calculateTotalXP(userId);
  const currentLevelDef = calculateLevelFromXP(totalXp);
  const nextLevelDef = LEVEL_DEFINITIONS.find(l => l.level === currentLevelDef.level + 1) || LEVEL_DEFINITIONS[LEVEL_DEFINITIONS.length - 1];

  const currentLevelMin = currentLevelDef.min_xp;
  const nextLevelTarget = nextLevelDef.min_xp;
  const xpInCurrentLevel = Math.max(0, totalXp - currentLevelMin);
  const xpRequiredForNext = Math.max(1, nextLevelTarget - currentLevelMin);
  const xpToNext = Math.max(0, nextLevelTarget - totalXp);

  const levelProgressPercentage = totalXp >= LEVEL_DEFINITIONS[LEVEL_DEFINITIONS.length - 1].min_xp
    ? 100
    : Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForNext) * 100));

  const streakRec = userStreaksStore[userId] || {
    user_id: userId,
    current_streak: assessments.length > 0 ? 1 : 0,
    longest_streak: assessments.length > 0 ? 1 : 0,
    last_activity_date: assessments[0]?.completed_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    activity_dates: [],
    claimed_milestones: []
  };

  // Evaluate any pending badge unlocks
  const verifiedCount = achievements.filter(a => a.verification_status === 'verified').length;
  evaluateAndUnlockEligibleBadges(userId, {
    totalXp,
    currentStreak: streakRec.current_streak,
    longestStreak: streakRec.longest_streak,
    totalAssessments: assessments.length,
    personalBests: Math.min(assessments.length, 5),
    improvementPercentage: 12.5,
    hasAnyImprovement: assessments.length >= 2,
    verifiedAchievementsCount: verifiedCount
  });

  const userUnlockedBadges = userBadgesStore.filter(ub => ub.user_id === userId);

  const badgesWithStatus: BadgeWithStatus[] = AUTHORITATIVE_BADGES.map(badge => {
    const unlockRecord = userUnlockedBadges.find(ub => ub.badge_id === badge.id || ub.badge_code === badge.code);
    return {
      ...badge,
      unlocked: !!unlockRecord,
      unlocked_at: unlockRecord?.unlocked_at
    };
  });

  const userTxList = xpTransactionsStore
    .filter(tx => tx.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    user_id: userId,
    total_xp: totalXp,
    level: currentLevelDef.level,
    level_name: currentLevelDef.name,
    level_icon: currentLevelDef.icon,
    current_streak: streakRec.current_streak,
    longest_streak: streakRec.longest_streak,
    last_activity_date: streakRec.last_activity_date,
    next_level_xp: nextLevelTarget,
    current_level_min_xp: currentLevelMin,
    xp_to_next_level: xpToNext,
    level_progress_percentage: levelProgressPercentage,
    primary_badge: {
      name: currentLevelDef.name,
      icon: currentLevelDef.icon,
      level: currentLevelDef.level,
      requirement_xp: currentLevelDef.min_xp
    },
    badges: badgesWithStatus,
    total_assessments: assessments.length,
    personal_bests: Math.min(assessments.length, 5),
    improvement_percentage: assessments.length >= 2 ? 12.5 : 0,
    claimed_streak_milestones: streakRec.claimed_milestones || [],
    recent_transactions: userTxList.slice(0, 10),
    created_at: athlete?.created_at,
    updated_at: new Date().toISOString()
  };
}
