import React, { useId } from 'react';

/* Ported verbatim from the validated HTML prototype (Cortex/Buying/react-prototype/
   src/garments.jsx). Replaces the picsum.photos fixture images: real garment
   silhouettes, drawn inline, no network request. */

export interface GarmentOption {
  hexCode?: string;
  colorName?: string;
  class_name?: string;
  className?: string;
  family?: string;
  description?: string;
  pattern?: string;
  code?: string;
}

/* ---------------------------------------------------------------------------
   Product illustrations.
   Each garment is a real silhouette with form shading, seam detail, fabric
   folds and an optional weave/stripe/print overlay — not a flat colour block.
   --------------------------------------------------------------------------- */

function hex2rgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('');
function shade(hex: string, amt: number): string {
  const [r, g, b] = hex2rgb(hex);
  return amt >= 0
    ? toHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt)
    : toHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
function luminance(hex: string): number {
  const [r, g, b] = hex2rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/* Which silhouette to draw, from the option's class / family. */
type GarmentKind = 'tee' | 'vneck' | 'polo' | 'shirt' | 'kurta' | 'denim' | 'chino' | 'shorts' | 'track';

function garmentType(o: GarmentOption): GarmentKind {
  const c = (o.class_name || '').toLowerCase();
  const f = (o.family || '').toLowerCase();
  const d = (o.description || '').toLowerCase();
  const s = c + ' ' + f + ' ' + d;
  if (s.includes('polo')) return 'polo';
  if (s.includes('v-neck')) return 'vneck';
  if (s.includes('formal shirt') || s.includes('shirt') && !s.includes('t-shirt')) return 'shirt';
  if (s.includes('kurta')) return 'kurta';
  if (s.includes('denim') || s.includes('jean')) return 'denim';
  if (s.includes('chino')) return 'chino';
  if (s.includes('short')) return 'shorts';
  if (s.includes('training') || s.includes('sportswear')) return 'track';
  if (s.includes('bottom')) return 'chino';
  return 'tee';
}

/* --- silhouette path data on a 120 x 150 canvas ---
   `hem` drives where the contact shadow sits, so a long kurta and a short
   pair of shorts each get a shadow at the right place. */
const BODY = {
  tee:   'M40 21 L26 27 L11 46 L23 59 L34 49 L34 128 L86 128 L86 49 L97 59 L109 46 L94 27 L80 21 C73 35 47 35 40 21 Z',
  vneck: 'M40 21 L26 27 L11 46 L23 59 L34 49 L34 128 L86 128 L86 49 L97 59 L109 46 L94 27 L80 21 L60 45 Z',
  polo:  'M40 21 L26 27 L11 46 L23 59 L34 49 L34 128 L86 128 L86 49 L97 59 L109 46 L94 27 L80 21 C73 33 47 33 40 21 Z',
  shirt: 'M41 20 L25 26 L12 48 L24 61 L34 51 L34 131 L86 131 L86 51 L96 61 L108 48 L95 26 L79 20 L60 34 Z',
  // Tunic: narrower through the body and dropping almost to the hem line.
  kurta: 'M42 18 L29 24 L16 46 L27 57 L37 48 L36 145 L84 145 L83 48 L93 57 L104 46 L91 24 L78 18 C73 28 47 28 42 18 Z',
  denim: 'M31 18 L89 18 L93 58 L88 143 L66 143 L60 76 L54 143 L32 143 L27 58 Z',
  chino: 'M33 18 L87 18 L91 57 L86 142 L67 142 L60 75 L53 142 L34 142 L29 57 Z',
  shorts:'M31 21 L89 21 L92 55 L88 99 L66 99 L60 63 L54 99 L32 99 L28 55 Z',
  track: 'M33 18 L87 18 L91 57 L86 142 L67 142 L60 75 L53 142 L34 142 L29 57 Z',
};
const HEM = { tee: 130, vneck: 130, polo: 130, shirt: 133, kurta: 147,
  denim: 145, chino: 144, shorts: 101, track: 144 };

/* Seam / construction detail per garment, drawn in a darker tone. */
function Detail({ type, line, dark }: { type: GarmentKind; line: string; dark: string }) {
  const st: React.SVGProps<SVGPathElement> = {
    stroke: line, strokeWidth: 1.1, fill: 'none', strokeLinecap: 'round', opacity: 0.55,
  };
  switch (type) {
    case 'tee':
      return (<>
        <path d="M40 21 C47 35 73 35 80 21" {...st} />
        <path d="M43 25 C48 37 72 37 77 25" {...st} strokeWidth={2} opacity={0.4} />
        <path d="M34 49 L34 128 M86 49 L86 128" {...st} opacity={0.22} />
        <path d="M23 59 L34 49 M97 59 L86 49" {...st} opacity={0.3} />
      </>);
    case 'vneck':
      return (<>
        <path d="M40 21 L60 45 L80 21" {...st} />
        <path d="M44 24 L60 41 L76 24" {...st} strokeWidth={2} opacity={0.4} />
        <path d="M23 59 L34 49 M97 59 L86 49" {...st} opacity={0.3} />
      </>);
    case 'polo':
      return (<>
        <path d="M48 26 L60 41 L72 26" {...st} strokeWidth={1.3} />
        <path d="M48 26 L41 22 L52 44 L60 41 Z" fill={dark} opacity={0.3} stroke={line} strokeWidth={0.9} />
        <path d="M72 26 L79 22 L68 44 L60 41 Z" fill={dark} opacity={0.3} stroke={line} strokeWidth={0.9} />
        <path d="M56 41 L56 66 M64 41 L64 66" {...st} opacity={0.5} />
        <circle cx="60" cy="48" r="1.6" fill={line} opacity={0.6} />
        <circle cx="60" cy="59" r="1.6" fill={line} opacity={0.6} />
        <path d="M23 59 L34 49 M97 59 L86 49" {...st} opacity={0.3} />
      </>);
    case 'shirt':
      return (<>
        <path d="M45 22 L60 34 L75 22" {...st} strokeWidth={1.3} />
        <path d="M45 22 L38 20 L53 41 L60 34 Z" fill={dark} opacity={0.32} stroke={line} strokeWidth={0.9} />
        <path d="M75 22 L82 20 L67 41 L60 34 Z" fill={dark} opacity={0.32} stroke={line} strokeWidth={0.9} />
        <path d="M60 34 L60 131" {...st} opacity={0.45} />
        <path d="M54 36 L54 131" {...st} opacity={0.25} />
        {[48, 64, 80, 96, 112].map((y) => <circle key={y} cx="60" cy={y} r="1.5" fill={line} opacity={0.62} />)}
        <rect x="71" y="52" width="15" height="17" rx="1.5" fill="none" stroke={line} strokeWidth={1} opacity={0.4} />
        <path d="M24 61 L34 51 M96 61 L86 51" {...st} opacity={0.3} />
        <path d="M17 54 L28 57 M103 54 L92 57" {...st} opacity={0.35} />
      </>);
    case 'kurta':
      return (<>
        <path d="M42 18 C47 28 73 28 78 18" {...st} />
        <rect x="47" y="15" width="26" height="7" rx="3" fill={dark} opacity={0.26} stroke={line} strokeWidth={0.9} />
        <path d="M60 24 L60 64" {...st} opacity={0.45} />
        {[34, 45, 56].map((y) => <circle key={y} cx="60" cy={y} r="1.4" fill={line} opacity={0.6} />)}
        <path d="M36 116 L36 145 M84 116 L84 145" {...st} opacity={0.4} />
      </>);
    case 'denim':
      return (<>
        <rect x="29" y="19" width="62" height="11" fill={dark} opacity={0.24} />
        <path d="M29 30 L91 30" {...st} strokeDasharray="3 2.5" opacity={0.6} />
        <path d="M60 30 L60 46" {...st} opacity={0.5} />
        <path d="M60 46 C57 52 58 62 60 74" {...st} strokeDasharray="3 2.5" opacity={0.55} />
        <path d="M35 33 L47 33 L44 45 Z" {...st} strokeDasharray="2.5 2" opacity={0.5} />
        <path d="M85 33 L73 33 L76 45 Z" {...st} strokeDasharray="2.5 2" opacity={0.5} />
        <path d="M33 80 L55 80 M87 80 L65 80" {...st} opacity={0.16} />
        {[34, 48, 72, 86].map((x) => <path key={x} d={`M${x} 19 L${x} 30`} {...st} opacity={0.4} />)}
      </>);
    case 'chino':
      return (<>
        <rect x="31" y="19" width="60" height="9" fill={dark} opacity={0.2} />
        <path d="M60 28 L60 44" {...st} opacity={0.45} />
        <path d="M60 44 C57 52 58 62 60 73" {...st} opacity={0.4} />
        <path d="M44 55 L44 140 M76 55 L76 140" {...st} opacity={0.18} />
      </>);
    case 'shorts':
      return (<>
        <rect x="29" y="21" width="62" height="9" rx="1" fill={dark} opacity={0.22} />
        <path d="M60 30 L60 44" {...st} opacity={0.45} />
        <path d="M60 44 C57 50 58 56 60 62" {...st} opacity={0.4} />
        <path d="M33 91 L54 91 M88 91 L66 91" {...st} opacity={0.3} strokeDasharray="3 2" />
      </>);
    case 'track':
      return (<>
        <rect x="31" y="19" width="60" height="10" rx="1" fill={dark} opacity={0.24} />
        <path d="M60 29 L60 45" {...st} opacity={0.4} />
        <path d="M40 30 L36 140 M80 30 L84 140" stroke={line} strokeWidth={3} fill="none"
          opacity={0.32} strokeLinecap="round" />
        <path d="M60 45 C57 53 58 63 60 73" {...st} opacity={0.35} />
      </>);
    default:
      return null;
  }
}

/* Stripe / print overlays, clipped to the garment body. */
function Pattern({ pattern, line }: { pattern?: string; line: string }) {
  const p = (pattern || '').toLowerCase();
  if (p === 'striped') {
    return (<g opacity={0.3}>
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x="0" y={24 + i * 9} width="120" height="4" fill={line} />
      ))}
    </g>);
  }
  if (p === 'printed') {
    return (<g opacity={0.26}>
      {Array.from({ length: 22 }, (_, i) => {
        const x = 20 + ((i * 37) % 80);
        const y = 30 + ((i * 53) % 95);
        return <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3.2 : 2} fill={line} />;
      })}
    </g>);
  }
  return null;
}

/**
 * A garment tile. `size` drives the frame; the artwork scales with it.
 */
export function Garment({ option, size = 'md', className = '' }:
  { option: GarmentOption; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const hex = option.hexCode || '#8A8F98';
  const type = garmentType(option);
  const light = luminance(hex) > 0.72;

  const top = shade(hex, light ? 0.1 : 0.2);
  const bot = shade(hex, -0.24);
  const line = shade(hex, light ? -0.42 : -0.5);
  const dark = shade(hex, -0.3);
  const body = BODY[type] || BODY.tee;

  const dims = { xs: 34, sm: 46, md: 68, lg: 104, xl: 150 }[size] || 68;

  return (
    <div
      className={'shrink-0 ' + className}
      // eslint-disable-next-line no-restricted-syntax -- tile scales with the `size` prop
      style={{ width: dims, height: dims * 1.2 }}
    >
      <svg viewBox="0 0 120 150" width="100%" height="100%" role="img"
        aria-label={`${option.class_name || 'Option'} in ${option.colorName || ''}`}>
        <defs>
          <linearGradient id={`g${uid}`} x1="0.18" y1="0" x2="0.86" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="46%" stopColor={hex} />
            <stop offset="100%" stopColor={bot} />
          </linearGradient>
          <clipPath id={`c${uid}`}><path d={body} /></clipPath>
          <filter id={`s${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#101828" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* soft contact shadow, sitting just under this garment's hem */}
        <ellipse cx="60" cy={(HEM[type] || 130) + 4} rx={type === 'kurta' ? 24 : 29} ry="4"
          fill="#101828" opacity="0.12" />

        <g filter={`url(#s${uid})`}>
          <path d={body} fill={`url(#g${uid})`} />
          <g clipPath={`url(#c${uid})`}>
            <Pattern pattern={option.pattern} line={line} />
            {/* fabric fold shading */}
            <path d="M34 40 C44 78 40 116 34 150 L16 150 L16 34 Z" fill={dark} opacity="0.16" />
            <path d="M86 40 C76 78 80 116 86 150 L106 150 L106 34 Z" fill={dark} opacity="0.1" />
            {/* sheen */}
            <path d="M44 22 C40 62 44 104 40 150 L58 150 C56 104 54 62 58 22 Z"
              fill="#fff" opacity={light ? 0.16 : 0.09} />
          </g>
          <path d={body} fill="none" stroke={line} strokeWidth="1.15" opacity="0.5" />
          <Detail type={type} line={line} dark={dark} />
        </g>
      </svg>
    </div>
  );
}

/** Small colour chip used next to option names. */
export function Swatch({ hex, title }: { hex: string; title?: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full border border-gray-200 shrink-0"
      // eslint-disable-next-line no-restricted-syntax -- the colour is option data, not a design token
      style={{ background: hex }}
      title={title}
    />
  );
}
