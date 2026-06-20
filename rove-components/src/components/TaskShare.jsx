/**
 * TaskShare.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Rove — Task Assignment & Sharing Component
 *
 * Location : src/components/TaskShare.jsx
 *
 * Firestore data model:
 *   families/{familyId}/members  → { uid, displayName, photoURL, role }
 *   tasks (top-level collection) → { title, assignedTo, createdBy,
 *                                    familyGroupId, status, dueDate, createdAt }
 *
 * Props:
 *   familyId  {string}  Firestore document ID of the active family group
 *
 * Install before use:
 *   npm install firebase date-fns
 *   (Tailwind CSS must already be configured in your project)
 *
 * Tailwind config — add to tailwind.config.js under theme.extend:
 *   keyframes: {
 *     slideUp: {
 *       from: { opacity: '0', transform: 'translateY(24px)' },
 *       to:   { opacity: '1', transform: 'translateY(0)' },
 *     },
 *   },
 *   animation: { slideUp: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1) both' },
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { format, parseISO, isValid } from 'date-fns';

// ─── Firebase imports ─────────────────────────────────────────────────────────
// Update this path to wherever your firebase.js lives in the Rove project.
import { db, auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

/** 1–2 character initials from a display name */
const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

/** Deterministic avatar background colour from a string */
const AVATAR_PALETTE = [
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
];
const avatarColor = str => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
};

const getLevelDetails = (xp) => {
  let level = 1;
  let title = 'Initiate';
  let minXP = 0;
  let maxXP = 100;
  
  if (xp <= 100) {
    level = 1;
    title = 'Initiate';
    minXP = 0;
    maxXP = 100;
  } else if (xp <= 250) {
    level = 2;
    title = 'Acolyte';
    minXP = 101;
    maxXP = 250;
  } else if (xp <= 500) {
    level = 3;
    title = 'Disciple';
    minXP = 251;
    maxXP = 500;
  } else {
    level = 4;
    title = 'Grandmaster';
    minXP = 501;
    maxXP = 501;
  }
  
  let pct = 0;
  if (level === 4) {
    pct = 100;
  } else {
    const range = maxXP - (minXP === 0 ? 0 : minXP - 1);
    const progress = xp - (minXP === 0 ? 0 : minXP - 1);
    pct = Math.min(100, Math.max(0, (progress / range) * 100));
  }
  
  return { level, title, pct, maxXP };
};

const getWeekDates = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust for Sunday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return format(x, 'yyyy-MM-dd');
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// MemberAvatar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a photo or coloured-initial avatar circle.
 *
 * @param {{ member: object, size?: 'sm'|'md'|'lg', selected?: boolean, onClick?: function }} props
 */
const MemberAvatar = ({ member, size = 'md', selected = false, onClick }) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  const color = avatarColor(member.uid ?? member.displayName ?? '?');

  return (
    <button
      type="button"
      title={member.displayName}
      onClick={onClick}
      className={[
        'relative flex-shrink-0 rounded-full flex items-center justify-center font-semibold',
        'transition-all duration-150 focus:outline-none',
        sizeMap[size],
        selected
          ? 'ring-2 ring-offset-2 ring-offset-[#121214] ring-[#3B82F6] scale-110'
          : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-105',
        onClick ? 'cursor-pointer' : 'cursor-default',
      ].join(' ')}
      style={{ background: member.photoURL ? undefined : color }}
      aria-pressed={selected}
    >
      {member.photoURL ? (
        <img
          src={member.photoURL}
          alt={member.displayName}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-white select-none">{initials(member.displayName)}</span>
      )}

      {/* Owner crown pip */}
      {member.role === 'owner' && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#F59E0B]
                     rounded-full flex items-center justify-center
                     text-[7px] text-black font-bold select-none"
          aria-label="Group owner"
          title="Group owner"
        >
          ★
        </span>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:   'bg-yellow-500/15 text-yellow-400  border-yellow-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  overdue:   'bg-red-500/15    text-red-400     border-red-500/30',
};

const StatusBadge = ({ status }) => (
  <span
    className={`text-[10px] font-semibold uppercase tracking-wider
                px-2 py-0.5 rounded-full border whitespace-nowrap
                ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}
  >
    {status}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// ToggleSwitch
// ─────────────────────────────────────────────────────────────────────────────

const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={[
      'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-[#3B82F6]',
      'focus:ring-offset-2 focus:ring-offset-[#1C1C20]',
      checked    ? 'bg-[#3B82F6]'           : 'bg-white/10',
      disabled   ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
    ].join(' ')}
  >
    <span
      className={[
        'inline-block h-4 w-4 transform rounded-full bg-white',
        'shadow transition duration-200 mt-0.5',
        checked ? 'translate-x-4' : 'translate-x-0.5',
      ].join(' ')}
    />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// SpinnerIcon
// ─────────────────────────────────────────────────────────────────────────────

const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);
const IntroScreen = ({ onGoogleLogin, onShowEmail, error }) => {
  return (
    <div className="min-h-screen bg-[#121214] text-white flex items-center justify-center px-4 font-sans antialiased">
      <div className="w-full max-w-md bg-[#1C1C20] border border-white/8 rounded-2xl shadow-2xl p-6 space-y-8 text-center">
        
        {/* Header/Tagline */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans">
            ROVE
          </h1>
          <p className="text-white/50 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
            Track habits. Share chores. Build discipline.
          </p>
        </div>

        {/* Feature Preview Card */}
        <div className="bg-[#121214] border border-white/6 rounded-2xl p-5 shadow-inner space-y-4 text-left max-w-xs mx-auto relative overflow-hidden group">
          {/* Subtle accent glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#3B82F6]/10 rounded-full blur-2xl group-hover:bg-[#3B82F6]/15 transition-all duration-500"></div>
          
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-white/60 font-semibold text-[10px] tracking-wider uppercase">✦ Daily Checklist</span>
            <span className="text-[9px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>
          </div>
          
          <div className="space-y-3">
            {/* Completed task */}
            <div className="flex items-center gap-2.5 opacity-40">
              <div className="w-4.5 h-4.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</div>
              <div>
                <p className="text-xs font-medium text-white/95 line-through">Hydrate &amp; Stretch</p>
                <p className="text-[9px] text-white/30">Completed</p>
              </div>
            </div>
            
            {/* Pending task */}
            <div className="flex items-center gap-2.5">
              <div className="w-4.5 h-4.5 rounded-full border border-white/20"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white">Read 10 Pages</p>
                <p className="text-[9px] text-white/35">15 min • Priority High</p>
              </div>
              <span className="text-[9px] text-white/45 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">4:00 PM</span>
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="space-y-4">
          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg focus:outline-none"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-left">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={onShowEmail}
              className="text-xs text-white/40 hover:text-white/80 transition-colors focus:outline-none underline decoration-white/20"
            >
              Or continue with Email address
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

const Login = ({ onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (isSignUp && !displayName.trim()) {
      setError('Name is required.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, {
          displayName: displayName.trim(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121214] text-white flex items-center justify-center px-4 font-sans antialiased">
      <div className="w-full max-w-md bg-[#1C1C20] border border-white/8 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? 'Create your Rove account' : 'Sign in to Rove'}
          </h2>
          <p className="text-white/40 text-xs mt-1.5">
            {isSignUp ? 'Start managing tasks with your family' : 'Welcome back! Enter your details to sign in'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/40">Name</label>
              <input
                type="text"
                placeholder="Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/40">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/40">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold hover:bg-blue-500 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon />
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="text-center pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-xs text-[#3B82F6] hover:underline focus:outline-none"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="text-xs text-white/40 hover:text-white/80 focus:outline-none"
          >
            ← Back to Intro
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AssignTaskModal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Modal for creating a new task.
 *
 * @param {{
 *   open:        boolean,
 *   onClose:     function,
 *   members:     object[],
 *   currentUser: object
 * }} props
 */
const AssignTaskModal = ({ open, onClose, members, currentUser }) => {
  const [title,      setTitle]      = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate,    setDueDate]    = useState('');
  const [isWeekly,    setIsWeekly]    = useState(false);
  const [isMonthly,   setIsMonthly]   = useState(false);
  const [category,    setCategory]    = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const titleRef = useRef(null);

  // Reset & auto-focus on open
  useEffect(() => {
    if (open) {
      setTitle('');
      setAssignedTo('');
      setDueDate('');
      setError('');
      setIsWeekly(false);
      setIsMonthly(false);
      setCategory('General');
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!title.trim())             { setError('Task title is required.');             return; }
    if (!assignedTo)               { setError('Please select a family member.');      return; }
    if (!dueDate)                  { setError('Please pick a due date.');             return; }
    const parsed = parseISO(dueDate);
    if (!isValid(parsed))          { setError('Invalid date selected.');              return; }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title:         title.trim(),
        assignedTo,
        createdBy:     currentUser.uid,
        familyGroupId: currentUser.familyId,
        status:        'pending',
        dueDate:       Timestamp.fromDate(parsed),
        scheduledDates: [dueDate],
        scheduledDate: dueDate,
        createdAt:     serverTimestamp(),
        isWeekly,
        isMonthly,
        category,
        weeklyDone:    false,
        monthlyDone:   false,
      });
      onClose();
    } catch (err) {
      console.error('[TaskShare] addDoc error:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center
                 justify-center bg-black/75 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Assign Task"
    >
      {/* ── Panel ── */}
      <div
        className="w-full max-w-md bg-[#1C1C20] border border-white/8
                   rounded-2xl shadow-2xl overflow-hidden
                   animate-slideUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <h2 className="text-white font-semibold text-lg tracking-tight">Assign Task</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-white/40 hover:text-white/80 transition-colors
                       w-8 h-8 flex items-center justify-center
                       rounded-lg hover:bg-white/5 focus:outline-none text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5" noValidate>

          {/* Task title */}
          <div className="space-y-1.5">
            <label
              htmlFor="ts-title"
              className="block text-[10px] font-semibold uppercase tracking-widest text-white/40"
            >
              Task Title
            </label>
            <input
              id="ts-title"
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Take out the trash"
              maxLength={120}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm placeholder:text-white/25
                         focus:outline-none focus:border-[#3B82F6]
                         focus:ring-1 focus:ring-[#3B82F6]/40 transition-colors"
            />
          </div>

          {/* Assign to — avatar selector */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Assign To
            </p>

            {members.length === 0 ? (
              <p className="text-white/30 text-sm">No family members found.</p>
            ) : (
              <div className="flex flex-wrap gap-3" role="group" aria-label="Select a member">
                {members.map(m => (
                  <div key={m.uid} className="flex flex-col items-center gap-1.5">
                    <MemberAvatar
                      member={m}
                      size="lg"
                      selected={assignedTo === m.uid}
                      onClick={() => setAssignedTo(m.uid)}
                    />
                    <span className={[
                      'text-[10px] font-medium transition-colors',
                      assignedTo === m.uid ? 'text-[#3B82F6]' : 'text-white/40',
                    ].join(' ')}>
                      {m.displayName?.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Accessible dropdown fallback when many members */}
            {members.length > 6 && (
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                aria-label="Select member (dropdown)"
                className="mt-2 w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3
                           text-white text-sm focus:outline-none focus:border-[#3B82F6]
                           transition-colors"
              >
                <option value="">Select a member…</option>
                {members.map(m => (
                  <option key={m.uid} value={m.uid}>{m.displayName}</option>
                ))}
              </select>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label
              htmlFor="ts-due"
              className="block text-[10px] font-semibold uppercase tracking-widest text-white/40"
            >
              Due Date
            </label>
            <input
              id="ts-due"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={today}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm [color-scheme:dark]
                         focus:outline-none focus:border-[#3B82F6]
                         focus:ring-1 focus:ring-[#3B82F6]/40 transition-colors"
            />
          </div>

          {/* Recurrence & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3
                           text-white text-sm focus:outline-none focus:border-[#3B82F6]
                           focus:ring-1 focus:ring-[#3B82F6]/40 transition-colors"
              >
                <option value="General">General</option>
                <option value="Health">Health</option>
                <option value="Work">Work</option>
                <option value="Fitness">Fitness</option>
                <option value="Education">Education</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                Recurrence
              </label>
              <div className="flex gap-4 items-center h-[46px]">
                <label className="flex items-center gap-2 text-white text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isWeekly}
                    onChange={e => setIsWeekly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/10 bg-[#121214] accent-[#3B82F6] cursor-pointer"
                  />
                  Weekly
                </label>
                <label className="flex items-center gap-2 text-white text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isMonthly}
                    onChange={e => setIsMonthly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/10 bg-[#121214] accent-[#3B82F6] cursor-pointer"
                  />
                  Monthly
                </label>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p role="alert" className="text-red-400 text-xs bg-red-500/10
                                       border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/60
                         text-sm font-medium hover:bg-white/5 hover:text-white
                         transition-colors focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold
                         hover:bg-blue-500 active:scale-[0.98] transition-all
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-blue-500/20"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon />
                  Assigning…
                </span>
              ) : (
                'Assign Task ↗'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TaskCard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single task row with toggle, title, due date, assignee avatar, and status.
 *
 * @param {{
 *   task:           object,
 *   assignedMember: object|undefined,
 *   currentUser:    object,
 *   onToggle:       function
 * }} props
 */
const TaskCard = ({ task, assignedMember, currentUser, onToggle, onWeeklyToggle, onMonthlyToggle }) => {
  const isCompleted = task.status === 'completed';
  const isOverdue   = !isCompleted && task.dueDate?.toDate?.() < new Date();
  const effectiveStatus = isCompleted ? 'completed' : isOverdue ? 'overdue' : 'pending';

  const dueDateStr = task.dueDate?.toDate
    ? format(task.dueDate.toDate(), 'MMM d, yyyy')
    : '—';

  // Sub-members may only toggle tasks assigned to themselves
  const canToggle = currentUser?.role === 'owner' || task.assignedTo === currentUser?.uid;

  return (
    <li
      className={[
        'flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200',
        isCompleted
          ? 'bg-[#121214]/60 border-white/5 opacity-60'
          : 'bg-[#1C1C20] border-white/8 hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-blue-500/5',
      ].join(' ')}
    >
      <ToggleSwitch
        checked={isCompleted}
        onChange={(e) => onToggle(task, e)}
        disabled={!canToggle}
      />

      {/* Weekly & Monthly Toggles */}
      {(task.isWeekly || task.isMonthly) && (
        <div className="flex gap-1.5 flex-shrink-0">
          {task.isWeekly && (
            <button
              type="button"
              onClick={(e) => onWeeklyToggle(task, e)}
              className={[
                'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border transition-all duration-200',
                task.weeklyDone
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20',
              ].join(' ')}
              title="Toggle Weekly"
            >
              W
            </button>
          )}
          {task.isMonthly && (
            <button
              type="button"
              onClick={(e) => onMonthlyToggle(task, e)}
              className={[
                'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border transition-all duration-200',
                task.monthlyDone
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20',
              ].join(' ')}
              title="Toggle Monthly"
            >
              M
            </button>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={[
          'text-sm font-medium truncate transition-colors flex items-center gap-2',
          isCompleted ? 'line-through text-white/30' : 'text-white',
        ].join(' ')}>
          <span>{task.title}</span>
          {task.category && task.category !== 'General' && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-wider">
              {task.category}
            </span>
          )}
        </p>
        <p className="text-xs text-white/35 mt-0.5 tabular-nums">Due {dueDateStr}</p>
      </div>

      {assignedMember && <MemberAvatar member={assignedMember} size="sm" />}

      <StatusBadge status={effectiveStatus} />
    </li>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState = ({ onAdd, isOwner }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center select-none">
    <div className="w-16 h-16 rounded-2xl bg-[#1C1C20] border border-white/8
                    flex items-center justify-center text-2xl mb-4">
      📋
    </div>
    <p className="text-white font-medium mb-1">No tasks yet</p>
    <p className="text-white/40 text-sm mb-5">
      {isOwner ? 'Assign a task to get the family organised.' : 'No tasks have been assigned to you yet.'}
    </p>
    {isOwner && (
      <button
        type="button"
        onClick={onAdd}
        className="px-5 py-2.5 bg-[#3B82F6] text-white text-sm font-semibold
                   rounded-xl hover:bg-blue-500 transition-colors
                   shadow-lg shadow-blue-500/20 focus:outline-none"
      >
        + Assign First Task
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// TaskShare — default export (main component)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TaskShare
 *
 * Drop into any route/page that needs task assignment:
 *
 *   import TaskShare from '@/components/TaskShare';
 *   <TaskShare familyId="your-firestore-family-doc-id" />
 *
 * Reads `auth.currentUser` directly — make sure Firebase Auth is initialised
 * and the user is signed in before rendering this component.
 *
 * @param {{ familyId: string }} props
 */
export default function TaskShare({ familyId }) {
  // ── States ──────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── Local state ────────────────────────────────────────────────────────────
  const [members,        setMembers]        = useState([]);
  const [tasks,          setTasks]          = useState([]);
  const [currentMember,  setCurrentMember]  = useState(null);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingTasks,   setLoadingTasks]   = useState(true);
  const [filterStatus,   setFilterStatus]   = useState('all'); // 'all' | 'pending' | 'completed'

  const [pulseProgress, setPulseProgress] = useState(false);

  // Local RPG stats state with safe fallback defaults
  const [rpgStats, setRpgStats] = useState({
    currentXP: 0,
    level: 1,
    streakCount: 0,
    lastCompletedDate: null,
    completedDates: [],
  });
  const hasInitializedRpg = useRef(false);

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setCurrentUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Reset the RPG initialization flag when the user changes
  useEffect(() => {
    hasInitializedRpg.current = false;
  }, [currentUser?.uid]);

  // Synchronize local RPG stats from currentMember profile snapshot on load
  useEffect(() => {
    if (currentMember && !hasInitializedRpg.current) {
      setRpgStats({
        currentXP: currentMember.currentXP || 0,
        level: currentMember.level || 1,
        streakCount: currentMember.streakCount || 0,
        lastCompletedDate: currentMember.lastCompletedDate || null,
        completedDates: currentMember.completedDates || [],
      });
      hasInitializedRpg.current = true;
    }
  }, [currentMember]);

  // ── Streak Reset Effect ────────────────────────────────────────────────────
  useEffect(() => {
    if (!familyId || !currentUser) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    const lastDate = rpgStats.lastCompletedDate;
    if (lastDate && lastDate !== todayStr && lastDate !== yesterdayStr) {
      // Streak was missed! Reset local state
      setRpgStats(prev => ({
        ...prev,
        streakCount: 0,
        lastCompletedDate: null
      }));

      const resetStreak = async () => {
        try {
          await updateDoc(doc(db, 'families', familyId, 'members', currentUser.uid), {
            streakCount: 0,
            lastCompletedDate: null
          });
        } catch (err) {
          console.warn('[TaskShare] Firestore streak reset failed (likely permission rule). Local state is reset.', err);
        }
      };
      resetStreak();
    }
  }, [familyId, currentUser, rpgStats.lastCompletedDate]);

  // ── Google login handler ───────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google Sign In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message.replace('Firebase: ', ''));
      }
    }
  };

  // ── Real-time family members ───────────────────────────────────────────────
  useEffect(() => {
    if (!familyId) return;

    const ref = collection(db, 'families', familyId, 'members');
    const unsub = onSnapshot(
      ref,
      snap => {
        const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setMembers(list);

        if (currentUser) {
          const me = list.find(m => m.uid === currentUser.uid) ?? {
            uid:         currentUser.uid,
            displayName: currentUser.displayName ?? 'You',
            photoURL:    currentUser.photoURL    ?? null,
            role:        'member',
          };
          setCurrentMember({ ...me, familyId });
        }

        setLoadingMembers(false);
      },
      err => {
        console.error('[TaskShare] members listener:', err);
        setLoadingMembers(false);
      }
    );

    return unsub;
  }, [familyId, currentUser]);

  // ── Real-time tasks (role-aware query) ────────────────────────────────────
  useEffect(() => {
    if (!familyId || !currentMember) return;

    const ref = collection(db, 'tasks');
    const isOwner = currentMember.role === 'owner';

    /*
     * Index required in Firestore (create via console or auto-prompted):
     *   Owner  query → familyGroupId ASC, createdBy ASC, createdAt DESC
     *   Member query → familyGroupId ASC, assignedTo ASC, createdAt DESC
     */
    const q = isOwner
      ? query(ref,
          where('familyGroupId', '==', familyId),
          where('createdBy',     '==', currentMember.uid),
          orderBy('createdAt',   'desc'))
      : query(ref,
          where('familyGroupId', '==', familyId),
          where('assignedTo',    '==', currentMember.uid),
          orderBy('createdAt',   'desc'));

    const unsub = onSnapshot(
      q,
      snap => {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingTasks(false);
      },
      err => {
        console.error('[TaskShare] tasks listener:', err);
        setLoadingTasks(false);
      }
    );

    return unsub;
  }, [familyId, currentUser, rpgStats, tasks]);

  const handleWeeklyToggle = useCallback(async (task, e) => {
    const newWeeklyDone = !task.weeklyDone;
    try {
      await updateDoc(doc(db, 'tasks', task.id), { weeklyDone: newWeeklyDone });

      if (task.assignedTo === currentUser?.uid) {
        const baseXP = 10;
        const currentXP = rpgStats?.currentXP || 0;
        const streakCount = rpgStats?.streakCount || 0;
        const lastCompletedDate = rpgStats?.lastCompletedDate || null;
        const completedDates = Array.isArray(rpgStats?.completedDates) ? [...rpgStats.completedDates] : [];

        let xpChange = newWeeklyDone ? baseXP : -baseXP;
        const newXP = Math.max(0, currentXP + xpChange);
        const details = getLevelDetails(newXP);
        const newLevel = details.level;

        console.log("Current XP:", newXP);

        if (newWeeklyDone) {
          setPulseProgress(true);
          setTimeout(() => setPulseProgress(false), 400);

          if (e && e.target) {
            const rect = e.target.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
            for (let i = 0; i < 30; i++) {
              const p = document.createElement('div');
              p.style.position = 'fixed';
              p.style.left = `${x}px`;
              p.style.top = `${y}px`;
              p.style.width = `${Math.random() * 6 + 4}px`;
              p.style.height = `${Math.random() * 6 + 4}px`;
              p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
              p.style.borderRadius = '50%';
              p.style.pointerEvents = 'none';
              p.style.zIndex = '9999';
              const angle = Math.random() * Math.PI * 2;
              const velocity = Math.random() * 100 + 50;
              const dx = Math.cos(angle) * velocity;
              const dy = Math.sin(angle) * velocity;
              document.body.appendChild(p);
              const anim = p.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${dx}px, ${dy + 80}px) scale(0)`, opacity: 0 }
              ], {
                duration: Math.random() * 500 + 500,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
              });
              anim.onfinish = () => p.remove();
            }
          }
        }

        const updates = {
          currentXP: newXP,
          level: newLevel,
          streakCount: streakCount,
          lastCompletedDate: lastCompletedDate,
          completedDates: completedDates,
        };

        setRpgStats(updates);

        try {
          await updateDoc(doc(db, 'families', familyId, 'members', currentUser.uid), updates);
        } catch (dbErr) {
          console.warn('[TaskShare] Firestore profile write blocked:', dbErr);
        }
      }
    } catch (err) {
      console.error('[TaskShare] Error updating weeklyDone/RPG stats:', err);
    }
  }, [familyId, currentUser, rpgStats]);

  const handleMonthlyToggle = useCallback(async (task, e) => {
    const newMonthlyDone = !task.monthlyDone;
    try {
      await updateDoc(doc(db, 'tasks', task.id), { monthlyDone: newMonthlyDone });

      if (task.assignedTo === currentUser?.uid) {
        const baseXP = 10;
        const currentXP = rpgStats?.currentXP || 0;
        const streakCount = rpgStats?.streakCount || 0;
        const lastCompletedDate = rpgStats?.lastCompletedDate || null;
        const completedDates = Array.isArray(rpgStats?.completedDates) ? [...rpgStats.completedDates] : [];

        let xpChange = newMonthlyDone ? baseXP : -baseXP;
        const newXP = Math.max(0, currentXP + xpChange);
        const details = getLevelDetails(newXP);
        const newLevel = details.level;

        console.log("Current XP:", newXP);

        if (newMonthlyDone) {
          setPulseProgress(true);
          setTimeout(() => setPulseProgress(false), 400);

          if (e && e.target) {
            const rect = e.target.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
            for (let i = 0; i < 30; i++) {
              const p = document.createElement('div');
              p.style.position = 'fixed';
              p.style.left = `${x}px`;
              p.style.top = `${y}px`;
              p.style.width = `${Math.random() * 6 + 4}px`;
              p.style.height = `${Math.random() * 6 + 4}px`;
              p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
              p.style.borderRadius = '50%';
              p.style.pointerEvents = 'none';
              p.style.zIndex = '9999';
              const angle = Math.random() * Math.PI * 2;
              const velocity = Math.random() * 100 + 50;
              const dx = Math.cos(angle) * velocity;
              const dy = Math.sin(angle) * velocity;
              document.body.appendChild(p);
              const anim = p.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${dx}px, ${dy + 80}px) scale(0)`, opacity: 0 }
              ], {
                duration: Math.random() * 500 + 500,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
              });
              anim.onfinish = () => p.remove();
            }
          }
        }

        const updates = {
          currentXP: newXP,
          level: newLevel,
          streakCount: streakCount,
          lastCompletedDate: lastCompletedDate,
          completedDates: completedDates,
        };

        setRpgStats(updates);

        try {
          await updateDoc(doc(db, 'families', familyId, 'members', currentUser.uid), updates);
        } catch (dbErr) {
          console.warn('[TaskShare] Firestore profile write blocked:', dbErr);
        }
      }
    } catch (err) {
      console.error('[TaskShare] Error updating monthlyDone/RPG stats:', err);
    }
  }, [familyId, currentUser, rpgStats]);

  // ── Early returns for Auth ─────────────────────────────────────────────────
  const handleToggle = useCallback(async (task, e) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      // 1. Update task in Firestore (always works)
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });

      if (task.assignedTo === currentUser?.uid) {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

        const baseXP = 10;
        // SAFE INITIAL STATE Fallbacks:
        const currentXP = rpgStats?.currentXP || 0;
        const streakCount = rpgStats?.streakCount || 0;
        const lastCompletedDate = rpgStats?.lastCompletedDate || null;
        const completedDates = Array.isArray(rpgStats?.completedDates) ? [...rpgStats.completedDates] : [];

        let xpChange = newStatus === 'completed' ? baseXP : -baseXP;
        const newXP = Math.max(0, currentXP + xpChange);
        const details = getLevelDetails(newXP);
        const newLevel = details.level;

        // Required Console Log:
        console.log("Current XP:", newXP);

        // Trigger pulse animation
        if (newStatus === 'completed') {
          setPulseProgress(true);
          setTimeout(() => setPulseProgress(false), 400);
          
          // Trigger confetti burst from element
          if (e && e.target) {
            const rect = e.target.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
            for (let i = 0; i < 30; i++) {
              const p = document.createElement('div');
              p.style.position = 'fixed';
              p.style.left = `${x}px`;
              p.style.top = `${y}px`;
              p.style.width = `${Math.random() * 6 + 4}px`;
              p.style.height = `${Math.random() * 6 + 4}px`;
              p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
              p.style.borderRadius = '50%';
              p.style.pointerEvents = 'none';
              p.style.zIndex = '9999';
              const angle = Math.random() * Math.PI * 2;
              const velocity = Math.random() * 100 + 50;
              const dx = Math.cos(angle) * velocity;
              const dy = Math.sin(angle) * velocity;
              document.body.appendChild(p);
              const anim = p.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${dx}px, ${dy + 80}px) scale(0)`, opacity: 0 }
              ], {
                duration: Math.random() * 500 + 500,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
              });
              anim.onfinish = () => p.remove();
            }
          }
        }

        const updates = {
          currentXP: newXP,
          level: newLevel,
          streakCount: streakCount,
          lastCompletedDate: lastCompletedDate,
          completedDates: completedDates,
        };

        if (newStatus === 'completed') {
          // Check if all today's tasks are completed
          const todayTasks = tasks.filter(t =>
            t.assignedTo === currentUser.uid &&
            t.dueDate?.toDate &&
            format(t.dueDate.toDate(), 'yyyy-MM-dd') === todayStr
          );

          const allCompleted = todayTasks.every(t =>
            t.id === task.id ? true : t.status === 'completed'
          );

          if (todayTasks.length > 0 && allCompleted && lastCompletedDate !== todayStr) {
            const newStreak = (lastCompletedDate === yesterdayStr)
              ? streakCount + 1
              : 1;

            updates.streakCount = newStreak;
            updates.lastCompletedDate = todayStr;
            if (!completedDates.includes(todayStr)) {
              updates.completedDates.push(todayStr);
            }
          }
        } else {
          // Rollback streak status if a task is unchecked today
          if (lastCompletedDate === todayStr) {
            const prevStreak = Math.max(0, streakCount - 1);
            updates.streakCount = prevStreak;
            updates.lastCompletedDate = prevStreak > 0 ? yesterdayStr : null;
            updates.completedDates = completedDates.filter(d => d !== todayStr);
          }
        }

        // Update local RPG stats state immediately so UI reacts instantly
        setRpgStats(updates);

        // Attempt to sync to Firestore in a try/catch (ignoring permission write errors)
        try {
          await updateDoc(doc(db, 'families', familyId, 'members', currentUser.uid), updates);
        } catch (dbErr) {
          console.warn('[TaskShare] Firestore profile write blocked (likely permission rule). Updating local state instead:', dbErr);
        }
      }
    } catch (err) {
      console.error('[TaskShare] Error updating task/RPG stats:', err);
    }
  }, [familyId, currentUser, rpgStats, tasks]);

  // ── Early returns for Auth ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#121214] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <SpinnerIcon />
          <p className="text-white/40 text-sm font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (showEmailForm) {
      return <Login onBack={() => { setShowEmailForm(false); setAuthError(''); }} />;
    }
    return (
      <IntroScreen
        onGoogleLogin={handleGoogleLogin}
        onShowEmail={() => setShowEmailForm(true)}
        error={authError}
      />
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const memberMap   = Object.fromEntries(members.map(m => [m.uid, m]));
  const isOwner     = currentMember?.role === 'owner';
  const pendingCnt  = tasks.filter(t => t.status !== 'completed').length;
  const doneCnt     = tasks.filter(t => t.status === 'completed').length;

  const visibleTasks = tasks.filter(t => {
    if (filterStatus === 'pending')   return t.status !== 'completed';
    if (filterStatus === 'completed') return t.status === 'completed';
    return true;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#121214] text-white font-sans antialiased">
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>ROVE</h1>
            <p className="text-white/40 text-xs mt-0.5">
              {isOwner ? "Managing this group" : 'Your assigned tasks'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/80
                         text-sm font-semibold rounded-xl hover:bg-white/10
                         hover:text-white transition-colors focus:outline-none focus:ring-2
                         focus:ring-white/20"
            >
              Sign Out
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#3B82F6] text-white
                           text-sm font-semibold rounded-xl hover:bg-blue-500
                           transition-colors shadow-lg shadow-blue-500/25
                           focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                <span className="text-base leading-none">+</span>
                Assign Task
              </button>
            )}
          </div>
        </header>

        {/* Rove Sub-Header with XP Bar & Streak Badge */}
        <div className="flex items-center justify-between bg-white/[0.02] border-b border-white/[0.04] py-2.5 px-1">
          <style>{`
            @keyframes xpBarPulse {
              0% { transform: scaleY(1); }
              50% { transform: scaleY(1.8); }
              100% { transform: scaleY(1); }
            }
            .xp-bar-pulse {
              animation: xpBarPulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
              transform-origin: center;
            }
          `}</style>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Level {getLevelDetails(rpgStats.currentXP).level} • {getLevelDetails(rpgStats.currentXP).title}
          </span>
          <div className="flex-1 mx-3 h-[3px] bg-white/10 rounded-full overflow-hidden relative">
            <div
              className={`h-full bg-gradient-to-r from-[#a855f7] to-[#6366f1] transition-all duration-300 ease-out ${pulseProgress ? 'xp-bar-pulse' : ''}`}
              style={{ width: `${getLevelDetails(rpgStats.currentXP).pct}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold flex items-center gap-0.5"
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: rpgStats.streakCount >= 8 ? '#a855f7' : (rpgStats.streakCount >= 3 ? '#fb923c' : '#8e8e9f')
              }}
            >
              <span>🔥</span>
              <span>{rpgStats.streakCount}</span>
            </span>
          </div>
        </div>

        {/* RPG Dashboard Card */}
        <div className="rpg-card" style={{ background: 'rgba(20, 20, 25, 0.5)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '14px 16px', margin: '0 auto', width: '100%', textAlign: 'left', boxSizing: 'border-box', position: 'relative', zIndex: 10 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white flex items-center gap-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <span style={{ color: rpgStats.streakCount >= 8 ? '#a855f7' : (rpgStats.streakCount >= 3 ? '#fb923c' : '#8e8e9f') }}>🔥</span>
                {rpgStats.streakCount} Day Streak
              </span>
            </div>
            {/* Locked Streak Freeze Button */}
            <button
              type="button"
              disabled
              className="text-[10px] font-bold text-[#8e8e9f] bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 cursor-not-allowed transition-all duration-200"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              🥶 Buy Streak Freeze (Premium Only)
            </button>
          </div>
          
          {/* Weekly completion tracker dots (M, T, W, Th, F, S, S) */}
          <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-white/[0.04]">
            <span className="text-[9px] font-bold tracking-widest uppercase text-white/35" style={{ fontFamily: "'Outfit', sans-serif" }}>Weekly Tracker</span>
            <div className="flex justify-between items-center px-1.5 py-1">
              {getWeekDates(new Date()).map((date, idx) => {
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const isToday = date === todayStr;
                const isCompleted = rpgStats.completedDates?.includes(date);
                const weekLetters = ['M', 'T', 'W', 'Th', 'F', 'S', 'S'];
                return (
                  <div key={date} className="flex flex-col items-center gap-1">
                    <span className={`text-[8px] font-bold ${isToday ? 'text-white' : 'text-white/35'}`}>
                      {weekLetters[idx]}
                    </span>
                    {isCompleted ? (
                      <div className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]" />
                    ) : (
                      <div className="w-2 h-2 rounded-full border border-white/20 bg-transparent" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Family member strip ── */}
        <section
          aria-label="Family members"
          className="bg-[#1C1C20] border border-white/8 rounded-2xl px-5 py-4"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-3">
            Family Members
          </p>

          {loadingMembers ? (
            <div className="flex gap-3" aria-busy="true" aria-label="Loading members">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-white/30 text-sm">No members found.</p>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {members.map(m => (
                <div key={m.uid} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <MemberAvatar
                    member={m}
                    size="md"
                    selected={m.uid === currentMember?.uid}
                  />
                  <span className={[
                    'text-[10px] font-medium whitespace-nowrap transition-colors',
                    m.uid === currentMember?.uid ? 'text-[#3B82F6]' : 'text-white/40',
                  ].join(' ')}>
                    {m.uid === currentMember?.uid ? 'You' : m.displayName?.split(' ')[0]}
                  </span>
                </div>
              ))}
              
              {/* If no other family members, render Invite/Add Member button */}
              {members.filter(m => m.uid !== currentMember?.uid).length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/?inviteCode=${familyId}`;
                    navigator.clipboard.writeText(link);
                    alert(`Invite link copied to clipboard!\nShare this with your family: ${link}`);
                  }}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-white/60 text-lg font-light">+</span>
                  </div>
                  <span className="text-[10px] font-medium text-white/40 whitespace-nowrap">
                    Invite Member
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3" aria-label="Task statistics">
          {[
            { label: 'Total',     value: tasks.length, color: 'text-white'        },
            { label: 'Pending',   value: pendingCnt,   color: 'text-yellow-400'   },
            { label: 'Completed', value: doneCnt,       color: 'text-emerald-400' },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-[#1C1C20] border border-white/8 rounded-xl px-4 py-3 text-center"
            >
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-white/35 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filter pills ── */}
        <div className="flex gap-2" role="group" aria-label="Filter tasks by status">
          {['all', 'pending', 'completed'].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterStatus(f)}
              aria-pressed={filterStatus === f}
              className={[
                'px-4 py-1.5 rounded-full text-xs font-semibold capitalize',
                'border transition-colors focus:outline-none',
                filterStatus === f
                  ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                  : 'bg-transparent border-white/10 text-white/45 hover:text-white hover:border-white/25',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Task list ── */}
        <section aria-label="Task list">
          {loadingTasks ? (
            <ul className="space-y-3" aria-busy="true" aria-label="Loading tasks">
              {[...Array(3)].map((_, i) => (
                <li key={i}
                  className="h-16 rounded-xl bg-[#1C1C20] animate-pulse border border-white/5" />
              ))}
            </ul>
          ) : visibleTasks.length === 0 ? (
            <EmptyState onAdd={() => setModalOpen(true)} isOwner={isOwner} />
          ) : (
            <div className="space-y-6">
              {['General', 'Health', 'Work', 'Fitness', 'Education', 'Sports'].map(cat => {
                const catTasks = visibleTasks.filter(t => (t.category || 'General') === cat);
                if (catTasks.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider pl-1 pb-1 border-b border-white/5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      <span>✦</span> {cat}
                    </div>
                    <ul className="space-y-2.5">
                      {catTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          assignedMember={memberMap[task.assignedTo]}
                          currentUser={currentMember}
                          onToggle={handleToggle}
                          onWeeklyToggle={handleWeeklyToggle}
                          onMonthlyToggle={handleMonthlyToggle}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* ── Assign Task Modal ── */}
      <AssignTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        members={members}
        currentUser={currentMember ?? { uid: currentUser?.uid, familyId }}
      />
    </div>
  );
}
