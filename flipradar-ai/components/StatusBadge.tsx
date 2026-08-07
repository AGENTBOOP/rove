import { LedgerStatus } from '@/lib/types';

interface Props {
  status: LedgerStatus;
}

const config: Record<LedgerStatus, { bg: string; text: string; border: string }> = {
  Acquired: {
    bg: 'rgba(99,102,241,0.1)',
    text: '#818cf8',
    border: 'rgba(99,102,241,0.25)',
  },
  Refurbishing: {
    bg: 'rgba(245,158,11,0.1)',
    text: '#f59e0b',
    border: 'rgba(245,158,11,0.25)',
  },
  Listed: {
    bg: 'rgba(59,130,246,0.1)',
    text: '#60a5fa',
    border: 'rgba(59,130,246,0.25)',
  },
  Sold: {
    bg: 'rgba(34,197,94,0.1)',
    text: '#22c55e',
    border: 'rgba(34,197,94,0.25)',
  },
};

export default function StatusBadge({ status }: Props) {
  const c = config[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '20px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: '11px',
        fontWeight: 600,
        color: c.text,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}
