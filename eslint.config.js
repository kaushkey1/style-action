import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { defineConfig, globalIgnores } from "eslint/config";

// ── Inline plugin: compound component enforcement (Layer 4, Phase 4) ──
// These rules nudge developers toward compound components for known
// inline layout patterns. Warnings, not errors — high false-positive
// rate on some patterns. Separate plugin so they can use 'warn' severity
// independently of the 'error'-level no-restricted-syntax rules.
const designSystemPlugin = {
  meta: { name: "eslint-plugin-design-system" },
  rules: {
    "prefer-empty-state": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Suggest <EmptyState> for p-8 text-center patterns",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== "className") return;
            const value = node.value;
            if (
              !value ||
              value.type !== "Literal" ||
              typeof value.value !== "string"
            )
              return;
            if (
              /\bp-8\b/.test(value.value) &&
              /\btext-center\b/.test(value.value)
            ) {
              context.report({
                node,
                message:
                  "Use <EmptyState> for centered empty/completion messages. See @/components/ui.",
              });
            }
          },
        };
      },
    },
    "prefer-section-header": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Suggest <SectionHeader> for flex justify-between heading patterns",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== "className") return;
            const value = node.value;
            if (
              !value ||
              value.type !== "Literal" ||
              typeof value.value !== "string"
            )
              return;
            const cls = value.value;
            // Only flag when all three layout classes appear together — the
            // canonical section header pattern. Still heuristic, but filters
            // out most non-header flex rows.
            if (
              /\bflex\b/.test(cls) &&
              /\bitems-center\b/.test(cls) &&
              /\bjustify-between\b/.test(cls)
            ) {
              // Reduce false positives: skip if it looks like a list row or
              // inline layout (contains gap-1/gap-2 or text-xs/text-sm hints)
              if (/\bgap-[12]\b/.test(cls) || /\btext-xs\b/.test(cls)) return;
              context.report({
                node,
                message:
                  "Consider using <SectionHeader> for section title + actions layout. See @/components/ui.",
              });
            }
          },
        };
      },
    },
    "prefer-metric-grid": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Suggest <MetricGrid> for grid-cols-3/4 metric layouts",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== "className") return;
            const value = node.value;
            if (
              !value ||
              value.type !== "Literal" ||
              typeof value.value !== "string"
            )
              return;
            if (
              /\bgrid\b/.test(value.value) &&
              /\bgrid-cols-[34]\b/.test(value.value)
            ) {
              context.report({
                node,
                message:
                  "Consider using <MetricGrid> for metric card layouts. See @/components/ui.",
              });
            }
          },
        };
      },
    },
  },
};

export default defineConfig([
  globalIgnores([
    "dist",
    "dev-dist",
    ".claude/worktrees",
    "storeops-frontend-app",
    "storeops-frontend-admin",
    "prototype",
    "coverage",
    "android",
    "ios",
    "src/prototypes",
    "src/modules/_design-lab",
  ]),

  // ── Base: TypeScript + React ────────────────────────────────────────
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // ── Accessibility: jsx-a11y recommended ─────────────────────────────
  // Enforces aria-label on icon-only interactive elements, alt text on
  // images, valid ARIA attributes, proper role usage, and more.
  {
    files: ["src/**/*.tsx"],
    ...jsxA11y.flatConfigs.recommended,
  },

  // ── Design System enforcement ───────────────────────────────────────
  // These rules apply to ALL src files EXCEPT the ui/ primitives.
  // The goal: every screen uses the same components, tokens, and patterns.
  //
  // Raw HTML bans are ERROR — these are hard design consistency violations.
  // Inline style ban is also ERROR — use eslint-disable with justification
  // for legitimate dynamic values (progress bar widths, chart dimensions).
  //
  // Banned Tailwind class rules enforce design tokens — no oversized
  // radii, no excessive padding, no low-contrast text colors.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // ── Raw HTML bans ───────────────────────────────────────────
        {
          selector: "JSXOpeningElement[name.name='input']",
          message:
            "Use <Input> from @/components/ui instead of raw <input>. The Input component handles consistent styling, focus rings, icons, labels, and error states.",
        },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message:
            "Use <Select> from @/components/ui instead of raw <select>. The Select component uses Radix primitives for consistent, accessible dropdowns.",
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message:
            "Use a shared Textarea component from @/components/ui instead of raw <textarea>.",
        },
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            "Prefer Tailwind utilities over inline style={{}}. Inline styles bypass the design system. If dynamic values are needed (e.g., width percentages, chart dimensions), add eslint-disable-next-line with justification.",
        },
        {
          selector:
            "JSXOpeningElement[name.name='SelectItem'] JSXAttribute[name.name='value'][value.value='']",
          message:
            'SelectItem value="" is invalid in Radix UI — empty string is reserved for clearing the selection. Use a sentinel like value="__all__" and map it back to null in onValueChange.',
        },
        // ── Banned Tailwind classes (Layer 4, Phase 1) ──────────────
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\brounded-(xl|2xl|3xl)\\b/]',
          message:
            "Use rounded-lg instead of rounded-xl/2xl/3xl. See design system: standard radius is rounded-lg.",
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\bp-(5|6|7|8)\\b/]',
          message:
            "Use p-3 or p-4 for card padding. p-8 is only allowed in EmptyState (src/components/ui/). p-6 is only allowed in app shell layouts.",
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\btext-gray-(200|300)\\b/]',
          message:
            "Use text-gray-400 minimum for decorative elements, text-gray-500 for readable text. text-gray-200/300 fails WCAG contrast requirements.",
        },
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\btext-indigo-[0-9]+\\b/]',
          message:
            "Use neutral text colors (text-gray-700/900) instead of text-indigo-*. Indigo text is reserved for interactive UI primitives in src/components/ui/. See ux-patterns.md §16.",
        },
      ],

      // ── Enforce barrel imports ──────────────────────────────────────
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*"],
              message:
                "Import from '@/components/ui' (barrel) instead of individual files like '@/components/ui/Button'.",
            },
            {
              group: ["@/prototypes/*", "@/prototypes/**"],
              message:
                "Production code must NEVER import from prototypes. Prototypes are sandbox-only.",
            },
          ],
        },
      ],
    },
  },

  // ── Compound component enforcement (Layer 4, Phase 4) ───────────────
  // These are WARNINGS — heuristic rules that flag inline layout patterns
  // which should use compound components. Higher false-positive rate than
  // the banned-class rules above; intended as nudges, not hard blocks.
  //
  // Uses a local inline plugin so compound rules can be 'warn' while
  // the no-restricted-syntax rules above remain 'error'.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    plugins: { "design-system": designSystemPlugin },
    rules: {
      "design-system/prefer-empty-state": "warn",
      "design-system/prefer-section-header": "warn",
      "design-system/prefer-metric-grid": "warn",
    },
  },
]);
