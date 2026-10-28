import { useRef, useState, type PointerEvent } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  MoveHorizontal,
  RotateCcw,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  Y2K_DEFAULTS,
  Y2K_EXAMPLES,
  type Y2kFinish,
  type Y2kTextSettings,
} from '@/lib/y2k-text';
import { m } from '@/paraglide/messages.js';
import { Footer, Header } from '@/blocks/metal-font-studio';
import { Y2kLettering } from '@/components/y2k-lettering';

import '@/styles/y2k.css';

export function Y2kFontMaker() {
  const [settings, setSettings] = useState<Y2kTextSettings>({
    ...Y2K_DEFAULTS,
  });
  const [background, setBackground] = useState('dark');
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [unsupported, setUnsupported] = useState(false);
  const [dragging, setDragging] = useState(false);
  const artworkRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef(false);
  const finishes: { id: Y2kFinish; label: string; short: string }[] = [
    {
      id: 'silver',
      label: m['y2k.finish.silver'](),
      short: m['y2k.finish.silver_short'](),
    },
    {
      id: 'ice',
      label: m['y2k.finish.ice'](),
      short: m['y2k.finish.ice_short'](),
    },
    {
      id: 'pink',
      label: m['y2k.finish.pink'](),
      short: m['y2k.finish.pink_short'](),
    },
  ];
  const activeFinish = finishes.find(
    (finish) => finish.id === settings.finish
  )!;
  const update = (patch: Partial<Y2kTextSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
    setExportStatus('idle');
  };
  const reset = () => {
    setSettings({ ...Y2K_DEFAULTS });
    setExportStatus('idle');
    setUnsupported(false);
  };
  const moveLight = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    update({
      light: Math.round(
        Math.min(
          90,
          Math.max(10, ((event.clientX - bounds.left) / bounds.width) * 100)
        )
      ),
    });
  };
  const useExample = (example: Y2kTextSettings) => {
    setSettings({ ...example });
    setExportStatus('idle');
    setUnsupported(false);
    document.getElementById('y2k-studio')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
    inputRef.current?.focus({ preventScroll: true });
  };
  const download = async () => {
    if (!artworkRef.current || !settings.text.trim() || exporting) return;
    setExporting(true);
    setExportStatus('idle');
    try {
      const { exportY2kPng } = await import('@/lib/y2k-export');
      await exportY2kPng(artworkRef.current, settings.text);
      setExportStatus('success');
    } catch {
      setExportStatus('error');
    } finally {
      setExporting(false);
    }
  };
  const chapters = [
    {
      id: 'what-is-y2k',
      title: m['y2k.guide.what.title'](),
      nav: m['y2k.index.what'](),
      body: m['y2k.guide.what.body'](),
    },
    {
      id: 'chrome-finishes',
      title: m['y2k.guide.finishes.title'](),
      nav: m['y2k.index.finishes'](),
      body: m['y2k.guide.finishes.body'](),
    },
    {
      id: 'readable-lettering',
      title: m['y2k.guide.readable.title'](),
      nav: m['y2k.index.readable'](),
      body: m['y2k.guide.readable.body'](),
    },
    {
      id: 'y2k-layout',
      title: m['y2k.guide.layout.title'](),
      nav: m['y2k.index.layout'](),
      body: m['y2k.guide.layout.body'](),
    },
    {
      id: 'y2k-design-ideas',
      title: m['y2k.guide.uses.title'](),
      nav: m['y2k.index.uses'](),
      body: m['y2k.guide.uses.body'](),
    },
    {
      id: 'copy-and-paste',
      title: m['y2k.guide.copy.title'](),
      nav: m['y2k.index.copy'](),
      body: m['y2k.guide.copy.body'](),
    },
    {
      id: 'transparent-png',
      title: m['y2k.guide.export.title'](),
      nav: m['y2k.index.export'](),
      body: m['y2k.guide.export.body'](),
    },
  ];
  const questions = [
    { question: m['y2k.faq.q1'](), answer: m['y2k.faq.a1']() },
    { question: m['y2k.faq.q2'](), answer: m['y2k.faq.a2']() },
    { question: m['y2k.faq.q3'](), answer: m['y2k.faq.a3']() },
    { question: m['y2k.faq.q4'](), answer: m['y2k.faq.a4']() },
    { question: m['y2k.faq.q5'](), answer: m['y2k.faq.a5']() },
  ];
  const controls = [
    { key: 'depth', label: m['y2k.studio.depth'](), min: 0, max: 28, unit: '' },
    {
      key: 'tracking',
      label: m['y2k.studio.tracking'](),
      min: 0,
      max: 12,
      unit: '',
    },
    {
      key: 'slant',
      label: m['y2k.studio.slant'](),
      min: 0,
      max: 18,
      unit: '°',
    },
    {
      key: 'light',
      label: m['y2k.studio.light_control'](),
      min: 10,
      max: 90,
      unit: '%',
    },
  ] as const;

  return (
    <div className="metal-app y2k-page">
      <a href="#y2k-main" className="y2k-skip">
        {m['y2k.skip']()}
      </a>
      <Header />
      <main id="y2k-main">
        <div className="y2k-container">
          <section className="y2k-hero" aria-labelledby="y2k-title">
            <div className="y2k-hero-heading">
              <p className="y2k-product-label">{m['y2k.hero.tag']()}</p>
              <h1 id="y2k-title">
                Y2K <span>Font Maker</span>
                <ArrowUpRight className="y2k-title-dot" aria-hidden="true" />
              </h1>
            </div>
            <div className="y2k-hero-copy">
              <p>{m['y2k.hero.description']()}</p>
              <a href="#y2k-looks" className="y2k-text-link">
                {m['y2k.hero.secondary']()}
                <ArrowDownRight size={18} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section
            className="y2k-studio"
            id="y2k-studio"
            aria-label={m['y2k.studio.label']()}
          >
            <div
              className="y2k-preview"
              data-background={background}
              data-dragging={dragging}
            >
              <div className="y2k-specimen-meta">
                <span>
                  {settings.typeface === 'vector'
                    ? 'VECTOR 2000'
                    : 'CLASSIC GROTESK'}{' '}
                  <span className="y2k-meta-separator">/</span>{' '}
                  <span className="y2k-finish-full">{activeFinish.label}</span>
                  <span className="y2k-finish-short">{activeFinish.short}</span>
                </span>
                <span className="y2k-live">
                  <span aria-hidden="true" />
                  {m['y2k.studio.live']()}
                </span>
              </div>
              <div
                className="y2k-light-surface"
                role="group"
                aria-label={m['y2k.studio.light_control']()}
                aria-describedby="y2k-light-hint"
                onPointerDown={(event) => {
                  if (event.pointerType === 'mouse' && event.button !== 0)
                    return;
                  dragRef.current = true;
                  setDragging(true);
                  event.currentTarget.setPointerCapture(event.pointerId);
                  moveLight(event);
                }}
                onPointerMove={(event) => {
                  if (dragRef.current) moveLight(event);
                }}
                onPointerUp={() => {
                  dragRef.current = false;
                  setDragging(false);
                }}
                onPointerCancel={() => {
                  dragRef.current = false;
                  setDragging(false);
                }}
                onLostPointerCapture={() => {
                  dragRef.current = false;
                  setDragging(false);
                }}
              >
                <div
                  className="y2k-crosshair y2k-crosshair-top"
                  aria-hidden="true"
                />
                <div
                  className="y2k-crosshair y2k-crosshair-bottom"
                  aria-hidden="true"
                />
                <Y2kLettering
                  ref={artworkRef}
                  framing="stage"
                  settings={settings}
                  label={m['y2k.studio.preview']({
                    text: settings.text.trim() || 'FUTURE',
                    finish: activeFinish.label,
                  })}
                  className="y2k-preview-art"
                />
              </div>
              <div className="y2k-canvas-bottom">
                <span id="y2k-light-hint">
                  <MoveHorizontal size={16} aria-hidden="true" />
                  {m['y2k.studio.drag']()}
                </span>
                <div
                  className="y2k-backgrounds"
                  role="group"
                  aria-label={m['y2k.studio.background']()}
                >
                  {[
                    { id: 'dark', label: m['y2k.studio.dark']() },
                    { id: 'light', label: m['y2k.studio.light']() },
                    { id: 'transparent', label: m['y2k.studio.transparent']() },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setBackground(item.id)}
                      aria-label={item.label}
                      title={item.label}
                      aria-pressed={background === item.id}
                      data-background={item.id}
                    >
                      <span>
                        {background === item.id ? (
                          <Check size={12} aria-hidden="true" />
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="y2k-control-dock">
              <div className="y2k-field">
                <label htmlFor="y2k-text">
                  {m['y2k.studio.text']()}
                  <span>{settings.text.length}/24</span>
                </label>
                <div className="y2k-input-wrap">
                  <input
                    ref={inputRef}
                    id="y2k-text"
                    value={settings.text}
                    maxLength={24}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="FUTURE"
                    aria-describedby="y2k-text-hint"
                    onChange={(event) => {
                      const value = event.target.value.toUpperCase();
                      const cleaned = value
                        .replace(/[^\x20-\x7e]/g, '')
                        .slice(0, 24);
                      setUnsupported(cleaned !== value);
                      update({ text: cleaned });
                    }}
                  />
                  <span aria-hidden="true" className="y2k-input-caret">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
              </div>
              <fieldset className="y2k-finishes">
                <legend>{m['y2k.studio.finish']()}</legend>
                <div>
                  {finishes.map((finish) => (
                    <button
                      type="button"
                      key={finish.id}
                      onClick={() => update({ finish: finish.id })}
                      aria-pressed={settings.finish === finish.id}
                      aria-label={finish.label}
                    >
                      <span
                        className="y2k-swatch"
                        data-finish={finish.id}
                        aria-hidden="true"
                      >
                        {settings.finish === finish.id ? (
                          <Check size={12} />
                        ) : null}
                      </span>
                      <span className="y2k-finish-full">{finish.label}</span>
                      <span className="y2k-finish-short">{finish.short}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="y2k-export-actions">
                <button
                  type="button"
                  className="y2k-download"
                  disabled={exporting || !settings.text.trim()}
                  onClick={download}
                  aria-busy={exporting}
                  data-state={exportStatus}
                >
                  {exportStatus === 'success' ? (
                    <Check size={18} aria-hidden="true" />
                  ) : exportStatus === 'error' ? (
                    <AlertCircle size={18} aria-hidden="true" />
                  ) : (
                    <Download size={18} aria-hidden="true" />
                  )}
                  {exporting
                    ? m['y2k.studio.exporting']()
                    : m['y2k.studio.download']()}
                </button>
                <p>{m['y2k.studio.format_short']()}</p>
              </div>
            </div>
            <div className="y2k-control-notes">
              <p id="y2k-text-hint">
                {unsupported ? (
                  <>
                    <AlertCircle size={14} aria-hidden="true" />
                    {m['y2k.studio.unsupported']()}
                  </>
                ) : (
                  m['y2k.studio.hint']()
                )}
              </p>
              <p className="y2k-export-status" role="status" aria-live="polite">
                {exportStatus === 'error'
                  ? m['y2k.studio.error']()
                  : exportStatus === 'success'
                    ? m['y2k.studio.downloaded']()
                    : !settings.text.trim()
                      ? m['y2k.studio.empty']()
                      : m['y2k.studio.background_note']()}
              </p>
            </div>
            <details className="y2k-tuning">
              <summary>
                <span>{m['y2k.studio.tuning']()}</span>
                <span className="y2k-tuning-values">
                  {m['y2k.studio.depth']()} {settings.depth}{' '}
                  <span aria-hidden="true">/</span> {m['y2k.studio.slant']()}{' '}
                  {settings.slant}°
                </span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div className="y2k-tuning-body">
                <fieldset className="y2k-typeface">
                  <legend>{m['y2k.studio.typeface']()}</legend>
                  <div>
                    {[
                      { id: 'vector' as const, label: 'Vector 2000' },
                      {
                        id: 'classic' as const,
                        label: m['y2k.studio.classic'](),
                      },
                    ].map((face) => (
                      <button
                        key={face.id}
                        type="button"
                        aria-pressed={settings.typeface === face.id}
                        onClick={() => update({ typeface: face.id })}
                      >
                        {face.label}
                        {settings.typeface === face.id ? (
                          <Check size={13} aria-hidden="true" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="y2k-range-grid">
                  {controls.map((control) => (
                    <label className="y2k-range" key={control.key}>
                      <span>
                        {control.label}
                        <output>
                          {settings[control.key]}
                          {control.unit}
                        </output>
                      </span>
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        value={settings[control.key]}
                        onChange={(event) =>
                          update({ [control.key]: Number(event.target.value) })
                        }
                      />
                    </label>
                  ))}
                </div>
                <button type="button" className="y2k-reset" onClick={reset}>
                  <RotateCcw size={15} aria-hidden="true" />
                  {m['y2k.studio.reset']()}
                </button>
              </div>
            </details>
          </section>

          <section
            className="y2k-looks y2k-section"
            id="y2k-looks"
            aria-labelledby="y2k-looks-title"
          >
            <div className="y2k-section-heading">
              <h2 id="y2k-looks-title">{m['y2k.looks.title']()}</h2>
              <p>{m['y2k.looks.intro']()}</p>
            </div>
            <div className="y2k-look-grid">
              {Y2K_EXAMPLES.map((example, index) => (
                <button
                  type="button"
                  key={example.finish}
                  className="y2k-look"
                  data-finish={example.finish}
                  onClick={() => useExample(example)}
                  aria-label={m['y2k.looks.action']({ name: example.text })}
                >
                  <div className="y2k-look-topline">
                    <span>{finishes[index].label}</span>
                    <ArrowUpRight size={22} aria-hidden="true" />
                  </div>
                  {index === 0 ? (
                    <div className="y2k-disc" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                  {index === 1 ? (
                    <div className="y2k-poster-grid" aria-hidden="true" />
                  ) : null}
                  {index === 2 ? (
                    <div className="y2k-poster-orbit" aria-hidden="true" />
                  ) : null}
                  <Y2kLettering
                    settings={example}
                    label={m['y2k.studio.preview']({
                      text: example.text,
                      finish: finishes[index].label,
                    })}
                    className="y2k-look-art"
                  />
                  <div className="y2k-look-caption">
                    <span>
                      {
                        [
                          m['y2k.looks.silver'](),
                          m['y2k.looks.ice'](),
                          m['y2k.looks.pink'](),
                        ][index]
                      }
                    </span>
                    <span>
                      {m['y2k.looks.use']()}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="y2k-gallery-note">{m['y2k.looks.note']()}</p>
          </section>

          <section
            className="y2k-steps y2k-section"
            aria-labelledby="y2k-steps-title"
            data-y2k-editorial=""
          >
            <h2 id="y2k-steps-title">{m['y2k.steps.title']()}</h2>
            <ol>
              {[
                {
                  title: m['y2k.steps.one.title'](),
                  body: m['y2k.steps.one.body'](),
                },
                {
                  title: m['y2k.steps.two.title'](),
                  body: m['y2k.steps.two.body'](),
                },
                {
                  title: m['y2k.steps.three.title'](),
                  body: m['y2k.steps.three.body'](),
                },
              ].map((step, index) => (
                <li key={step.title}>
                  <span className="y2k-step-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="y2k-guide y2k-section"
            aria-labelledby="y2k-guide-title"
            data-y2k-editorial=""
          >
            <div className="y2k-guide-heading">
              <h2 id="y2k-guide-title">{m['y2k.guide.title']()}</h2>
              <nav
                className="y2k-guide-index"
                aria-label={m['y2k.index.label']()}
              >
                {chapters.map((chapter) => (
                  <a key={chapter.id} href={'#' + chapter.id}>
                    {chapter.nav}
                    <ArrowDownRight size={13} aria-hidden="true" />
                  </a>
                ))}
              </nav>
            </div>
            <div className="y2k-guide-copy">
              <p className="y2k-guide-intro">{m['y2k.guide.intro']()}</p>
              {chapters.map((chapter) => (
                <article key={chapter.id} id={chapter.id}>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            className="y2k-faq y2k-section"
            aria-labelledby="y2k-faq-title"
            data-y2k-editorial=""
          >
            <h2 id="y2k-faq-title">{m['y2k.faq.title']()}</h2>
            <div className="y2k-faq-list">
              {questions.map((item) => (
                <details key={item.question}>
                  <summary>
                    <h3>{item.question}</h3>
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
          <section
            className="y2k-related y2k-section"
            aria-labelledby="y2k-related-title"
          >
            <h2 id="y2k-related-title">{m['y2k.related.title']()}</h2>
            <div>
              <Link href="/">
                <span>Metal Font Generator</span>
                <p>{m['y2k.related.home']()}</p>
                <ArrowUpRight size={22} aria-hidden="true" />
              </Link>
              <Link href="/heavy-metal-font-generator">
                <span>Heavy Metal Font Generator</span>
                <p>{m['y2k.related.heavy']()}</p>
                <ArrowUpRight size={22} aria-hidden="true" />
              </Link>
            </div>
          </section>
          <section
            className="y2k-closing"
            aria-label={m['y2k.closing.title']()}
          >
            <p>{m['y2k.closing.title']()}</p>
            <a href="#y2k-studio">
              {m['y2k.closing.cta']()}
              <ArrowUpRight size={22} aria-hidden="true" />
            </a>
            <span className="y2k-colophon">
              VECTOR 2000 — ABCDEFGHIJKLMNOPQRSTUVWXYZ / 0123456789
            </span>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
