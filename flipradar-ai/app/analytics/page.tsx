'use client';

import { BarChart2, TrendingUp, Award, Package, Zap } from 'lucide-react';
import { mockDeals, mockLedger, netProfit, roi, ledgerProfit } from '@/lib/mockData';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#94a3b8'];

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function AnalyticsPage() {
  // Category breakdown from mock deals
  const categoryMap: Record<string, { count: number; totalProfit: number; avgROI: number }> = {};
  mockDeals.forEach((d) => {
    if (!categoryMap[d.category]) categoryMap[d.category] = { count: 0, totalProfit: 0, avgROI: 0 };
    categoryMap[d.category].count++;
    categoryMap[d.category].totalProfit += netProfit(d);
    categoryMap[d.category].avgROI += roi(d);
  });
  Object.values(categoryMap).forEach((v) => { v.avgROI = v.avgROI / v.count; });

  const categories = Object.entries(categoryMap).sort((a, b) => b[1].totalProfit - a[1].totalProfit);
  const maxProfit = Math.max(...categories.map(([, v]) => v.totalProfit));

  // Monthly profit from ledger (mock 6 months)
  const monthlyData = [
    { month: 'Mar', profit: 320, deals: 2 },
    { month: 'Apr', profit: 185, deals: 1 },
    { month: 'May', profit: 540, deals: 3 },
    { month: 'Jun', profit: 810, deals: 4 },
    { month: 'Jul', profit: 620, deals: 3 },
    { month: 'Aug', profit: 149, deals: 1 },
  ];
  const maxMonthly = Math.max(...monthlyData.map((m) => m.profit));

  // Top deals by ROI
  const topDeals = [...mockDeals].sort((a, b) => roi(b) - roi(a)).slice(0, 5);

  const totalRealizedProfit = mockLedger
    .filter((i) => i.status === 'Sold')
    .reduce((acc, i) => acc + (ledgerProfit(i) ?? 0), 0);

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart2 size={22} color="#818cf8" />
          Analytics
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
          Performance insights across your deal activity
        </p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total Deals Tracked', value: mockDeals.length, color: '#818cf8', icon: <Zap size={15} /> },
          { label: 'Avg ROI on Radar', value: `${(mockDeals.reduce((a, d) => a + roi(d), 0) / mockDeals.length).toFixed(1)}%`, color: '#22c55e', icon: <TrendingUp size={15} /> },
          { label: 'Realized Profit', value: fmt(totalRealizedProfit), color: '#f59e0b', icon: <Award size={15} /> },
          { label: 'Categories Covered', value: categories.length, color: '#60a5fa', icon: <Package size={15} /> },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span style={{ color: k.color }}>{k.icon}</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)' }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Monthly Profit Chart */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>Monthly Realized Profit</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>Last 6 months</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px' }}>
            {monthlyData.map((m, i) => (
              <div
                key={m.month}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}
              >
                <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                  ${m.profit}
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${(m.profit / maxMonthly) * 100}%`,
                    background: i === monthlyData.length - 1
                      ? 'linear-gradient(to top, #6366f1, #818cf8)'
                      : 'linear-gradient(to top, rgba(99,102,241,0.3), rgba(129,140,248,0.5))',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '4px',
                    transition: 'height 0.3s ease',
                    position: 'relative',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-2)' }}>{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>Profit by Category</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>Based on current radar deals</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map(([cat, data], i) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-1)', fontWeight: 500 }}>{cat}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: COLORS[i % COLORS.length], fontWeight: 600 }}>
                    {fmt(data.totalProfit)}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(data.totalProfit / maxProfit) * 100}%`,
                      background: COLORS[i % COLORS.length],
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top deals by ROI */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={16} color="#f59e0b" />
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>Top 5 Deals by ROI</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {['Rank', 'Item', 'Category', 'Buy', 'Net Profit', 'ROI'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-2)',
                    textAlign: i >= 3 ? 'right' : 'left',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topDeals.map((deal, idx) => {
              const profit = netProfit(deal);
              const roiVal = roi(deal);
              const medals = ['🥇', '🥈', '🥉', '4th', '5th'];
              return (
                <tr
                  key={deal.id}
                  style={{ transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '13px 14px', fontSize: '13px', color: 'var(--text-2)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {medals[idx]}
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid var(--border-subtle)', maxWidth: '280px' }}>
                    {deal.title}
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {deal.category}
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: '13px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', borderBottom: '1px solid var(--border-subtle)' }}>
                    {fmt(deal.buyPrice)}
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: '13px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#22c55e', borderBottom: '1px solid var(--border-subtle)' }}>
                    +{fmt(profit)}
                  </td>
                  <td style={{ padding: '13px 14px', textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#22c55e',
                      }}
                    >
                      {roiVal.toFixed(1)}%
                    </span>
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
