import { useState, useEffect, useCallback } from 'react';

export type PanelMode = 'dark' | 'light';
export type AccentPreset = 'blue' | 'indigo' | 'teal' | 'violet';
export type DensityMode = 'comfortable' | 'compact' | 'spacious';

export interface ThemeConfig {
  panel: PanelMode;
  accent: AccentPreset;
  density: DensityMode;
}

const ACCENT_PRESETS: Record<AccentPreset, { accent: string; accentHover: string; accentSoft: string }> = {
  blue:   { accent: '#2563EB', accentHover: '#1D4ED8', accentSoft: 'rgba(37,99,235,0.14)' },
  indigo: { accent: '#6366F1', accentHover: '#4F46E5', accentSoft: 'rgba(99,102,241,0.14)' },
  teal:   { accent: '#0D9488', accentHover: '#0F766E', accentSoft: 'rgba(13,148,136,0.14)' },
  violet: { accent: '#8B5CF6', accentHover: '#7C3AED', accentSoft: 'rgba(139,92,246,0.14)' },
};

const DEFAULT_CONFIG: ThemeConfig = {
  panel: 'dark',
  accent: 'blue',
  density: 'comfortable',
};

function loadConfig(): ThemeConfig {
  try {
    const saved = localStorage.getItem('chatowl_theme');
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<ThemeConfig>;
      return {
        panel: parsed.panel ?? DEFAULT_CONFIG.panel,
        accent: parsed.accent ?? DEFAULT_CONFIG.accent,
        density: parsed.density ?? DEFAULT_CONFIG.density,
      };
    }
  } catch {
    // ignore parse errors
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { panel: prefersDark ? 'dark' : 'light', accent: DEFAULT_CONFIG.accent, density: DEFAULT_CONFIG.density };
}

function applyConfig(config: ThemeConfig): void {
  const root = document.documentElement;

  // Apply panel (dark/light) via data attribute
  root.dataset.panel = config.panel;

  // Apply density via data attribute
  root.dataset.density = config.density;

  // Apply accent CSS variables directly
  const preset = ACCENT_PRESETS[config.accent];
  root.style.setProperty('--color-accent', preset.accent);
  root.style.setProperty('--color-accent-hover', preset.accentHover);
  root.style.setProperty('--color-accent-soft', preset.accentSoft);
}

export const useTheme = () => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const loaded = loadConfig();
    // Apply immediately on first render (sync)
    applyConfig(loaded);
    return loaded;
  });

  useEffect(() => {
    applyConfig(config);
    try {
      localStorage.setItem('chatowl_theme', JSON.stringify(config));
    } catch {
      // ignore storage errors
    }
  }, [config]);

  const setPanel = useCallback((panel: PanelMode) => {
    setConfig(prev => ({ ...prev, panel }));
  }, []);

  const setAccent = useCallback((accent: AccentPreset) => {
    setConfig(prev => ({ ...prev, accent }));
  }, []);

  const setDensity = useCallback((density: DensityMode) => {
    setConfig(prev => ({ ...prev, density }));
  }, []);

  const togglePanel = useCallback(() => {
    setConfig(prev => ({ ...prev, panel: prev.panel === 'dark' ? 'light' : 'dark' }));
  }, []);

  return { config, setPanel, setAccent, setDensity, togglePanel };
};
