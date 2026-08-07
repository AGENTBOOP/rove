'use client';

import { useState } from 'react';
import {
  BookMarked,
  Plus,
  Trash2,
  Bell,
  BellOff,
  Tag,
  Target,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import ToggleSwitch from '@/components/ToggleSwitch';
import Modal from '@/components/Modal';
import { mockWatchlists } from '@/lib/mockData';
import { Watchlist, DealCategory } from '@/lib/types';

const CATEGORIES: Array<'All' | DealCategory> = [
  'All', 'GPU', 'Laptop', 'Console', 'Camera', 'Audio',
  'Networking', 'CPU', 'Storage', 'Smartphone', 'Tablet',
];

const emptyForm = {
  name: '',
  category: 'All' as 'All' | DealCategory,
  keywords: '',
  maxBuyPrice: 500,
  minProfitMargin: 10,
  minROI: 15,
};

export default function WatchlistsPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(mockWatchlists);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.keywords.trim()) e.keywords = 'Keywords are required';
    if (form.maxBuyPrice <= 0) e.maxBuyPrice = 'Must be > 0';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const newWl: Watchlist = {
      id: `w${Date.now()}`,
      ...form,
      notificationsEnabled: true,
      createdAt: new Date().toISOString(),
      matchCount: 0,
    };
    setWatchlists((prev) => [newWl, ...prev]);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(false);
  };

  const toggleNotif = (id: string) => {
    setWatchlists((prev) =>
      prev.map((w) => (w.id === id ? { ...w, notificationsEnabled: !w.notificationsEnabled } : w))
    );
  };

  const deleteWatchlist = (id: string) => {
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-1)',
    fontSize: '13px',
    padding: '10px 12px',
    outline: 'none',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-2)',
    display: 'block',
    marginBottom: '6px',
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
  };

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookMarked size={22} color="#818cf8" />
            Watchlists
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
            Custom deal alerts with instant notifications
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '10px 18px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            border: 'none',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            transition: 'opacity 0.15s',
          }}
          id="create-watchlist-btn"
        >
          <Plus size={15} />
          New Alert
        </button>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {[
          { label: 'Total Watchlists', value: watchlists.length, icon: <BookMarked size={16} />, color: '#818cf8' },
          { label: 'Active Alerts', value: watchlists.filter((w) => w.notificationsEnabled).length, icon: <Bell size={16} />, color: '#22c55e' },
          { label: 'Total Matches', value: watchlists.reduce((a, w) => a + w.matchCount, 0), icon: <Target size={16} />, color: '#f59e0b' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Watchlist cards */}
      {watchlists.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '2px dashed var(--border)',
            borderRadius: '14px',
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <BookMarked size={40} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
            No watchlists yet
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            Create your first alert to start tracking deals.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {watchlists.map((wl) => (
            <WatchlistCard key={wl.id} wl={wl} onToggle={toggleNotif} onDelete={deleteWatchlist} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Watchlist Alert">
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="wl-name">Alert Name *</label>
            <input
              id="wl-name"
              type="text"
              placeholder="e.g. GPU Bargain Hunter"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : 'var(--border)' }}
            />
            {errors.name && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="wl-category">Category</label>
              <select
                id="wl-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#0e1117' }}>{c}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="wl-max-buy">Max Buy Price ($)</label>
              <input
                id="wl-max-buy"
                type="number"
                min={1}
                value={form.maxBuyPrice}
                onChange={(e) => setForm({ ...form, maxBuyPrice: Number(e.target.value) })}
                style={{ ...inputStyle, borderColor: errors.maxBuyPrice ? '#ef4444' : 'var(--border)' }}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="wl-keywords">Keywords * <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(comma separated)</span></label>
            <input
              id="wl-keywords"
              type="text"
              placeholder="RTX 4080, RTX 4090, RX 7900 XT"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              style={{ ...inputStyle, borderColor: errors.keywords ? '#ef4444' : 'var(--border)' }}
            />
            {errors.keywords && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.keywords}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="wl-min-margin">
                Min Profit Margin{' '}
                <span style={{ color: '#22c55e', fontWeight: 600 }}>{form.minProfitMargin}%</span>
              </label>
              <input
                id="wl-min-margin"
                type="range"
                min={0}
                max={50}
                step={1}
                value={form.minProfitMargin}
                onChange={(e) => setForm({ ...form, minProfitMargin: Number(e.target.value) })}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="wl-min-roi">
                Min ROI{' '}
                <span style={{ color: '#818cf8', fontWeight: 600 }}>{form.minROI}%</span>
              </label>
              <input
                id="wl-min-roi"
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.minROI}
                onChange={(e) => setForm({ ...form, minROI: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                border: 'none',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              id="wl-submit-btn"
            >
              Create Alert
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function WatchlistCard({
  wl,
  onToggle,
  onDelete,
}: {
  wl: Watchlist;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="card-glow"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '4px' }}>
            {wl.name}
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              fontSize: '11px',
              color: '#818cf8',
              fontWeight: 500,
            }}
          >
            {wl.category}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {wl.notificationsEnabled ? (
            <Bell size={14} color="#22c55e" />
          ) : (
            <BellOff size={14} color="var(--text-3)" />
          )}
          <ToggleSwitch
            checked={wl.notificationsEnabled}
            onChange={() => onToggle(wl.id)}
            id={`toggle-${wl.id}`}
          />
        </div>
      </div>

      {/* Keywords */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Tag size={12} color="var(--text-3)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: '1.5' }}>
          {wl.keywords}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { icon: <DollarSign size={11} />, label: 'Max Buy', value: `$${wl.maxBuyPrice.toLocaleString()}`, color: '#60a5fa' },
          { icon: <TrendingUp size={11} />, label: 'Min Margin', value: `${wl.minProfitMargin}%`, color: '#22c55e' },
          { icon: <Target size={11} />, label: 'Min ROI', value: `${wl.minROI}%`, color: '#f59e0b' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', color: 'var(--text-3)', marginBottom: '2px' }}>
              {s.icon}
              <span style={{ fontSize: '10px' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>{wl.matchCount}</span> match{wl.matchCount !== 1 ? 'es' : ''}
        </span>
        <button
          onClick={() => onDelete(wl.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            padding: '4px 6px',
            borderRadius: '6px',
            transition: 'color 0.15s',
          }}
          aria-label={`Delete ${wl.name} watchlist`}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  );
}
