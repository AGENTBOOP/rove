'use client';

import { useState, useMemo } from 'react';
import {
  Radar,
  Search,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  SlidersHorizontal,
  TrendingUp,
  DollarSign,
  AlertCircle,
  LayoutGrid,
  LayoutList,
  Clock,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { mockDeals, netProfit, roi } from '@/lib/mockData';
import { Deal, DealCategory } from '@/lib/types';

const CATEGORIES: Array<'All' | DealCategory> = [
  'All', 'GPU', 'Laptop', 'Console', 'Camera', 'Audio',
  'Networking', 'CPU', 'Storage', 'Smartphone', 'Tablet',
];

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function RadarPage() {
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [category, setCategory] = useState<'All' | DealCategory>('All');
  const [minProfit, setMinProfit] = useState(0);
  const [minROI, setMinROI] = useState(0);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      const profit = netProfit(d);
      const roiVal = roi(d);
      const matchCat = category === 'All' || d.category === category;
      const matchProfit = profit >= minProfit;
      const matchROI = roiVal >= minROI;
      const matchSearch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase()) ||
        d.source.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchProfit && matchROI && matchSearch;
    });
  }, [deals, category, minProfit, minROI, search]);

  const totalMargin = filtered.reduce((acc, d) => acc + netProfit(d), 0);
  const avgROI =
    filtered.length > 0
      ? filtered.reduce((acc, d) => acc + roi(d), 0) / filtered.length
      : 0;
  const savedCount = deals.filter((d) => d.saved).length;

  const toggleSave = (id: string) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, saved: !d.saved } : d))
    );
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-1)',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radar size={22} color="#818cf8" />
            Live Deal Radar
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
            Real-time arbitrage opportunities · Updated every 3 min
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '7px 10px',
              borderRadius: '7px',
              background: viewMode === 'table' ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
              border: `1px solid ${viewMode === 'table' ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
              color: viewMode === 'table' ? '#818cf8' : 'var(--text-2)',
              cursor: 'pointer',
            }}
            aria-label="Table view"
          >
            <LayoutList size={15} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '7px 10px',
              borderRadius: '7px',
              background: viewMode === 'grid' ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
              border: `1px solid ${viewMode === 'grid' ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
              color: viewMode === 'grid' ? '#818cf8' : 'var(--text-2)',
              cursor: 'pointer',
            }}
            aria-label="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <MetricCard
          title="Deals Today"
          value={String(filtered.length)}
          subtext="active opportunities"
          trend="up"
          trendValue="+3 new"
          icon={<Radar size={16} />}
          accentColor="#818cf8"
          glowColor="rgba(99,102,241,0.12)"
        />
        <MetricCard
          title="Avg ROI"
          value={`${avgROI.toFixed(1)}%`}
          subtext="across filtered deals"
          trend="up"
          trendValue="+2.1%"
          icon={<TrendingUp size={16} />}
          accentColor="#22c55e"
          glowColor="rgba(34,197,94,0.1)"
        />
        <MetricCard
          title="Total Potential Margin"
          value={fmt(totalMargin)}
          subtext="combined net profit"
          trend="up"
          trendValue="↑ from yesterday"
          icon={<DollarSign size={16} />}
          accentColor="#f59e0b"
          glowColor="rgba(245,158,11,0.1)"
        />
        <MetricCard
          title="Saved Alerts"
          value={String(savedCount)}
          subtext="bookmarked deals"
          trend="neutral"
          icon={<AlertCircle size={16} />}
          accentColor="#60a5fa"
          glowColor="rgba(59,130,246,0.1)"
        />
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'flex-end',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Search
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder="Keyword, category, source…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, padding: '8px 10px 8px 32px', width: '100%' }}
              id="radar-search"
            />
          </div>
        </div>

        {/* Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' }}>
          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            style={{ ...inputStyle, padding: '8px 12px', cursor: 'pointer' }}
            id="radar-category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: '#0e1117' }}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Min Profit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' }}>
          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Min Profit{' '}
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>${minProfit}</span>
          </label>
          <input
            type="range"
            min={0}
            max={400}
            step={10}
            value={minProfit}
            onChange={(e) => setMinProfit(Number(e.target.value))}
            id="radar-min-profit"
          />
        </div>

        {/* Min ROI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
          <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Min ROI{' '}
            <span style={{ color: '#22c55e', fontWeight: 600 }}>{minROI}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minROI}
            onChange={(e) => setMinROI(Number(e.target.value))}
            id="radar-min-roi"
          />
        </div>

        {/* Clear */}
        <button
          onClick={() => { setCategory('All'); setMinProfit(0); setMinROI(0); setSearch(''); }}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
          }}
          id="radar-clear-filters"
        >
          <SlidersHorizontal size={12} />
          Reset
        </button>
      </div>

      {/* Results count */}
      <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '12px' }}>
        Showing{' '}
        <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{filtered.length}</span>{' '}
        deal{filtered.length !== 1 ? 's' : ''}
        {category !== 'All' && ` in ${category}`}
      </div>

      {/* Deal content */}
      {viewMode === 'table' ? (
        <TableView deals={filtered} onToggleSave={toggleSave} />
      ) : (
        <GridView deals={filtered} onToggleSave={toggleSave} />
      )}
    </div>
  );
}

function TableView({ deals, onToggleSave }: { deals: Deal[]; onToggleSave: (id: string) => void }) {
  if (deals.length === 0) return <EmptyState />;

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-2)',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--border)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px',
    fontSize: '13px',
    color: 'var(--text-1)',
    verticalAlign: 'middle',
    borderBottom: '1px solid var(--border-subtle)',
  };

  return (
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
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Source</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Buy</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Est. Resale</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Net Profit</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>ROI</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Score</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Posted</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => {
              const profit = netProfit(deal);
              const roiVal = roi(deal);
              return (
                <tr
                  key={deal.id}
                  style={{ transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  {/* Item */}
                  <td style={{ ...tdStyle, maxWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid var(--border)',
                        }}
                        loading="lazy"
                      />
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: '13px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.35',
                        }}
                      >
                        {deal.title}
                      </span>
                    </div>
                  </td>
                  {/* Category */}
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        fontSize: '11px',
                        color: 'var(--text-2)',
                        fontWeight: 500,
                      }}
                    >
                      {deal.category}
                    </span>
                  </td>
                  {/* Source */}
                  <td style={{ ...tdStyle, color: 'var(--text-2)', fontSize: '12px' }}>
                    {deal.source}
                  </td>
                  {/* Buy */}
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                    {fmt(deal.buyPrice)}
                  </td>
                  {/* Resale */}
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#60a5fa' }}>
                    {fmt(deal.estResalePrice)}
                  </td>
                  {/* Profit */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: profit > 0 ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {profit > 0 ? '+' : ''}{fmt(profit)}
                    </span>
                  </td>
                  {/* ROI */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: roiVal >= 20 ? '#22c55e' : roiVal >= 10 ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      {roiVal.toFixed(1)}%
                    </span>
                  </td>
                  {/* Confidence */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <ConfidenceBadge level={deal.confidence} />
                  </td>
                  {/* Time */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      <Clock size={11} />
                      {timeAgo(deal.postedAt)}
                    </span>
                  </td>
                  {/* Actions */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => onToggleSave(deal.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: deal.saved ? '#f59e0b' : 'var(--text-3)',
                          transition: 'color 0.15s',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        aria-label={deal.saved ? 'Unsave deal' : 'Save deal'}
                      >
                        {deal.saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                      <a
                        href={deal.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          borderRadius: '7px',
                          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'opacity 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Grab Deal
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GridView({ deals, onToggleSave }: { deals: Deal[]; onToggleSave: (id: string) => void }) {
  if (deals.length === 0) return <EmptyState />;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}
    >
      {deals.map((deal) => {
        const profit = netProfit(deal);
        const roiVal = roi(deal);
        return (
          <div
            key={deal.id}
            className="card-glow animate-fade-in"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Image */}
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
              <img
                src={deal.imageUrl}
                alt={deal.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
              <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                <ConfidenceBadge level={deal.confidence} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(to top, var(--bg-surface), transparent)',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '13.5px', fontWeight: 600, lineHeight: '1.4', marginBottom: '4px' }}>
                  {deal.title}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                  {deal.category} · {deal.source} · {timeAgo(deal.postedAt)}
                </p>
              </div>

              {/* Prices */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Buy', value: fmt(deal.buyPrice), color: 'var(--text-1)' },
                  { label: 'Resale', value: fmt(deal.estResalePrice), color: '#60a5fa' },
                  { label: 'Profit', value: `+${fmt(profit)}`, color: '#22c55e' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: 'var(--text-2)', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ROI */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>ROI</span>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: roiVal >= 20 ? '#22c55e' : roiVal >= 10 ? '#f59e0b' : '#ef4444',
                  }}
                >
                  {roiVal.toFixed(1)}%
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  onClick={() => onToggleSave(deal.id)}
                  style={{
                    flex: '0 0 auto',
                    padding: '8px',
                    borderRadius: '8px',
                    background: deal.saved ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)',
                    border: `1px solid ${deal.saved ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                    color: deal.saved ? '#f59e0b' : 'var(--text-2)',
                    cursor: 'pointer',
                  }}
                  aria-label={deal.saved ? 'Unsave' : 'Save'}
                >
                  {deal.saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                </button>
                <a
                  href={deal.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Grab Deal <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <Radar size={40} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
        No deals match your filters
      </p>
      <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
        Try adjusting your profit threshold or category.
      </p>
    </div>
  );
}
