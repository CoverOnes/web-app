/**
 * NetworkGraph — inline-SVG radial network graph (NO chart library).
 *
 * Center node = you; spokes = REAL accepted connections (no fabricated nodes).
 * Radial layout: cx = 380 + R cosθ, cy = 160 + R sinθ, θ = 2π·i/n. No d3.
 * Mobile caps node count via `cap`. Empty (n=0) → center node + "尚無連結".
 *
 * Extracted from NetworkPage so both NetworkPage and InsightsPage render the
 * identical real-data graph without duplicating the SVG (per SA spec §6.5).
 * Tokens only (var(--co-*)); renders only a single initial per node — never an
 * avatar URL or full name — so it carries no PII / no fabricated data.
 */
import type { Connection } from '../../lib/api/coverones';

export interface NetworkGraphProps {
  centerInitial: string;
  connections: Connection[];
  cap: number;
}

export function NetworkGraph({ centerInitial, connections, cap }: NetworkGraphProps) {
  const nodes = connections.slice(0, cap);
  const n = nodes.length;
  const R = 120; // spoke radius within the 760×320 viewBox

  return (
    <svg
      className="net-graph-svg"
      viewBox="0 0 760 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={n === 0 ? '人脈網絡圖：尚無連結' : `人脈網絡圖：${n} 個直接連結`}
    >
      <defs>
        <radialGradient id="net-rg-center">
          <stop offset="0%" stopColor="var(--co-cyan)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--co-cyan)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="net-lg-edge" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--co-cyan)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--co-accent-2)" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Edges from center to each real connection */}
      <g stroke="url(#net-lg-edge)" strokeWidth="1.5" fill="none" opacity="0.7">
        {nodes.map((c, i) => {
          const theta = (2 * Math.PI * i) / n;
          const cx = 380 + R * Math.cos(theta);
          const cy = 160 + R * Math.sin(theta);
          return <path key={`e-${c.id}`} d={`M380 160 L ${cx.toFixed(1)} ${cy.toFixed(1)}`} />;
        })}
      </g>

      {/* Center node = you */}
      <circle cx="380" cy="160" r="40" fill="var(--co-bg-3)" stroke="var(--co-accent)" strokeWidth="2" />
      <circle cx="380" cy="160" r="30" fill="url(#net-rg-center)" />
      <text x="380" y="158" textAnchor="middle" fill="var(--co-text)" fontSize="14" fontWeight="700">
        {centerInitial}
      </text>
      <text x="380" y="174" textAnchor="middle" fill="var(--co-text-dim)" fontSize="9">
        中心節點 · 你
      </text>

      {/* Connection nodes (or empty-state label) */}
      {n === 0 ? (
        <text x="380" y="250" textAnchor="middle" fill="var(--co-text-dim)" fontSize="12">
          尚無連結
        </text>
      ) : (
        <g>
          {nodes.map((c, i) => {
            const theta = (2 * Math.PI * i) / n;
            const cx = 380 + R * Math.cos(theta);
            const cy = 160 + R * Math.sin(theta);
            const initial = (c.user.displayName || '?').charAt(0).toUpperCase();
            return (
              <g key={`n-${c.id}`}>
                <circle cx={cx} cy={cy} r="14" fill="var(--co-bg-card-2)" stroke="var(--co-cyan)" strokeWidth="1.5" />
                <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--co-cyan)" fontSize="10" fontWeight="700">
                  {initial}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

export default NetworkGraph;
