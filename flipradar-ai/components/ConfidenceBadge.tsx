import { ConfidenceLevel } from '@/lib/types';

interface Props {
  level: ConfidenceLevel;
}

const config: Record<
  ConfidenceLevel,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  High: {
    label: 'High',
    bg: 'rgba(34,197,94,0.08)',
    text: '#22c55e',
    border: 'rgba(34,197,94,0.25)',
    dot: '#22c55e',
  },
  Medium: {
    label: 'Medium',
    bg: 'rgba(245,158,11,0.08)',
    text: '#f59e0b',
    border: 'rgba(245,158,11,0.25)',
    dot: '#f59e0b',
  },
  Low: {
    label: 'Low',
    bg: 'rgba(239,68,68,0.08)',
    text: '#ef4444',
    border: 'rgba(239,68,68,0.25)',
    dot: '#ef4444',
  },
};

export default function ConfidenceBadge({ level }: Props) {
  const c = config[level];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '20px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: '11px',
        fontWeight: 600,
        color: c.text,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: c.dot,
          boxShadow: `0 0 4px ${c.dot}`,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}
