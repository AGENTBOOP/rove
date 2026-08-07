'use client';

import { useState } from 'react';
import { Settings, Bell, Key, Sliders, Shield, RefreshCw, ChevronRight } from 'lucide-react';
import ToggleSwitch from '@/components/ToggleSwitch';

interface Prefs {
  emailAlerts: boolean;
  pushNotifications: boolean;
  radarRefreshInterval: number;
  minConfidenceFilter: 'All' | 'Medium' | 'High';
  showSoldDeals: boolean;
  darkMode: boolean;
  autoSaveHighROI: boolean;
  apiKey: string;
  webhook: string;
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    emailAlerts: true,
    pushNotifications: false,
    radarRefreshInterval: 3,
    minConfidenceFilter: 'All',
    showSoldDeals: true,
    darkMode: true,
    autoSaveHighROI: true,
    apiKey: 'sk_live_••••••••••••••••••••••••',
    webhook: '',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    marginBottom: '20px',
    overflow: 'hidden',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '14px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-elevated)',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid var(--border-subtle)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-1)',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
    minWidth: '200px',
  };

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={22} color="#818cf8" />
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
          Configure alerts, data sources, and preferences
        </p>
      </div>

      {/* Notifications */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Bell size={14} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Notifications</span>
        </div>
        {[
          {
            key: 'emailAlerts' as const,
            label: 'Email Alerts',
            desc: 'Receive deal notifications via email',
          },
          {
            key: 'pushNotifications' as const,
            label: 'Push Notifications',
            desc: 'Browser push for instant alerts',
          },
          {
            key: 'autoSaveHighROI' as const,
            label: 'Auto-save High ROI',
            desc: 'Automatically bookmark deals with ROI ≥ 30%',
          },
        ].map(({ key, label, desc }) => (
          <div key={key} style={rowStyle}>
            <div style={labelStyle}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>{label}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{desc}</span>
            </div>
            <ToggleSwitch
              id={`setting-${key}`}
              checked={prefs[key] as boolean}
              onChange={(val) => setPrefs({ ...prefs, [key]: val })}
            />
          </div>
        ))}
      </div>

      {/* Radar Settings */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Sliders size={14} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Radar Preferences</span>
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>Refresh Interval</span>
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>How often the radar scans for new deals</span>
          </div>
          <select
            id="setting-refresh"
            value={prefs.radarRefreshInterval}
            onChange={(e) => setPrefs({ ...prefs, radarRefreshInterval: Number(e.target.value) })}
            style={{ ...inputStyle, minWidth: '140px', cursor: 'pointer' }}
          >
            {[1, 3, 5, 10, 15, 30].map((v) => (
              <option key={v} value={v} style={{ background: '#0e1117' }}>{v} min</option>
            ))}
          </select>
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>Min Confidence Filter</span>
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Only show deals above this confidence level</span>
          </div>
          <select
            id="setting-confidence"
            value={prefs.minConfidenceFilter}
            onChange={(e) => setPrefs({ ...prefs, minConfidenceFilter: e.target.value as Prefs['minConfidenceFilter'] })}
            style={{ ...inputStyle, minWidth: '140px', cursor: 'pointer' }}
          >
            {(['All', 'Medium', 'High'] as const).map((v) => (
              <option key={v} value={v} style={{ background: '#0e1117' }}>{v}</option>
            ))}
          </select>
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>Show Sold Listings</span>
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Include recently sold comps in price estimates</span>
          </div>
          <ToggleSwitch
            id="setting-show-sold"
            checked={prefs.showSoldDeals}
            onChange={(val) => setPrefs({ ...prefs, showSoldDeals: val })}
          />
        </div>
      </div>

      {/* API & Integrations */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Key size={14} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>API & Integrations</span>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }} htmlFor="setting-api-key">
            FlipRadar API Key
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="setting-api-key"
              type="password"
              value={prefs.apiKey}
              onChange={(e) => setPrefs({ ...prefs, apiKey: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Regenerate key"
            >
              <RefreshCw size={13} /> Regen
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            Used for third-party integrations (Zapier, webhooks, etc.)
          </p>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }} htmlFor="setting-webhook">
            Webhook URL <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="setting-webhook"
            type="url"
            placeholder="https://hooks.zapier.com/..."
            value={prefs.webhook}
            onChange={(e) => setPrefs({ ...prefs, webhook: e.target.value })}
            style={{ ...inputStyle, minWidth: 'unset', width: '100%' }}
          />
        </div>
      </div>

      {/* Security */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Shield size={14} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Account & Security</span>
        </div>
        {[
          { label: 'Change Password', desc: 'Update your account password' },
          { label: 'Two-Factor Authentication', desc: '2FA via authenticator app' },
          { label: 'Export Data', desc: 'Download ledger and watchlists as CSV' },
        ].map(({ label, desc }) => (
          <button
            key={label}
            style={{
              ...rowStyle,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          >
            <div style={labelStyle}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>{label}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{desc}</span>
            </div>
            <ChevronRight size={16} color="var(--text-3)" />
          </button>
        ))}
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          id="save-settings-btn"
          style={{
            padding: '11px 28px',
            borderRadius: '10px',
            background: saved
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'linear-gradient(135deg, #6366f1, #818cf8)',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.3s ease',
            boxShadow: saved ? '0 4px 16px rgba(34,197,94,0.35)' : '0 4px 16px rgba(99,102,241,0.35)',
          }}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
