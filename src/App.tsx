import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Watch,
  Footprints,
  Heart,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import {
  UserModel,
  HabitModel,
  HabitCompletionModel,
  UserPermissions,
  WearableDevice,
  generatePasswordHash,
  checkPasswordHash,
  getTodayISO,
  addDaysISO,
  calculateStreak,
  calculateLongestStreak,
  calculateCompletionRate,
  createInitialDatabase,
  INITIAL_WEARABLES,
} from './typesAndServices';
import {
  AnimatedSplashLanding,
  WearablesSection,
  ProfileAndSettingsView,
} from './ProfileAndWearables';

type RouteState =
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'dashboard' }
  | { name: 'create_habit' }
  | { name: 'edit_habit'; habitId: number }
  | { name: 'habit_details'; habitId: number }
  | { name: 'wearables' }
  | { name: 'profile' }
  | { name: 'error_403' }
  | { name: 'error_404' };

interface FlashAlert {
  id: number;
  category: 'success' | 'danger' | 'info';
  message: string;
}

export default function App() {
  // Animated Splash Landing state (shows centered Habitty logo animation first, then opens Dashboard)
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Day & Night Theme Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('habitty_theme_dark') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('habitty_theme_dark', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persistent Database State
  const [dbState, setDbState] = useState<{
    users: UserModel[];
    habits: HabitModel[];
    completions: HabitCompletionModel[];
  }>(() => {
    const saved = localStorage.getItem('habitty_sqlite_db_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return createInitialDatabase();
  });

  useEffect(() => {
    localStorage.setItem('habitty_sqlite_db_v2', JSON.stringify(dbState));
  }, [dbState]);

  // Permissions State (Notifications, Reminder, App Permission, Background Running)
  const [permissions, setPermissions] = useState<UserPermissions>(() => {
    const saved = localStorage.getItem('habitty_permissions_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      notificationsEnabled: true,
      dailyReminderPermission: true,
      reminderTime: '08:00',
      appPermission: true,
      backgroundRunningPermission: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('habitty_permissions_v1', JSON.stringify(permissions));
  }, [permissions]);

  // Wearables State (Fitness Band & Smart Watch)
  const [wearables, setWearables] = useState<WearableDevice[]>(() => {
    const saved = localStorage.getItem('habitty_wearables_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_WEARABLES;
  });

  useEffect(() => {
    localStorage.setItem('habitty_wearables_v1', JSON.stringify(wearables));
  }, [wearables]);

  // Authenticated User Session
  const [currentUserId, setCurrentUserId] = useState<number | null>(1);
  const currentUser = useMemo(
    () => dbState.users.find((u) => u.id === currentUserId) || null,
    [dbState.users, currentUserId]
  );

  const [route, setRoute] = useState<RouteState>({ name: 'dashboard' });
  const [flashes, setFlashes] = useState<FlashAlert[]>([]);
  const [deleteModalHabit, setDeleteModalHabit] = useState<HabitModel | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const todayISO = getTodayISO();

  const addFlash = (message: string, category: FlashAlert['category'] = 'info') => {
    const id = Date.now() + Math.random();
    setFlashes((prev) => [{ id, category, message }, ...prev.slice(0, 2)]);
  };

  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================

  const [loginEmail, setLoginEmail] = useState('tejaswini@habitty.app');
  const [loginPassword, setLoginPassword] = useState('password123');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !loginPassword) {
      addFlash('Both email and password are required.', 'danger');
      return;
    }

    const user = dbState.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      addFlash('Invalid email address or account does not exist.', 'danger');
      return;
    }

    if (!checkPasswordHash(user.password_hash, loginPassword)) {
      addFlash('Invalid password. Please try again.', 'danger');
      return;
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDbState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id
          ? {
              ...u,
              last_login_at: `${todayISO} ${nowTime}`,
              login_count: (u.login_count || 1) + 1,
            }
          : u
      ),
    }));

    setCurrentUserId(user.id);
    setFlashes([]);
    addFlash(`Welcome back, ${user.username}!`, 'success');
    setRoute({ name: 'dashboard' });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const username = regUsername.trim();
    const email = regEmail.trim().toLowerCase();

    if (!username || username.length < 3) {
      addFlash('Username must be at least 3 characters.', 'danger');
      return;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      addFlash('Please provide a valid email address.', 'danger');
      return;
    }
    if (regPassword.length < 6) {
      addFlash('Password must be at least 6 characters long.', 'danger');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      addFlash('Password and confirm password do not match.', 'danger');
      return;
    }
    if (dbState.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      addFlash('That username is already taken.', 'danger');
      return;
    }
    if (dbState.users.some((u) => u.email.toLowerCase() === email)) {
      addFlash('An account with that email already exists.', 'danger');
      return;
    }

    const newUser: UserModel = {
      id: Math.max(0, ...dbState.users.map((u) => u.id)) + 1,
      username,
      email,
      password_hash: generatePasswordHash(regPassword),
      created_at: todayISO,
      last_login_at: `${todayISO} Just now`,
      login_count: 1,
      bio: 'Building better daily habits.',
      avatar_url: '',
    };

    setDbState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));

    setLoginEmail(email);
    setLoginPassword(regPassword);
    setRegUsername('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    addFlash('Account registered! Please log in with your credentials.', 'success');
    setRoute({ name: 'login' });
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setFlashes([]);
    addFlash('You have been logged out.', 'info');
    setRoute({ name: 'login' });
  };

  // ============================================================================
  // PROFILE UPDATE & PASSWORD RESET HANDLERS
  // ============================================================================

  const handleUpdateProfileInfo = (updates: {
    username: string;
    email: string;
    bio: string;
    avatar_url: string;
  }): boolean => {
    if (!currentUser) return false;
    const cleanUsername = updates.username.trim();
    const cleanEmail = updates.email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail) {
      addFlash('Username and email cannot be empty.', 'danger');
      return false;
    }

    const duplicateUser = dbState.users.some(
      (u) => u.id !== currentUser.id && u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (duplicateUser) {
      addFlash('That username is already in use by another account.', 'danger');
      return false;
    }

    const duplicateEmail = dbState.users.some(
      (u) => u.id !== currentUser.id && u.email.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      addFlash('That email address is already in use by another account.', 'danger');
      return false;
    }

    setDbState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              username: cleanUsername,
              email: cleanEmail,
              bio: updates.bio.trim(),
              avatar_url: updates.avatar_url,
            }
          : u
      ),
    }));

    setLoginEmail(cleanEmail);
    addFlash('Profile updated.', 'success');
    return true;
  };

  const handleResetPassword = (
    currentPasswordInput: string,
    newPasswordInput: string
  ): { ok: boolean; message: string } => {
    if (!currentUser) {
      return { ok: false, message: 'You must be logged in to reset your password.' };
    }

    if (!checkPasswordHash(currentUser.password_hash, currentPasswordInput)) {
      return {
        ok: false,
        message: 'Current password is incorrect. Please verify and try again.',
      };
    }

    const newHash = generatePasswordHash(newPasswordInput);
    setDbState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id ? { ...u, password_hash: newHash } : u
      ),
    }));

    // Update login form state so logging out and logging back in uses the new password seamlessly
    setLoginPassword(newPasswordInput);
    addFlash('Login password updated! Use your new password next time you sign in.', 'success');
    return {
      ok: true,
      message: 'Password updated! Your new password is now active for login.',
    };
  };

  // ============================================================================
  // WEARABLES (FITNESS BAND & SMART WATCH) HANDLERS
  // ============================================================================

  const handleToggleConnectDevice = (deviceId: string) => {
    const target = wearables.find((d) => d.id === deviceId);
    if (!target) return;

    const nextConnected = !target.connected;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setWearables((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              connected: nextConnected,
              lastSynced: nextConnected ? `Today at ${nowTime}` : d.lastSynced,
            }
          : d
      )
    );

    if (nextConnected) {
      addFlash(`Connected to ${target.name}. Live health metrics synced!`, 'success');
    } else {
      addFlash(`Disconnected ${target.name}.`, 'info');
    }
  };

  const handleSyncDevice = (deviceId: string) => {
    const target = wearables.find((d) => d.id === deviceId);
    if (!target) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setWearables((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              stepsToday: d.stepsToday + 320,
              activeCalories: d.activeCalories + 25,
              lastSynced: `Today at ${nowTime}`,
            }
          : d
      )
    );

    // If autoCompleteFitnessHabits is enabled, mark user's active Fitness habits complete for today
    if (target.autoCompleteFitnessHabits && currentUser) {
      const fitnessHabits = dbState.habits.filter(
        (h) =>
          h.user_id === currentUser.id &&
          h.is_active &&
          h.category.toLowerCase() === 'fitness'
      );
      fitnessHabits.forEach((fh) => {
        handleCompleteHabit(fh.id, todayISO);
      });
    }

    addFlash(`Synced latest workout & step data from ${target.name}.`, 'success');
  };

  const handleToggleAutoCompleteWearable = (deviceId: string) => {
    setWearables((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, autoCompleteFitnessHabits: !d.autoCompleteFitnessHabits }
          : d
      )
    );
  };

  // ============================================================================
  // HABIT CRUD & COMPLETION HANDLERS
  // ============================================================================

  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitCategory, setHabitCategory] = useState('Fitness');
  const [habitFrequency, setHabitFrequency] = useState<'Daily' | 'Weekly'>('Daily');
  const [habitTarget, setHabitTarget] = useState(1);
  const [habitIsActive, setHabitIsActive] = useState(true);

  const openEditHabit = (habitId: number) => {
    if (!currentUser) {
      setRoute({ name: 'login' });
      return;
    }
    const habit = dbState.habits.find((h) => h.id === habitId);
    if (!habit) {
      setRoute({ name: 'error_404' });
      return;
    }
    if (habit.user_id !== currentUser.id) {
      setRoute({ name: 'error_403' });
      return;
    }

    setHabitName(habit.name);
    setHabitDesc(habit.description);
    setHabitCategory(habit.category);
    setHabitFrequency(habit.frequency);
    setHabitTarget(habit.target);
    setHabitIsActive(habit.is_active);
    setRoute({ name: 'edit_habit', habitId });
  };

  const openHabitDetails = (habitId: number) => {
    if (!currentUser) {
      setRoute({ name: 'login' });
      return;
    }
    const habit = dbState.habits.find((h) => h.id === habitId);
    if (!habit) {
      setRoute({ name: 'error_404' });
      return;
    }
    if (habit.user_id !== currentUser.id) {
      setRoute({ name: 'error_403' });
      return;
    }
    setRoute({ name: 'habit_details', habitId });
  };

  const handleCreateHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!habitName.trim() || !habitCategory.trim()) {
      addFlash('Habit name and category are required.', 'danger');
      return;
    }

    const newHabit: HabitModel = {
      id: Math.max(0, ...dbState.habits.map((h) => h.id)) + 1,
      user_id: currentUser.id,
      name: habitName.trim(),
      description: habitDesc.trim(),
      category: habitCategory.trim(),
      frequency: habitFrequency,
      target: Math.max(1, Number(habitTarget) || 1),
      created_at: todayISO,
      updated_at: todayISO,
      is_active: true,
    };

    setDbState((prev) => ({
      ...prev,
      habits: [newHabit, ...prev.habits],
    }));

    setHabitName('');
    setHabitDesc('');
    setHabitCategory('Fitness');
    setHabitFrequency('Daily');
    setHabitTarget(1);

    addFlash(`Habit '${newHabit.name}' created.`, 'success');
    setRoute({ name: 'dashboard' });
  };

  const handleUpdateHabitSubmit = (e: React.FormEvent, habitId: number) => {
    e.preventDefault();
    if (!currentUser) return;

    const targetHabit = dbState.habits.find((h) => h.id === habitId);
    if (!targetHabit) {
      setRoute({ name: 'error_404' });
      return;
    }
    if (targetHabit.user_id !== currentUser.id) {
      setRoute({ name: 'error_403' });
      return;
    }

    setDbState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === habitId
          ? {
              ...h,
              name: habitName.trim(),
              description: habitDesc.trim(),
              category: habitCategory.trim(),
              frequency: habitFrequency,
              target: Math.max(1, Number(habitTarget) || 1),
              is_active: habitIsActive,
              updated_at: todayISO,
            }
          : h
      ),
    }));

    addFlash(`Habit '${habitName.trim()}' updated.`, 'success');
    setRoute({ name: 'dashboard' });
  };

  const confirmDeleteHabit = () => {
    if (!deleteModalHabit || !currentUser) return;
    if (deleteModalHabit.user_id !== currentUser.id) {
      setDeleteModalHabit(null);
      setRoute({ name: 'error_403' });
      return;
    }

    const deletedId = deleteModalHabit.id;
    const deletedName = deleteModalHabit.name;

    setDbState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== deletedId),
      completions: prev.completions.filter((c) => c.habit_id !== deletedId),
    }));

    setDeleteModalHabit(null);
    addFlash(`Habit '${deletedName}' has been deleted.`, 'info');
    setRoute({ name: 'dashboard' });
  };

  const handleCompleteHabit = (habitId: number, dateStr: string = todayISO) => {
    if (!currentUser) return;
    const habit = dbState.habits.find((h) => h.id === habitId);
    if (!habit || habit.user_id !== currentUser.id) return;

    const alreadyCompleted = dbState.completions.some(
      (c) => c.habit_id === habitId && c.completion_date === dateStr && c.completed
    );
    if (alreadyCompleted) return;

    const nextId = Math.max(0, ...dbState.completions.map((c) => c.id)) + 1;
    setDbState((prev) => ({
      ...prev,
      completions: [
        ...prev.completions,
        {
          id: nextId,
          habit_id: habitId,
          completion_date: dateStr,
          completed: true,
          created_at: todayISO,
        },
      ],
    }));

    if (dateStr === todayISO) {
      addFlash(`Marked '${habit.name}' as completed for today!`, 'success');
    }
  };

  const handleUncompleteHabit = (habitId: number, dateStr: string = todayISO) => {
    if (!currentUser) return;
    const habit = dbState.habits.find((h) => h.id === habitId);
    if (!habit || habit.user_id !== currentUser.id) return;

    setDbState((prev) => ({
      ...prev,
      completions: prev.completions.filter(
        (c) => !(c.habit_id === habitId && c.completion_date === dateStr)
      ),
    }));

    if (dateStr === todayISO) {
      addFlash(`Undid completion for '${habit.name}'.`, 'info');
    }
  };

  // ============================================================================
  // DASHBOARD STATS & WEARABLE SUMMARY
  // ============================================================================

  const userHabits = useMemo(() => {
    if (!currentUser) return [];
    return dbState.habits.filter((h) => h.user_id === currentUser.id);
  }, [dbState.habits, currentUser]);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    userHabits.forEach((h) => set.add(h.category));
    return Array.from(set);
  }, [userHabits]);

  const filteredHabits = useMemo(() => {
    if (categoryFilter === 'All') return userHabits;
    return userHabits.filter((h) => h.category === categoryFilter);
  }, [userHabits, categoryFilter]);

  const dashboardStats = useMemo(() => {
    const totalHabits = userHabits.length;
    const activeHabits = userHabits.filter((h) => h.is_active);
    const activeCount = activeHabits.length;

    let completedToday = 0;
    let bestStreak = 0;

    for (const h of userHabits) {
      const s = calculateStreak(h.id, dbState.completions, todayISO);
      if (s > bestStreak) bestStreak = s;

      const doneToday = dbState.completions.some(
        (c) => c.habit_id === h.id && c.completion_date === todayISO && c.completed
      );
      if (h.is_active && doneToday) {
        completedToday += 1;
      }
    }

    const userHabitIds = new Set(userHabits.map((h) => h.id));
    const weeklySeries: { dayLabel: string; isoDate: string; count: number }[] = [];

    for (let offset = 6; offset >= 0; offset--) {
      const dIso = addDaysISO(todayISO, -offset);
      const [y, m, d] = dIso.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayLabel = dt.toLocaleDateString('en-US', { weekday: 'short' });
      const count = dbState.completions.filter(
        (c) => userHabitIds.has(c.habit_id) && c.completion_date === dIso && c.completed
      ).length;
      weeklySeries.push({ dayLabel, isoDate: dIso, count });
    }

    return {
      totalHabits,
      activeCount,
      completedToday,
      bestStreak,
      weeklySeries,
    };
  }, [userHabits, dbState.completions, todayISO]);

  const connectedWearable = useMemo(
    () => wearables.find((w) => w.connected) || null,
    [wearables]
  );

  if (showSplash) {
    return (
      <AnimatedSplashLanding
        onEnterDashboard={() => setShowSplash(false)}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950 text-[#0f172a] dark:text-slate-100 transition-colors">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Primary Actions) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setRoute(currentUser ? { name: 'dashboard' } : { name: 'login' });
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap"
        >
          Habitty
        </a>

        {/* Zone 2: Clean navigation links (Python Architecture & Tests completely removed) */}
        {currentUser ? (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setRoute({ name: 'dashboard' })}
              className={`hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer ${
                route.name === 'dashboard'
                  ? 'text-slate-900 dark:text-white font-semibold underline'
                  : ''
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setHabitName('');
                setHabitDesc('');
                setHabitCategory('Fitness');
                setHabitFrequency('Daily');
                setHabitTarget(1);
                setRoute({ name: 'create_habit' });
              }}
              className={`hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer ${
                route.name === 'create_habit'
                  ? 'text-slate-900 dark:text-white font-semibold underline'
                  : ''
              }`}
            >
              Create Habit
            </button>
            <button
              type="button"
              onClick={() => setRoute({ name: 'wearables' })}
              className={`hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer ${
                route.name === 'wearables'
                  ? 'text-slate-900 dark:text-white font-semibold underline'
                  : ''
              }`}
            >
              Devices & Watch
            </button>
            <button
              type="button"
              onClick={() => setRoute({ name: 'profile' })}
              className={`hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer ${
                route.name === 'profile'
                  ? 'text-slate-900 dark:text-white font-semibold underline'
                  : ''
              }`}
            >
              Profile
            </button>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setRoute({ name: 'login' })}
              className={`hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer ${
                route.name === 'login'
                  ? 'text-slate-900 dark:text-white font-semibold underline'
                  : ''
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setRoute({ name: 'register' })}
              className={`hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer ${
                route.name === 'register'
                  ? 'text-slate-900 dark:text-white font-semibold underline'
                  : ''
              }`}
            >
              Register
            </button>
          </nav>
        )}

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRoute({ name: 'register' })}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Create Account
            </button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around py-2.5 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
        {currentUser ? (
          <>
            <button type="button" onClick={() => setRoute({ name: 'dashboard' })} className="py-1">
              Dashboard
            </button>
            <button type="button" onClick={() => setRoute({ name: 'create_habit' })} className="py-1">
              Create
            </button>
            <button type="button" onClick={() => setRoute({ name: 'wearables' })} className="py-1">
              Devices
            </button>
            <button type="button" onClick={() => setRoute({ name: 'profile' })} className="py-1">
              Profile
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setRoute({ name: 'login' })} className="py-1">
              Login
            </button>
            <button type="button" onClick={() => setRoute({ name: 'register' })} className="py-1">
              Register
            </button>
          </>
        )}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1160px] mx-auto px-4 sm:px-6 py-8">
        {/* Flash Alerts */}
        {flashes.length > 0 && (
          <div className="mb-6 space-y-2">
            {flashes.map((f) => (
              <div
                key={f.id}
                role="alert"
                className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium ${
                  f.category === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : f.category === 'danger'
                    ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {f.category === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : f.category === 'danger' ? (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  ) : null}
                  <span>{f.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlashes((prev) => prev.filter((item) => item.id !== f.id))}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white ml-4 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 1: LOGIN */}
        {route.name === 'login' && (
          <section className="max-w-md mx-auto my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sign in to Habitty
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your email and password to access your habits.
            </p>

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Login to Dashboard
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
              <span>New to Habitty?</span>
              <button
                type="button"
                onClick={() => setRoute({ name: 'register' })}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Register an account →
              </button>
            </div>
          </section>
        )}

        {/* VIEW 2: REGISTER */}
        {route.name === 'register' && (
          <section className="max-w-md mx-auto my-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Build lasting daily habits with streak tracking and progress analytics.
            </p>

            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. Tejaswini"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password (minimum 6 characters)
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Register Account
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
              <span>Already have an account?</span>
              <button
                type="button"
                onClick={() => setRoute({ name: 'login' })}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Sign in instead →
              </button>
            </div>
          </section>
        )}

        {/* VIEW 3: DASHBOARD */}
        {route.name === 'dashboard' && currentUser && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-600"
                  />
                ) : null}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {greeting}, {currentUser.username} 👋
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Let's build better habits today.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRoute({ name: 'wearables' })}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Watch className="w-4 h-4 text-indigo-600" />
                  {connectedWearable ? connectedWearable.name : 'Connect Watch / Band'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHabitName('');
                    setHabitDesc('');
                    setHabitCategory('Fitness');
                    setHabitFrequency('Daily');
                    setHabitTarget(1);
                    setRoute({ name: 'create_habit' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Habit
                </button>
              </div>
            </section>

            {/* Connected Fitness Band / Smart Watch Live Telemetry Bar */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Watch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {connectedWearable
                      ? `${connectedWearable.name} (${connectedWearable.type} Connected)`
                      : 'Connect Fitness Band or Smart Watch'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {connectedWearable
                      ? `Last synced: ${connectedWearable.lastSynced} · Battery ${connectedWearable.battery}%`
                      : 'Sync daily steps, heart rate, and active calories to automatically complete your Fitness habits.'}
                  </p>
                </div>
              </div>

              {connectedWearable ? (
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-indigo-600" />
                    <span className="text-slate-500 dark:text-slate-400">Steps:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {connectedWearable.stepsToday.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="text-slate-500 dark:text-slate-400">Heart Rate:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {connectedWearable.heartRateBpm} bpm
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-500 dark:text-slate-400">Calories:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {connectedWearable.activeCalories} kcal
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSyncDevice(connectedWearable.id)}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    Sync Now
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRoute({ name: 'wearables' })}
                  className="px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  Pair Fitness Band / Watch →
                </button>
              )}
            </section>

            {/* Dashboard Statistics Cards */}
            <section aria-label="Dashboard Statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Habits
                </span>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {dashboardStats.totalHabits}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Configured in your account
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Active Habits
                </span>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {dashboardStats.activeCount}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Scheduled for tracking
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Completed Today
                </span>
                <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {dashboardStats.completedToday}/{dashboardStats.activeCount}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Daily progress ({todayISO})
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Current Best Streak
                </span>
                <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  🔥 {dashboardStats.bestStreak} {dashboardStats.bestStreak === 1 ? 'day' : 'days'}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Consecutive daily completions
                </p>
              </div>
            </section>

            {/* Weekly Habit Completion Chart */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Weekly Habit Completion
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dynamic completion count across your habits over the last 7 days
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {dashboardStats.weeklySeries[0]?.isoDate} — {todayISO}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-3 items-end h-44 pt-6 px-2 border-b border-slate-200 dark:border-slate-800">
                {dashboardStats.weeklySeries.map((day) => {
                  const maxPossible = Math.max(dashboardStats.activeCount, 4);
                  const heightPercent = Math.min(100, Math.round((day.count / maxPossible) * 100));
                  const isToday = day.isoDate === todayISO;
                  return (
                    <div key={day.isoDate} className="flex flex-col items-center justify-end h-full gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                        {day.count}
                      </span>
                      <div className="w-full max-w-[44px] bg-slate-100 dark:bg-slate-800 rounded-t-md h-28 flex items-end overflow-hidden">
                        <div
                          style={{ height: `${Math.max(day.count > 0 ? 14 : 4, heightPercent)}%` }}
                          className={`w-full rounded-t-md transition-all duration-200 ${
                            isToday ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7 gap-3 pt-2.5 px-2 text-center">
                {dashboardStats.weeklySeries.map((day) => (
                  <div key={day.isoDate} className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {day.dayLabel}
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {day.isoDate.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Habit List Section */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Your Personal Habits
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any habit title to view full streak analytics and monthly calendar history
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg overflow-x-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredHabits.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    No habits found
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Start building consistency by creating your first daily or weekly habit.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRoute({ name: 'create_habit' })}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    + Create First Habit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredHabits.map((habit) => {
                    const currentStreak = calculateStreak(habit.id, dbState.completions, todayISO);
                    const completedToday = dbState.completions.some(
                      (c) =>
                        c.habit_id === habit.id &&
                        c.completion_date === todayISO &&
                        c.completed
                    );

                    return (
                      <article
                        key={habit.id}
                        className={`bg-white dark:bg-slate-900 border rounded-xl p-6 flex flex-col justify-between gap-4 transition-colors ${
                          completedToday
                            ? 'border-emerald-300 dark:border-emerald-700'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              <button
                                type="button"
                                onClick={() => openHabitDetails(habit.id)}
                                className="hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors cursor-pointer"
                              >
                                {habit.name}
                              </button>
                            </h3>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums shrink-0">
                              🔥 {currentStreak} {currentStreak === 1 ? 'day' : 'days'} streak
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            <span>Category: {habit.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>Frequency: {habit.frequency}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">Target: {habit.target}/period</span>
                            {!habit.is_active && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-600 font-medium">Paused</span>
                              </>
                            )}
                          </div>

                          {habit.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                              {habit.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            {completedToday ? (
                              <button
                                type="button"
                                onClick={() => handleUncompleteHabit(habit.id, todayISO)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Completed Today
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCompleteHabit(habit.id, todayISO)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openHabitDetails(habit.id)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              History
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditHabit(habit.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModalHabit(habit)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 4: CREATE HABIT */}
        {route.name === 'create_habit' && currentUser && (
          <section className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create New Habit</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Define a personal habit to track daily or weekly consistency.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoute({ name: 'dashboard' })}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div>

            <form onSubmit={handleCreateHabitSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g. Exercise, Read 20 Pages"
                  required
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  placeholder="e.g. Workout for at least 45 minutes."
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Frequency *
                  </label>
                  <select
                    value={habitFrequency}
                    onChange={(e) => setHabitFrequency(e.target.value as 'Daily' | 'Weekly')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={habitTarget}
                    onChange={(e) => setHabitTarget(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRoute({ name: 'dashboard' })}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </section>
        )}

        {/* VIEW 5: EDIT HABIT */}
        {route.name === 'edit_habit' && currentUser && (
          <section className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Edit Habit</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Modify habit details or active status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoute({ name: 'dashboard' })}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div>

            <form
              onSubmit={(e) => handleUpdateHabitSubmit(e, route.habitId)}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Frequency *
                  </label>
                  <select
                    value={habitFrequency}
                    onChange={(e) => setHabitFrequency(e.target.value as 'Daily' | 'Weekly')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={habitTarget}
                    onChange={(e) => setHabitTarget(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={habitIsActive}
                    onChange={(e) => setHabitIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  Active Habit (include in daily completion targets)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRoute({ name: 'dashboard' })}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                >
                  Update Habit
                </button>
              </div>
            </form>
          </section>
        )}

        {/* VIEW 6: HABIT DETAILS */}
        {route.name === 'habit_details' && currentUser && (() => {
          const habit = dbState.habits.find((h) => h.id === route.habitId);
          if (!habit) return null;

          const currentStreak = calculateStreak(habit.id, dbState.completions, todayISO);
          const longestStreak = calculateLongestStreak(habit.id, dbState.completions);
          const totalCompletions = dbState.completions.filter(
            (c) => c.habit_id === habit.id && c.completed
          ).length;
          const completionRate = calculateCompletionRate(habit, dbState.completions, todayISO);

          const completedSet = new Set(
            dbState.completions
              .filter((c) => c.habit_id === habit.id && c.completed)
              .map((c) => c.completion_date)
          );

          const calendarDays: {
            iso: string;
            dayNum: number;
            monthShort: string;
            completed: boolean;
            missed: boolean;
            isToday: boolean;
          }[] = [];

          for (let offset = 27; offset >= 0; offset--) {
            const iso = addDaysISO(todayISO, -offset);
            const [y, m, d] = iso.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            const completed = completedSet.has(iso);
            const missed = !completed && iso >= habit.created_at.slice(0, 10) && iso < todayISO;
            calendarDays.push({
              iso,
              dayNum: d,
              monthShort: dt.toLocaleDateString('en-US', { month: 'short' }),
              completed,
              missed,
              isToday: iso === todayISO,
            });
          }

          return (
            <div className="space-y-8">
              <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <button
                    type="button"
                    onClick={() => setRoute({ name: 'dashboard' })}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Dashboard
                  </button>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{habit.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Category: {habit.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Frequency: {habit.frequency}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Created: {habit.created_at.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => openEditHabit(habit.id)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    Edit Habit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModalHabit(habit)}
                    className="px-3.5 py-2 text-xs font-medium text-red-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    Delete Habit
                  </button>
                </div>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <span className="text-xs font-medium text-slate-500">Current Streak</span>
                  <div className="mt-2 text-2xl font-bold text-indigo-600 tabular-nums">
                    {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <span className="text-xs font-medium text-slate-500">Longest Streak</span>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <span className="text-xs font-medium text-slate-500">Total Completions</span>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {totalCompletions}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <span className="text-xs font-medium text-slate-500">Completion Rate</span>
                  <div className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">
                    {completionRate}%
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" />
                      Completion History Calendar (Last 28 Days)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click any date cell to toggle completion status
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2.5">
                  {calendarDays.map((cell) => (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() =>
                        cell.completed
                          ? handleUncompleteHabit(habit.id, cell.iso)
                          : handleCompleteHabit(habit.id, cell.iso)
                      }
                      className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between cursor-pointer ${
                        cell.completed
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700'
                          : cell.missed
                          ? 'bg-red-50/40 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full text-xs">
                        <span className="font-semibold tabular-nums">
                          {cell.monthShort} {cell.dayNum}
                        </span>
                        {cell.isToday && (
                          <span className="text-[10px] font-bold text-indigo-600">Today</span>
                        )}
                      </div>
                      <div className="mt-2 text-sm font-bold tabular-nums">
                        {cell.completed ? (
                          <span className="text-emerald-600">✓</span>
                        ) : cell.missed ? (
                          <span className="text-red-500">✗</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          );
        })()}

        {/* VIEW 7: WEARABLES (Fitness Band & Smart Watch) */}
        {route.name === 'wearables' && currentUser && (
          <WearablesSection
            devices={wearables}
            onToggleConnect={handleToggleConnectDevice}
            onSyncDevice={handleSyncDevice}
            onToggleAutoComplete={handleToggleAutoCompleteWearable}
          />
        )}

        {/* VIEW 8: CLEAN PROFILE & SETTINGS */}
        {route.name === 'profile' && currentUser && (
          <ProfileAndSettingsView
            currentUser={currentUser}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onUpdateProfile={handleUpdateProfileInfo}
            onResetPassword={handleResetPassword}
            permissions={permissions}
            onUpdatePermissions={(next) => {
              setPermissions(next);
              addFlash('Notification & app permissions updated.', 'info');
            }}
            devices={wearables}
            onToggleConnectDevice={handleToggleConnectDevice}
            onSyncDevice={handleSyncDevice}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalHabit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete "{deleteModalHabit.name}"?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete this habit and its completion history? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalHabit(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteHabit}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Footer (Route indicator removed) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Habitty — Minimalist Habit Tracking & Productivity Platform</span>
        <button
          type="button"
          onClick={() => setShowSplash(true)}
          className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          Replay Intro Animation
        </button>
      </footer>
    </div>
  );
}
