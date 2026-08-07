'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Radar,
  BookMarked,
  BookOpen,
  BarChart2,
  Settings,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/radar', label: 'Live Radar', icon: Radar },
  { href: '/watchlists', label: 'Watchlists', icon: BookMarked },
  { href: '/ledger', label: 'Flip Ledger', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '64px',
        background: 'rgba(8, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '8px',
      }}
    >
      {/* Logo */}
      <Link
        href="/radar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          marginRight: '24px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}
        >
          <Zap size={16} color="white" fill="white" />
        </div>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #f1f5f9, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.3px',
          }}
        >
          FlipRadar <span style={{ WebkitTextFillColor: '#6366f1', color: '#6366f1' }}>AI</span>
        </span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: active ? 600 : 400,
                color: active ? '#f1f5f9' : '#64748b',
                background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                transition: 'all 0.18s ease',
              }}
            >
              <Icon size={14} color={active ? '#818cf8' : '#64748b'} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '20px',
          background: 'var(--positive-muted)',
          border: '1px solid rgba(34,197,94,0.2)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 6px #22c55e',
            display: 'inline-block',
            animation: 'pulse-glow 2s infinite',
          }}
        />
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#22c55e' }}>LIVE</span>
      </div>
    </header>
  );
}
