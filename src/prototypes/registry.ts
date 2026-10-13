import { lazy } from 'react'
import type { ComponentType } from 'react'

export interface PrototypeEntry {
  name: string
  title: string
  description: string
  author: string
  date: string
  component: React.LazyExoticComponent<ComponentType>
}

export const prototypes: PrototypeEntry[] = [
  {
    name: 'ra-detail-redesign',
    title: 'RA Attribute Variants Redesign',
    description: 'Buyer workspace: inline editing, performance signals, color/store detail panel, budget guardrails.',
    author: 'Product',
    date: '2026-09-10',
    component: lazy(() => import('./ra-detail-redesign/Page')),
  },
  {
    name: 'example',
    title: 'Example Prototype',
    description: 'Starter prototype demonstrating UI components, Tailwind, and mock data.',
    author: 'Engineering',
    date: '2026-04-17',
    component: lazy(() => import('./_example/Page')),
  },
]
