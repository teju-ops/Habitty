import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Camera,
  Lock,
  Bell,
  ShieldCheck,
  Cpu,
  Watch,
  Activity,
  Heart,
  Flame,
  Footprints,
  RefreshCw,
  Check,
  LogOut,
  Clock,
  Calendar,
  UserCheck,
  Smartphone,
} from 'lucide-react';
import {
  UserModel,
  UserPermissions,
  WearableDevice,
  generatePasswordHash,
  checkPasswordHash,
} from './typesAndServices';

interface SplashLandingProps {
  onEnterDashboard: () => void;
  darkMode: boolean;
}

export const AnimatedSplashLanding: React.FC<SplashLandingProps> = ({
  onEnterDashboard,
  darkMode,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 transition-colors duration-500 ${
        darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute w-[420px] h-[420px] rounded-full blur-3xl opacity-25 bg-indigo-500"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg animate-[fadeIn_0.6s_ease-out]">
        {/* Animated Center Habitty Logo Mark */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-600 text-white shadow-xl mb-6 animate-bounce">
          <div className="flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold tracking-tighter">H</span>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-slate-950">
            <Check className="w-4 h-4 stroke-[3]" />
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Habitty
        </h1>
        <p
          className={`mt-3 text-base sm:text-lg max-w-md ${
            darkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          Minimalist daily rituals, streak momentum, and smart wearable sync in one calm workspace.
        </p>

        {/* Animated Progress Bar */}
        <div className="w-56 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-8">
          <div className="h-full bg-indigo-600 rounded-full animate-[pulse_1.2s_ease-in-out_infinite] w-full" />
        </div>

        <button
          type="button"
          onClick={onEnterDashboard}
          className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
        >
          Open Dashboard →
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// WEARABLES SECTION (Fitness Band & Smart Watch Sync)
// ============================================================================

interface WearablesHubProps {
  devices: WearableDevice[];
  onToggleConnect: (deviceId: string) => void;
  onSyncDevice: (deviceId: string) => void;
  onToggleAutoComplete: (deviceId: string) => void;
}

export const WearablesSection: React.FC<WearablesHubProps> = ({
  devices,
  onToggleConnect,
  onSyncDevice,
  onToggleAutoComplete,
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      onSyncDevice(id);
      setSyncingId(null);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Watch className="w-6 h-6 text-indigo-600" />
            Fitness Band & Smart Watch Integration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pair your wearable devices to sync live steps, heart rate, active calories, and auto-complete fitness habits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`rounded-xl border p-6 transition-colors ${
              device.connected
                ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    device.connected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {device.type === 'Fitness Band' ? (
                    <Activity className="w-6 h-6" />
                  ) : (
                    <Watch className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {device.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {device.type} ·{' '}
                    {device.connected ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Connected ({device.battery}% battery)
                      </span>
                    ) : (
                      <span>Disconnected</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleConnect(device.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  device.connected
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {device.connected ? 'Disconnect' : 'Connect Device'}
              </button>
            </div>

            {device.connected ? (
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Footprints className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Steps</span>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                      {device.stepsToday.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Heart Rate</span>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                      {device.heartRateBpm} bpm
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Active Cal</span>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                      {device.activeCalories} kcal
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={device.autoCompleteFitnessHabits}
                      onChange={() => onToggleAutoComplete(device.id)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    Auto-complete Fitness habits when activity target is met
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSync(device.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold rounded-lg hover:bg-indigo-100 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${syncingId === device.id ? 'animate-spin' : ''}`}
                    />
                    Sync Now
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 tabular-nums">
                  Last synced: {device.lastSynced}
                </p>
              </div>
            ) : (
              <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                Click <strong>Connect Device</strong> to pair via Bluetooth Low Energy and import real-time workout & step milestones into your Habitty dashboard.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CLEAN PROFILE & SETTINGS SECTION (No code/PK/hash/tampering info)
// ============================================================================

const AVATAR_PRESETS = [
  'https://api.dicebear.com/9.x/notionists/svg?seed=Tejaswini&backgroundColor=e0e7ff',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=dcfce7',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Sam&backgroundColor=fef3c7',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Jordan&backgroundColor=fce7f3',
];

interface ProfileSectionProps {
  currentUser: UserModel;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateProfile: (updates: { username: string; email: string; bio: string; avatar_url: string }) => boolean;
  onResetPassword: (currentPassword: string, newPassword: string) => { ok: boolean; message: string };
  permissions: UserPermissions;
  onUpdatePermissions: (next: UserPermissions) => void;
  devices: WearableDevice[];
  onToggleConnectDevice: (deviceId: string) => void;
  onSyncDevice: (deviceId: string) => void;
  onLogout: () => void;
}

export const ProfileAndSettingsView: React.FC<ProfileSectionProps> = ({
  currentUser,
  darkMode,
  onToggleDarkMode,
  onUpdateProfile,
  onResetPassword,
  permissions,
  onUpdatePermissions,
  devices,
  onToggleConnectDevice,
  onSyncDevice,
  onLogout,
}) => {
  // User Info Edit state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar_url || '');

  // Password Reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwFeedback, setPwFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
        onUpdateProfile({
          username: currentUser.username,
          email: currentUser.email,
          bio: currentUser.bio || '',
          avatar_url: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUserInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onUpdateProfile({
      username: editUsername,
      email: editEmail,
      bio: editBio,
      avatar_url: editAvatar,
    });
    if (ok) {
      setIsEditingInfo(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwFeedback(null);

    if (newPassword.length < 6) {
      setPwFeedback({
        type: 'error',
        text: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwFeedback({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    const res = onResetPassword(currentPassword, newPassword);
    if (res.ok) {
      setPwFeedback({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPwFeedback({ type: 'error', text: res.message });
    }
  };

  const activeAvatar = editAvatar || currentUser.avatar_url;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Profile Header, Avatar Picture & Edit User Info */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {activeAvatar ? (
                <img
                  src={activeAvatar}
                  alt={currentUser.username}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-600"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                  {currentUser.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="avatar-upload-input"
                title="Upload Profile Picture"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shadow cursor-pointer hover:bg-indigo-600 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentUser.username}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
              {currentUser.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {currentUser.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEditUsername(currentUser.username);
                setEditEmail(currentUser.email);
                setEditBio(currentUser.bio || '');
                setEditAvatar(currentUser.avatar_url || '');
                setIsEditingInfo(!isEditingInfo);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {isEditingInfo ? 'Cancel Edit' : 'Edit Profile Info'}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>

        {/* Avatar Quick Presets */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Choose a quick avatar style or click the camera icon to upload a custom photo:
          </span>
          <div className="flex items-center gap-2">
            {AVATAR_PRESETS.map((presetUrl, idx) => (
              <button
                key={presetUrl}
                type="button"
                onClick={() => {
                  setEditAvatar(presetUrl);
                  onUpdateProfile({
                    username: currentUser.username,
                    email: currentUser.email,
                    bio: currentUser.bio || '',
                    avatar_url: presetUrl,
                  });
                }}
                className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer ${
                  activeAvatar === presetUrl ? 'border-indigo-600' : 'border-transparent'
                }`}
                title={`Avatar preset ${idx + 1}`}
              >
                <img src={presetUrl} alt={`Preset ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Edit User Info Form */}
        {isEditingInfo && (
          <form
            onSubmit={handleSaveUserInfo}
            className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Login Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Personal Bio / Goal Statement
              </label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="e.g. Focused on daily fitness and mindful reading."
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 2. Login Data & Appearance (Day and Night Toggle Mode) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Login Data Card */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Login & Session Activity
          </h2>
          <dl className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member Since
              </dt>
              <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">
                {currentUser.created_at}
              </dd>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Last Login Time
              </dt>
              <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">
                {currentUser.last_login_at || `${currentUser.created_at} 09:00 AM`}
              </dd>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                Total Sign-In Sessions
              </dt>
              <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">
                {currentUser.login_count || 1} sessions
              </dd>
            </div>

            <div className="flex items-center justify-between py-1">
              <dt className="text-slate-500 dark:text-slate-400">Session Status</dt>
              <dd className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Active & Verified
              </dd>
            </div>
          </dl>
        </section>

        {/* Day and Night Mode Appearance Toggle Card */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {darkMode ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              Day & Night Mode
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Switch between crisp daylight mode and low-glare night mode across your dashboard, habit cards, and charts.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Current Theme: {darkMode ? 'Night Mode (Dark)' : 'Day Mode (Light)'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Saved automatically to your profile preferences
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Switch to {darkMode ? 'Day Mode' : 'Night Mode'}
            </button>
          </div>
        </section>
      </div>

      {/* 3. Notification, Reminder, App & Background Running Permissions */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            Notifications & System Permissions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage reminder alerts, application permissions, and background synchronization for streaks and wearables.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {/* Push Notifications Button/Toggle */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs">
                Push Notifications
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Receive instant alerts when daily streaks are at risk or milestones are achieved
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdatePermissions({
                  ...permissions,
                  notificationsEnabled: !permissions.notificationsEnabled,
                })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                permissions.notificationsEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {permissions.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Reminder Permission + Time */}
          <div className="py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs">
                Daily Reminder Permission
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Allow scheduled daily habit check-in reminders at your preferred time
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="time"
                value={permissions.reminderTime}
                onChange={(e) =>
                  onUpdatePermissions({ ...permissions, reminderTime: e.target.value })
                }
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md tabular-nums"
              />
              <button
                type="button"
                onClick={() =>
                  onUpdatePermissions({
                    ...permissions,
                    dailyReminderPermission: !permissions.dailyReminderPermission,
                  })
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  permissions.dailyReminderPermission
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {permissions.dailyReminderPermission ? 'Allowed' : 'Blocked'}
              </button>
            </div>
          </div>

          {/* App Permission */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                App Storage & Health Sensor Permission
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Grant Habitty permission to read step counters, heart rate sensors, and local storage
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdatePermissions({
                  ...permissions,
                  appPermission: !permissions.appPermission,
                })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                permissions.appPermission
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {permissions.appPermission ? 'Granted' : 'Denied'}
            </button>
          </div>

          {/* Background Running Permission */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                Background Running Permission
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Keep Habitty active in the background to sync fitness bands & smart watches automatically
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdatePermissions({
                  ...permissions,
                  backgroundRunningPermission: !permissions.backgroundRunningPermission,
                })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                permissions.backgroundRunningPermission
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {permissions.backgroundRunningPermission ? 'Active' : 'Restricted'}
            </button>
          </div>
        </div>
      </section>

      {/* 4. Password Reset Option (Directly Updates Login Password) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          Reset Login Password
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Update your account password. Your new password will immediately take effect for future logins.
        </p>

        {pwFeedback && (
          <div
            className={`mt-4 px-4 py-2.5 rounded-lg text-xs font-medium border ${
              pwFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 text-red-800 dark:text-red-200'
            }`}
          >
            {pwFeedback.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              New Password (min 6 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </section>

      {/* 5. Quick Fitness Band & Smart Watch Connection Card inside Profile */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Watch className="w-4 h-4 text-indigo-600" />
              Connected Fitness Band & Smart Watch
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect or sync your wearable devices directly from your profile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {devices.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {d.type} · {d.connected ? `${d.stepsToday.toLocaleString()} steps` : 'Not paired'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.connected && (
                  <button
                    type="button"
                    onClick={() => onSyncDevice(d.id)}
                    className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg cursor-pointer"
                  >
                    Sync
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onToggleConnectDevice(d.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                    d.connected
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {d.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
