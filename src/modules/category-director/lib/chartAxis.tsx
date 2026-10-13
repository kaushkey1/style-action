import { CHART_AXIS_TICK } from '@/data/chartColors';

/**
 * Left-aligned YAxis tick for vertical bar charts. All labels start at the
 * left edge of the YAxis band (no wasted gutter), single line, ellipsis
 * truncation if longer than `maxChars`, full label on hover via SVG <title>.
 *
 * `axisWidth` is the YAxis band width — Recharts gives `x` as the right edge,
 * so we offset by -(axisWidth - LEFT_GUTTER) to render from the left edge.
 *
 * Used today by the "Revenue by Category" chart on the Category Performance
 * tab and the "Aged Stock by Grade" chart on the Inventory & Lifecycle tab.
 */
const LABEL_LEFT_GUTTER = 4;

interface SingleLineTickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  fontSize: number;
  maxChars: number;
  axisWidth: number;
}

export function SingleLineTick({
  x = 0,
  y = 0,
  payload,
  fontSize,
  maxChars,
  axisWidth,
}: SingleLineTickProps) {
  const value = payload?.value ?? '';
  const truncated = value.length > maxChars;
  const display = truncated ? `${value.slice(0, Math.max(0, maxChars - 1))}…` : value;
  const cx = typeof x === 'number' ? x : Number(x);
  const cy = typeof y === 'number' ? y : Number(y);
  return (
    <g transform={`translate(${cx},${cy})`}>
      <text
        x={-axisWidth + LABEL_LEFT_GUTTER}
        y={0}
        dy={4}
        textAnchor="start"
        fill={CHART_AXIS_TICK}
        fontSize={fontSize}
      >
        {display}
        {truncated && <title>{value}</title>}
      </text>
    </g>
  );
}

// `computeAxisWidth` lives in apiAdapters.ts (non-component helpers must be in
// their own file for react-refresh).
