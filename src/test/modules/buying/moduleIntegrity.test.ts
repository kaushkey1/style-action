import { describe, it, expect } from 'vitest'
import {
  capabilitiesFor, roleHas, STAGE_GATES, ALL_BUYING_CAPABILITIES, BUYING_ROLE_SLUGS,
} from '@/modules/otb/buyingCapabilities'
import {
  getBuyPlanMonths, getBuyPlanCategories, getBuyPlanSubcategories,
  getBuyPlanBricks, getBuyPlanOptions,
} from '@/modules/otb/data/mockBuyingModuleV2'

/**
 * These three suites exist because each corresponds to a defect that reached a
 * stakeholder in the HTML prototype and was present again here:
 *   · a stage gate guarded by a capability its owner did not hold
 *   · a fixture where six of seven categories declared options that did not exist
 *   · accessors that ignored the sale month, so every month served October
 */

describe('BR-127 — each stage gate has exactly one owner', () => {
  it('every gate is held by at least one non-admin role', () => {
    for (const gate of STAGE_GATES) {
      const owners = BUYING_ROLE_SLUGS.filter(
        (r) => r !== 'super-admin' && roleHas(r, gate.cap),
      )
      expect(owners, `${gate.id} (${gate.cap}) has no owner`).not.toHaveLength(0)
    }
  })

  it('the PO gates belong to the CFO and not to Commercial', () => {
    // the defect: the release card was guarded by `otb.approve`, which
    // Commercial holds and the CFO does not
    expect(roleHas('ceo', 'po.approve')).toBe(true)
    expect(roleHas('ceo', 'po.release')).toBe(true)
    expect(roleHas('financial-commercial-admin', 'po.approve')).toBe(false)
    expect(roleHas('financial-commercial-admin', 'po.release')).toBe(false)
  })

  it('BR-127a — at OTB the CFO holds a veto, not an approval', () => {
    expect(roleHas('ceo', 'otb.hold')).toBe(true)
    expect(roleHas('ceo', 'otb.reject')).toBe(true)
    expect(roleHas('ceo', 'otb.approve')).toBe(false)
    expect(roleHas('financial-commercial-admin', 'otb.approve')).toBe(true)
  })

  it('every capability a role is granted is a declared capability', () => {
    for (const slug of BUYING_ROLE_SLUGS) {
      for (const cap of capabilitiesFor(slug)) {
        expect(ALL_BUYING_CAPABILITIES, `${slug} → ${cap}`).toContain(cap)
      }
    }
  })
})

describe('hierarchy coherence — a level may not declare what it cannot produce', () => {
  const months = getBuyPlanMonths().map((m) => m.saleMonth)

  it.each(months)('%s: category totals equal their own drill-down', (month) => {
    for (const cat of getBuyPlanCategories(month)) {
      const real = getBuyPlanSubcategories(cat.code, month)
        .flatMap((s) => getBuyPlanBricks(s.code, month))
        .reduce((n, b) => n + getBuyPlanOptions(b.code, month).length, 0)
      expect(real, `${month} ${cat.code} declared ${cat.optionsCount}`).toBe(cat.optionsCount)
    }
  })

  it.each(months)('%s: every category actually carries options', (month) => {
    for (const cat of getBuyPlanCategories(month)) {
      expect(cat.optionsCount, `${month} ${cat.code} is empty`).toBeGreaterThan(0)
    }
  })
})

describe('BR-134 — every sale month is its own plan', () => {
  const months = getBuyPlanMonths().map((m) => m.saleMonth)

  const signature = (month: string) =>
    JSON.stringify(
      getBuyPlanCategories(month)
        .flatMap((c) => getBuyPlanSubcategories(c.code, month))
        .flatMap((s) => getBuyPlanBricks(s.code, month))
        .flatMap((b) => getBuyPlanOptions(b.code, month))
        .map((o) => `${o.code}:${o.sysBuyQty}:${o.status}`),
    )

  it('no two months return an identical option set', () => {
    for (let i = 0; i < months.length; i++) {
      for (let j = i + 1; j < months.length; j++) {
        expect(
          signature(months[i]!),
          `${months[i]} and ${months[j]} are the same plan`,
        ).not.toBe(signature(months[j]!))
      }
    }
  })
})

describe('BR-129 — Buying covers Fashion and Ultimate', () => {
  it('both grades are present in the fixture', () => {
    const grades = new Set(
      getBuyPlanCategories('2026-10')
        .flatMap((c) => getBuyPlanSubcategories(c.code, '2026-10'))
        .flatMap((s) => getBuyPlanBricks(s.code, '2026-10'))
        .flatMap((b) => getBuyPlanOptions(b.code, '2026-10'))
        .map((o) => o.segment),
    )
    expect(grades).toContain('Fashion')
    expect(grades).toContain('Ultimate')
  })
})
