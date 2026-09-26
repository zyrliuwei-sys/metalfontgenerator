import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Download,
  FileImage,
  Menu,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

import { signIn } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { metalFaq } from '@/lib/metal-faq';
import { exportMetalFont } from '@/lib/metal-font-export';
import { m } from '@/paraglide/messages.js';
import { SiteFooter } from '@/components/site-footer';

type Finish = 'steel' | 'copper' | 'black-chrome' | 'brushed';
type Orbit = 'front' | 'three-quarter' | 'profile';

const FINISHES: Array<{ id: Finish; label: () => string; swatch: string }> = [
  {
    id: 'steel',
    label: m['metal.studio.finish.steel'],
    swatch: 'metal-swatch-steel',
  },
  {
    id: 'copper',
    label: m['metal.studio.finish.copper'],
    swatch: 'metal-swatch-copper',
  },
  {
    id: 'black-chrome',
    label: m['metal.studio.finish.black_chrome'],
    swatch: 'metal-swatch-black',
  },
  {
    id: 'brushed',
    label: m['metal.studio.finish.brushed'],
    swatch: 'metal-swatch-brushed',
  },
];

const ORBITS: Array<{ id: Orbit; label: () => string; angle: number }> = [
  { id: 'front', label: m['metal.studio.orbit.front'], angle: 0 },
  {
    id: 'three-quarter',
    label: m['metal.studio.orbit.three_quarter'],
    angle: 22,
  },
  { id: 'profile', label: m['metal.studio.orbit.profile'], angle: 48 },
];

function MetalWord({
  word,
  className = '',
  finish,
  angle,
  extrusion,
  light,
  tracking,
}: {
  word: string;
  className?: string;
  finish: Finish;
  angle: number;
  extrusion: number;
  light: number;
  tracking: number;
}) {
  const style = {
    '--metal-angle': `${angle}deg`,
    '--metal-depth': `${extrusion}px`,
    '--metal-depth-x': `${-Math.round(extrusion * 0.55)}px`,
    '--metal-depth-y': `${Math.round(extrusion * 0.6)}px`,
    '--metal-light': `${light}%`,
    '--metal-tracking': `${tracking}px`,
  } as CSSProperties;

  return (
    <span
      className={`metal-word metal-word-${finish} ${className}`}
      data-text={word}
      style={style}
      aria-label={word}
    >
      {word}
    </span>
  );
}

function BrandMark() {
  return (
    <Link href="/" className="metal-brand" aria-label={m['metal.brand.name']()}>
      <img src={envConfigs.app_logo} alt="" width={28} height={28} />
      <span>{m['metal.brand.name']()}</span>
    </Link>
  );
}

function SeoContent() {
  const paragraph = (text: string) =>
    text.split('\n\n').map((copy) => <p key={copy}>{copy}</p>);

  return (
    <section className="metal-seo-section" aria-labelledby="metal-seo-title">
      <div className="metal-seo-lead">
        <p className="metal-kicker">{m['metal.seo.kicker']()}</p>
        <h2 id="metal-seo-title">{m['metal.seo.title']()}</h2>
      </div>
      <article className="metal-seo-copy">
        {paragraph(m['metal.seo.intro']())}
        <h3>{m['metal.seo.what.title']()}</h3>
        {paragraph(m['metal.seo.what.body']())}
        <h3>{m['metal.seo.use.title']()}</h3>
        {paragraph(m['metal.seo.use.body']())}
        <h3>{m['metal.seo.materials.title']()}</h3>
        {paragraph(m['metal.seo.materials.body']())}
        <h3>{m['metal.seo.workflow.title']()}</h3>
        {paragraph(m['metal.seo.workflow.body']())}
        <h3>{m['metal.seo.creators.title']()}</h3>
        {paragraph(m['metal.seo.creators.body']())}
        <h2>{m['metal.seo.copy.title']()}</h2>
        {paragraph(m['metal.seo.copy.body']())}
        <h2>{m['metal.seo.free.title']()}</h2>
        {paragraph(m['metal.seo.free.body']())}
        <p>
          <Link href="/heavy-metal-font-generator">
            Heavy Metal Font Generator
          </Link>{' '}
          — {m['metal.seo.heavy_link']()}
        </p>
        <h3>{m['metal.seo.faq.title']()}</h3>
        <Faq kind="home" />
      </article>
    </section>
  );
}

function Faq({ kind }: { kind: 'home' | 'heavy' }) {
  return (
    <div className="metal-seo-faq">
      {metalFaq(kind).map(({ question, answer }) => (
        <div key={question}>
          <h4>{question}</h4>
          <p>{answer}</p>
        </div>
      ))}
    </div>
  );
}

function HeavyIntro() {
  return (
    <section className="metal-seo-section">
      <div className="metal-seo-lead">
        <p className="metal-kicker">{m['metal.heavy.kicker']()}</p>
        <h2>What Makes Heavy Metal Lettering Different</h2>
      </div>
      <div className="metal-seo-copy">
        <p>{m['metal.heavy.intro']()}</p>
        <div className="metal-material-grid">
          {[
            { word: 'THUNDER', finish: 'steel', angle: 0, depth: 22 },
            { word: 'IRON RITE', finish: 'copper', angle: 22, depth: 18 },
            { word: 'MIDNIGHT', finish: 'black-chrome', angle: 38, depth: 26 },
          ].map((item) => (
            <article className="metal-material-card" key={item.word}>
              <MetalWord
                word={item.word}
                finish={item.finish as Finish}
                angle={item.angle}
                extrusion={item.depth}
                light={80}
                tracking={-1}
                className="metal-word-card"
              />
              <div className="metal-card-caption">
                <span>{item.word}</span>
                <span>{item.finish}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeavyContent() {
  return (
    <section className="metal-seo-section">
      <div className="metal-seo-copy">
        <h2>Heavy vs Death vs Black Metal Lettering</h2>
        <p>{m['metal.heavy.comparison']()}</p>
        <p>
          <Link href="/">metal font generator</Link> —{' '}
          {m['metal.heavy.home_link']()}
        </p>
        <h2>Heavy Metal Font Generator FAQ</h2>
        <Faq kind="heavy" />
      </div>
    </section>
  );
}

function LoginPanel({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result: any = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || m['metal.auth.error']());
        return;
      }

      window.location.reload();
    } catch (submitError: any) {
      setError(submitError?.message || m['metal.auth.error']());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="metal-login-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="metal-login-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metal-login-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="metal-login-panel-topline">
          <span>{m['metal.nav.sign_in']()}</span>
          <button
            type="button"
            className="metal-login-close"
            onClick={onClose}
            aria-label={m['metal.auth.close']()}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="metal-login-heading">
          <p className="metal-kicker">{m['metal.auth.kicker']()}</p>
          <h2 id="metal-login-title">{m['metal.auth.title']()}</h2>
          <p>{m['metal.auth.description']()}</p>
        </div>
        <form className="metal-login-form" onSubmit={handleSubmit}>
          {error ? (
            <p className="metal-login-error" role="alert">
              {error}
            </p>
          ) : null}
          <label className="metal-login-field" htmlFor="metal-login-email">
            <span>{m['metal.auth.email']()}</span>
            <input
              id="metal-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={m['metal.auth.email_placeholder']()}
              autoComplete="email"
              required
              autoFocus
            />
          </label>
          <label className="metal-login-field" htmlFor="metal-login-password">
            <span>{m['metal.auth.password']()}</span>
            <input
              id="metal-login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={m['metal.auth.password_placeholder']()}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            className="metal-login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? m['metal.auth.submitting']()
              : m['metal.auth.submit']()}
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </form>
        <p className="metal-login-signup">
          {m['metal.auth.sign_up_prompt']()}{' '}
          <Link href="/sign-up" onClick={onClose}>
            {m['metal.auth.sign_up']()}
          </Link>
        </p>
      </section>
    </div>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = () => {
    setMenuOpen(false);
    setLoginOpen(true);
  };

  return (
    <>
      <header className="metal-header">
        <div className="metal-header-inner">
          <BrandMark />
          <nav className="metal-nav" aria-label={m['metal.nav.label']()}>
            <Link href="/#workbench">{m['metal.nav.studio']()}</Link>
            <Link href="/#materials">{m['metal.nav.materials']()}</Link>
            <Link href="/heavy-metal-font-generator">
              Heavy Metal Font Generator
            </Link>
          </nav>
          <div className="metal-header-actions">
            <button
              type="button"
              className="metal-header-cta"
              onClick={openLogin}
            >
              {m['metal.nav.sign_in']()}
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="metal-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label={m['metal.nav.menu']()}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {menuOpen ? (
          <nav className="metal-mobile-nav" aria-label={m['metal.nav.label']()}>
            <Link
              href="/heavy-metal-font-generator"
              onClick={() => setMenuOpen(false)}
            >
              Heavy Metal Font Generator
            </Link>
            <Link href="/#workbench" onClick={() => setMenuOpen(false)}>
              {m['metal.nav.studio']()}
            </Link>
            <Link href="/#materials" onClick={() => setMenuOpen(false)}>
              {m['metal.nav.materials']()}
            </Link>
            <button type="button" onClick={openLogin}>
              {m['metal.nav.sign_in']()}
            </button>
          </nav>
        ) : null}
      </header>
      {loginOpen ? <LoginPanel onClose={() => setLoginOpen(false)} /> : null}
    </>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="metal-range-control">
      <span className="metal-control-heading">
        <span>{label}</span>
        <span className="metal-control-value">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function MetalFontStudio({ heavy = false }: { heavy?: boolean }) {
  const [word, setWord] = useState(heavy ? 'THUNDER' : 'FORGE');
  const [finish, setFinish] = useState<Finish>('steel');
  const [orbit, setOrbit] = useState<Orbit>(heavy ? 'front' : 'three-quarter');
  const [angle, setAngle] = useState(heavy ? 0 : 22);
  const [extrusion, setExtrusion] = useState(heavy ? 22 : 14);
  const [light, setLight] = useState(heavy ? 85 : 72);
  const [tracking, setTracking] = useState(heavy ? -1 : 0);
  const [status, setStatus] = useState<
    'idle' | 'generating' | 'ready' | 'exported'
  >('idle');
  const [filename, setFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setWord(heavy ? 'THUNDER' : 'FORGE');
    setFinish('steel');
    setOrbit(heavy ? 'front' : 'three-quarter');
    setAngle(heavy ? 0 : 22);
    setExtrusion(heavy ? 22 : 14);
    setLight(heavy ? 85 : 72);
    setTracking(heavy ? -1 : 0);
    setStatus('idle');
    setFilename('');
  };

  const generate = () => {
    setStatus('generating');
    window.setTimeout(() => setStatus('ready'), 820);
  };

  const download = async () => {
    setIsExporting(true);
    setExportError('');
    try {
      const preview = document.querySelector('.metal-word-workbench');
      const fontFamily = preview
        ? getComputedStyle(preview).fontFamily
        : 'sans-serif';
      await exportMetalFont({
        word: word || 'TYPE',
        finish,
        angle,
        extrusion,
        light,
        tracking,
        fontFamily,
      });
      setStatus('exported');
    } catch {
      setExportError(m['metal.studio.export_error']());
    } finally {
      setIsExporting(false);
    }
  };

  const currentStatus =
    status === 'generating'
      ? m['metal.studio.status.generating']()
      : status === 'ready'
        ? m['metal.studio.status.ready']()
        : status === 'exported'
          ? m['metal.studio.status.exported']()
          : m['metal.studio.status.idle']();

  return (
    <div className="metal-app">
      <Header />

      <main>
        <section className="metal-hero">
          <div className="metal-hero-copy">
            <p className="metal-kicker">{m['metal.hero.kicker']()}</p>
            <h1>
              {heavy ? 'Heavy Metal Font Generator' : m['metal.hero.title']()}
            </h1>
            <p className="metal-hero-description">
              {heavy
                ? m['metal.heavy.description']()
                : m['metal.hero.description']()}
            </p>
            <div className="metal-hero-actions">
              <a className="metal-primary-button" href="#workbench">
                {m['metal.hero.cta']()}
                <ArrowDownRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div
              className="metal-hero-specs"
              aria-label={m['metal.hero.specs_label']()}
            >
              <div>
                <span>{m['metal.hero.spec.material']()}</span>
                <strong>{m['metal.hero.spec.material_value']()}</strong>
              </div>
              <div>
                <span>{m['metal.hero.spec.angle']()}</span>
                <strong>{heavy ? '0°' : '22°'}</strong>
              </div>
              <div>
                <span>{m['metal.hero.spec.depth']()}</span>
                <strong>{heavy ? '22px' : '14px'}</strong>
              </div>
            </div>
          </div>
          <div
            className="metal-hero-preview"
            aria-label={m['metal.hero.preview_alt']()}
          >
            <div className="metal-preview-grid" aria-hidden="true" />
            <div className="metal-orbit-label">
              <span>{m['metal.hero.preview_label']()}</span>
              <span>{heavy ? '0° / 22px' : '22° / 14px'}</span>
            </div>
            <MetalWord
              word={heavy ? 'THUNDER' : 'FORM'}
              className="metal-word-hero"
              finish="steel"
              angle={heavy ? 0 : 22}
              extrusion={heavy ? 22 : 14}
              light={heavy ? 85 : 72}
              tracking={heavy ? -1 : 0}
            />
          </div>
        </section>

        {heavy ? <HeavyIntro /> : null}

        <section className="metal-workbench-section" id="workbench">
          <div className="metal-section-heading">
            <div>
              <p className="metal-kicker">{m['metal.studio.kicker']()}</p>
              <h2>
                {heavy
                  ? 'How to Make Heavy Metal Text Online'
                  : m['metal.studio.title']()}
              </h2>
            </div>
            <p>
              {heavy
                ? m['metal.heavy.workflow']()
                : m['metal.studio.description']()}
            </p>
          </div>

          <div className="metal-workbench">
            <div className="metal-canvas-wrap">
              <div className="metal-canvas-topline">
                <span>{m['metal.studio.canvas_label']()}</span>
                <span className="metal-canvas-mode">
                  <span className="metal-status-dot" aria-hidden="true" />
                  {m['metal.studio.canvas_live']()}
                </span>
              </div>
              <div className="metal-canvas" data-ready={status === 'ready'}>
                <div
                  className="metal-canvas-ruler metal-canvas-ruler-top"
                  aria-hidden="true"
                >
                  <span>0</span>
                  <span>128</span>
                  <span>256</span>
                  <span>384</span>
                  <span>512</span>
                </div>
                <div
                  className="metal-canvas-ruler metal-canvas-ruler-side"
                  aria-hidden="true"
                >
                  <span>0</span>
                  <span>128</span>
                  <span>256</span>
                  <span>384</span>
                  <span>512</span>
                </div>
                <div className="metal-canvas-word">
                  <MetalWord
                    word={word || 'TYPE'}
                    className="metal-word-workbench"
                    finish={finish}
                    angle={angle}
                    extrusion={extrusion}
                    light={light}
                    tracking={tracking}
                  />
                </div>
                <div className="metal-canvas-coordinates">
                  <span>X 240</span>
                  <span>Y 256</span>
                  <span>Z {extrusion}</span>
                </div>
              </div>
              <div className="metal-canvas-footline">
                <span>{m['metal.studio.canvas_hint']()}</span>
                <span>{currentStatus}</span>
              </div>
            </div>

            <div className="metal-controls">
              {heavy ? (
                <div className="metal-control-section">
                  <span className="metal-label">
                    {m['metal.heavy.presets']()}
                  </span>
                  <div className="metal-input-row">
                    {[
                      {
                        label: 'Chrome',
                        finish: 'steel',
                        angle: 0,
                        depth: 22,
                        light: 85,
                      },
                      {
                        label: 'Vintage',
                        finish: 'copper',
                        angle: 22,
                        depth: 18,
                        light: 64,
                      },
                      {
                        label: 'Dark',
                        finish: 'black-chrome',
                        angle: 38,
                        depth: 26,
                        light: 56,
                      },
                    ].map((preset) => (
                      <button
                        type="button"
                        className="metal-text-link"
                        key={preset.label}
                        onClick={() => {
                          setFinish(preset.finish as Finish);
                          setAngle(preset.angle);
                          setExtrusion(preset.depth);
                          setLight(preset.light);
                          setTracking(-1);
                          setOrbit(
                            preset.angle === 0 ? 'front' : 'three-quarter'
                          );
                          setStatus('idle');
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="metal-control-section metal-word-input-section">
                <label className="metal-label" htmlFor="metal-word">
                  {m['metal.studio.word_label']()}
                </label>
                <div className="metal-input-row">
                  <input
                    id="metal-word"
                    className="metal-text-input"
                    value={word}
                    onChange={(event) =>
                      setWord(
                        event.target.value
                          .toUpperCase()
                          .slice(0, heavy ? 40 : 12)
                      )
                    }
                    placeholder={m['metal.studio.word_placeholder']()}
                    aria-describedby="metal-word-hint"
                  />
                  <button
                    type="button"
                    className="metal-icon-button"
                    onClick={() => setWord('')}
                    aria-label={m['metal.studio.clear_word']()}
                  >
                    <X size={15} />
                  </button>
                </div>
                <span id="metal-word-hint" className="metal-input-hint">
                  {heavy
                    ? m['metal.heavy.word_hint']()
                    : m['metal.studio.word_hint']()}
                </span>
              </div>

              <div className="metal-control-section">
                <span className="metal-label">
                  {m['metal.studio.finish_label']()}
                </span>
                <div className="metal-finish-grid">
                  {FINISHES.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`metal-finish-button ${finish === item.id ? 'is-selected' : ''}`}
                      onClick={() => setFinish(item.id)}
                      aria-pressed={finish === item.id}
                    >
                      <span className={`metal-finish-swatch ${item.swatch}`} />
                      <span>{item.label()}</span>
                      {finish === item.id ? (
                        <Check size={13} aria-hidden="true" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="metal-control-section">
                <div className="metal-control-heading metal-label">
                  <span>{m['metal.studio.orbit_label']()}</span>
                  <span>{angle}°</span>
                </div>
                <div className="metal-orbit-controls">
                  {ORBITS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={orbit === item.id ? 'is-selected' : ''}
                      onClick={() => {
                        setOrbit(item.id);
                        setAngle(item.angle);
                      }}
                      aria-pressed={orbit === item.id}
                    >
                      {item.label()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="metal-control-section metal-range-section">
                <div className="metal-range-grid">
                  <RangeControl
                    label={m['metal.studio.extrusion']()}
                    value={extrusion}
                    min={4}
                    max={28}
                    suffix=" px"
                    onChange={setExtrusion}
                  />
                  <RangeControl
                    label={m['metal.studio.light']()}
                    value={light}
                    min={20}
                    max={100}
                    suffix="%"
                    onChange={setLight}
                  />
                  <RangeControl
                    label={m['metal.studio.tracking']()}
                    value={tracking}
                    min={-4}
                    max={18}
                    suffix=" px"
                    onChange={setTracking}
                  />
                  <RangeControl
                    label={m['metal.studio.angle']()}
                    value={angle}
                    min={0}
                    max={54}
                    suffix="°"
                    onChange={(value) => {
                      setAngle(value);
                      setOrbit(
                        value > 38
                          ? 'profile'
                          : value > 10
                            ? 'three-quarter'
                            : 'front'
                      );
                    }}
                  />
                </div>
              </div>

              <div className="metal-control-section metal-reference-row">
                <button
                  type="button"
                  className="metal-reference-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={15} aria-hidden="true" />
                  <span>{filename || m['metal.studio.reference']()}</span>
                </button>
                <input
                  ref={fileInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setFilename(event.target.files?.[0]?.name || '')
                  }
                />
                <button
                  type="button"
                  className="metal-reset-button"
                  onClick={reset}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  {m['metal.studio.reset']()}
                </button>
              </div>

              <div className="metal-action-row">
                <button
                  type="button"
                  className="metal-generate-button"
                  onClick={generate}
                  disabled={status === 'generating'}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  {status === 'generating'
                    ? m['metal.studio.generating']()
                    : m['metal.studio.generate']()}
                </button>
                <button
                  type="button"
                  className="metal-export-button"
                  onClick={download}
                  disabled={status === 'generating' || isExporting}
                  aria-label={m['metal.studio.export']()}
                  title={m['metal.studio.export']()}
                  aria-busy={isExporting}
                >
                  <Download size={16} aria-hidden="true" />
                </button>
              </div>
              {exportError ? (
                <p className="metal-login-error" role="alert">
                  {exportError}
                </p>
              ) : null}
              <p className="metal-credit-note">
                <SlidersHorizontal size={14} aria-hidden="true" />
                {m['metal.studio.credit_note']()}
              </p>
            </div>
          </div>
        </section>

        {!heavy ? (
          <>
            <section className="metal-materials-section" id="materials">
              <div className="metal-section-heading metal-section-heading-wide">
                <div>
                  <p className="metal-kicker">
                    {m['metal.materials.kicker']()}
                  </p>
                  <h2>{m['metal.materials.title']()}</h2>
                </div>
                <Link href="/#workbench" className="metal-text-link">
                  {m['metal.materials.link']()}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <div className="metal-material-grid">
                <article className="metal-material-card metal-material-card-large metal-card-steel">
                  <MetalWord
                    word="STUDIO"
                    className="metal-word-card"
                    finish="steel"
                    angle={0}
                    extrusion={8}
                    light={83}
                    tracking={0}
                  />
                  <div className="metal-card-caption">
                    <span>{m['metal.materials.steel']()}</span>
                    <span>01</span>
                  </div>
                </article>
                <article className="metal-material-card metal-card-copper">
                  <MetalWord
                    word="HEAT"
                    className="metal-word-card metal-word-card-vertical"
                    finish="copper"
                    angle={38}
                    extrusion={15}
                    light={58}
                    tracking={1}
                  />
                  <div className="metal-card-caption">
                    <span>{m['metal.materials.copper']()}</span>
                    <span>02</span>
                  </div>
                </article>
                <article className="metal-material-card metal-card-black">
                  <MetalWord
                    word="NIGHT"
                    className="metal-word-card"
                    finish="black-chrome"
                    angle={16}
                    extrusion={12}
                    light={50}
                    tracking={-1}
                  />
                  <div className="metal-card-caption">
                    <span>{m['metal.materials.black_chrome']()}</span>
                    <span>03</span>
                  </div>
                </article>
                <article className="metal-material-card metal-card-brushed">
                  <MetalWord
                    word="MOTION"
                    className="metal-word-card"
                    finish="brushed"
                    angle={26}
                    extrusion={10}
                    light={76}
                    tracking={2}
                  />
                  <div className="metal-card-caption">
                    <span>{m['metal.materials.brushed']()}</span>
                    <span>04</span>
                  </div>
                </article>
              </div>
            </section>

            <section className="metal-feature-section">
              <div className="metal-feature-lead">
                <p className="metal-kicker">{m['metal.features.kicker']()}</p>
                <h2>{m['metal.features.title']()}</h2>
              </div>
              <div className="metal-feature-list">
                <article>
                  <FileImage size={17} aria-hidden="true" />
                  <div>
                    <h3>{m['metal.features.f1.title']()}</h3>
                    <p>{m['metal.features.f1.description']()}</p>
                  </div>
                </article>
                <article>
                  <SlidersHorizontal size={17} aria-hidden="true" />
                  <div>
                    <h3>{m['metal.features.f2.title']()}</h3>
                    <p>{m['metal.features.f2.description']()}</p>
                  </div>
                </article>
                <article>
                  <Sparkles size={17} aria-hidden="true" />
                  <div>
                    <h3>{m['metal.features.f3.title']()}</h3>
                    <p>{m['metal.features.f3.description']()}</p>
                  </div>
                </article>
              </div>
            </section>

            <SeoContent />
          </>
        ) : (
          <HeavyContent />
        )}
      </main>

      <Footer />
    </div>
  );
}

export function Footer() {
  return (
    <SiteFooter
      brandName={m['metal.brand.name']()}
      columns={[
        {
          title: m['metal.footer.product'](),
          links: [
            { label: 'metal font generator', href: '/' },
            {
              label: 'Heavy Metal Font Generator',
              href: '/heavy-metal-font-generator',
            },
            { label: m['metal.nav.studio'](), href: '/#workbench' },
            { label: m['metal.nav.materials'](), href: '/#materials' },
          ],
        },
        {
          title: m['metal.footer.resources'](),
          links: [
            { label: m['metal.footer.sign_in'](), href: '/sign-in' },
            { label: m['metal.footer.sign_up'](), href: '/sign-up' },
          ],
        },
        {
          title: m['metal.footer.legal'](),
          links: [
            { label: m['metal.footer.privacy'](), href: '/privacy-policy' },
            { label: m['metal.footer.terms'](), href: '/terms-of-service' },
          ],
        },
      ]}
    />
  );
}
