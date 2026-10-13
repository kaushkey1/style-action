/**
 * Skills catalog — types and helpers for the Ask AI skills menu.
 * Kept separate from SkillsMenu.tsx so that file only exports components (fast-refresh clean).
 * Skills come exclusively from the gbrain skills endpoint — no fallback catalog.
 */
import { Lightbulb, Package, Calculator, Scissors, Megaphone, Users, PieChart, type LucideIcon } from 'lucide-react';
import type { Skill } from '../data/agenticBrainTypes';

export interface DisplaySkill {
  name: string;
  label: string;
  desc: string;
  category: string;
  icon: LucideIcon;
}

export const FEATURED_SKILL: DisplaySkill = {
  name: 'deep-research',
  label: 'Deep Research',
  desc: 'Run a deep, multi-step analysis with the AI Analyst’s reasoning model.',
  category: 'Featured',
  icon: Lightbulb,
};

export const SKILLS_PAGE = '/knowledge-base/skills';

export function humanizeSkill(name: string): string {
  return name
    .replace(/^fnl-/, '')
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function iconForCategory(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (/finance|budget|cash|cost|capex|margin/.test(c)) return Calculator;
  if (/sourc|design|fabric|fit|colou?r|material|product dev/.test(c)) return Scissors;
  if (/market|campaign|content|influencer|creative|brand/.test(c)) return Megaphone;
  if (/customer|loyalty|crm|service/.test(c)) return Users;
  if (/insight|analytic|report|cohort|segment/.test(c)) return PieChart;
  return Package; // planning / merchandising / default
}

export function toDisplaySkills(skills: Skill[]): DisplaySkill[] {
  return skills.map((s) => ({
    name: s.name,
    label: humanizeSkill(s.name),
    desc: s.description ?? '',
    category: s.category || 'General',
    icon: iconForCategory(s.category || ''),
  }));
}
