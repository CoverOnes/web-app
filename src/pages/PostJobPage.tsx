/**
 * PostJobPage — 發布新需求 (PostProject)
 *
 * Design source: design-reference/chat/project/PostProject.html + shared.css
 * Route: /jobs/new (mapped from design "PostProject → post-job" in DESIGN.md)
 *
 * 4-step stepper flow:
 *   Step 1 — 基本資訊 (category, title, description, skills, work mode)
 *   Step 2 — 需求規格 (detailed spec, NDA, confidentiality)
 *   Step 3 — 預算與時程 (milestones, total budget)
 *   Step 4 — 審核與發布 (review & publish)
 *
 * Submit: useCreateListing mutation.
 *   Fields mapped to API: title, description, budgetMin, budgetMax, currency.
 *   UI-only fields (category, skills, workMode, location, nda, milestones) are
 *   captured in form state but NOT yet sent to the backend.
 *   TODO: confirm extended listing endpoint shape with backend team before adding
 *   these fields to CreateListingRequest.
 */

import { useState, useId, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCreateListing } from '../lib/query';
import { TierGuard } from '../components/auth/TierGuard';

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: '基本資訊' },
  { n: 2, label: '需求規格' },
  { n: 3, label: '預算與時程' },
  { n: 4, label: '審核與發布' },
] as const;

interface Category {
  value: string;
  label: string;
  sub: string;
  ico: string;
  gradient: string;
}

const CATEGORIES: Category[] = [
  { value: 'DEV',    label: '技術接案', sub: '後端 / 前端 / DevOps', ico: '</>',  gradient: 'linear-gradient(135deg,var(--co-accent),var(--co-accent-2))' },
  { value: 'DESIGN', label: '設計創意', sub: 'UI/UX / 平面 / 品牌',  ico: '✦',   gradient: 'linear-gradient(135deg,var(--co-pink),var(--co-red))' },
  { value: 'MFG',    label: '硬體製造', sub: 'PCB / 模具 / 代工',    ico: '⚙',   gradient: 'linear-gradient(135deg,var(--co-amber),var(--co-red))' },
  { value: 'MKT',    label: '行銷顧問', sub: '數位行銷 / 公關',      ico: '📊',  gradient: 'linear-gradient(135deg,var(--co-green),var(--co-cyan))' },
];

const WORK_MODES = [
  '混合辦公（部分駐廠）',
  '遠端',
  '全程駐廠',
];

const LOCATIONS = [
  '新竹科學園區（駐廠）',
  '大台北地區',
  '不限',
];

const NDA_OPTIONS = [
  '是 — 簽署後提供詳細文件',
  '否',
];

const CONFIDENTIALITY_OPTIONS = ['機密', '內部', '公開'];

const CURRENCY_OPTIONS = ['TWD', 'USD'];

// ─── Milestone model ─────────────────────────────────────────────────────────

interface Milestone {
  id: string;
  title: string;
  amount: string;
}

function makeMilestone(n: number): Milestone {
  return { id: crypto.randomUUID(), title: `里程碑 ${n}`, amount: '' };
}

// Monotonically increasing counter so deleted-then-added milestones
// get a new sequential number rather than reusing a previous index.
let _milestoneCounter = 1;

// ─── Small helper components ─────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  optional?: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}

function Field({ label, required, optional, hint, htmlFor, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: 12.5,
          fontWeight: 600,
          marginBottom: 7,
          color: 'var(--co-text)',
        }}
      >
        {label}
        {required && <span style={{ color: '#FCA5A5', marginLeft: 4 }}>*</span>}
        {optional && (
          <span style={{ color: 'var(--co-text-muted)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
            {optional}
          </span>
        )}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)', marginTop: 5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
}

function TextInput({ id, ...rest }: TextInputProps) {
  return (
    <input
      id={id}
      style={{
        width: '100%',
        background: 'var(--co-bg-3)',
        border: '1px solid var(--co-line)',
        color: 'var(--co-text)',
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 13.5,
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 150ms, box-shadow 150ms',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--co-accent)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--co-line)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      {...rest}
    />
  );
}

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
}

function TextAreaInput({ id, ...rest }: TextAreaInputProps) {
  return (
    <textarea
      id={id}
      style={{
        width: '100%',
        background: 'var(--co-bg-3)',
        border: '1px solid var(--co-line)',
        color: 'var(--co-text)',
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 13.5,
        fontFamily: 'inherit',
        outline: 'none',
        minHeight: 110,
        resize: 'vertical',
        lineHeight: 1.6,
        transition: 'border-color 150ms, box-shadow 150ms',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--co-accent)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--co-line)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      {...rest}
    />
  );
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
}

function SelectInput({ id, children, ...rest }: SelectInputProps) {
  return (
    <select
      id={id}
      style={{
        width: '100%',
        background: 'var(--co-bg-3)',
        border: '1px solid var(--co-line)',
        color: 'var(--co-text)',
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 13.5,
        fontFamily: 'inherit',
        outline: 'none',
        cursor: 'pointer',
        transition: 'border-color 150ms',
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 14,
        padding: 24,
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--co-text)' }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 12.5, color: 'var(--co-text-dim)', marginBottom: 18, marginTop: 0 }}>
          {sub}
        </p>
      )}
      {children}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

interface StepperProps {
  current: number; // 1-indexed
}

function Stepper({ current }: StepperProps) {
  return (
    <nav aria-label="表單步驟">
      <ol
        role="tablist"
        aria-label="表單步驟"
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 18,
          background: 'var(--co-bg-card)',
          border: '1px solid var(--co-line-strong)',
          borderRadius: 14,
          padding: 8,
          listStyle: 'none',
          margin: '0 0 18px 0',
        }}
      >
      {STEPS.map((step) => {
        const done = step.n < current;
        const active = step.n === current;
        return (
          <li
            key={step.n}
            id={`step-tab-${step.n}`}
            role="tab"
            aria-selected={active}
            aria-current={active ? 'step' : undefined}
            style={{
              flex: 1,
              padding: '14px 12px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: done ? 'var(--co-green)' : active ? '#fff' : 'var(--co-text-dim)',
              background: active
                ? 'linear-gradient(135deg, rgba(99,102,241,.18), rgba(139,92,246,.12))'
                : 'transparent',
              position: 'relative',
            }}
          >
            {/* Step number / check */}
            <div
              aria-hidden="true"
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
                background: done
                  ? 'rgba(16,185,129,0.2)'
                  : active
                  ? 'linear-gradient(135deg,var(--co-accent-blue),var(--co-accent-2))'
                  : 'rgba(15,23,42,0.6)',
                border: done
                  ? '1px solid var(--co-green)'
                  : active
                  ? '1px solid transparent'
                  : '1px solid var(--co-line)',
                color: done ? 'var(--co-green)' : '#fff',
              }}
            >
              {done ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step.n
              )}
            </div>
            {/* Labels */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: active ? '#fff' : done ? 'var(--co-green)' : 'var(--co-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}
              >
                Step {step.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{step.label}</div>
            </div>
          </li>
        );
      })}
      </ol>
    </nav>
  );
}

// ─── Skills Tag Input ─────────────────────────────────────────────────────────

interface SkillsTagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  id?: string;
}

function SkillsTagInput({ tags, onAdd, onRemove, id }: SkillsTagInputProps) {
  const [inputVal, setInputVal] = useState('');

  const commit = useCallback(() => {
    const v = inputVal.trim();
    if (v && !tags.includes(v)) onAdd(v);
    setInputVal('');
  }, [inputVal, tags, onAdd]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && inputVal === '' && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div
      role="group"
      aria-label="必備技能標籤"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '10px 12px',
        background: 'var(--co-bg-3)',
        border: '1px solid var(--co-line)',
        borderRadius: 10,
        minHeight: 46,
        alignItems: 'center',
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11.5,
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#C7D2FE',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          {tag}
          <button
            type="button"
            aria-label={`移除技能 ${tag}`}
            onClick={() => onRemove(tag)}
            style={{
              color: 'var(--co-text-muted)',
              cursor: 'pointer',
              fontSize: 13,
              lineHeight: 1,
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? '新增技能標籤...' : ''}
        aria-label="輸入新技能後按 Enter"
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--co-text)',
          fontSize: 13,
          flex: 1,
          minWidth: 120,
          padding: '2px',
        }}
      />
    </div>
  );
}

// ─── Category grid ────────────────────────────────────────────────────────────

interface CategoryGridProps {
  selected: string;
  onSelect: (v: string) => void;
}

function CategoryGrid({ selected, onSelect }: CategoryGridProps) {
  return (
    <div
      role="radiogroup"
      aria-label="專案類別"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}
      className="cat-grid"
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(cat.value)}
            style={{
              padding: '14px 12px',
              background: isSelected
                ? 'linear-gradient(135deg, rgba(99,102,241,.15), rgba(139,92,246,.08))'
                : 'rgba(15,23,42,0.5)',
              border: `1px solid ${isSelected ? 'var(--co-accent)' : 'var(--co-line)'}`,
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 150ms',
              textAlign: 'left',
              color: 'var(--co-text)',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'var(--co-line)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8,
                background: cat.gradient,
              }}
            >
              {cat.ico}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</div>
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 2 }}>{cat.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Milestone row ────────────────────────────────────────────────────────────

interface MilestoneRowProps {
  ms: Milestone;
  index: number;
  onChange: (id: string, field: 'title' | 'amount', value: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

function MilestoneRow({ ms, index, onChange, onDelete, canDelete }: MilestoneRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 140px 36px',
        gap: 10,
        alignItems: 'center',
        padding: 12,
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid var(--co-line)',
        borderRadius: 10,
        marginBottom: 8,
      }}
    >
      {/* Milestone number badge */}
      <div
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg,var(--co-accent-blue),var(--co-accent-2))',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        M{index + 1}
      </div>

      {/* Title input */}
      <input
        aria-label={`里程碑 ${index + 1} 名稱`}
        value={ms.title}
        onChange={(e) => onChange(ms.id, 'title', e.target.value)}
        style={{
          padding: '8px 12px',
          fontSize: 12.5,
          background: 'var(--co-bg-3)',
          border: '1px solid var(--co-line)',
          color: 'var(--co-text)',
          borderRadius: 10,
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--co-accent)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--co-line)'; }}
      />

      {/* Amount input */}
      <input
        aria-label={`里程碑 ${index + 1} 金額`}
        value={ms.amount}
        onChange={(e) => onChange(ms.id, 'amount', e.target.value)}
        placeholder="NT$ 0"
        style={{
          padding: '8px 12px',
          fontSize: 12.5,
          background: 'var(--co-bg-3)',
          border: '1px solid var(--co-line)',
          color: 'var(--co-text)',
          borderRadius: 10,
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--co-accent)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--co-line)'; }}
      />

      {/* Delete button */}
      <button
        type="button"
        aria-label={`刪除里程碑 ${index + 1}`}
        onClick={() => onDelete(ms.id)}
        disabled={!canDelete}
        style={{
          background: 'transparent',
          border: '1px solid var(--co-line)',
          color: 'var(--co-text-dim)',
          width: 36,
          height: 36,
          borderRadius: 8,
          cursor: canDelete ? 'pointer' : 'not-allowed',
          opacity: canDelete ? 1 : 0.4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Live Preview (right sidebar) ─────────────────────────────────────────────

interface LivePreviewProps {
  title: string;
  category: string;
  skills: string[];
  milestones: Milestone[];
  workMode: string;
  currency: string;
}

function parseTotalFromMilestones(milestones: Milestone[], currency: string): string {
  const total = milestones.reduce((sum, m) => {
    const raw = m.amount.replace(/[^0-9.]/g, '');
    return sum + (parseFloat(raw) || 0);
  }, 0);
  if (total === 0) return '—';
  if (currency === 'TWD') {
    return `NT$ ${total.toLocaleString('zh-TW')}`;
  }
  return `${currency} ${total.toLocaleString()}`;
}

function LivePreview({ title, category, skills, milestones, workMode, currency }: LivePreviewProps) {
  const cat = CATEGORIES.find((c) => c.value === category);
  const total = parseTotalFromMilestones(milestones, currency);
  const activeMilestones = milestones.filter((m) => m.title.trim());

  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 14,
        padding: 16,
        position: 'sticky',
        top: 80,
      }}
    >
      {/* Label row */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--co-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: 'var(--co-green)',
            boxShadow: '0 0 8px var(--co-green)',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        即時預覽 — 廠商視角
      </div>

      {/* Preview card body */}
      <div
        style={{
          padding: 14,
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid var(--co-line)',
          borderRadius: 10,
        }}
      >
        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {cat && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 500,
                background: 'rgba(99,102,241,0.15)',
                color: '#A78BFA',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              {cat.label}
            </span>
          )}
          {skills.slice(0, 3).map((s) => (
            <span
              key={s}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 500,
                background: 'rgba(34,211,238,0.15)',
                color: '#67E8F9',
                border: '1px solid rgba(34,211,238,0.3)',
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.4, color: 'var(--co-text)' }}>
          {title || '（專案標題）'}
        </h3>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--co-line)',
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: 'var(--co-text-dim)', textTransform: 'uppercase' }}>預算</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: 'var(--co-green)' }}>{total}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--co-text-dim)', textTransform: 'uppercase' }}>里程碑</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
              {activeMilestones.length > 0 ? `${activeMilestones.length} 階段` : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--co-text-dim)', textTransform: 'uppercase' }}>工作模式</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{workMode || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--co-text-dim)', textTransform: 'uppercase' }}>技能數</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{skills.length > 0 ? `${skills.length} 項` : '—'}</div>
          </div>
        </div>
      </div>

      {/* AI Match prediction */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,.08), rgba(99,102,241,.05))',
          border: '1px solid rgba(34,211,238,.25)',
          borderRadius: 12,
          padding: 14,
          marginTop: 14,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: '#67E8F9', display: 'flex', alignItems: 'center', gap: 6 }}>
          ✨ AI 媒合預測
          <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--co-text-muted)', marginLeft: 4 }}>
            依平台均值估算
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--co-text-dim)', marginTop: 6, lineHeight: 1.55 }}>
          根據目前內容，預估可觸及{' '}
          <strong style={{ color: '#67E8F9' }}>218 家</strong>{' '}
          高匹配廠商。預期應標數{' '}
          <strong style={{ color: '#67E8F9' }}>8-14 家</strong>
          ，平均第一份報價將於{' '}
          <strong style={{ color: '#67E8F9' }}>2.4 天</strong>{' '}
          內到達。
        </div>
      </div>

      {/* Optimization suggestions */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,.08), rgba(239,68,68,.05))',
          border: '1px solid rgba(245,158,11,.25)',
          borderRadius: 12,
          padding: 14,
          marginTop: 10,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚠ 建議優化
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--co-text-dim)', marginTop: 6, lineHeight: 1.55 }}>
          • 加入技能標籤可提升廠商媒合精準度<br />
          • 建議設置至少 3 個里程碑降低雙方風險<br />
          • 補充過往實績要求可提高優質應標率
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--co-text-muted)', marginTop: 14, textAlign: 'center' }}>
        草稿自動儲存
      </div>
    </div>
  );
}

// ─── Step 1: 基本資訊 ─────────────────────────────────────────────────────────

interface Step1Props {
  category: string;
  onCategoryChange: (v: string) => void;
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  skills: string[];
  onSkillAdd: (s: string) => void;
  onSkillRemove: (s: string) => void;
  workMode: string;
  onWorkModeChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
}

function Step1({
  category, onCategoryChange,
  title, onTitleChange,
  description, onDescriptionChange,
  skills, onSkillAdd, onSkillRemove,
  workMode, onWorkModeChange,
  location, onLocationChange,
}: Step1Props) {
  const titleId = useId();
  const descId = useId();
  const skillsId = useId();
  const workModeId = useId();
  const locationId = useId();
  const descChars = description.trim().length;

  return (
    <>
      {/* Category */}
      <Section title="選擇專案類別" sub="類別會影響系統媒合的廠商池。可選擇 1-2 個主要類別。">
        <CategoryGrid selected={category} onSelect={onCategoryChange} />
      </Section>

      {/* Basic info */}
      <Section title="專案基本資訊" sub="標題建議簡潔有力，平均瀏覽量在標題清楚時可提升 +42%">
        <Field
          label="專案標題"
          required
          optional="建議 15-30 字"
          htmlFor={titleId}
          hint={
            title.length > 0 && title.length >= 10
              ? <span>✓ 標題長度適中。<strong style={{ color: 'var(--co-cyan)' }}>AI 提示：</strong>包含技術棧關鍵字可提升媒合精準度。</span>
              : '填寫清晰標題有助廠商快速理解需求。'
          }
        >
          <TextInput
            id={titleId}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="例：API Gateway 微服務化重構"
            maxLength={120}
          />
        </Field>

        <Field
          label="簡短描述"
          required
          htmlFor={descId}
          hint={`字數 ${descChars} / 建議 100-300 字`}
        >
          <TextAreaInput
            id={descId}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="詳述案件背景、技術需求、驗收標準..."
            rows={6}
          />
        </Field>

        <Field
          label="必備技能"
          required
          optional="輸入後按 Enter 新增"
          htmlFor={skillsId}
          hint="輸入技能關鍵字後按 Enter 新增。Backspace 刪除最後一個標籤。"
        >
          <SkillsTagInput
            id={skillsId}
            tags={skills}
            onAdd={onSkillAdd}
            onRemove={onSkillRemove}
          />
        </Field>

        {/* 2-column selects */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="row-2-selects">
          <Field label="工作模式" required htmlFor={workModeId}>
            <SelectInput id={workModeId} value={workMode} onChange={(e) => onWorkModeChange(e.target.value)}>
              {WORK_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </SelectInput>
          </Field>
          <Field label="地點偏好" htmlFor={locationId}>
            <SelectInput id={locationId} value={location} onChange={(e) => onLocationChange(e.target.value)}>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </SelectInput>
          </Field>
        </div>
      </Section>
    </>
  );
}

// ─── Step 2: 需求規格 ─────────────────────────────────────────────────────────

interface Step2Props {
  nda: string;
  onNdaChange: (v: string) => void;
  confidentiality: string;
  onConfidentialityChange: (v: string) => void;
  extraDesc: string;
  onExtraDescChange: (v: string) => void;
}

function Step2({ nda, onNdaChange, confidentiality, onConfidentialityChange, extraDesc, onExtraDescChange }: Step2Props) {
  const ndaId = useId();
  const confId = useId();
  const extraId = useId();

  return (
    <>
      <Section title="合約與保密" sub="設定需簽署的文件類型及資料保密要求。">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="row-2-selects">
          <Field label="需簽署 NDA" htmlFor={ndaId}>
            <SelectInput id={ndaId} value={nda} onChange={(e) => onNdaChange(e.target.value)}>
              {NDA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </SelectInput>
          </Field>
          <Field label="專案保密級別" htmlFor={confId}>
            <SelectInput id={confId} value={confidentiality} onChange={(e) => onConfidentialityChange(e.target.value)}>
              {CONFIDENTIALITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </SelectInput>
          </Field>
        </div>
      </Section>

      <Section title="詳細需求說明" sub="補充更多背景資訊、技術架構、驗收條件等。">
        <Field label="補充說明" optional="選填" htmlFor={extraId}>
          <TextAreaInput
            id={extraId}
            value={extraDesc}
            onChange={(e) => onExtraDescChange(e.target.value)}
            placeholder="例：需具備大型 monolith 拆分實戰經驗，能在不停機前提下逐步拆分 8-12 個獨立微服務..."
            rows={8}
          />
        </Field>
      </Section>
    </>
  );
}

// ─── Step 3: 預算與時程 ───────────────────────────────────────────────────────

interface Step3Props {
  milestones: Milestone[];
  onMilestoneChange: (id: string, field: 'title' | 'amount', value: string) => void;
  onMilestoneAdd: () => void;
  onMilestoneDelete: (id: string) => void;
  currency: string;
  onCurrencyChange: (v: string) => void;
}

function Step3({ milestones, onMilestoneChange, onMilestoneAdd, onMilestoneDelete, currency, onCurrencyChange }: Step3Props) {
  const currencyId = useId();
  const total = parseTotalFromMilestones(milestones, currency);
  const rawTotal = milestones.reduce((sum, m) => {
    const raw = m.amount.replace(/[^0-9.]/g, '');
    return sum + (parseFloat(raw) || 0);
  }, 0);

  return (
    <Section title="里程碑與付款" sub="分階段付款可降低雙方風險。建議至少設置 3 個里程碑。">
      {/* Currency selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14, marginBottom: 18 }} className="currency-row">
        <Field label="幣別" htmlFor={currencyId}>
          <SelectInput id={currencyId} value={currency} onChange={(e) => onCurrencyChange(e.target.value)}>
            {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </Field>
      </div>

      {/* Milestone list */}
      <div role="list" aria-label="里程碑列表">
        {milestones.map((ms, idx) => (
          <div key={ms.id} role="listitem">
            <MilestoneRow
              ms={ms}
              index={idx}
              onChange={onMilestoneChange}
              onDelete={onMilestoneDelete}
              canDelete={milestones.length > 1}
            />
          </div>
        ))}
      </div>

      {/* Add milestone */}
      <button
        type="button"
        onClick={onMilestoneAdd}
        style={{
          marginTop: 6,
          padding: '8px 14px',
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          color: 'var(--co-text-dim)',
          fontSize: 13,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--co-text)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--co-text-dim)'; }}
      >
        ＋ 新增里程碑
      </button>

      {/* Budget total */}
      {rawTotal > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 14,
            padding: '12px 14px',
            background: 'rgba(16,185,129,.08)',
            border: '1px solid rgba(16,185,129,.3)',
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 12.5, color: 'var(--co-green)', fontWeight: 600 }}>✓ 預算總額</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--co-green)' }}>{total}</div>
        </div>
      )}
    </Section>
  );
}

// ─── Step 4: 審核與發布 ───────────────────────────────────────────────────────

interface Step4Props {
  title: string;
  description: string;
  category: string;
  skills: string[];
  milestones: Milestone[];
  workMode: string;
  location: string;
  nda: string;
  confidentiality: string;
  currency: string;
  submitError: string;
  isSubmitting: boolean;
}

function Step4({ title, description, category, skills, milestones, workMode, location, nda, confidentiality, currency, submitError, isSubmitting }: Step4Props) {
  const cat = CATEGORIES.find((c) => c.value === category);
  const total = parseTotalFromMilestones(milestones, currency);

  return (
    <Section title="審核與發布" sub="確認所有資訊無誤後，點擊「發布需求」送出。">
      {submitError && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: 18,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            fontSize: 13,
            color: '#FCA5A5',
          }}
        >
          {submitError}
        </div>
      )}

      {/* Review table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: '類別', value: cat?.label ?? '（未選擇）' },
          { label: '標題', value: title || '（未填寫）' },
          { label: '工作模式', value: workMode },
          { label: '地點', value: location },
          { label: 'NDA', value: nda },
          { label: '保密級別', value: confidentiality },
          { label: '幣別', value: currency },
          { label: '預算總額', value: total },
          { label: '里程碑數', value: milestones.length > 0 ? `${milestones.length} 個` : '—' },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              gap: 14,
              padding: '10px 0',
              borderBottom: '1px solid var(--co-line)',
            }}
          >
            <span style={{ width: 100, fontSize: 12.5, color: 'var(--co-text-muted)', flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: 'var(--co-text)', fontWeight: 500 }}>{value}</span>
          </div>
        ))}

        {/* Skills */}
        <div style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--co-line)' }}>
          <span style={{ width: 100, fontSize: 12.5, color: 'var(--co-text-muted)', flexShrink: 0 }}>必備技能</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skills.length > 0 ? skills.map((s) => (
              <span
                key={s}
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  background: 'rgba(99,102,241,0.15)',
                  color: '#C7D2FE',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              >
                {s}
              </span>
            )) : <span style={{ fontSize: 13, color: 'var(--co-text-dim)' }}>（未填寫）</span>}
          </div>
        </div>

        {/* Description excerpt */}
        <div style={{ display: 'flex', gap: 14, padding: '10px 0' }}>
          <span style={{ width: 100, fontSize: 12.5, color: 'var(--co-text-muted)', flexShrink: 0 }}>案件說明</span>
          <span style={{ fontSize: 13, color: 'var(--co-text)', lineHeight: 1.55 }}>
            {description ? (description.slice(0, 200) + (description.length > 200 ? '...' : '')) : '（未填寫）'}
          </span>
        </div>
      </div>

      {isSubmitting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: 'var(--co-text-dim)', fontSize: 13 }}>
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid rgba(148,163,184,0.3)',
              borderTopColor: 'var(--co-accent)',
              animation: 'spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
          正在發布需求...
        </div>
      )}
    </Section>
  );
}

// ─── Footer navigation ────────────────────────────────────────────────────────

interface FooterNavProps {
  step: number;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
}

function FooterNav({ step, onPrev, onNext, isSubmitting, isLastStep }: FooterNavProps) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
      {/* Prev */}
      <button
        type="button"
        onClick={onPrev}
        disabled={step === 1}
        aria-label="上一步"
        style={{
          background: 'transparent',
          color: 'var(--co-text-dim)',
          border: '1px solid var(--co-line-strong)',
          padding: '11px 18px',
          borderRadius: 10,
          fontSize: 13,
          cursor: step === 1 ? 'not-allowed' : 'pointer',
          opacity: step === 1 ? 0.4 : 1,
        }}
      >
        ← 上一步
      </button>

      {/* Save draft — disabled until localStorage persist is implemented */}
      <button
        type="button"
        disabled
        title="即將推出"
        aria-label="儲存草稿（即將推出）"
        style={{
          background: 'var(--co-bg-3)',
          color: 'var(--co-text-muted)',
          border: '1px solid var(--co-line-strong)',
          padding: '11px 18px',
          borderRadius: 10,
          fontSize: 13,
          cursor: 'not-allowed',
          opacity: 0.55,
        }}
      >
        儲存草稿
      </button>

      {/* Next / Submit */}
      <button
        type={isLastStep ? 'submit' : 'button'}
        onClick={isLastStep ? undefined : onNext}
        disabled={isSubmitting}
        aria-label={isLastStep ? '發布需求' : '下一步'}
        style={{
          marginLeft: 'auto',
          padding: '11px 22px',
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent-2))',
          color: '#fff',
          cursor: isSubmitting ? 'wait' : 'pointer',
          boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
          opacity: isSubmitting ? 0.7 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          transition: 'opacity 150ms',
        }}
        onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = isSubmitting ? '0.7' : '1'; }}
      >
        {isSubmitting && (
          <span
            aria-hidden="true"
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              animation: 'spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
        )}
        {isLastStep ? '發布需求 ✓' : `下一步：${STEPS[step]?.label ?? ''} →`}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PostJobPage = () => {
  const navigate = useNavigate();
  const kycTier = useAuthStore((s) => s.user?.kycTier ?? 0);
  const createListing = useCreateListing();

  // ── Step ──
  const [step, setStep] = useState(1);

  // ── Step 1 fields ──
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [workMode, setWorkMode] = useState(WORK_MODES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);

  // ── Step 2 fields ──
  const [nda, setNda] = useState(NDA_OPTIONS[1]); // default: 否
  const [confidentiality, setConfidentiality] = useState(CONFIDENTIALITY_OPTIONS[2]); // 公開
  const [extraDesc, setExtraDesc] = useState('');

  // ── Step 3 fields ──
  const [milestones, setMilestones] = useState<Milestone[]>([makeMilestone(1)]);
  const [currency, setCurrency] = useState('TWD');

  // ── Submit ──
  const [submitError, setSubmitError] = useState('');

  // ── Step validation error (inline, replaces window.alert) ──
  const [stepError, setStepError] = useState('');

  // ── Handlers (must be before any early return) ──
  const addSkill = useCallback((s: string) => setSkills((prev) => [...prev, s]), []);
  const removeSkill = useCallback((s: string) => setSkills((prev) => prev.filter((x) => x !== s)), []);

  const changeMilestone = useCallback((id: string, field: 'title' | 'amount', value: string) => {
    setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
  }, []);

  const addMilestone = useCallback(() => {
    _milestoneCounter += 1;
    setMilestones((prev) => [...prev, makeMilestone(_milestoneCounter)]);
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // KYC guard — MUST be after all hooks (Rules of Hooks: no conditional hooks)
  if (kycTier < 2) {
    return (
      <TierGuard
        requiredTier={2}
        fullPage
        message="發布案件需要 KYC Tier 2。您仍可返回案件看板瀏覽開放案件。"
      >
        {null}
      </TierGuard>
    );
  }

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!category) { setStepError('請選擇專案類別。'); return false; }
      if (!title.trim()) { setStepError('請填寫專案標題。'); return false; }
      if (!description.trim()) { setStepError('請填寫簡短描述。'); return false; }
    }
    setStepError('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (!title.trim()) { setSubmitError('請填寫專案標題。'); return; }
    if (!description.trim()) { setSubmitError('請填寫案件說明。'); return; }
    setSubmitError('');

    // Compute budget from milestones
    const rawTotal = milestones.reduce((sum, m) => {
      const raw = m.amount.replace(/[^0-9.]/g, '');
      return sum + (parseFloat(raw) || 0);
    }, 0);

    try {
      // TODO: confirm extended listing endpoint shape with backend team.
      // Fields NOT yet sent: category, skills, workMode, location, nda,
      // confidentiality, extraDesc, milestones (breakdown).
      // Only the fields accepted by CreateListingRequest are wired:
      // budgetMin = milestone total (user-declared lower bound);
      // budgetMax = undefined (no upper bound declared by user; don't fabricate a range).
      const listing = await createListing.mutateAsync({
        title,
        description: [description, extraDesc].filter(Boolean).join('\n\n'),
        budgetMin: rawTotal > 0 ? String(rawTotal) : undefined,
        budgetMax: undefined,
        currency,
      });
      navigate(`/jobs/${listing.id}`, { replace: true });
    } catch (err) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        setSubmitError(err.response?.data?.message ?? '發布失敗，請稍後重試。');
      } else {
        setSubmitError('發布失敗，請稍後重試。');
      }
    }
  };

  const isLastStep = step === STEPS.length;

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--co-bg)',
          minHeight: '100%',
          color: 'var(--co-text)',
        }}
      >
        {/* Page header */}
        <div
          style={{
            padding: '24px 28px 18px 28px',
            borderBottom: '1px solid var(--co-line)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
          className="post-job-head"
        >
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
                color: 'var(--co-text)',
              }}
            >
              發布新需求
            </h1>
            <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: '4px 0 0' }}>
              完整填寫 RFP 內容，平均可在{' '}
              <strong style={{ color: 'var(--co-green)' }}>3.2 天</strong>{' '}
              內收到第一份報價
              <span style={{ fontSize: 10.5, color: 'var(--co-text-muted)', marginLeft: 6 }}>（依平台均值估算）</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Save draft — disabled until localStorage persist is implemented */}
            <button
              type="button"
              disabled
              title="即將推出"
              aria-label="儲存草稿（即將推出）"
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: 'var(--co-text-muted)',
                fontSize: 13,
                cursor: 'not-allowed',
                opacity: 0.55,
              }}
            >
              儲存草稿
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="取消並返回"
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--co-line-strong)',
                background: 'var(--co-bg-3)',
                color: 'var(--co-text)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '22px 28px 40px 28px', flex: 1 }}
          aria-label="發布新需求表單"
          className="post-job-body"
        >
          {/* Two-column layout: form | preview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) 360px',
              gap: 22,
            }}
            className="post-job-grid"
          >
            {/* LEFT: form */}
            <div style={{ minWidth: 0 }}>
              {/* Stepper */}
              <Stepper current={step} />

              {/* Step error (inline, replaces window.alert) */}
              {stepError && (
                <div
                  role="alert"
                  style={{
                    padding: '10px 14px',
                    marginBottom: 14,
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#FCA5A5',
                  }}
                >
                  {stepError}
                </div>
              )}

              {/* Step content — wrapped in tabpanel pointing to the active stepper tab */}
              <div
                role="tabpanel"
                aria-labelledby={`step-tab-${step}`}
              >
                {step === 1 && (
                  <Step1
                    category={category} onCategoryChange={setCategory}
                    title={title} onTitleChange={setTitle}
                    description={description} onDescriptionChange={setDescription}
                    skills={skills} onSkillAdd={addSkill} onSkillRemove={removeSkill}
                    workMode={workMode} onWorkModeChange={setWorkMode}
                    location={location} onLocationChange={setLocation}
                  />
                )}

                {step === 2 && (
                  <Step2
                    nda={nda} onNdaChange={setNda}
                    confidentiality={confidentiality} onConfidentialityChange={setConfidentiality}
                    extraDesc={extraDesc} onExtraDescChange={setExtraDesc}
                  />
                )}

                {step === 3 && (
                  <Step3
                    milestones={milestones}
                    onMilestoneChange={changeMilestone}
                    onMilestoneAdd={addMilestone}
                    onMilestoneDelete={deleteMilestone}
                    currency={currency}
                    onCurrencyChange={setCurrency}
                  />
                )}

                {step === 4 && (
                  <Step4
                    title={title}
                    description={description}
                    category={category}
                    skills={skills}
                    milestones={milestones}
                    workMode={workMode}
                    location={location}
                    nda={nda}
                    confidentiality={confidentiality}
                    currency={currency}
                    submitError={submitError}
                    isSubmitting={createListing.isPending}
                  />
                )}
              </div>

              {/* Footer nav */}
              <FooterNav
                step={step}
                onPrev={handlePrev}
                onNext={handleNext}
                isSubmitting={createListing.isPending}
                isLastStep={isLastStep}
              />
            </div>

            {/* RIGHT: live preview */}
            <div style={{ minWidth: 0 }}>
              <LivePreview
                title={title}
                category={category}
                skills={skills}
                milestones={milestones}
                workMode={workMode}
                currency={currency}
              />
            </div>
          </div>
        </form>

        {/* RWD overrides */}
        <style>{`
          /* Mobile: stack single column */
          @media (max-width: 767px) {
            .post-job-head {
              padding: 16px !important;
              flex-wrap: wrap;
              gap: 10px !important;
            }
            .post-job-body {
              padding: 12px 16px 80px 16px !important;
            }
            .post-job-grid {
              grid-template-columns: 1fr !important;
            }
            .cat-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .row-2-selects {
              grid-template-columns: 1fr !important;
            }
            .currency-row {
              grid-template-columns: 1fr !important;
            }
          }
          /* Tablet: stack grid but wider cards */
          @media (min-width: 768px) and (max-width: 1023px) {
            .post-job-grid {
              grid-template-columns: 1fr !important;
            }
            .post-job-body {
              padding: 18px 20px 40px 20px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default PostJobPage;
