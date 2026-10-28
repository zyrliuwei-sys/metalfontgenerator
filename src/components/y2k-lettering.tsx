import { useId, type Ref } from 'react';

import { layoutY2kGlyphs } from '@/lib/y2k-glyphs';
import { Y2K_PALETTES, type Y2kTextSettings } from '@/lib/y2k-text';

type Y2kLetteringProps = {
  settings: Y2kTextSettings;
  label: string;
  className?: string;
  framing?: 'artwork' | 'stage';
  ref?: Ref<SVGSVGElement>;
};

/** The displayed SVG is also the source for the transparent PNG export. */
export function Y2kLettering({
  settings,
  label,
  className,
  framing = 'artwork',
  ref,
}: Y2kLetteringProps) {
  const id = `chrome-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { text, finish, depth, tracking, slant, typeface, light } = settings;
  const palette = Y2K_PALETTES[finish];
  const letters = text.trim() || 'FUTURE';
  const layout = layoutY2kGlyphs(letters, tracking);
  const scale = Math.min(3.15, 1020 / layout.width);
  const shapeTransform = `scale(${scale} ${scale * 1.04}) translate(${-layout.width / 2} -40)`;
  const lightShift = (light - 50) / 200;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      viewBox={framing === 'stage' ? '0 135 1200 330' : '0 0 1200 600'}
      preserveAspectRatio="xMidYMid meet"
      width="2400"
      height="1200"
      role="img"
      aria-label={label}
      className={className}
      data-y2k-lettering=""
      data-typeface={typeface}
    >
      <title>{label}</title>
      <defs>
        <g
          id={`${id}-letters`}
          fillRule="evenodd"
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {typeface === 'vector' ? (
            layout.glyphs.map((glyph, index) =>
              glyph.path ? (
                <path
                  key={index}
                  d={glyph.path}
                  transform={`translate(${glyph.x} 0)`}
                />
              ) : glyph.letter !== ' ' ? (
                <text
                  key={index}
                  x={glyph.x}
                  y="78"
                  fontSize="106"
                  fontFamily="IBM Plex Sans Variable, sans-serif"
                  fontWeight="700"
                >
                  {glyph.letter}
                </text>
              ) : null
            )
          ) : (
            <text
              x="0"
              y="78"
              fontSize="106"
              fontFamily="IBM Plex Sans Variable, sans-serif"
              fontWeight="700"
              textLength={layout.width}
              lengthAdjust="spacingAndGlyphs"
              letterSpacing={tracking}
            >
              {letters}
            </text>
          )}
        </g>
        <linearGradient
          id={`${id}-face`}
          x1={lightShift}
          y1="0"
          x2={0.18 + lightShift}
          y2="1"
        >
          {palette.face.map((color, index) => (
            <stop
              key={index}
              offset={[0, 0.18, 0.39, 0.47, 0.49, 0.51, 0.67, 0.87, 1][index]}
              stopColor={color}
            />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="0.7" y2="1">
          <stop stopColor={palette.sideLight} />
          <stop offset="0.42" stopColor={palette.side} />
          <stop offset="1" stopColor={palette.sideLight} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor={palette.edge} stopOpacity="0" />
          <stop
            offset={Math.max(0.06, light / 100 - 0.12)}
            stopColor={palette.edge}
            stopOpacity="0"
          />
          <stop
            offset={Math.max(0.07, Math.min(0.93, light / 100))}
            stopColor={palette.edge}
            stopOpacity="0.5"
          />
          <stop
            offset={Math.min(0.98, light / 100 + 0.12)}
            stopColor={palette.edge}
            stopOpacity="0"
          />
          <stop offset="1" stopColor={palette.edge} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g
        transform={`translate(${600 + depth * 0.3} ${300 - depth * 0.3}) skewX(${-slant})`}
      >
        {Array.from({ length: depth }, (_, index) => depth - index).map(
          (step) => (
            <use
              key={step}
              href={`#${id}-letters`}
              transform={`translate(${-step * 0.65} ${step * 0.8}) ${shapeTransform}`}
              fill={`url(#${id}-side)`}
              stroke={palette.side}
              strokeWidth="0.3"
              aria-hidden="true"
            />
          )
        )}
        <use
          href={`#${id}-letters`}
          transform={shapeTransform}
          fill={`url(#${id}-face)`}
          stroke={palette.edge}
          strokeWidth="0.7"
          aria-hidden="true"
        />
        <use
          href={`#${id}-letters`}
          fill="none"
          stroke={palette.edge}
          strokeWidth="0.2"
          opacity="0.85"
          transform={`translate(0 -0.9) ${shapeTransform}`}
          aria-hidden="true"
        />
        <use
          href={`#${id}-letters`}
          transform={shapeTransform}
          fill={`url(#${id}-sheen)`}
          aria-hidden="true"
        />
      </g>
    </svg>
  );
}
