/**
 * SkillsMenu — Dia-style skills picker/manager for the Ask AI composer.
 * Backed by the real gbrain skills endpoint (fetchSkills) grouped by category, with a curated
 * fallback so the menu always has content. "New / Manage Skills" redirect to the Skills page.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Folder, Plus, Settings, X, type LucideIcon } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { fetchSkills, gbrainKeys } from '../api/agenticBrainApi';
import { FEATURED_SKILL, SKILLS_PAGE, toDisplaySkills, type DisplaySkill } from './skillsCatalog';

// ─── Skill pill (start-of-composer chip; hover-only ✕) ──────────────────────

export function SkillPill({ label, icon: Icon, onRemove }: { label: string; icon: LucideIcon; onRemove: () => void }): React.ReactNode {
  return (
    <span className="group/pill relative inline-flex shrink-0 select-none items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 py-1 pl-2.5 pr-3 text-sm font-medium text-primary-700">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
      {/* Solid tint behind the ✕ (short gradient ramp before it) so the label
          can't ghost through the glyph */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} skill`}
        className="absolute inset-y-0 right-0 flex items-stretch rounded-r-lg text-primary-500 opacity-0 transition-opacity hover:text-primary-700 focus:outline-none group-hover/pill:opacity-100 touch:opacity-100"
      >
        <span aria-hidden className="w-4 bg-gradient-to-r from-transparent to-primary-50" />
        <span className="flex items-center rounded-r-lg bg-primary-50 pr-2.5">
          <X className="h-3.5 w-3.5" />
        </span>
      </button>
    </span>
  );
}

function SkillRow({ skill, featured, active, onPick }: { skill: DisplaySkill; featured?: boolean; active?: boolean; onPick: (s: DisplaySkill) => void }): React.ReactNode {
  const Icon = skill.icon;
  return (
    <button
      type="button"
      role="menuitem"
      data-active={active ? 'true' : undefined}
      onClick={() => onPick(skill)}
      className={cn('flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50', active && 'bg-primary-50')}
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', featured ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-600')}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900">{skill.label}</span>
        {skill.desc && <span className="block truncate text-xs text-gray-500">{skill.desc}</span>}
      </span>
    </button>
  );
}

export function SkillsMenu({
  onPick,
  query = '',
  mode = 'picker',
}: {
  onPick: (s: DisplaySkill) => void;
  query?: string;
  mode?: 'picker' | 'manager';
}): React.ReactNode {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevQuery, setPrevQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: gbrainKeys.skills(),
    queryFn: fetchSkills,
    staleTime: 30 * 60 * 1000,
  });

  // React Compiler auto-memoizes these — no manual useMemo needed.
  // API-driven only: no fallback catalog — an empty/failed response shows an
  // honest message instead of invented skills.
  const skills = data?.skills ? toDisplaySkills(data.skills) : [];
  const categories = Array.from(new Set(skills.map((s) => s.category))).sort();

  const q = query.trim().toLowerCase();
  const matches = (s: DisplaySkill): boolean => !q || s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);
  const visible: DisplaySkill[] = [
    ...(matches(FEATURED_SKILL) ? [FEATURED_SKILL] : []),
    ...categories.flatMap((cat) => skills.filter((s) => s.category === cat && matches(s))),
  ];

  // Reset the keyboard highlight when the query changes (render-time guard, not an effect).
  if (q !== prevQuery) {
    setPrevQuery(q);
    setActiveIndex(0);
  }

  // Keep latest values for the mount-only keydown listener (avoids re-subscribing every render).
  const navState = useRef({ visible, activeIndex, onPick });
  useEffect(() => {
    navState.current = { visible, activeIndex, onPick };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const { visible: vis, activeIndex: idx, onPick: pick } = navState.current;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(vis.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        const s = vis[idx];
        if (s) {
          e.preventDefault();
          pick(s);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    scrollRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const goSkillsPage = (): void => {
    void navigate(SKILLS_PAGE);
  };

  return (
    <div className="w-[min(28rem,calc(100vw-3rem))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      {mode === 'manager' && (
        <div className="border-b border-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-900">Skills library</div>
      )}

      <div ref={scrollRef} className="max-h-[18rem] overflow-y-auto p-1.5">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
            <Spinner className="h-4 w-4" /> Loading skills…
          </div>
        )}
        {!isLoading && matches(FEATURED_SKILL) && (
          <div className="mb-1">
            <SkillRow skill={FEATURED_SKILL} featured active={visible[activeIndex]?.name === FEATURED_SKILL.name} onPick={onPick} />
          </div>
        )}
        {!isLoading &&
          categories.map((cat) => {
            const items = skills.filter((s) => s.category === cat && matches(s));
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-1">
                <div className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <Folder className="h-3.5 w-3.5" aria-hidden />
                  {cat}
                </div>
                {items.map((s) => (
                  <SkillRow key={s.name} skill={s} active={visible[activeIndex]?.name === s.name} onPick={onPick} />
                ))}
              </div>
            );
          })}
        {!isLoading && error != null && skills.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-gray-500">Couldn&apos;t load skills.</p>
        )}
        {!isLoading && error == null && !q && skills.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-gray-500">No skills available.</p>
        )}
        {!isLoading && q && visible.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-gray-400">No skills match “{query}”.</p>
        )}
      </div>

      {mode === 'manager' ? (
        <div className="flex items-center justify-end gap-1 border-t border-gray-100 px-3 py-2">
          <Button variant="outline" size="sm" onClick={goSkillsPage}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New Skill
          </Button>
          <Button variant="ghost" size="sm" onClick={goSkillsPage}>
            <Settings className="mr-1 h-3.5 w-3.5" /> Manage Skills
          </Button>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-400">↑ ↓ to navigate · ↵ to select · esc to close</div>
      )}
    </div>
  );
}
