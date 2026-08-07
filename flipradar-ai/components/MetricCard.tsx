import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: ReactNode;
  accentColor?: string;
  glowColor?: string;
}

export default function MetricCard({
  title,
  value,
  subtext,
  trend,
  trendValue,
  icon,
  accentColor = '#6366f1',
  glowColor = 'rgba(99,102,241,0.1)',
}: MetricCardProps) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94a3b8';

  return (
    <div
      className="card-glow"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Background glow blob */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: glowColor,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </span>
        <span
          style={{
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: glowColor,
          }}
        >
          {icon}
        </span>
      </div>

      <div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-1)',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {trend && trendValue && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '12px',
                fontWeight: 500,
                color: trendColor,
              }}
            >
              <TrendIcon size={12} />
              {trendValue}
            </span>
          )}
          {subtext && (
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
}
