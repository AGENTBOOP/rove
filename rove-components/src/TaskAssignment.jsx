/**
 * TaskAssignment.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Rove — Task Assignment & Sharing component
 *
 * Firestore data model expected:
 *   families/{familyId}/members  → { uid, displayName, photoURL, role }
 *   tasks (top-level collection) → { title, assignedTo, createdBy,
 *                                    familyGroupId, status, dueDate, createdAt }
 *
 * Props:
 *   familyId  (string) – Firestore document ID of the active family group
 *
 * Dependencies (install before use):
 *   npm install firebase date-fns
 *   (Tailwind CSS must already be configured in your project)
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
import { db, auth } from './firebase';

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Returns the 1–2 character initials for a display name */
const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

/** Deterministic avatar color from a string (cycles through neon palette) */
const AVATAR_COLORS = [
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
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * MemberAvatar
 * Shows a photo or coloured initials circle.
 * size: 'sm' | 'md' | 'lg'
 */
const MemberAvatar = ({ member, size = 'md', selected = false, onClick }) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  const color = avatarColor(member.uid || member.displayName || '?');

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
        />
      ) : (
        <span className="text-white select-none">{initials(member.displayName)}</span>
      )}

      {/* Owner crown pip */}
      {member.role === 'owner' && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#F59E0B] rounded-full
                     flex items-center justify-center text-[7px] text-black font-bold"
          title="Group owner"
          aria-label="Group owner"
        >
          ★
        </span>
      )}
    </button>
  );
};

/**
 * StatusBadge
 */
const StatusBadge = ({ status }) => {
  const map = {
    pending:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    completed:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    overdue:    'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5
                  rounded-full border ${map[status] ?? map.pending}`}
    >
      {status}
    </span>
  );
};

/**
 * ToggleSwitch
 */
const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={[
      'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#1C1C20]',
      checked ? 'bg-[#3B82F6]' : 'bg-white/10',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
    ].join(' ')}
  >
    <span
      className={[
        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 mt-0.5',
        checked ? 'translate-x-4' : 'translate-x-0.5',
      ].join(' ')}
    />
  </button>
);

/**
 * AssignTaskModal
 * Controlled by `open` prop. Calls `onClose()` and `onSubmit(data)`.
 */
const AssignTaskModal = ({ open, onClose, members, currentUser }) => {
  const [title,      setTitle]      = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate,    setDueDate]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const titleRef = useRef(null);

  // Auto-focus title on open
  useEffect(() => {
    if (open) {
      setTitle(''); setAssignedTo(''); setDueDate(''); setError('');
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!title.trim())   { setError('Task title is required.'); return; }
    if (!assignedTo)     { setError('Please select a family member.'); return; }
    if (!dueDate)        { setError('Please pick a due date.'); return; }

    const parsed = parseISO(dueDate);
    if (!isValid(parsed)) { setError('Invalid date.'); return; }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title:         title.trim(),
        assignedTo,
        createdBy:     currentUser.uid,
        familyGroupId: currentUser.familyId,
        status:        'pending',
        dueDate:       Timestamp.fromDate(parsed),
        createdAt:     serverTimestamp(),
      });
      onClose();
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-black/70 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label="Assign Task"
    >
      {/* Panel */}
      <div
        className="w-full max-w-md bg-[#1C1C20] border border-white/8
                   rounded-2xl shadow-2xl overflow-hidden
                   animate-[slideUp_0.28s_cubic-bezier(0.16,1,0.3,1)_both]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-white/6">
          <h2 className="text-white font-semibold text-lg tracking-tight">
            Assign Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors
                       text-xl leading-none focus:outline-none rounded-lg
                       w-8 h-8 flex items-center justify-center hover:bg-white/5"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Task title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/40">
              Task Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Take out the trash"
              maxLength={120}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm placeholder:text-white/25
                         focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40
                         transition-colors"
            />
          </div>

          {/* Assign to — avatar selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/40">
              Assign To
            </label>
            <div className="flex flex-wrap gap-3">
              {members.length === 0 && (
                <p className="text-white/30 text-sm">No family members found.</p>
              )}
              {members.map(m => (
                <div key={m.uid} className="flex flex-col items-center gap-1">
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

            {/* Fallback dropdown for accessibility / many members */}
            {members.length > 6 && (
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
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
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/40">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm [color-scheme:dark]
                         focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40
                         transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20
                          rounded-lg px-3 py-2">
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
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
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

/**
 * TaskCard
 * Single task row.
 */
const TaskCard = ({ task, assignedMember, currentUser, onToggle }) => {
  const isOverdue =
    task.status !== 'completed' &&
    task.dueDate?.toDate() < new Date();

  const effectiveStatus = task.status === 'completed'
    ? 'completed'
    : isOverdue ? 'overdue' : 'pending';

  const dueDateStr = task.dueDate?.toDate
    ? format(task.dueDate.toDate(), 'MMM d, yyyy')
    : '—';

  const isCompleted = task.status === 'completed';

  return (
    <li
      className={[
        'group flex items-center gap-4 px-4 py-4 rounded-xl border',
        'transition-all duration-200',
        isCompleted
          ? 'bg-[#121214]/60 border-white/5 opacity-60'
          : 'bg-[#1C1C20] border-white/8 hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-blue-500/5',
      ].join(' ')}
    >
      {/* Toggle */}
      <ToggleSwitch
        checked={isCompleted}
        onChange={() => onToggle(task)}
        disabled={
          /* Sub-members can only complete tasks assigned to them */
          currentUser.role !== 'owner' && task.assignedTo !== currentUser.uid
        }
      />

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={[
          'text-sm font-medium truncate',
          isCompleted ? 'line-through text-white/30' : 'text-white',
        ].join(' ')}>
          {task.title}
        </p>
        <p className="text-xs text-white/35 mt-0.5">Due {dueDateStr}</p>
      </div>

      {/* Assigned-to avatar */}
      {assignedMember && (
        <MemberAvatar member={assignedMember} size="sm" />
      )}

      {/* Status badge */}
      <StatusBadge status={effectiveStatus} />
    </li>
  );
};

/**
 * EmptyState
 */
const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-[#1C1C20] border border-white/8
                    flex items-center justify-center text-2xl mb-4">
      📋
    </div>
    <p className="text-white font-medium mb-1">No tasks yet</p>
    <p className="text-white/40 text-sm mb-5">
      Assign a task to get the family organised.
    </p>
    <button
      type="button"
      onClick={onAdd}
      className="px-5 py-2.5 bg-[#3B82F6] text-white text-sm font-semibold rounded-xl
                 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
    >
      + Assign First Task
    </button>
  </div>
);

/** Tiny SVG spinner */
const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * TaskAssignment
 *
 * @param {{ familyId: string }} props
 *
 * Usage:
 *   <TaskAssignment familyId="abc123" />
 *
 * The component reads `auth.currentUser` automatically. Make sure Firebase Auth
 * is initialised (and the user is signed in) before rendering this component.
 *
 * The Firestore `families/{familyId}/members` subcollection documents must
 * include a `role` field with value "owner" for the group manager, and any
 * other string (e.g. "member") for everyone else.
 */
export default function TaskAssignment({ familyId }) {
  const currentFirebaseUser = auth.currentUser;

  // ── State ──────────────────────────────────────────────────────────────────
  const [members,       setMembers]       = useState([]);
  const [tasks,         setTasks]         = useState([]);
  const [currentMember, setCurrentMember] = useState(null); // enriched user obj
  const [modalOpen,     setModalOpen]     = useState(false);
  const [loadingMembers,setLoadingMembers]= useState(true);
  const [loadingTasks,  setLoadingTasks]  = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('all'); // 'all' | 'pending' | 'completed'

  // ── Fetch family members (real-time) ───────────────────────────────────────
  useEffect(() => {
    if (!familyId) return;

    const membersRef = collection(db, 'families', familyId, 'members');
    const unsubscribe = onSnapshot(
      membersRef,
      snapshot => {
        const list = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
        setMembers(list);

        // Identify current user within the family
        if (currentFirebaseUser) {
          const me = list.find(m => m.uid === currentFirebaseUser.uid) ?? {
            uid:         currentFirebaseUser.uid,
            displayName: currentFirebaseUser.displayName ?? 'You',
            photoURL:    currentFirebaseUser.photoURL    ?? null,
            role:        'member',
            familyId,
          };
          setCurrentMember({ ...me, familyId });
        }
        setLoadingMembers(false);
      },
      err => {
        console.error('Members listener error:', err);
        setLoadingMembers(false);
      }
    );

    return unsubscribe;
  }, [familyId, currentFirebaseUser]);

  // ── Fetch tasks (real-time, filtered by role) ──────────────────────────────
  useEffect(() => {
    if (!familyId || !currentMember) return;

    const tasksRef = collection(db, 'tasks');

    let q;
    if (currentMember.role === 'owner') {
      // Owner sees all tasks they created for this family group
      q = query(
        tasksRef,
        where('familyGroupId', '==', familyId),
        where('createdBy',     '==', currentMember.uid),
        orderBy('createdAt',  'desc')
      );
    } else {
      // Sub-member sees only tasks assigned to them
      q = query(
        tasksRef,
        where('familyGroupId', '==', familyId),
        where('assignedTo',    '==', currentMember.uid),
        orderBy('createdAt',  'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingTasks(false);
      },
      err => {
        console.error('Tasks listener error:', err);
        setLoadingTasks(false);
      }
    );

    return unsubscribe;
  }, [familyId, currentMember]);

  // ── Toggle task completion ─────────────────────────────────────────────────
  const handleToggle = useCallback(async task => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  }, []);

  // ── Member lookup map ──────────────────────────────────────────────────────
  const memberMap = Object.fromEntries(members.map(m => [m.uid, m]));

  // ── Filtered task list ─────────────────────────────────────────────────────
  const visibleTasks = tasks.filter(t => {
    if (filterStatus === 'all')       return true;
    if (filterStatus === 'pending')   return t.status !== 'completed';
    if (filterStatus === 'completed') return t.status === 'completed';
    return true;
  });

  const pendingCount   = tasks.filter(t => t.status !== 'completed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#121214] text-white font-sans antialiased">
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {currentMember?.role === 'owner'
                ? 'You're managing this group'
                : 'Your assigned tasks'}
            </p>
          </div>

          {/* Only owners can assign tasks */}
          {currentMember?.role === 'owner' && (
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
        </header>

        {/* ── Family member strip ── */}
        <section
          className="bg-[#1C1C20] border border-white/8 rounded-2xl px-5 py-4"
          aria-label="Family members"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest
                        text-white/35 mb-3">
            Family Members
          </p>

          {loadingMembers ? (
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i}
                  className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
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
                    'text-[10px] font-medium whitespace-nowrap',
                    m.uid === currentMember?.uid ? 'text-[#3B82F6]' : 'text-white/40',
                  ].join(' ')}>
                    {m.uid === currentMember?.uid
                      ? 'You'
                      : m.displayName?.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',     value: tasks.length,   color: 'text-white' },
            { label: 'Pending',   value: pendingCount,   color: 'text-yellow-400' },
            { label: 'Completed', value: completedCount, color: 'text-emerald-400' },
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
        <div className="flex gap-2" role="group" aria-label="Filter tasks">
          {['all', 'pending', 'completed'].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterStatus(f)}
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
            <ul className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <li key={i}
                  className="h-16 rounded-xl bg-[#1C1C20] animate-pulse border border-white/5" />
              ))}
            </ul>
          ) : visibleTasks.length === 0 ? (
            <EmptyState onAdd={() => setModalOpen(true)} />
          ) : (
            <ul className="space-y-2.5">
              {visibleTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignedMember={memberMap[task.assignedTo]}
                  currentUser={currentMember}
                  onToggle={handleToggle}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Modal ── */}
      <AssignTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        members={members}
        currentUser={currentMember ?? { uid: currentFirebaseUser?.uid, familyId }}
      />

      {/*
        ── Tailwind keyframe for modal slide-up animation ──
        Add this to your tailwind.config.js under theme.extend.keyframes:

        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },

        And under theme.extend.animation:
          'slideUp': 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1) both',
      */}
    </div>
  );
}
