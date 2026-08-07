'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  DollarSign,
  Package,
  Clock,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import MetricCard from '@/components/MetricCard';
import { mockLedger, ledgerProfit, turnaroundDays } from '@/lib/mockData';
import { LedgerItem, LedgerStatus, DealCategory } from '@/lib/types';

const CATEGORIES: DealCategory[] = [
  'GPU', 'Laptop', 'Console', 'Camera', 'Audio',
  'Networking', 'CPU', 'Storage', 'Smartphone', 'Tablet',
];

const STATUSES: LedgerStatus[] = ['Acquired', 'Refurbishing', 'Listed', 'Sold'];

const emptyForm = {
  title: '',
  category: 'GPU' as DealCategory,
  buyPrice: '',
  salePrice: '',
  fees: '',
  shipping: '',
  status: 'Acquired' as LedgerStatus,
  notes: '',
};

function fmt(n: number | null): string {
  if (n === null) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LedgerPage() {
  const [items, setItems] = useState<LedgerItem[]>(mockLedger);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<'All' | LedgerStatus>('All');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.buyPrice || isNaN(Number(form.buyPrice))) e.buyPrice = 'Valid buy price required';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const newItem: LedgerItem = {
      id: `l${Date.now()}`,
      title: form.title,
      category: form.category,
      buyPrice: Number(form.buyPrice),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      fees: Number(form.fees) || 0,
      shipping: Number(form.shipping) || 0,
      status: form.status,
      acquiredAt: new Date().toISOString(),
      soldAt: form.status === 'Sold' ? new Date().toISOString() : null,
      imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80',
      notes: form.notes,
    };
    setItems((prev) => [newItem, ...prev]);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(false);
  };

  const filtered = useMemo(
    () => (statusFilter === 'All' ? items : items.filter((i) => i.status === statusFilter)),
    [items, statusFilter]
  );

  const soldItems = items.filter((i) => i.status === 'Sold');
  const totalRealizedProfit = soldItems.reduce((acc, i) => {
    const p = ledgerProfit(i);
    return acc + (p ?? 0);
  }, 0);
  const activeInventoryValue = items
    .filter((i) => i.status !== 'Sold')
    .reduce((acc, i) => acc + i.buyPrice, 0);
  const turnarounds = soldItems.map((i) => turnaroundDays(i)).filter((d): d is number => d !== null);
  const avgTurnaround =
    turnarounds.length > 0
      ? Math.round(turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length)
      : 0;

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

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-2)',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '13px 14px',
    fontSize: '13px',
    color: 'var(--text-1)',
    verticalAlign: 'middle',
    borderBottom: '1px solid var(--border-subtle)',
  };

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={22} color="#818cf8" />
            Flip Ledger
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
            Track inventory, costs, and realized profits
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
          }}
          id="log-flip-btn"
        >
          <Plus size={15} />
          Log Flip
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <MetricCard
          title="Total Realized Profit"
          value={fmt(totalRealizedProfit)}
          subtext={`from ${soldItems.length} sold flips`}
          trend="up"
          trendValue="all-time"
          icon={<DollarSign size={16} />}
          accentColor="#22c55e"
          glowColor="rgba(34,197,94,0.1)"
        />
        <MetricCard
          title="Active Inventory Value"
          value={fmt(activeInventoryValue)}
          subtext={`${items.filter((i) => i.status !== 'Sold').length} active items`}
          trend="neutral"
          icon={<Package size={16} />}
          accentColor="#818cf8"
          glowColor="rgba(99,102,241,0.1)"
        />
        <MetricCard
          title="Avg Turnaround"
          value={`${avgTurnaround}d`}
          subtext="days to sell"
          trend="down"
          trendValue="-2d vs last month"
          icon={<Clock size={16} />}
          accentColor="#f59e0b"
          glowColor="rgba(245,158,11,0.1)"
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['All', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: statusFilter === s ? 600 : 400,
              cursor: 'pointer',
              border: `1px solid ${statusFilter === s ? 'rgba(99,102,241,0.35)' : 'var(--border)'}`,
              background: statusFilter === s ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
              color: statusFilter === s ? '#818cf8' : 'var(--text-2)',
              transition: 'all 0.15s',
            }}
          >
            {s}
            <span
              style={{
                marginLeft: '6px',
                padding: '1px 6px',
                borderRadius: '20px',
                background: statusFilter === s ? 'rgba(99,102,241,0.2)' : 'var(--bg-elevated)',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {s === 'All' ? items.length : items.filter((i) => i.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th style={thStyle}>Item</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Buy Price</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Sale Price</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Fees + Ship</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Net Profit</th>
                <th style={thStyle}>Acquired</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: '48px', color: 'var(--text-3)' }}>
                    No items with status &ldquo;{statusFilter}&rdquo;
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const profit = ledgerProfit(item);
                  const days = turnaroundDays(item);
                  return (
                    <tr
                      key={item.id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      style={{ transition: 'background 0.15s' }}
                    >
                      {/* Item */}
                      <td style={{ ...tdStyle, maxWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid var(--border)',
                              flexShrink: 0,
                            }}
                            loading="lazy"
                          />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '13px', lineHeight: '1.3' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '2px' }}>{item.category}</div>
                          </div>
                        </div>
                      </td>
                      {/* Status */}
                      <td style={tdStyle}>
                        <StatusBadge status={item.status} />
                      </td>
                      {/* Buy */}
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                        {fmt(item.buyPrice)}
                      </td>
                      {/* Sale */}
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: item.salePrice ? '#60a5fa' : 'var(--text-3)' }}>
                        {item.salePrice ? fmt(item.salePrice) : '—'}
                      </td>
                      {/* Fees */}
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)' }}>
                        {fmt(item.fees + item.shipping)}
                      </td>
                      {/* Profit */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {profit !== null ? (
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontWeight: 700,
                              fontSize: '13px',
                              color: profit >= 0 ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {profit >= 0 ? '+' : ''}{fmt(profit)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-3)' }}>
                            {item.status === 'Sold' ? '—' : 'Pending'}
                          </span>
                        )}
                      </td>
                      {/* Acquired */}
                      <td style={{ ...tdStyle, color: 'var(--text-2)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <div>{formatDate(item.acquiredAt)}</div>
                        {days !== null && (
                          <div style={{ color: 'var(--text-3)', fontSize: '11px', marginTop: '2px' }}>
                            {days}d turnaround
                          </div>
                        )}
                      </td>
                      {/* Notes */}
                      <td style={{ ...tdStyle, color: 'var(--text-2)', fontSize: '12px', maxWidth: '160px' }}>
                        {item.notes || <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Flip Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log New Flip">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
            <label style={labelStyle} htmlFor="lf-title">Item Title *</label>
            <input
              id="lf-title"
              type="text"
              placeholder="e.g. RTX 4090 Founders Edition"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ ...inputStyle, borderColor: errors.title ? '#ef4444' : 'var(--border)' }}
            />
            {errors.title && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.title}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="lf-category">Category</label>
              <select
                id="lf-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as DealCategory })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#0e1117' }}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="lf-status">Status</label>
              <select
                id="lf-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as LedgerStatus })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} style={{ background: '#0e1117' }}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="lf-buy">Buy Price ($) *</label>
              <input
                id="lf-buy"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.buyPrice}
                onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                style={{ ...inputStyle, borderColor: errors.buyPrice ? '#ef4444' : 'var(--border)' }}
              />
              {errors.buyPrice && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.buyPrice}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="lf-sale">Sale Price ($) <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="lf-sale"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="lf-fees">Platform Fees ($)</label>
              <input
                id="lf-fees"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.fees}
                onChange={(e) => setForm({ ...form, fees: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="lf-ship">Shipping ($)</label>
              <input
                id="lf-ship"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.shipping}
                onChange={(e) => setForm({ ...form, shipping: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Live profit preview */}
          {form.buyPrice && form.salePrice && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <TrendingUp size={16} color="#22c55e" />
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Estimated Profit:</span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#22c55e',
                  marginLeft: 'auto',
                }}
              >
                {fmt(
                  Number(form.salePrice) -
                    Number(form.buyPrice) -
                    Number(form.fees || 0) -
                    Number(form.shipping || 0)
                )}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
            <label style={labelStyle} htmlFor="lf-notes">Notes</label>
            <textarea
              id="lf-notes"
              placeholder="Condition details, repairs, strategy…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
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
              id="lf-submit-btn"
            >
              Log Flip
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
