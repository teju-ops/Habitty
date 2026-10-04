export interface UserModel {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  last_login_at?: string;
  login_count?: number;
  avatar_url?: string;
  bio?: string;
}

export interface HabitModel {
  id: number;
  user_id: number;
  name: string;
  description: string;
  category: string;
  frequency: 'Daily' | 'Weekly';
  target: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface HabitCompletionModel {
  id: number;
  habit_id: number;
  completion_date: string; // YYYY-MM-DD
  completed: boolean;
  created_at: string;
}

export interface UserPermissions {
  notificationsEnabled: boolean;
  dailyReminderPermission: boolean;
  reminderTime: string;
  appPermission: boolean;
  backgroundRunningPermission: boolean;
}

export interface WearableDevice {
  id: string;
  name: string;
  type: 'Fitness Band' | 'Smart Watch';
  connected: boolean;
  battery: number;
  stepsToday: number;
  heartRateBpm: number;
  activeCalories: number;
  sleepHours: number;
  lastSynced: string;
  autoCompleteFitnessHabits: boolean;
}

export function generatePasswordHash(password: string): string {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = (hash * 33) ^ password.charCodeAt(i);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `scrypt:32768:8:1$habitty_salt$${hex}${password.length}`;
}

export function checkPasswordHash(pwhash: string, password: string): boolean {
  return pwhash === generatePasswordHash(password);
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function daysBetweenISO(startIso: string, endIso: string): number {
  const [sy, sm, sd] = startIso.slice(0, 10).split('-').map(Number);
  const [ey, em, ed] = endIso.slice(0, 10).split('-').map(Number);
  const s = new Date(sy, sm - 1, sd);
  const e = new Date(ey, em - 1, ed);
  const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

export function calculateStreak(
  habitId: number,
  completions: HabitCompletionModel[],
  referenceDate: string = getTodayISO()
): number {
  const completedDates = new Set(
    completions
      .filter((c) => c.habit_id === habitId && c.completed)
      .map((c) => c.completion_date)
  );
  if (completedDates.size === 0) return 0;

  const yesterday = addDaysISO(referenceDate, -1);
  let checkDate: string | null = null;

  if (completedDates.has(referenceDate)) {
    checkDate = referenceDate;
  } else if (completedDates.has(yesterday)) {
    checkDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (checkDate && completedDates.has(checkDate)) {
    streak += 1;
    checkDate = addDaysISO(checkDate, -1);
  }
  return streak;
}

export function calculateLongestStreak(
  habitId: number,
  completions: HabitCompletionModel[]
): number {
  const dates = Array.from(
    new Set(
      completions
        .filter((c) => c.habit_id === habitId && c.completed)
        .map((c) => c.completion_date)
    )
  ).sort();

  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] === addDaysISO(dates[i - 1], 1)) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

export function calculateCompletionRate(
  habit: HabitModel,
  completions: HabitCompletionModel[],
  referenceDate: string = getTodayISO()
): number {
  const totalCompletions = completions.filter(
    (c) => c.habit_id === habit.id && c.completed
  ).length;

  const createdDate = habit.created_at.slice(0, 10);
  const daysElapsed = daysBetweenISO(createdDate, referenceDate);

  let expected = daysElapsed;
  if (habit.frequency === 'Weekly') {
    const weeksElapsed = Math.max(1, Math.ceil(daysElapsed / 7));
    expected = weeksElapsed * Math.max(1, habit.target);
  }

  const rate = (totalCompletions / Math.max(1, expected)) * 100;
  return Math.min(100, Math.round(rate * 10) / 10);
}

export function createInitialDatabase() {
  const today = getTodayISO();
  const created14DaysAgo = addDaysISO(today, -13);

  const users: UserModel[] = [
    {
      id: 1,
      username: 'Tejaswini',
      email: 'tejaswini@habitty.app',
      password_hash: generatePasswordHash('password123'),
      created_at: created14DaysAgo,
      last_login_at: `${today} 08:30 AM`,
      login_count: 14,
      bio: 'Building mindful daily habits and staying active.',
      avatar_url: '',
    },
    {
      id: 2,
      username: 'AlexRivera',
      email: 'alex@habitty.app',
      password_hash: generatePasswordHash('password123'),
      created_at: created14DaysAgo,
      last_login_at: `${today} 07:15 AM`,
      login_count: 9,
      bio: 'Marathon runner & productivity enthusiast.',
      avatar_url: '',
    },
  ];

  const habits: HabitModel[] = [
    {
      id: 1,
      user_id: 1,
      name: 'Exercise',
      description: 'Workout for at least 45 minutes at the gym or outdoors.',
      category: 'Fitness',
      frequency: 'Daily',
      target: 1,
      created_at: created14DaysAgo,
      updated_at: today,
      is_active: true,
    },
    {
      id: 2,
      user_id: 1,
      name: 'Morning Deep Work',
      description: 'Focus on high-priority projects for 90 minutes without distractions.',
      category: 'Career',
      frequency: 'Daily',
      target: 1,
      created_at: created14DaysAgo,
      updated_at: today,
      is_active: true,
    },
    {
      id: 3,
      user_id: 1,
      name: 'Mindful Reading',
      description: 'Read 25 pages of non-fiction before bed.',
      category: 'Mindfulness',
      frequency: 'Daily',
      target: 1,
      created_at: created14DaysAgo,
      updated_at: today,
      is_active: true,
    },
    {
      id: 4,
      user_id: 1,
      name: 'Hydration Goal (2.5L)',
      description: 'Drink 2.5 liters of water throughout the workday.',
      category: 'Health',
      frequency: 'Daily',
      target: 1,
      created_at: created14DaysAgo,
      updated_at: today,
      is_active: true,
    },
    {
      id: 5,
      user_id: 1,
      name: 'Weekly System Review',
      description: 'Audit weekly goals, clean up backlog, and plan upcoming milestones.',
      category: 'Productivity',
      frequency: 'Weekly',
      target: 1,
      created_at: created14DaysAgo,
      updated_at: today,
      is_active: true,
    },
  ];

  const completions: HabitCompletionModel[] = [];
  let compId = 1;

  for (let offset = 6; offset >= 0; offset--) {
    completions.push({
      id: compId++,
      habit_id: 1,
      completion_date: addDaysISO(today, -offset),
      completed: true,
      created_at: addDaysISO(today, -offset),
    });
  }

  for (let offset = 4; offset >= 0; offset--) {
    completions.push({
      id: compId++,
      habit_id: 2,
      completion_date: addDaysISO(today, -offset),
      completed: true,
      created_at: addDaysISO(today, -offset),
    });
  }

  for (const offset of [10, 9, 8, 7, 3, 2, 1]) {
    completions.push({
      id: compId++,
      habit_id: 3,
      completion_date: addDaysISO(today, -offset),
      completed: true,
      created_at: addDaysISO(today, -offset),
    });
  }

  for (const offset of [6, 5, 3, 1, 0]) {
    completions.push({
      id: compId++,
      habit_id: 4,
      completion_date: addDaysISO(today, -offset),
      completed: true,
      created_at: addDaysISO(today, -offset),
    });
  }

  completions.push({
    id: compId++,
    habit_id: 5,
    completion_date: addDaysISO(today, -2),
    completed: true,
    created_at: addDaysISO(today, -2),
  });

  return { users, habits, completions };
}

export const INITIAL_WEARABLES: WearableDevice[] = [
  {
    id: 'band-1',
    name: 'Habitty Pulse Band 6',
    type: 'Fitness Band',
    connected: false,
    battery: 88,
    stepsToday: 8420,
    heartRateBpm: 72,
    activeCalories: 460,
    sleepHours: 7.6,
    lastSynced: 'Not synced yet',
    autoCompleteFitnessHabits: true,
  },
  {
    id: 'watch-1',
    name: 'Apex Chrono Smart Watch',
    type: 'Smart Watch',
    connected: false,
    battery: 94,
    stepsToday: 9650,
    heartRateBpm: 68,
    activeCalories: 540,
    sleepHours: 8.1,
    lastSynced: 'Not synced yet',
    autoCompleteFitnessHabits: true,
  },
];
